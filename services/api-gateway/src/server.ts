import { randomUUID } from 'crypto';
import Fastify from 'fastify';
import { z } from 'zod';
import fetch from 'node-fetch';
import {
  prisma,
  findUserWithRolesByEmail,
  getSubjectTimeseriesForLearner,
  getAggregateTenantStats,
  incrementTenantUsage,
  getOrCreateTenantLimits,
  getTenantUsageForDate,
  updateTenantLimits,
  createAuditLogEntry,
  // Session persistence
  getSessionForLearnerToday,
  createSession,
  startSession as dbStartSession,
  updateActivityStatus as dbUpdateActivityStatus,
  getSessionById,
  // Admin persistence
  listTenants,
  getTenantById,
  listDistrictsForTenant,
  listSchoolsForTenant,
  listRoleAssignmentsForTenant,
} from '@aivo/persistence';
import {
  createDifficultyProposal as dbCreateDifficultyProposal,
  listPendingProposalsForLearner,
  decideOnProposal as dbDecideOnProposal,
  createNotification as dbCreateNotification,
  listNotificationsForUser,
  markNotificationRead as dbMarkNotificationRead,
  getLearnerWithBrainProfile,
  listCurriculumTopicsForTenant,
  createCurriculumTopic,
  updateCurriculumTopic,
  listContentItemsForTopic,
  createContentItem,
  updateContentItem as dbUpdateContentItem,
  recordFeedback as dbRecordFeedback,
  aggregateFeedbackForTarget,
} from '@aivo/persistence';
import type {
  GenerateBaselineRequest,
  GenerateBaselineResponse,
  SubmitBaselineResponsesRequest,
  SubmitBaselineResponsesResponse,
  CreateDifficultyProposalRequest,
  CreateDifficultyProposalResponse,
  ListDifficultyProposalsResponse,
  DecideOnDifficultyProposalResponse,
  GenerateLessonPlanRequest,
  GenerateLessonPlanResponse,
  GetLearnerResponse,
} from '@aivo/api-client/src/contracts';
import type {
  ListCurriculumTopicsResponse,
  CreateCurriculumTopicRequest,
  CreateCurriculumTopicResponse,
  UpdateCurriculumTopicRequest,
  UpdateCurriculumTopicResponse,
  ListContentItemsResponse,
  CreateContentItemRequest,
  CreateContentItemResponse,
  UpdateContentItemRequest,
  UpdateContentItemResponse,
  GenerateDraftContentRequest,
  GenerateDraftContentResponse,
} from '@aivo/api-client/src/content-contracts';
import type {
  RecordFeedbackResponse,
  AggregateFeedbackResponse,
} from '@aivo/api-client/src/feedback-contracts';
import type {
  ListTenantsResponse,
  GetTenantConfigResponse,
  ListDistrictsResponse,
  ListSchoolsResponse,
  ListRoleAssignmentsResponse,
} from '@aivo/api-client/src/admin-contracts';
import type {
  GetTenantLimitsResponse,
  UpdateTenantLimitsRequest,
  UpdateTenantLimitsResponse,
  ListAuditLogsResponse,
  ListTenantUsageResponse,
} from '@aivo/api-client/src/governance-contracts';
import type {
  Tenant,
  TenantConfig,
  District,
  School,
  RoleAssignment,
  LearnerSession,
  SessionActivity,
  CaregiverLearnerOverview,
  Notification,
  NotificationSummary,
  CaregiverSubjectView,
  LearnerAnalyticsOverview,
  LearnerSubjectProgressOverview,
  ExplainableDifficultySummary,
  SessionPlanRun,
} from '@aivo/types';
import type { GetTenantAnalyticsResponse } from '@aivo/api-client/src/analytics-contracts';
import type {
  ListNotificationsResponse,
  MarkNotificationReadResponse,
} from '@aivo/api-client/src/caregiver-contracts';
import { getUserFromRequest, requireRole, type RequestUser } from './authContext';
import { signAccessToken, type Role } from '@aivo/auth';
import {
  initObservability,
  observabilityPlugin,
  info,
  warn,
  error as logError,
  startSpan,
  endSpan,
  recordMetric,
  recordLLMMetrics,
  recordError,
  drainMetrics,
  getHealthStatus,
  withTrace,
  withLLMTrace,
} from '@aivo/observability';
import { getCurriculumSearchService, type SearchResult } from '@aivo/embeddings';
import {
  createCheckoutSession,
  createPortalSession,
  verifyWebhookSignature,
  handleWebhookEvent,
  getSubscriptionInfo,
  isStripeConfigured,
} from './stripe-service';
import { rateLimitByTier } from '@aivo/rate-limit';
import {
  DataDeletionService,
  DataExportService,
  ConsentService,
  RetentionService,
} from '@aivo/gdpr';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTrialExpiringEmail,
  sendTrialExpiredEmail,
  sendSubscriptionActivatedEmail,
  sendPaymentFailedEmail,
  isEmailConfigured,
} from '@aivo/email';
// Temporarily disabled - functions from email.ts which has schema mismatches
// import {
//   createPasswordResetToken,
//   verifyPasswordResetToken,
//   consumePasswordResetToken,
//   getEmailPreferences,
//   updateEmailPreferences,
//   findUsersWithExpiringTrials,
//   findUsersWithExpiredTrials,
//   getUserByEmailForEmail
// } from "@aivo/persistence";
import { swaggerPlugin } from './swagger';

// Initialize observability before creating Fastify instance
initObservability({
  serviceName: 'api-gateway',
  serviceVersion: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
});

const fastify = Fastify({ logger: false });

// Register observability plugin for automatic request tracking
fastify.register(observabilityPlugin, {
  ignorePaths: ['/health', '/ready', '/metrics', '/docs'],
  logRequests: true,
  recordMetrics: true,
});

// Register OpenAPI/Swagger documentation
console.log('[server] Registering swagger plugin...');
fastify.register(swaggerPlugin);
console.log('[server] Swagger plugin registered');

console.log('[server] Adding content type parser...');
// Add raw body parser for webhook signature verification
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try {
    // Store raw body for webhook signature verification
    (req as any).rawBody = body;
    const json = JSON.parse(body as string);
    done(null, json);
  } catch (err: any) {
    done(err, undefined);
  }
});
console.log('[server] Content type parser added');

console.log('[server] Adding onRequest hook...');
fastify.addHook('onRequest', async (request, _reply) => {
  const requestId = (request.headers['x-request-id'] as string | undefined) ?? randomUUID();
  (request as any).requestId = requestId;
});
console.log('[server] onRequest hook added');

const prismaAny = prisma as any;

console.log('[server] Initializing GDPR services...');
// Initialize GDPR services
const dataDeletionService = new DataDeletionService(prismaAny, {
  deletionGracePeriodDays: 30,
});
const dataExportService = new DataExportService(prismaAny, {
  exportLinkExpirationHours: 24,
});
const consentService = new ConsentService(prismaAny);
const retentionService = new RetentionService(prismaAny, {
  telemetryDays: 90,
  auditLogDays: 365,
  sessionRecordingDays: 30,
  deletedDataDays: 90,
});
console.log('[server] GDPR services initialized');

const DEV_JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-aivo';

console.log('[server] Adding preHandler hook...');
// Attach user from JWT on every request
fastify.addHook('preHandler', async (request, _reply) => {
  const user = getUserFromRequest(request);
  (request as any).user = user;
});
console.log('[server] preHandler hook added');

console.log('[server] Setting up routes...');

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

const BRAIN_SERVICE_URL = process.env.BRAIN_SERVICE_URL || 'http://brain-service:5000';
const MODEL_DISPATCH_URL = process.env.MODEL_DISPATCH_URL || 'http://model-dispatch:4001';

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latencyMs?: number;
  version?: string;
  error?: string;
}

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    brainService: ServiceHealth;
    modelDispatch: ServiceHealth;
  };
}

const startTime = Date.now();

// Simple health check
fastify.get(
  '/health',
  {
    schema: {
      description: 'Basic health check endpoint',
      summary: 'Health check',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  },
  async (_request, reply) => {
    return reply.send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  },
);

// Readiness check
fastify.get(
  '/ready',
  {
    schema: {
      description: 'Readiness check - verifies all dependencies are available',
      summary: 'Readiness check',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            ready: { type: 'boolean' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  },
  async (_request, reply) => {
    try {
      // Check database
      await prisma.$queryRaw`SELECT 1`;
      return reply.send({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } catch {
      return reply.status(503).send({
        ready: false,
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// Detailed system health check
fastify.get(
  '/health/detailed',
  {
    schema: {
      description: 'Detailed health check with all service statuses',
      summary: 'Detailed health check',
      tags: ['Health'],
    },
  },
  async (_request, reply) => {
    const health: SystemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        database: { status: 'unhealthy' },
        redis: { status: 'unhealthy' },
        brainService: { status: 'unhealthy' },
        modelDispatch: { status: 'unhealthy' },
      },
    };

    // Check database
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = {
        status: 'healthy',
        latencyMs: Date.now() - dbStart,
      };
    } catch (err) {
      health.services.database = {
        status: 'unhealthy',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Check Redis (via persistence layer if available)
    try {
      const redisStart = Date.now();
      // Simple check - if we can query, Redis is likely up
      health.services.redis = {
        status: 'healthy',
        latencyMs: Date.now() - redisStart,
      };
    } catch (err) {
      health.services.redis = {
        status: 'unhealthy',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Check Python Brain Service
    try {
      const brainStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const brainResponse = await fetch(`${BRAIN_SERVICE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (brainResponse.ok) {
        const brainData = await brainResponse.json();
        health.services.brainService = {
          status: brainData.status === 'healthy' ? 'healthy' : 'degraded',
          latencyMs: Date.now() - brainStart,
          version: brainData.version,
        };
      } else {
        health.services.brainService = {
          status: 'unhealthy',
          latencyMs: Date.now() - brainStart,
          error: `HTTP ${brainResponse.status}`,
        };
      }
    } catch (err) {
      health.services.brainService = {
        status: 'unhealthy',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Check Model Dispatch Service
    try {
      const dispatchStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const dispatchResponse = await fetch(`${MODEL_DISPATCH_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (dispatchResponse.ok) {
        health.services.modelDispatch = {
          status: 'healthy',
          latencyMs: Date.now() - dispatchStart,
        };
      } else {
        health.services.modelDispatch = {
          status: 'unhealthy',
          latencyMs: Date.now() - dispatchStart,
          error: `HTTP ${dispatchResponse.status}`,
        };
      }
    } catch (err) {
      health.services.modelDispatch = {
        status: 'unhealthy',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Determine overall status
    const serviceStatuses = Object.values(health.services);
    if (serviceStatuses.some((s) => s.status === 'unhealthy')) {
      health.status = serviceStatuses.every((s) => s.status === 'unhealthy')
        ? 'unhealthy'
        : 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    return reply.status(statusCode).send(health);
  },
);

// Python Brain Service proxy health check
fastify.get(
  '/health/brain',
  {
    schema: {
      description: 'Health check for Python Brain Service',
      summary: 'Brain service health',
      tags: ['Health'],
    },
  },
  async (_request, reply) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${BRAIN_SERVICE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return reply.send(data);
      } else {
        return reply.status(response.status).send({
          status: 'unhealthy',
          error: `HTTP ${response.status}`,
        });
      }
    } catch (err) {
      return reply.status(503).send({
        status: 'unhealthy',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
);

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

// Login endpoint issuing JWTs backed by Prisma User & RoleAssignment
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

fastify.post(
  '/auth/login',
  {
    schema: {
      description: 'Authenticate a user and receive a JWT access token',
      summary: 'User login',
      tags: ['Auth'],
      security: [], // No auth required for login
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: 'User email address' },
          password: { type: 'string', minLength: 1, description: 'User password' },
        },
      },
      response: {
        200: {
          description: 'Successful login',
          type: 'object',
          properties: {
            accessToken: { type: 'string', description: 'JWT access token' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                tenantId: { type: 'string' },
                roles: { type: 'array', items: { type: 'string' } },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        },
        401: {
          description: 'Invalid credentials',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  },
  async (request, reply) => {
    const body = loginSchema.parse(request.body);

    // NOTE: Password is currently ignored; this is a dev-only flow that
    // authenticates by email and derives roles from RoleAssignment.
    const result = await findUserWithRolesByEmail(body.email);

    if (!result) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const { user, roles } = result;

    const roleEnums = roles.map((r) => r as Role);

    const token = signAccessToken(
      {
        sub: user.id,
        tenantId: user.tenantId ?? undefined,
        roles: roleEnums,
        name: user.name ?? undefined,
        email: user.email ?? '',
      },
      DEV_JWT_SECRET,
    );

    return reply.send({
      accessToken: token,
      user: {
        id: user.id,
        tenantId: user.tenantId ?? undefined,
        roles: roleEnums,
        name: user.name ?? undefined,
        email: user.email,
      },
    });
  },
);

fastify.get(
  '/me',
  {
    schema: {
      description: "Get the current authenticated user's information",
      summary: 'Get current user',
      tags: ['Auth'],
      response: {
        200: {
          description: 'Current user information',
          type: 'object',
          properties: {
            userId: { type: 'string' },
            tenantId: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } },
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
        401: {
          description: 'Not authenticated',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  },
  async (request, reply) => {
    const user = (request as any).user as RequestUser | null;
    if (!user) {
      return reply.status(401).send({ error: 'Unauthenticated' });
    }

    return {
      userId: user.userId,
      tenantId: user.tenantId,
      roles: user.roles,
      name: user.name,
      email: user.email,
    };
  },
);

// Simple mock brain-profile endpoint so brain-orchestrator (or other services)
// can retrieve a LearnerBrainProfile without reaching directly into the DB.
// GET /brain-profile/:learnerId
fastify.get('/brain-profile/:learnerId', async (request, reply) => {
  const params = z.object({ learnerId: z.string() }).parse(request.params);

  // In a real system, this would load from Postgres via Prisma.
  // For now we return a static-but-plausible brain profile.
  const profile: GetLearnerResponse['brainProfile'] = {
    learnerId: params.learnerId,
    tenantId: 'demo-tenant',
    region: 'north_america',
    currentGrade: 7,
    gradeBand: '6_8',
    subjectLevels: [
      {
        subject: 'math',
        enrolledGrade: 7,
        assessedGradeLevel: 5,
        masteryScore: 0.6,
      },
    ],
    neurodiversity: {
      autismSpectrum: true,
      sensorySensitivity: true,
      prefersLowStimulusUI: true,
    },
    preferences: {
      prefersStepByStep: true,
      prefersShortSessions: true,
    },
    lastUpdatedAt: new Date().toISOString(),
  };

  return reply.send({ brainProfile: profile });
});

// Lessons / brain-orchestrator proxy

fastify.post('/lessons/generate', async (request, reply) => {
  const requestId = ((request as any).requestId as string) ?? randomUUID();
  const span = startSpan('lessons_generate', { requestId });
  const startedAt = Date.now();
  const body = request.body as GenerateLessonPlanRequest;
  const user = (request as any).user as RequestUser | null;
  const tenantId = user?.tenantId ?? 'demo-tenant';

  try {
    const res = await fetch('http://brain-orchestrator:4003/lessons/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learnerId: body.learnerId,
        tenantId,
        subject: body.subject,
        region: body.region,
        domain: body.domain,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      recordMetric({
        name: 'lessons_generate_errors_total',
        value: 1,
        labels: { tenantId },
        timestamp: Date.now(),
      });
      logError('Brain orchestrator lesson generation failed', {
        tenantId,
        requestId,
        meta: { text },
      });
      endSpan(span);
      return reply.status(502).send({ error: 'Failed to generate lesson plan', requestId });
    }

    const data = (await res.json()) as GenerateLessonPlanResponse;
    const duration = Date.now() - startedAt;

    recordMetric({
      name: 'lessons_generate_latency_ms',
      value: duration,
      labels: { tenantId },
      timestamp: Date.now(),
    });
    recordMetric({
      name: 'lessons_generated_total',
      value: 1,
      labels: { tenantId },
      timestamp: Date.now(),
    });
    info('Lesson plan generated', {
      tenantId,
      requestId,
      meta: { durationMs: duration },
    });
    endSpan(span);

    const response: GenerateLessonPlanResponse = {
      plan: data.plan,
    };

    reply.header('x-request-id', requestId);
    return reply.send(response);
  } catch (err) {
    recordMetric({
      name: 'lessons_generate_errors_total',
      value: 1,
      labels: { tenantId },
      timestamp: Date.now(),
    });
    logError('Lesson generation threw', {
      tenantId,
      requestId,
      meta: {
        error: err instanceof Error ? err.message : String(err),
      },
    });
    endSpan(span);
    return reply.status(500).send({ error: 'Failed to generate lesson plan', requestId });
  }
});

fastify.post('/sessions/plan', async (request, reply) => {
  const requestId = ((request as any).requestId as string) ?? randomUUID();
  const span = startSpan('sessions_plan_gateway', { requestId });
  const startedAt = Date.now();
  const user = (request as any).user as RequestUser | null;

  try {
    requireRole(user, ['learner']);
  } catch (err: any) {
    warn('Session plan forbidden', {
      tenantId: user?.tenantId,
      requestId,
      meta: { error: err.message },
    });
    endSpan(span);
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  const body = planSessionSchema.parse(request.body ?? {});
  const tenantId = user?.tenantId ?? 'demo-tenant';

  try {
    const orchestratorRes = await fetch('http://brain-orchestrator:4003/sessions/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learnerId: body.learnerId,
        tenantId,
        subject: body.subject,
        region: body.region,
      }),
    });

    if (!orchestratorRes.ok) {
      const text = await orchestratorRes.text();
      recordMetric({
        name: 'sessions_plan_gateway_errors_total',
        value: 1,
        labels: { tenantId },
        timestamp: Date.now(),
      });
      logError('Brain orchestrator /sessions/plan failed', {
        tenantId,
        requestId,
        meta: { text },
      });
      endSpan(span);
      return reply.status(502).send({ error: 'Failed to plan session' });
    }

    const payload = (await orchestratorRes.json()) as { run: SessionPlanRun };
    const duration = Date.now() - startedAt;

    recordMetric({
      name: 'sessions_plan_gateway_latency_ms',
      value: duration,
      labels: { tenantId },
      timestamp: Date.now(),
    });
    info('Session plan generated', {
      tenantId,
      requestId,
      meta: { durationMs: duration, learnerId: body.learnerId },
    });
    reply.header('x-request-id', requestId);
    endSpan(span);
    return reply.send(payload);
  } catch (err) {
    recordMetric({
      name: 'sessions_plan_gateway_errors_total',
      value: 1,
      labels: { tenantId },
      timestamp: Date.now(),
    });
    logError('Session plan request threw', {
      tenantId,
      requestId,
      meta: {
        error: err instanceof Error ? err.message : String(err),
      },
    });
    endSpan(span);
    return reply.status(500).send({ error: 'Failed to plan session' });
  }
});

// Baseline assessment routes

fastify.post('/baseline/generate', async (request, reply) => {
  const body = request.body as GenerateBaselineRequest;

  // Forward to baseline-assessment service
  const res = await fetch('http://baseline-assessment:4002/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      learnerId: body.learnerId,
      tenantId: 'demo-tenant', // TODO: from auth
      region: 'north_america', // TODO: from learner profile
      currentGrade: 7, // TODO: from learner
      subjects: body.subjects,
    }),
  });

  const data: unknown = await res.json();

  const response: GenerateBaselineResponse = {
    // TODO: map real assessment returned by the service
    assessment: {
      id: (data as any).assessment?.id ?? 'baseline-1',
      learnerId: body.learnerId,
      tenantId: 'demo-tenant',
      region: 'north_america',
      grade: 7,
      subjects: body.subjects,
      items: (data as any).assessment?.items ?? [],
      createdAt: new Date().toISOString(),
      status: 'draft',
    },
  };

  return reply.send(response);
});

fastify.post('/baseline/submit', async (request, reply) => {
  const body = request.body as SubmitBaselineResponsesRequest;

  // TODO: real auth/tenant resolution
  const tenantId = 'demo-tenant';
  const region = 'north_america';

  // For now, we don't receive learnerId in this request. In a real system,
  // this should come from auth/session or by looking up the assessment.
  const learnerId = 'demo-learner';

  // Ensure learner exists (simple upsert by id for now)
  const learner = await (prisma as any).learner.upsert({
    where: { id: learnerId },
    update: {},
    create: {
      id: learnerId,
      tenantId,
      ownerId: learnerId, // TODO: link to real user
      displayName: learnerId,
      currentGrade: 7, // TODO: from learner
      region: 'north_america',
    },
  });

  // Persist baseline assessment (using prismaAny since baselineAssessment not in current schema)
  const assessment = await (prisma as any).baselineAssessment.create({
    data: {
      learnerId: learner.id,
      tenantId,
      region: region as any,
      grade: 7,
      // We don't have subject information per response in this contract yet,
      // so we store the raw responses and leave subjects empty for now.
      subjects: [],
      items: body.responses, // raw JSON for now
      status: 'completed',
    },
  });

  // TODO: call brain-orchestrator to compute subject levels
  const response: SubmitBaselineResponsesResponse = {
    summary: {
      subjectLevels: [],
      notes: 'Mock summary â€“ persisted baseline assessment in Postgres, real scoring TBD',
    },
    updatedBrainProfile: {
      learnerId: learner.id,
      tenantId,
      region: region as any,
      currentGrade: learner.currentGrade,
      gradeBand: '6_8',
      subjectLevels: [],
      neurodiversity: {},
      preferences: {},
      lastUpdatedAt: new Date().toISOString(),
    },
  };

  return reply.send(response);
});

// Difficulty proposals via Prisma

fastify.post('/difficulty/proposals', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const body = request.body as CreateDifficultyProposalRequest;

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const learnerProfile = await getLearnerWithBrainProfile(body.learnerId);
  const baseFrom = (learnerProfile?.brainProfile as any)?.currentGrade ?? 5; // TODO: derive per-subject
  const direction: 'easier' | 'harder' = body.toAssessedGradeLevel > baseFrom ? 'harder' : 'easier';

  const created = await dbCreateDifficultyProposal({
    learnerId: body.learnerId,
    tenantId: user.tenantId ?? 'demo-tenant',
    subject: body.subject,
    fromLevel: baseFrom,
    toLevel: body.toAssessedGradeLevel,
    direction,
    rationale:
      body.rationale ??
      'System detected sustained mastery; recommending an adjustment in difficulty.',
    createdBy: 'system',
  });

  const proposal: CreateDifficultyProposalResponse['proposal'] = {
    id: created.id,
    learnerId: created.learnerId,
    subject: created.subject as any,
    fromAssessedGradeLevel: (created as any).fromLevel,
    toAssessedGradeLevel: (created as any).toLevel,
    direction: created.direction as any,
    rationale: created.rationale,
    createdBy: created.createdBy as any,
    createdAt: created.createdAt.toISOString(),
    status: created.status as any,
  };

  await dbCreateNotification({
    tenantId: user.tenantId ?? 'demo-tenant',
    learnerId: body.learnerId,
    recipientUserId: 'user-parent-1', // TODO: lookup real caregiver(s)
    audience: 'parent',
    type: 'difficulty_proposal',
    title:
      direction === 'harder'
        ? 'AIVO suggests a gentle increase in difficulty'
        : 'AIVO suggests making this subject gentler',
    body:
      direction === 'harder'
        ? 'Based on recent progress, AIVO recommends trying slightly more challenging work. Please review and approve if you agree.'
        : 'AIVO noticed some struggle and suggests temporarily easing the difficulty. Please review and approve if you agree.',
    relatedDifficultyProposalId: created.id,
  });

  return reply.send({ proposal });
});

const listQuerySchema = z.object({
  learnerId: z.string().optional(),
});

fastify.get('/difficulty/proposals', async (request, reply) => {
  const query = listQuerySchema.parse(request.query);

  const records = query.learnerId
    ? await listPendingProposalsForLearner(query.learnerId)
    : await prismaAny.difficultyProposal.findMany();

  const response: ListDifficultyProposalsResponse = {
    proposals: records.map((p: any) => ({
      id: p.id,
      learnerId: p.learnerId,
      subject: p.subject as any,
      fromAssessedGradeLevel: (p as any).fromLevel ?? p.fromLevel,
      toAssessedGradeLevel: (p as any).toLevel ?? p.toLevel,
      direction: p.direction as any,
      rationale: p.rationale,
      createdBy: p.createdBy as any,
      createdAt: p.createdAt.toISOString(),
      status: p.status as any,
      decidedByUserId: (p as any).decidedById ?? p.decidedByUserId ?? undefined,
      decidedAt:
        (p as any).decidedAt?.toISOString() ??
        (p.decidedAt ? p.decidedAt.toISOString() : undefined),
      decisionNotes: (p as any).decisionNotes ?? p.decisionNotes ?? undefined,
    })),
  };

  return reply.send(response);
});

fastify.post('/difficulty/proposals/:id/decision', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const paramsSchema = z.object({ id: z.string() });
  const params = paramsSchema.parse(request.params);

  const body = request.body as { approve: boolean; notes?: string };

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const updated = await dbDecideOnProposal({
    proposalId: params.id,
    approve: body.approve,
    decidedById: user.userId,
    notes: body.notes,
  });

  const proposal: DecideOnDifficultyProposalResponse['proposal'] = {
    id: updated.id,
    learnerId: updated.learnerId,
    subject: updated.subject as any,
    fromAssessedGradeLevel: (updated as any).fromLevel,
    toAssessedGradeLevel: (updated as any).toLevel,
    direction: updated.direction as any,
    rationale: updated.rationale,
    createdBy: updated.createdBy as any,
    createdAt: updated.createdAt.toISOString(),
    status: updated.status as any,
    decidedByUserId: (updated as any).decidedById ?? undefined,
    decidedAt: (updated as any).decidedAt?.toISOString() ?? undefined,
    decisionNotes: (updated as any).decisionNotes ?? undefined,
  };

  const response: DecideOnDifficultyProposalResponse = { proposal };

  return reply.send(response);
});

// --- In-memory mock data for Admin views ---
// --- Caregiver notifications now persisted via @aivo/persistence ---

// --- Session persistence schemas ---

const planSessionSchema = z.object({
  learnerId: z.string(),
  subject: z.string(),
  region: z.string().default('north_america'),
});

const providerEnum = z.enum(['openai', 'anthropic', 'google', 'meta']);
const updateTenantLimitsSchema = z.object({
  maxDailyLlmCalls: z.number().int().min(0).nullable().optional(),
  maxDailyTutorTurns: z.number().int().min(0).nullable().optional(),
  allowedProviders: z.array(providerEnum).min(1).nullable().optional(),
  blockedProviders: z.array(providerEnum).min(1).nullable().optional(),
});

// Helper to create a calm, short session from scratch
// --- Session routes ---

// GET /sessions/today?learnerId=...&subject=...
fastify.get('/sessions/today', async (request, reply) => {
  const query = z
    .object({
      learnerId: z.string(),
      subject: z.string(),
    })
    .parse(request.query);

  const today = new Date().toISOString().slice(0, 10);
  const existing = await getSessionForLearnerToday(query.learnerId, query.subject, today);

  return reply.send({ session: existing ?? null });
});

// POST /sessions/start
fastify.post('/sessions/start', async (request, reply) => {
  const requestId = ((request as any).requestId as string) ?? randomUUID();
  const span = startSpan('sessions_start', { requestId });
  const startedAt = Date.now();
  const user = (request as any).user as RequestUser | null;

  try {
    requireRole(user, ['learner']);
  } catch (err: any) {
    warn('Session start forbidden', {
      tenantId: user?.tenantId,
      requestId,
      meta: { error: err.message },
    });
    endSpan(span);
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  const body = z
    .object({
      learnerId: z.string(),
      subject: z.string(),
    })
    .parse(request.body);

  const tenantId = user?.tenantId ?? 'demo-tenant';
  const today = new Date().toISOString().slice(0, 10);

  try {
    if (tenantId) {
      const limits = await getOrCreateTenantLimits(tenantId);
      if (limits.maxDailyTutorTurns != null) {
        const usage = await getTenantUsageForDate(tenantId, today);
        const used = usage?.tutorTurns ?? 0;
        if (used >= limits.maxDailyTutorTurns) {
          warn('Tenant exceeded tutor turn quota', {
            tenantId,
            requestId,
            meta: { used, limit: limits.maxDailyTutorTurns },
          });
          endSpan(span);
          return reply.status(429).send({ error: 'Daily tutor turn quota exceeded.' });
        }
        if (used >= Math.floor(limits.maxDailyTutorTurns * 0.8)) {
          reply.header(
            'x-aivo-usage-warning',
            `Tutor turns ${used}/${limits.maxDailyTutorTurns} approaching limit`,
          );
        }
      }
    }

    let session = await getSessionForLearnerToday(body.learnerId, body.subject, today);

    if (!session) {
      const sessionId = `session-${Date.now()}`;
      const activities = [
        {
          id: `${sessionId}-act-1`,
          type: 'calm_check_in' as const,
          title: 'Calm Check-In',
          instructions:
            'Take a deep breath. On a scale from 1 to 5, how ready do you feel to learn right now?',
          estimatedMinutes: 2,
          status: 'pending' as const,
        },
        {
          id: `${sessionId}-act-2`,
          type: 'micro_lesson' as const,
          title: 'Micro Lesson',
          instructions:
            "We will review one small idea. You'll see an example, then try one similar question.",
          estimatedMinutes: 5,
          status: 'pending' as const,
        },
        {
          id: `${sessionId}-act-3`,
          type: 'guided_practice' as const,
          title: 'Guided Practice',
          instructions:
            'Try 2-3 practice items. You can ask for a hint anytime. If it feels too hard, you can skip one.',
          estimatedMinutes: 7,
          status: 'pending' as const,
        },
        {
          id: `${sessionId}-act-4`,
          type: 'reflection' as const,
          title: 'Reflection',
          instructions:
            "What felt okay? What felt too hard? Choose one thing you'd like AIVO to remember for next time.",
          estimatedMinutes: 3,
          status: 'pending' as const,
        },
      ];
      const plannedMinutes = activities.reduce((sum, a) => sum + a.estimatedMinutes, 0);

      session = await createSession({
        learnerId: body.learnerId,
        tenantId,
        subject: body.subject,
        date: today,
        plannedMinutes,
        activities,
      });
    }

    // Start the session if it's in planned state
    if (session && session.status === 'planned') {
      session = (await dbStartSession(session.id)) ?? session;
    }

    if (!session) {
      return reply.status(500).send({ error: 'Failed to create session' });
    }

    await incrementTenantUsage({
      tenantId,
      date: today,
      tutorTurns: 1,
    });

    const duration = Date.now() - startedAt;
    recordMetric({
      name: 'tutor_turns_total',
      value: 1,
      labels: { tenantId },
      timestamp: Date.now(),
    });
    recordMetric({
      name: 'sessions_start_latency_ms',
      value: duration,
      labels: { tenantId },
      timestamp: Date.now(),
    });
    info('Session started', {
      tenantId,
      requestId,
      meta: { learnerId: body.learnerId, subject: body.subject, durationMs: duration },
    });
    reply.header('x-request-id', requestId);
    endSpan(span);
    return reply.send({ session });
  } catch (err) {
    logError('Session start failed', {
      tenantId,
      requestId,
      meta: { error: err instanceof Error ? err.message : String(err) },
    });
    endSpan(span);
    return reply.status(500).send({ error: 'Failed to start session' });
  }
});

// PATCH /sessions/:sessionId/activities/:activityId
fastify.patch('/sessions/:sessionId/activities/:activityId', async (request, reply) => {
  const params = z
    .object({
      sessionId: z.string(),
      activityId: z.string(),
    })
    .parse(request.params);

  const body = z
    .object({
      status: z.enum(['in_progress', 'completed', 'skipped']),
    })
    .parse(request.body);

  const updatedSession = await dbUpdateActivityStatus({
    sessionId: params.sessionId,
    activityId: params.activityId,
    status: body.status,
  });

  if (!updatedSession) {
    return reply.status(404).send({ error: 'Session or activity not found' });
  }

  const response = { session: updatedSession };
  return reply.send(response);
});

// --- Admin routes ---

fastify.get('/admin/tenants', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  try {
    requireRole(user, ['platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  const tenants = await listTenants();
  const response: ListTenantsResponse = {
    tenants: tenants as any,
  };
  return reply.send(response);
});

fastify.get('/admin/tenants/:tenantId', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const params = z.object({ tenantId: z.string() }).parse(request.params);

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  if (!user.roles.includes('platform_admin') && user.tenantId !== params.tenantId) {
    return reply.status(403).send({ error: 'Forbidden for this tenant' });
  }

  const tenant = await getTenantById(params.tenantId);
  const config = await prisma.tenantConfig.findUnique({
    where: { tenantId: params.tenantId },
  });

  if (!tenant) {
    return reply.status(404).send({ error: 'Tenant not found' });
  }

  const response: GetTenantConfigResponse = {
    tenant: tenant as any,
    config: (config || {}) as any,
  };

  return reply.send(response);
});

fastify.get('/admin/tenants/:tenantId/districts', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const params = z.object({ tenantId: z.string() }).parse(request.params);

  try {
    requireRole(user, ['district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user || (!user.roles.includes('platform_admin') && user.tenantId !== params.tenantId)) {
    return reply.status(403).send({ error: 'Forbidden for this tenant' });
  }

  const districts = await listDistrictsForTenant(params.tenantId);
  const response: ListDistrictsResponse = { districts };
  return reply.send(response);
});

fastify.get('/admin/tenants/:tenantId/schools', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const params = z.object({ tenantId: z.string() }).parse(request.params);
  const query = z.object({ districtId: z.string().optional() }).parse(request.query);

  try {
    requireRole(user, ['district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user || (!user.roles.includes('platform_admin') && user.tenantId !== params.tenantId)) {
    return reply.status(403).send({ error: 'Forbidden for this tenant' });
  }

  const schools = await listSchoolsForTenant(params.tenantId, query.districtId);

  const response: ListSchoolsResponse = { schools };
  return reply.send(response);
});

fastify.get('/admin/tenants/:tenantId/roles', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const params = z.object({ tenantId: z.string() }).parse(request.params);

  try {
    requireRole(user, ['district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user || (!user.roles.includes('platform_admin') && user.tenantId !== params.tenantId)) {
    return reply.status(403).send({ error: 'Forbidden for this tenant' });
  }

  const assignments = await listRoleAssignmentsForTenant(params.tenantId);
  const response: ListRoleAssignmentsResponse = { assignments: assignments as any };
  return reply.send(response);
});

function mapTenantLimitsRecord(record: any) {
  return {
    tenantId: record.tenantId,
    maxDailyLlmCalls: record.maxDailyLlmCalls ?? undefined,
    maxDailyTutorTurns: record.maxDailyTutorTurns ?? undefined,
    allowedProviders: (record.allowedProviders as string[] | null) ?? undefined,
    blockedProviders: (record.blockedProviders as string[] | null) ?? undefined,
  };
}

fastify.get('/governance/tenants/:tenantId/limits', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const params = z.object({ tenantId: z.string() }).parse(request.params);

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  if (!user.roles.includes('district_admin') && !user.roles.includes('platform_admin')) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  if (!user.roles.includes('platform_admin') && user.tenantId !== params.tenantId) {
    return reply.status(403).send({ error: 'Forbidden for this tenant' });
  }

  const limits = await getOrCreateTenantLimits(params.tenantId);
  const response: GetTenantLimitsResponse = {
    limits: mapTenantLimitsRecord(limits),
  };

  return reply.send(response);
});

fastify.put('/governance/tenants/:tenantId/limits', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const params = z.object({ tenantId: z.string() }).parse(request.params);
  const body = updateTenantLimitsSchema.parse(request.body ?? {});

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  if (!user.roles.includes('district_admin') && !user.roles.includes('platform_admin')) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  if (!user.roles.includes('platform_admin') && user.tenantId !== params.tenantId) {
    return reply.status(403).send({ error: 'Forbidden for this tenant' });
  }

  const updated = await updateTenantLimits({
    tenantId: params.tenantId,
    maxDailyLlmCalls: body.maxDailyLlmCalls ?? null,
    maxDailyTutorTurns: body.maxDailyTutorTurns ?? null,
    allowedProviders: body.allowedProviders ?? null,
    blockedProviders: body.blockedProviders ?? null,
  });

  await createAuditLogEntry({
    tenantId: params.tenantId,
    userId: user.userId,
    type: 'tenant_policy_updated',
    message: 'Tenant limits updated',
    meta: body,
  });

  const response: UpdateTenantLimitsResponse = {
    limits: mapTenantLimitsRecord(updated),
  };

  return reply.send(response);
});

fastify.get('/governance/audit', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const query = z.object({ tenantId: z.string() }).parse(request.query);

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  if (!user.roles.includes('district_admin') && !user.roles.includes('platform_admin')) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  if (!user.roles.includes('platform_admin') && user.tenantId !== query.tenantId) {
    return reply.status(403).send({ error: 'Forbidden for this tenant' });
  }

  const logs = await prismaAny.auditLogEntry.findMany({
    where: { tenantId: query.tenantId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const response: ListAuditLogsResponse = {
    logs: logs.map((log: any) => ({
      id: log.id,
      tenantId: log.tenantId,
      userId: log.userId,
      type: log.type,
      message: log.message,
      meta: log.meta ?? undefined,
      createdAt: log.createdAt.toISOString(),
    })),
  };

  return reply.send(response);
});

fastify.get('/governance/usage', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const query = z.object({ tenantId: z.string() }).parse(request.query);

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  if (!user.roles.includes('district_admin') && !user.roles.includes('platform_admin')) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  if (!user.roles.includes('platform_admin') && user.tenantId !== query.tenantId) {
    return reply.status(403).send({ error: 'Forbidden for this tenant' });
  }

  const rows = await prismaAny.tenantUsage.findMany({
    where: { tenantId: query.tenantId },
    orderBy: { date: 'desc' },
    take: 30,
  });

  const response: ListTenantUsageResponse = {
    usage: rows.map((row: any) => ({
      tenantId: row.tenantId,
      date: row.date,
      llmCalls: row.llmCalls,
      tutorTurns: row.tutorTurns,
      sessionsPlanned: row.sessionsPlanned,
      safetyIncidents: row.safetyIncidents,
    })),
  };

  return reply.send(response);
});

// --- Caregiver routes ---

// GET /caregiver/learners/:learnerId/overview
fastify.get('/caregiver/learners/:learnerId/overview', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const params = z.object({ learnerId: z.string() }).parse(request.params);
  const learnerId = params.learnerId;

  // TODO: enforce that this user is a parent/teacher of the learner
  if (!user || (!user.roles.includes('parent') && !user.roles.includes('teacher'))) {
    return reply.status(403).send({ error: 'Only parents and teachers can view this overview.' });
  }

  // Mock learner & brain profile
  const learner: CaregiverLearnerOverview['learner'] = {
    id: learnerId,
    tenantId: user.tenantId,
    userId: 'learner-user-1',
    displayName: 'Alex',
    currentGrade: 7,
    region: 'north_america',
    createdAt: new Date().toISOString(),
  };

  const brainProfile: CaregiverLearnerOverview['brainProfile'] = {
    learnerId,
    tenantId: user.tenantId,
    region: 'north_america',
    currentGrade: 7,
    gradeBand: '6_8',
    subjectLevels: [
      {
        subject: 'math',
        enrolledGrade: 7,
        assessedGradeLevel: 5,
        masteryScore: 0.62,
      },
      {
        subject: 'ela',
        enrolledGrade: 7,
        assessedGradeLevel: 7,
        masteryScore: 0.75,
      },
    ],
    neurodiversity: { adhd: true, prefersLowStimulusUI: true },
    preferences: { prefersStepByStep: true, prefersVisual: true },
    lastUpdatedAt: new Date().toISOString(),
  };

  // Build caregiver subject views
  const subjects: CaregiverSubjectView[] = brainProfile.subjectLevels.map((lvl) => {
    let difficultyRecommendation: 'easier' | 'maintain' | 'harder' | undefined;
    const diff = lvl.enrolledGrade - lvl.assessedGradeLevel;
    if (diff >= 2) difficultyRecommendation = 'easier';
    else if (diff <= -1) difficultyRecommendation = 'harder';
    else difficultyRecommendation = 'maintain';

    return {
      subject: lvl.subject,
      enrolledGrade: lvl.enrolledGrade,
      assessedGradeLevel: lvl.assessedGradeLevel,
      masteryScore: lvl.masteryScore,
      difficultyRecommendation,
    };
  });

  // Mock baseline summary
  const lastBaselineSummary: CaregiverLearnerOverview['lastBaselineSummary'] = {
    subjectLevels: brainProfile.subjectLevels,
    notes:
      'Baseline shows Alex is currently working at a 5th-grade level in math but on-level in ELA. AIVO will scaffold 7th-grade math concepts with 5th-grade difficulty.',
  };

  // Mock recent sessions (e.g., last 3 days)
  const today = new Date();
  const recentSessionDates = [0, 1, 2].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    return d.toISOString().slice(0, 10);
  });

  // For now, query difficulty proposals via Prisma and filter to pending
  const records = await prismaAny.difficultyProposal.findMany({
    where: { learnerId },
  });

  const pendingDifficultyProposals = records
    .filter((p: any) => p.status === 'pending')
    .map((p: any) => ({
      id: p.id,
      learnerId: p.learnerId,
      subject: p.subject as any,
      fromAssessedGradeLevel: (p as any).fromLevel ?? p.fromLevel,
      toAssessedGradeLevel: (p as any).toLevel ?? p.toLevel,
      direction: p.direction as any,
      rationale: p.rationale,
      createdBy: p.createdBy as any,
      createdAt: p.createdAt.toISOString(),
      status: p.status as any,
      decidedByUserId: (p as any).decidedById ?? p.decidedByUserId ?? undefined,
      decidedAt: p.decidedAt ? p.decidedAt.toISOString() : undefined,
      decisionNotes: p.decisionNotes ?? undefined,
    }));

  const overview: CaregiverLearnerOverview = {
    learner,
    brainProfile,
    subjects,
    lastBaselineSummary,
    recentSessionDates,
    pendingDifficultyProposals,
  };

  return reply.send({ overview });
});

// GET /caregiver/notifications
fastify.get('/caregiver/notifications', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  if (!user || (!user.roles.includes('parent') && !user.roles.includes('teacher'))) {
    return reply.status(403).send({ error: 'Only parents and teachers can view notifications.' });
  }

  const records = await listNotificationsForUser(user.userId);

  const items: NotificationSummary[] = records.map((n: any) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    createdAtFriendly: n.createdAt.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
  }));

  const response: ListNotificationsResponse = { items };
  return reply.send(response);
});

// POST /caregiver/notifications/:id/read
fastify.post('/caregiver/notifications/:id/read', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const params = z.object({ id: z.string() }).parse(request.params);

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  await dbMarkNotificationRead(params.id);
  const records = await listNotificationsForUser(user.userId);
  const updated = records.find((n: any) => n.id === params.id) as any;

  if (!updated) {
    return reply.status(404).send({ error: 'Notification not found' });
  }

  const notification: Notification = {
    id: updated.id,
    tenantId: updated.tenantId,
    learnerId: updated.learnerId,
    recipientUserId: updated.recipientUserId,
    audience: updated.audience as any,
    type: updated.type as any,
    title: updated.title,
    body: updated.body,
    createdAt: updated.createdAt.toISOString(),
    status: updated.status as any,
    relatedDifficultyProposalId: updated.relatedDifficultyProposalId ?? undefined,
    relatedBaselineAssessmentId: updated.relatedBaselineAssessmentId ?? undefined,
    relatedSessionId: updated.relatedSessionId ?? undefined,
  };

  const response: MarkNotificationReadResponse = { notification };
  return reply.send(response);
});

// --- Analytics routes ------------------------------------------------------

// GET /analytics/learners/:learnerId
fastify.get('/analytics/learners/:learnerId', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const params = z.object({ learnerId: z.string() }).parse(request.params);

  // Allow parent, teacher, district_admin, platform_admin
  try {
    requireRole(user, ['parent', 'teacher', 'district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  const learnerId = params.learnerId;

  const learner = await prisma.learner.findUnique({
    where: { id: learnerId },
    include: { brainProfile: true },
  });

  if (!learner) {
    return reply.status(404).send({ error: 'Learner not found' });
  }

  const brainProfile = learner.brainProfile as any | null;
  const subjects: LearnerSubjectProgressOverview[] = [];

  if (brainProfile) {
    const subjectLevels = (brainProfile.subjectLevels as any[]) ?? [];
    for (const lvl of subjectLevels) {
      const snapshots = await getSubjectTimeseriesForLearner(learnerId, lvl.subject);
      subjects.push({
        subject: lvl.subject,
        enrolledGrade: lvl.enrolledGrade,
        currentAssessedGradeLevel: lvl.assessedGradeLevel,
        timeseries: snapshots.map((s: any) => ({
          date: s.date,
          masteryScore: s.masteryScore,
          minutesPracticed: s.minutesPracticed,
          difficultyLevel: s.difficultyLevel,
        })),
      });
    }
  }

  const difficultySummaries: ExplainableDifficultySummary[] = (
    (brainProfile?.subjectLevels as any[]) ?? []
  ).map((lvl: any) => {
    const diff = lvl.enrolledGrade - lvl.assessedGradeLevel;
    let direction: 'easier' | 'maintain' | 'harder' = 'maintain';
    let rationale =
      'Learner is close to enrolled grade; keep current difficulty predictable and steady.';

    if (diff >= 2) {
      direction = 'easier';
      rationale =
        'Learner is working below enrolled grade; AIVO keeps difficulty gentle and scaffolds concepts.';
    } else if (diff <= -1) {
      direction = 'harder';
      rationale =
        'Learner is working above enrolled grade; AIVO may suggest slightly more challenging material when appropriate.';
    }

    const factors = [
      {
        label: 'Baseline results',
        description: 'Functional grade level estimated from baseline assessment.',
        weight: 0.5,
      },
      {
        label: 'Recent session performance',
        description: 'Answer accuracy and completion rate over recent practice.',
        weight: 0.3,
      },
      {
        label: 'Neurodiversity accommodations',
        description:
          'We avoid sudden jumps in difficulty to keep the experience predictable and less overwhelming.',
        weight: 0.2,
      },
    ];

    return {
      subject: lvl.subject,
      currentDifficultyLevel: lvl.assessedGradeLevel,
      targetDifficultyLevel:
        direction === 'harder' ? lvl.assessedGradeLevel + 1 : lvl.assessedGradeLevel,
      rationale,
      factors,
    };
  });

  const analytics: LearnerAnalyticsOverview = {
    learnerId,
    subjects,
    difficultySummaries,
  };

  return reply.send({ analytics });
});

// GET /analytics/tenants/:tenantId
fastify.get('/analytics/tenants/:tenantId', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  const params = z.object({ tenantId: z.string() }).parse(request.params);

  // District and platform admins only
  try {
    requireRole(user, ['district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  if (!user.roles.includes('platform_admin') && user.tenantId !== params.tenantId) {
    return reply.status(403).send({ error: 'Forbidden for this tenant' });
  }

  const stats = await getAggregateTenantStats(params.tenantId);

  const response: GetTenantAnalyticsResponse = {
    tenantId: params.tenantId,
    learnersCount: stats.learnersCount,
    avgMinutesPracticed: stats.avgMinutesPracticed,
    avgMasteryScore: stats.avgMasteryScore,
  };

  return reply.send(response);
});

// =============================
// Content Management Routes
// =============================

// List curriculum topics for tenant
fastify.get('/content/topics', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  // Teachers, district admins, and platform admins can view curriculum topics
  try {
    requireRole(user, ['teacher', 'district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const topics = await listCurriculumTopicsForTenant(user.tenantId);
  return reply.send({ topics: topics as any });
});

// Create a curriculum topic
fastify.post('/content/topics', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  // Only district admins and platform admins can create curriculum topics
  try {
    requireRole(user, ['district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const { subject, grade, region, standard, code, title, description } = request.body as any;

  const topic = await createCurriculumTopic({
    tenantId: user.tenantId,
    subject,
    grade,
    region,
    standard,
    code,
    title,
    description,
  });

  // Index the new topic for semantic search (async, don't block response)
  void (async () => {
    try {
      const searchService = getCurriculumSearchService();
      await searchService.indexTopic({
        id: topic.id,
        tenantId: user.tenantId,
        subject,
        grade,
        title,
        description,
        standardCode: code,
      });
      info('Topic indexed for semantic search', {
        tenantId: user.tenantId,
        meta: { topicId: topic.id },
      });
    } catch (err) {
      logError('Failed to index topic', {
        tenantId: user.tenantId,
        meta: { topicId: topic.id, error: err instanceof Error ? err.message : String(err) },
      });
    }
  })();

  return reply.send({ topic: topic as any });
});

// Update a curriculum topic
fastify.patch('/content/topics/:topicId', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  // Only district admins and platform admins can update curriculum topics
  try {
    requireRole(user, ['district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const params = z.object({ topicId: z.string() }).parse(request.params);
  const { code, title, description } = request.body as any;

  const topic = await updateCurriculumTopic(params.topicId, {
    code,
    title,
    description,
  });

  // Re-index the updated topic for semantic search (async, don't block response)
  void (async () => {
    try {
      const searchService = getCurriculumSearchService();
      await searchService.indexTopic({
        id: topic.id,
        tenantId: topic.tenantId,
        subject: topic.subject,
        grade: topic.grade,
        title: topic.title,
        description: topic.description ?? undefined,
        standardCode: topic.code ?? undefined,
      });
      info('Topic re-indexed for semantic search', {
        tenantId: topic.tenantId,
        meta: { topicId: topic.id },
      });
    } catch (err) {
      logError('Failed to re-index topic', {
        tenantId: topic.tenantId,
        meta: { topicId: topic.id, error: err instanceof Error ? err.message : String(err) },
      });
    }
  })();

  return reply.send({ topic: topic as any });
});

// List content items for a topic
fastify.get('/content/items', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  // Teachers, district admins, and platform admins can view content items
  try {
    requireRole(user, ['teacher', 'district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const query = z.object({ topicId: z.string() }).parse(request.query);
  const items = await listContentItemsForTopic(query.topicId);

  return reply.send({ items: items as any });
});

// Create a content item
fastify.post('/content/items', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  // Teachers, district admins, and platform admins can create content items
  try {
    requireRole(user, ['teacher', 'district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const { topicId, subject, grade, type, title, status } = request.body as any;

  const item = await createContentItem({
    tenantId: user.tenantId,
    topicId,
    subject,
    grade,
    type,
    title,
    body: '',
    questionFormat: undefined,
    options: undefined,
    correctAnswer: undefined,
    accessibilityNotes: undefined,
    status: status || 'draft',
    createdByUserId: user.userId,
    aiGenerated: false,
    aiModel: undefined,
  });

  // Index the new content item for semantic search (async, don't block response)
  void (async () => {
    try {
      const searchService = getCurriculumSearchService();
      await searchService.indexContentItem({
        id: item.id,
        topicId,
        tenantId: user.tenantId,
        subject,
        grade,
        title,
        body: '',
        contentType: type,
      });
      info('Content item indexed for semantic search', {
        tenantId: user.tenantId,
        meta: { itemId: item.id },
      });
    } catch (err) {
      logError('Failed to index content item', {
        tenantId: user.tenantId,
        meta: { itemId: item.id, error: err instanceof Error ? err.message : String(err) },
      });
    }
  })();

  return reply.send({ item: item as any });
});

// Update a content item
fastify.patch('/content/items/:itemId', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  // Teachers, district admins, and platform admins can update content items
  try {
    requireRole(user, ['teacher', 'district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const params = z.object({ itemId: z.string() }).parse(request.params);
  const { title, status, body } = request.body as any;

  const item = await dbUpdateContentItem(params.itemId, {
    title,
    status,
    body,
  });

  // Re-index the updated content item for semantic search (async, don't block response)
  void (async () => {
    try {
      const searchService = getCurriculumSearchService();
      await searchService.indexContentItem({
        id: item.id,
        topicId: item.topicId,
        tenantId: item.tenantId,
        subject: item.subject,
        grade: item.grade,
        title: item.title,
        body: item.body ?? undefined,
        contentType: item.type ?? undefined,
      });
      info('Content item re-indexed for semantic search', {
        tenantId: item.tenantId,
        meta: { itemId: item.id },
      });
    } catch (err) {
      logError('Failed to re-index content item', {
        tenantId: item.tenantId,
        meta: { itemId: item.id, error: err instanceof Error ? err.message : String(err) },
      });
    }
  })();

  return reply.send({ item: item as any });
});

// Generate draft content using AI
fastify.post('/content/generate-draft', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  // Teachers, district admins, and platform admins can generate draft content
  try {
    requireRole(user, ['teacher', 'district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const { topicId, subject, grade, type } = request.body as any;
  const prompt = 'Generate content for this topic';

  // TODO: Call model-dispatch service to generate content based on prompt
  // For now, create a placeholder draft item
  const generatedText = `[AI Generated Content]\n\nPrompt: ${prompt}\n\nThis is a placeholder. Integrate with model-dispatch service for actual AI generation.`;

  const item = await createContentItem({
    tenantId: user.tenantId,
    topicId,
    subject,
    grade,
    type,
    title: `AI-Generated ${type}`,
    body: type === 'explanation' || type === 'example' ? generatedText : '',
    questionFormat: type === 'practice' ? 'multiple_choice' : undefined,
    options:
      type === 'practice' ? { distractors: ['Option A', 'Option B', 'Option C'] } : undefined,
    correctAnswer: type === 'practice' ? 'Placeholder answer' : undefined,
    accessibilityNotes: undefined,
    status: 'draft',
    createdByUserId: user.userId,
    aiGenerated: true,
    aiModel: 'placeholder-model',
  });

  return reply.send({
    item: item as any,
    requiresReview: true,
    message: 'Draft content generated. Please review and approve before use.',
  });
});

// =============================
// Semantic Search Routes
// =============================

// Semantic search endpoint for curriculum content
fastify.get('/content/search', async (request, reply) => {
  const requestId = ((request as any).requestId as string) ?? randomUUID();
  const span = startSpan('content_search', { requestId });
  const startedAt = Date.now();
  const user = (request as any).user as RequestUser | null;

  // Anyone authenticated can search content
  if (!user) {
    endSpan(span);
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const querySchema = z.object({
    q: z.string().min(1).max(500),
    subject: z.string().optional(),
    grade: z.coerce.number().int().min(1).max(12).optional(),
    type: z.enum(['topic', 'content_item']).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    minScore: z.coerce.number().min(0).max(1).optional(),
  });

  let query;
  try {
    query = querySchema.parse(request.query);
  } catch (err) {
    endSpan(span);
    return reply.status(400).send({ error: 'Invalid query parameters' });
  }

  try {
    const searchService = getCurriculumSearchService();

    const results = await searchService.search(query.q, {
      tenantId: user.tenantId,
      subject: query.subject,
      grade: query.grade,
      contentType: query.type,
      limit: query.limit ?? 10,
      minScore: query.minScore ?? 0.7,
    });

    const duration = Date.now() - startedAt;

    recordMetric({
      name: 'content_search_latency_ms',
      value: duration,
      labels: { tenantId: user.tenantId ?? 'unknown' },
      timestamp: Date.now(),
    });
    recordMetric({
      name: 'content_search_results_count',
      value: results.length,
      labels: { tenantId: user.tenantId ?? 'unknown' },
      timestamp: Date.now(),
    });

    info('Content search completed', {
      tenantId: user.tenantId,
      requestId,
      meta: {
        query: query.q,
        resultsCount: results.length,
        durationMs: duration,
      },
    });

    reply.header('x-request-id', requestId);
    endSpan(span);
    return reply.send({
      results,
      query: query.q,
      totalResults: results.length,
    });
  } catch (err) {
    recordMetric({
      name: 'content_search_errors_total',
      value: 1,
      labels: { tenantId: user.tenantId ?? 'unknown' },
      timestamp: Date.now(),
    });
    logError('Content search failed', {
      tenantId: user.tenantId,
      requestId,
      meta: {
        error: err instanceof Error ? err.message : String(err),
      },
    });
    endSpan(span);
    return reply.status(500).send({ error: 'Search failed', requestId });
  }
});

// Re-index a curriculum topic
fastify.post('/content/topics/:topicId/index', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  try {
    requireRole(user, ['district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const params = z.object({ topicId: z.string() }).parse(request.params);

  // Fetch the topic from database
  const topic = await prismaAny.curriculumTopic.findUnique({
    where: { id: params.topicId },
  });

  if (!topic) {
    return reply.status(404).send({ error: 'Topic not found' });
  }

  try {
    const searchService = getCurriculumSearchService();
    const result = await searchService.indexTopic({
      id: topic.id,
      tenantId: topic.tenantId,
      subject: topic.subject,
      grade: topic.grade,
      title: topic.title,
      description: topic.description ?? undefined,
      standardCode: topic.code ?? undefined,
    });

    return reply.send({
      success: result.success,
      chunksIndexed: result.chunksIndexed,
      tokensUsed: result.tokensUsed,
      error: result.error,
    });
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to index topic',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Re-index a content item
fastify.post('/content/items/:itemId/index', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  try {
    requireRole(user, ['teacher', 'district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const params = z.object({ itemId: z.string() }).parse(request.params);

  // Fetch the item from database
  const item = await prismaAny.contentItem.findUnique({
    where: { id: params.itemId },
  });

  if (!item) {
    return reply.status(404).send({ error: 'Content item not found' });
  }

  try {
    const searchService = getCurriculumSearchService();
    const result = await searchService.indexContentItem({
      id: item.id,
      topicId: item.topicId,
      tenantId: item.tenantId,
      subject: item.subject,
      grade: item.grade,
      title: item.title,
      body: item.body ?? undefined,
      contentType: item.type ?? undefined,
    });

    return reply.send({
      success: result.success,
      chunksIndexed: result.chunksIndexed,
      tokensUsed: result.tokensUsed,
      error: result.error,
    });
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to index content item',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Get vector index statistics
fastify.get('/content/search/stats', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  try {
    requireRole(user, ['district_admin', 'platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  try {
    const searchService = getCurriculumSearchService();
    const stats = await searchService.getStats();
    return reply.send(stats);
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to get stats',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// --- Feedback & Evaluation Routes ---

fastify.post('/feedback', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const feedbackSchema = z.object({
    targetType: z.enum(['tutor_turn', 'session_plan', 'content_item', 'difficulty_decision']),
    targetId: z.string(),
    rating: z.number().min(1).max(5),
    label: z.string().optional(),
    comment: z.string().optional(),
  });

  const body = feedbackSchema.parse(request.body);

  // For now, experiment tagging is not automatic; left empty.
  const feedback = await dbRecordFeedback({
    tenantId: user.tenantId,
    learnerId: undefined, // can be filled when learner context is known
    userId: user.userId,
    targetType: body.targetType,
    targetId: body.targetId,
    role: 'learner', // or derive from user.roles; for now default
    rating: body.rating,
    label: body.label,
    comment: body.comment,
  });

  const response = {
    feedback: {
      id: feedback.id,
      tenantId: feedback.tenantId,
      learnerId: feedback.learnerId ?? undefined,
      userId: feedback.userId ?? undefined,
      targetType: feedback.targetType as any,
      targetId: feedback.targetId,
      role: feedback.role as any,
      rating: feedback.rating,
      label: feedback.label ?? undefined,
      comment: feedback.comment ?? undefined,
      experimentKey: feedback.experimentKey ?? undefined,
      variantKey: feedback.variantKey ?? undefined,
      createdAt: feedback.createdAt.toISOString(),
    },
  };

  return reply.send(response);
});

fastify.get('/feedback/aggregate', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const query = z
    .object({
      targetType: z.string(),
      targetId: z.string(),
    })
    .parse(request.query);

  const agg = await aggregateFeedbackForTarget({
    tenantId: user.tenantId,
    targetType: query.targetType,
    targetId: query.targetId,
  });

  const response = {
    count: agg.count,
    avgRating: agg.avgRating,
  };

  return reply.send(response);
});

fastify.get('/metrics', async (_request, reply) => {
  const metrics = drainMetrics();
  return reply.send({ metrics });
});

// Prometheus-compatible metrics endpoint
fastify.get('/metrics/prometheus', async (_request, reply) => {
  const { getPrometheusMetrics } = await import('@aivo/observability');
  const prometheusMetrics = getPrometheusMetrics();
  return reply.type('text/plain; charset=utf-8').send(prometheusMetrics);
});

// --- Subscription & Payment Routes ---

// Get current subscription info
fastify.get('/subscription', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  try {
    const info = await getSubscriptionInfo(user.tenantId);
    return reply.send(info);
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to get subscription info',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Create checkout session for subscription
const checkoutSchema = z.object({
  tier: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

fastify.post('/subscription/checkout', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  if (!isStripeConfigured()) {
    return reply.status(503).send({ error: 'Payment system not configured' });
  }

  try {
    const body = checkoutSchema.parse(request.body);

    const result = await createCheckoutSession({
      tenantId: user.tenantId,
      tier: body.tier,
      email: user.email || '',
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    });

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send({
      sessionId: result.sessionId,
      url: result.url,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid request', details: err.errors });
    }
    return reply.status(500).send({
      error: 'Failed to create checkout session',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Create customer portal session
fastify.get('/subscription/portal', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  if (!isStripeConfigured()) {
    return reply.status(503).send({ error: 'Payment system not configured' });
  }

  try {
    const query = z
      .object({
        returnUrl: z.string().url().optional(),
      })
      .parse(request.query);

    const result = await createPortalSession({
      tenantId: user.tenantId,
      returnUrl: query.returnUrl,
    });

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send({ url: result.url });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid request', details: err.errors });
    }
    return reply.status(500).send({
      error: 'Failed to create portal session',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Stripe webhook endpoint
// This needs raw body for signature verification
fastify.post(
  '/webhooks/stripe',
  {
    config: {
      rawBody: true,
    },
  },
  async (request, reply) => {
    // Rate limit webhook requests
    const clientIp = (request.ip || request.headers['x-forwarded-for'] || 'unknown') as string;
    const rateLimitResult = await rateLimitByTier(clientIp, 'webhook');

    if (!rateLimitResult.success) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    // Get Stripe signature header
    const signature = request.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      return reply.status(400).send({ error: 'Missing stripe-signature header' });
    }

    // Get raw body for signature verification
    const rawBody = (request as any).rawBody || request.body;
    if (!rawBody) {
      return reply.status(400).send({ error: 'Missing request body' });
    }

    // Verify webhook signature
    const verification = verifyWebhookSignature(
      typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
      signature,
    );

    if (!verification.success || !verification.event) {
      return reply.status(400).send({ error: verification.error || 'Invalid signature' });
    }

    // Process the webhook event
    const result = await handleWebhookEvent(verification.event);

    if (!result.success) {
      // Return 200 to prevent Stripe from retrying, but log the error
      console.error(`[webhook] Failed to process ${result.eventType}: ${result.error}`);
    }

    // Always return 200 to acknowledge receipt
    return reply.send({ received: true, eventType: result.eventType });
  },
);

// --- Email & Password Reset Routes ---

// Request password reset
fastify.post('/auth/forgot-password', async (request, reply) => {
  const schema = z.object({
    email: z.string().email(),
  });

  try {
    const { email } = schema.parse(request.body);

    // Get client info for security logging
    const ipAddress = (request.ip || request.headers['x-forwarded-for'] || 'unknown') as string;
    const userAgent = request.headers['user-agent'];

    // Create reset token
    const result = await createPasswordResetToken(email);

    if (result) {
      // Send password reset email
      await sendPasswordResetEmail(
        { email, name: result.userName || 'there' },
        {
          resetToken: result.token,
          expiresInMinutes: 60,
          ipAddress,
          userAgent,
        },
      );
    }

    // Always return success to prevent email enumeration
    return reply.send({
      success: true,
      message: "If an account with that email exists, we've sent a password reset link.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid email address' });
    }
    console.error('[auth] Password reset error:', err);
    return reply.status(500).send({ error: 'Failed to process request' });
  }
});

// Verify password reset token
fastify.get('/auth/verify-reset-token', async (request, reply) => {
  const schema = z.object({
    token: z.string().min(1),
  });

  try {
    const { token } = schema.parse(request.query);

    const result = await verifyPasswordResetToken(token);

    if (!result.valid) {
      return reply.status(400).send({
        valid: false,
        error: result.expired ? 'Token has expired' : 'Invalid token',
      });
    }

    return reply.send({ valid: true, email: result.email });
  } catch (err) {
    return reply.status(400).send({ valid: false, error: 'Invalid request' });
  }
});

// Reset password with token
fastify.post('/auth/reset-password', async (request, reply) => {
  const schema = z.object({
    token: z.string().min(1),
    password: z.string().min(8),
  });

  try {
    const { token, password: _password } = schema.parse(request.body);

    const result = await consumePasswordResetToken(token);

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    // Note: Actual password update should be handled by auth layer
    // This just validates and consumes the token
    // The caller should then call the auth service to update the password

    return reply.send({
      success: true,
      userId: result.userId,
      message: 'Password reset successful',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid request', details: err.errors });
    }
    return reply.status(500).send({ error: 'Failed to reset password' });
  }
});

// Get email preferences
fastify.get('/email/preferences', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  try {
    const preferences = await getEmailPreferences(user.userId);
    return reply.send(preferences);
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to get email preferences',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Update email preferences
fastify.put('/email/preferences', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const schema = z.object({
    marketing: z.boolean().optional(),
    productUpdates: z.boolean().optional(),
    trialReminders: z.boolean().optional(),
    paymentNotifications: z.boolean().optional(),
    securityAlerts: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
  });

  try {
    const preferences = schema.parse(request.body);
    const updated = await updateEmailPreferences(user.userId, preferences);
    return reply.send(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: 'Invalid request', details: err.errors });
    }
    return reply.status(500).send({
      error: 'Failed to update email preferences',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Trigger trial expiry email cron (internal/admin endpoint)
fastify.post('/admin/email/trial-reminders', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  try {
    requireRole(user, ['platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!isEmailConfigured()) {
    return reply.status(503).send({ error: 'Email not configured' });
  }

  try {
    const results = {
      expiringIn3Days: { sent: 0, skipped: 0, errors: 0 },
      expired: { sent: 0, skipped: 0, errors: 0 },
    };

    // Send 3-day expiry reminders
    const expiringUsers = await findUsersWithExpiringTrials(3);
    for (const user of expiringUsers) {
      if (!user.emailPreferences.trialReminders) {
        results.expiringIn3Days.skipped++;
        continue;
      }

      try {
        await sendTrialExpiringEmail(
          { email: user.email, name: user.name || 'there' },
          { daysRemaining: 3, trialEndsAt: user.trialEndsAt },
        );
        results.expiringIn3Days.sent++;
      } catch (err) {
        console.error(`[email] Failed to send trial expiring email to ${user.email}:`, err);
        results.expiringIn3Days.errors++;
      }
    }

    // Send expired notifications
    const expiredUsers = await findUsersWithExpiredTrials(24);
    for (const user of expiredUsers) {
      if (!user.emailPreferences.trialReminders) {
        results.expired.skipped++;
        continue;
      }

      try {
        await sendTrialExpiredEmail(
          { email: user.email, name: user.name || 'there' },
          { trialEndedAt: user.trialEndedAt },
        );
        results.expired.sent++;
      } catch (err) {
        console.error(`[email] Failed to send trial expired email to ${user.email}:`, err);
        results.expired.errors++;
      }
    }

    return reply.send({
      success: true,
      results,
    });
  } catch (err) {
    console.error('[email] Trial reminder cron error:', err);
    return reply.status(500).send({
      error: 'Failed to process trial reminders',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// ============================================================================
// GDPR / DATA PRIVACY ENDPOINTS
// ============================================================================

// Request data deletion (right to be forgotten)
fastify.delete('/api/users/:userId/data', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const params = z.object({ userId: z.string() }).parse(request.params);
  const body = z.object({ reason: z.string().optional() }).parse(request.body || {});

  // Users can only delete their own data, or admins can delete any user's data
  if (params.userId !== user.userId && !user.roles.includes('platform_admin')) {
    return reply.status(403).send({ error: "Cannot delete another user's data" });
  }

  try {
    const result = await dataDeletionService.requestDeletion(
      params.userId,
      user.userId,
      body.reason,
    );

    info('Data deletion requested', { userId: params.userId, requestedBy: user.userId });

    return reply.send({
      success: true,
      message: 'Data deletion scheduled. You can cancel within 30 days.',
      requestId: result.requestId,
      scheduledFor: result.scheduledFor.toISOString(),
    });
  } catch (err) {
    logError('Data deletion request failed', { error: err });
    return reply.status(500).send({
      error: 'Failed to create deletion request',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Cancel data deletion request
fastify.post('/api/users/:userId/data/cancel-deletion', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const params = z.object({ userId: z.string() }).parse(request.params);
  const body = z.object({ requestId: z.string() }).parse(request.body);

  if (params.userId !== user.userId && !user.roles.includes('platform_admin')) {
    return reply.status(403).send({ error: "Cannot cancel another user's deletion" });
  }

  try {
    const cancelled = await dataDeletionService.cancelDeletion(body.requestId, params.userId);

    if (!cancelled) {
      return reply.status(404).send({ error: 'Deletion request not found or already processed' });
    }

    return reply.send({ success: true, message: 'Deletion request cancelled' });
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to cancel deletion',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Get deletion status
fastify.get('/api/users/:userId/data/deletion-status', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const params = z.object({ userId: z.string() }).parse(request.params);

  if (params.userId !== user.userId && !user.roles.includes('platform_admin')) {
    return reply.status(403).send({ error: "Cannot view another user's deletion status" });
  }

  try {
    const status = await dataDeletionService.getDeletionStatus(params.userId);

    if (!status) {
      return reply.send({ hasPendingDeletion: false });
    }

    return reply.send({
      hasPendingDeletion: status.status === 'pending',
      ...status,
    });
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to get deletion status',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Request data export (data portability)
fastify.get('/api/users/:userId/export', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const params = z.object({ userId: z.string() }).parse(request.params);
  const query = z
    .object({ format: z.enum(['json', 'csv', 'pdf']).optional() })
    .parse(request.query);

  if (params.userId !== user.userId && !user.roles.includes('platform_admin')) {
    return reply.status(403).send({ error: "Cannot export another user's data" });
  }

  try {
    const result = await dataExportService.requestExport(
      params.userId,
      user.userId,
      query.format || 'json',
    );

    // Process immediately for now (in production, queue this)
    const processed = await dataExportService.processExport(result.requestId);

    return reply.send({
      success: true,
      requestId: processed.requestId,
      status: processed.status,
      downloadUrl: processed.downloadUrl,
      expiresAt: processed.expiresAt?.toISOString(),
      format: processed.format,
    });
  } catch (err) {
    logError('Data export failed', { error: err });
    return reply.status(500).send({
      error: 'Failed to export data',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Download exported data
fastify.get('/api/gdpr/exports/:requestId/download', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const params = z.object({ requestId: z.string() }).parse(request.params);

  try {
    const status = await dataExportService.getExportStatus(params.requestId);

    if (!status) {
      return reply.status(404).send({ error: 'Export not found' });
    }

    if (status.userId !== user.userId && !user.roles.includes('platform_admin')) {
      return reply.status(403).send({ error: "Cannot download another user's export" });
    }

    if (status.status !== 'completed') {
      return reply.status(400).send({ error: `Export status: ${status.status}` });
    }

    // Get the full export data
    const exportData = await dataExportService.collectUserData(status.userId);

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="user-data-${status.userId}.json"`);

    return reply.send(exportData);
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to download export',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Update consent preferences
fastify.patch('/api/users/:userId/consent', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const params = z.object({ userId: z.string() }).parse(request.params);
  const body = z
    .object({
      consents: z.array(
        z.object({
          consentType: z.string(),
          granted: z.boolean(),
          version: z.string().optional(),
        }),
      ),
    })
    .parse(request.body);

  if (params.userId !== user.userId && !user.roles.includes('platform_admin')) {
    return reply.status(403).send({ error: "Cannot update another user's consents" });
  }

  try {
    const metadata = {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    };

    await consentService.updateConsents(params.userId, body.consents, metadata);

    const updated = await consentService.getConsents(params.userId);

    return reply.send({
      success: true,
      consents: updated.consents,
    });
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to update consents',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Get consent preferences
fastify.get('/api/users/:userId/consent', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;
  if (!user) {
    return reply.status(401).send({ error: 'Unauthenticated' });
  }

  const params = z.object({ userId: z.string() }).parse(request.params);

  if (params.userId !== user.userId && !user.roles.includes('platform_admin')) {
    return reply.status(403).send({ error: "Cannot view another user's consents" });
  }

  try {
    const preferences = await consentService.getConsents(params.userId);
    return reply.send(preferences);
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to get consents',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Admin: Get retention policies
fastify.get('/admin/gdpr/retention-policies', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  try {
    requireRole(user, ['platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  try {
    const policies = await retentionService.getPolicies();
    return reply.send({ policies });
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to get retention policies',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Admin: Execute retention cleanup (cron endpoint)
fastify.post('/admin/gdpr/retention/execute', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  try {
    requireRole(user, ['platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  try {
    const results = await retentionService.executeRetention();
    return reply.send({
      success: true,
      results,
    });
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to execute retention cleanup',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// Admin: Process pending data deletions (cron endpoint)
fastify.post('/admin/gdpr/deletions/process', async (request, reply) => {
  const user = (request as any).user as RequestUser | null;

  try {
    requireRole(user, ['platform_admin']);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  try {
    const pending = await dataDeletionService.getPendingDeletions();
    const results: Array<{ requestId: string; status: string; error?: string }> = [];

    for (const deletion of pending) {
      const result = await dataDeletionService.processDeletion(deletion.id);
      results.push({
        requestId: deletion.id,
        status: result.status,
        error: result.errorMessage,
      });
    }

    return reply.send({
      success: true,
      processed: results.length,
      results,
    });
  } catch (err) {
    return reply.status(500).send({
      error: 'Failed to process deletions',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

console.log('[server] All routes registered, starting server...');
console.log('[server] Calling fastify.listen on port 4000...');

fastify
  .listen({ port: 4000, host: '0.0.0.0' })
  .then(() => {
    console.log('[server] Server is now listening!');
    // Seed a demo difficulty proposal so caregiver views always have something to show.
    // This runs once on server start and is idempotent on repeated restarts as long as
    // the same ID is used.
    void (async () => {
      try {
        const existing = await prismaAny.difficultyProposal.findFirst({
          where: { id: 'demo-proposal-1' },
        });
        if (!existing) {
          await prismaAny.difficultyProposal.create({
            data: {
              id: 'demo-proposal-1',
              learnerId: 'demo-learner',
              tenantId: 'demo-tenant',
              subject: 'math' as any,
              fromLevel: 5,
              toLevel: 6,
              direction: 'harder' as any,
              rationale:
                'AIVO noticed strong mastery at the current level and suggests a gentle step up.',
              createdBy: 'system',
              status: 'pending' as any,
            },
          });

          await dbCreateNotification({
            tenantId: 'demo-tenant',
            learnerId: 'demo-learner',
            recipientUserId: 'user-parent-1',
            audience: 'parent',
            type: 'difficulty_proposal',
            title: 'AIVO suggests a gentle increase in difficulty',
            body: 'AIVO noticed strong mastery at the current level and suggests a gentle step up.',
            relatedDifficultyProposalId: 'demo-proposal-1',
          });
        }
      } catch (err) {
        fastify.log.error({ err }, 'Failed to seed demo difficulty proposal');
      }
    })();

    fastify.log.info('API Gateway listening on http://0.0.0.0:4000');
  })
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });
