import Fastify from "fastify";
import { z } from "zod";
import fetch from "node-fetch";
import { prisma } from "./db";
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
  GetLearnerResponse
} from "@aivo/api-client/src/contracts";
import type {
  ListTenantsResponse,
  GetTenantConfigResponse,
  ListDistrictsResponse,
  ListSchoolsResponse,
  ListRoleAssignmentsResponse
} from "@aivo/api-client/src/admin-contracts";
import type {
  Tenant,
  TenantConfig,
  District,
  School,
  RoleAssignment,
  LearnerSession,
  SessionActivity
} from "@aivo/types";
import { getMockUserFromHeader, requireRole } from "./authContext";

const fastify = Fastify({ logger: true });

// --- Auth + role simulation ---

fastify.addHook("preHandler", async (request, _reply) => {
  const roleHeader = request.headers["x-aivo-user"];
  (request as any).user = getMockUserFromHeader(roleHeader);
});

fastify.get("/me", async (request) => {
  const user = (request as any).user;

  // For now we expose a single mock learner linked to this user.
  // Later this can be a list or pulled from the real DB.
  const mockLearnerId = "demo-learner";

  return {
    userId: user.userId,
    tenantId: user.tenantId,
    roles: user.roles,
    learner: {
      id: mockLearnerId,
      displayName: "Demo Learner",
      subjects: ["math"],
      region: "north_america"
    }
  };
});

// Simple mock brain-profile endpoint so brain-orchestrator (or other services)
// can retrieve a LearnerBrainProfile without reaching directly into the DB.
// GET /brain-profile/:learnerId
fastify.get("/brain-profile/:learnerId", async (request, reply) => {
  const params = z.object({ learnerId: z.string() }).parse(request.params);

  // In a real system, this would load from Postgres via Prisma.
  // For now we return a static-but-plausible brain profile.
  const profile: GetLearnerResponse["brainProfile"] = {
    learnerId: params.learnerId,
    tenantId: "demo-tenant",
    region: "north_america",
    currentGrade: 7,
    gradeBand: "6_8",
    subjectLevels: [
      {
        subject: "math",
        enrolledGrade: 7,
        assessedGradeLevel: 5,
        masteryScore: 0.6
      }
    ],
    neurodiversity: {
      autismSpectrum: true,
      sensorySensitivity: true,
      prefersLowStimulusUI: true
    },
    preferences: {
      prefersStepByStep: true,
      prefersShortSessions: true
    },
    lastUpdatedAt: new Date().toISOString()
  };

  return reply.send({ brainProfile: profile });
});

// Lessons / brain-orchestrator proxy

fastify.post("/lessons/generate", async (request, reply) => {
  const body = request.body as GenerateLessonPlanRequest;

  const res = await fetch("http://brain-orchestrator:4003/lessons/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      learnerId: body.learnerId,
      tenantId: "demo-tenant", // TODO: derive from auth/user
      subject: body.subject,
      region: body.region,
      domain: body.domain
    })
  });

  if (!res.ok) {
    const text = await res.text();
    fastify.log.error({ text }, "brain-orchestrator /lessons/generate failed");
    return reply.status(502).send({ error: "Failed to generate lesson plan" });
  }

  const data = (await res.json()) as GenerateLessonPlanResponse;
  const response: GenerateLessonPlanResponse = {
    plan: data.plan
  };

  return reply.send(response);
});

// Baseline assessment routes

fastify.post("/baseline/generate", async (request, reply) => {
  const body = request.body as GenerateBaselineRequest;

  // Forward to baseline-assessment service
  const res = await fetch("http://baseline-assessment:4002/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      learnerId: body.learnerId,
      tenantId: "demo-tenant", // TODO: from auth
      region: "north_america", // TODO: from learner profile
      currentGrade: 7, // TODO: from learner
      subjects: body.subjects
    })
  });

  const data: unknown = await res.json();

  const response: GenerateBaselineResponse = {
    // TODO: map real assessment returned by the service
    assessment: {
  id: (data as any).assessment?.id ?? "baseline-1",
      learnerId: body.learnerId,
      tenantId: "demo-tenant",
      region: "north_america",
      grade: 7,
      subjects: body.subjects,
  items: (data as any).assessment?.items ?? [],
      createdAt: new Date().toISOString(),
      status: "draft"
    }
  };

  return reply.send(response);
});

fastify.post("/baseline/submit", async (request, reply) => {
  const body = request.body as SubmitBaselineResponsesRequest;

  // TODO: real auth/tenant resolution
  const tenantId = "demo-tenant";
  const region = "north_america";

  // For now, we don't receive learnerId in this request. In a real system,
  // this should come from auth/session or by looking up the assessment.
  const learnerId = "demo-learner";

  // Ensure learner exists (simple upsert by id for now)
  const learner = await prisma.learner.upsert({
    where: { id: learnerId },
    update: {},
    create: {
      id: learnerId,
      tenantId,
      userId: learnerId, // TODO: link to real user
      displayName: learnerId,
      currentGrade: 7, // TODO: from learner
      region: "north_america"
    }
  });

  // Persist baseline assessment
  const assessment = await prisma.baselineAssessment.create({
    data: {
      learnerId: learner.id,
      tenantId,
      region: region as any,
      grade: 7,
      // We don't have subject information per response in this contract yet,
      // so we store the raw responses and leave subjects empty for now.
      subjects: [],
      items: body.responses, // raw JSON for now
      status: "completed"
    }
  });

  // TODO: call brain-orchestrator to compute subject levels
  const response: SubmitBaselineResponsesResponse = {
    summary: {
      subjectLevels: [],
      notes:
        "Mock summary – persisted baseline assessment in Postgres, real scoring TBD"
    },
    updatedBrainProfile: {
      learnerId: learner.id,
      tenantId,
      region: region as any,
      currentGrade: learner.currentGrade,
      gradeBand: "6_8",
      subjectLevels: [],
      neurodiversity: {},
      preferences: {},
      lastUpdatedAt: new Date().toISOString()
    }
  };

  return reply.send(response);
});

// Difficulty proposals via Prisma

fastify.post("/difficulty/proposals", async (request, reply) => {
  const body = request.body as CreateDifficultyProposalRequest;

  const baseFrom = 5; // TODO: derive from learner brain profile
  const direction =
    body.toAssessedGradeLevel > baseFrom ? "harder" : "easier";

  const created = await prisma.difficultyChangeProposal.create({
    data: {
      learnerId: body.learnerId,
      subject: body.subject as any,
      fromAssessedGradeLevel: baseFrom,
      toAssessedGradeLevel: body.toAssessedGradeLevel,
      direction: direction as any,
      rationale:
        body.rationale ??
        "System detected sustained mastery; recommending an adjustment in difficulty.",
      createdBy: "system"
    }
  });

  const proposal: CreateDifficultyProposalResponse["proposal"] = {
    id: created.id,
    learnerId: created.learnerId,
    subject: created.subject as any,
    fromAssessedGradeLevel: created.fromAssessedGradeLevel,
    toAssessedGradeLevel: created.toAssessedGradeLevel,
    direction: created.direction as any,
    rationale: created.rationale,
    createdBy: "system",
    createdAt: created.createdAt.toISOString(),
    status: created.status as any
  };

  return reply.send({ proposal });
});

const listQuerySchema = z.object({
  learnerId: z.string().optional()
});

fastify.get("/difficulty/proposals", async (request, reply) => {
  const query = listQuerySchema.parse(request.query);

  const records = await prisma.difficultyChangeProposal.findMany({
    where: query.learnerId ? { learnerId: query.learnerId } : undefined
  });

  const response: ListDifficultyProposalsResponse = {
    proposals: records.map((p: any) => ({
      id: p.id,
      learnerId: p.learnerId,
      subject: p.subject as any,
      fromAssessedGradeLevel: p.fromAssessedGradeLevel,
      toAssessedGradeLevel: p.toAssessedGradeLevel,
      direction: p.direction as any,
      rationale: p.rationale,
      createdBy: p.createdBy as any,
      createdAt: p.createdAt.toISOString(),
      status: p.status as any,
      decidedByUserId: p.decidedByUserId ?? undefined,
      decidedAt: p.decidedAt ? p.decidedAt.toISOString() : undefined,
      decisionNotes: p.decisionNotes ?? undefined
    }))
  };

  return reply.send(response);
});

fastify.post("/difficulty/proposals/:id/decision", async (request, reply) => {
  const paramsSchema = z.object({ id: z.string() });
  const params = paramsSchema.parse(request.params);

  const body = request.body as { approve: boolean; notes?: string };

  const updated = await prisma.difficultyChangeProposal.update({
    where: { id: params.id },
    data: {
      status: (body.approve ? "approved" : "rejected") as any,
      decidedByUserId: "demo-user", // TODO: from auth
      decidedAt: new Date(),
      decisionNotes: body.notes
    }
  });

  const proposal: DecideOnDifficultyProposalResponse["proposal"] = {
    id: updated.id,
    learnerId: updated.learnerId,
    subject: updated.subject as any,
    fromAssessedGradeLevel: updated.fromAssessedGradeLevel,
    toAssessedGradeLevel: updated.toAssessedGradeLevel,
    direction: updated.direction as any,
    rationale: updated.rationale,
    createdBy: updated.createdBy as any,
    createdAt: updated.createdAt.toISOString(),
    status: updated.status as any,
    decidedByUserId: updated.decidedByUserId ?? undefined,
    decidedAt: updated.decidedAt ? updated.decidedAt.toISOString() : undefined,
    decisionNotes: updated.decisionNotes ?? undefined
  };

  const response: DecideOnDifficultyProposalResponse = { proposal };

  return reply.send(response);
});

// --- In-memory mock data for Admin views ---

const mockTenants: Tenant[] = [
  {
    id: "tenant-1",
    type: "district",
    name: "Sunrise Unified School District",
    region: "north_america",
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: "tenant-2",
    type: "independent_school",
    name: "Riverstone Neurodiversity Academy",
    region: "europe",
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

const mockTenantConfigs: TenantConfig[] = [
  {
    tenantId: "tenant-1",
    name: "Sunrise Unified School District",
    defaultRegion: "north_america",
    allowedProviders: ["openai", "anthropic", "google", "meta"],
    dataResidency: "us",
    curricula: [
      {
        id: "curr-1",
        label: "US Common Core (Math, ELA)",
        region: "north_america",
        standard: "us_common_core",
        subjects: ["math", "ela", "reading", "writing"]
      }
    ]
  },
  {
    tenantId: "tenant-2",
    name: "Riverstone Neurodiversity Academy",
    defaultRegion: "europe",
    allowedProviders: ["openai", "anthropic"],
    dataResidency: "eu",
    curricula: [
      {
        id: "curr-2",
        label: "Local National Curriculum",
        region: "europe",
        standard: "local_national",
        subjects: ["math", "science", "sel"]
      }
    ]
  }
];

const mockDistricts: District[] = [
  {
    id: "district-1",
    tenantId: "tenant-1",
    name: "Sunrise District Central",
    country: "USA",
    createdAt: new Date().toISOString()
  }
];

const mockSchools: School[] = [
  {
    id: "school-1",
    tenantId: "tenant-1",
    districtId: "district-1",
    name: "Sunrise Middle School",
    city: "Springfield",
    createdAt: new Date().toISOString()
  },
  {
    id: "school-2",
    tenantId: "tenant-1",
    districtId: "district-1",
    name: "Sunrise High School",
    city: "Springfield",
    createdAt: new Date().toISOString()
  },
  {
    id: "school-3",
    tenantId: "tenant-2",
    districtId: null,
    name: "Riverstone Neurodiversity Academy",
    city: "London",
    createdAt: new Date().toISOString()
  }
];

const mockRoleAssignments: RoleAssignment[] = [
  {
    userId: "user-district-admin",
    tenantId: "tenant-1",
    districtId: "district-1",
    schoolId: null,
    role: "district_admin"
  },
  {
    userId: "user-teacher-1",
    tenantId: "tenant-1",
    districtId: "district-1",
    schoolId: "school-1",
    role: "teacher"
  }
];

// --- In-memory sessions (mock) ---

const mockSessions: LearnerSession[] = [];

// Helper to create a calm, short session from scratch
function createMockSession(
  learnerId: string,
  tenantId: string,
  subject: string
): LearnerSession {
  const id = `session-${Date.now()}`;
  const date = new Date().toISOString().slice(0, 10);

  // TODO (later): Call brain-orchestrator/model-dispatch here to generate
  // personalised activities based on the learner's brain profile and
  // curriculum for this subject, e.g.:
  //
  // const brainProfile = await fetchBrainProfile(learnerId);
  // const plan = await fetch("http://brain-orchestrator:PORT/sessions/plan", { ... });
  // const activitiesFromBrain = plan.activities.map( ... );
  //
  // For now we keep a simple, hand-crafted sequence that follows the
  // same shape the orchestrator would return.

  const activities: SessionActivity[] = [
    {
      id: `${id}-act-1`,
      sessionId: id,
      learnerId,
      subject: subject as any,
      type: "calm_check_in",
      title: "Calm Check-In",
      instructions:
        "Take a deep breath. On a scale from 1 to 5, how ready do you feel to learn right now?",
      estimatedMinutes: 2,
      status: "pending"
    },
    {
      id: `${id}-act-2`,
      sessionId: id,
      learnerId,
      subject: subject as any,
      type: "micro_lesson",
      title: "Micro Lesson",
      instructions:
        "We will review one small idea. You’ll see an example, then try one similar question.",
      estimatedMinutes: 5,
      status: "pending"
    },
    {
      id: `${id}-act-3`,
      sessionId: id,
      learnerId,
      subject: subject as any,
      type: "guided_practice",
      title: "Guided Practice",
      instructions:
        "Try 2–3 practice items. You can ask for a hint anytime. If it feels too hard, you can skip one.",
      estimatedMinutes: 7,
      status: "pending"
    },
    {
      id: `${id}-act-4`,
      sessionId: id,
      learnerId,
      subject: subject as any,
      type: "reflection",
      title: "Reflection",
      instructions:
        "What felt okay? What felt too hard? Choose one thing you’d like AIVO to remember for next time.",
      estimatedMinutes: 3,
      status: "pending"
    }
  ];

  const now = new Date().toISOString();

  const session: LearnerSession = {
    id,
    learnerId,
    tenantId,
    date,
    subject: subject as any,
    status: "planned",
    plannedMinutes: activities.reduce((sum, a) => sum + a.estimatedMinutes, 0),
    activities,
    createdAt: now,
    updatedAt: now
  };

  return session;
}

// --- Session routes ---

// GET /sessions/today?learnerId=...&subject=...
fastify.get("/sessions/today", async (request, reply) => {
  const query = z
    .object({
      learnerId: z.string(),
      subject: z.string()
    })
    .parse(request.query);

  const today = new Date().toISOString().slice(0, 10);
  const existing = mockSessions.find(
    (s) =>
      s.learnerId === query.learnerId &&
      s.subject === (query.subject as any) &&
      s.date === today
  );

  return reply.send({ session: existing ?? null });
});

// POST /sessions/start
fastify.post("/sessions/start", async (request, reply) => {
  const user = (request as any).user;
  const body = z
    .object({
      learnerId: z.string(),
      subject: z.string()
    })
    .parse(request.body);

  const today = new Date().toISOString().slice(0, 10);
  let session = mockSessions.find(
    (s) =>
      s.learnerId === body.learnerId &&
      s.subject === (body.subject as any) &&
      s.date === today
  );

  if (!session) {
    session = createMockSession(body.learnerId, user.tenantId, body.subject);
    mockSessions.push(session);
  }

  if (session.status === "planned") {
    session.status = "active";
    session.updatedAt = new Date().toISOString();
  }

  return reply.send({ session });
});

// PATCH /sessions/:sessionId/activities/:activityId
fastify.patch("/sessions/:sessionId/activities/:activityId", async (request, reply) => {
  const params = z
    .object({
      sessionId: z.string(),
      activityId: z.string()
    })
    .parse(request.params);

  const body = z
    .object({
      status: z.enum(["in_progress", "completed", "skipped"])
    })
    .parse(request.body);

  const session = mockSessions.find((s) => s.id === params.sessionId);
  if (!session) {
    return reply.status(404).send({ error: "Session not found" });
  }

  const activity = session.activities.find((a) => a.id === params.activityId);
  if (!activity) {
    return reply.status(404).send({ error: "Activity not found" });
  }

  const now = new Date().toISOString();

  if (body.status === "in_progress" && activity.status === "pending") {
    activity.status = "in_progress";
    activity.startedAt = now;
  } else if (body.status === "completed") {
    activity.status = "completed";
    if (!activity.startedAt) {
      activity.startedAt = now;
    }
    activity.completedAt = now;
  } else if (body.status === "skipped") {
    activity.status = "skipped";
    if (!activity.startedAt) {
      activity.startedAt = now;
    }
    activity.completedAt = now;
  }

  const allDone = session.activities.every(
    (a) => a.status === "completed" || a.status === "skipped"
  );
  if (allDone) {
    session.status = "completed";
    session.actualMinutes = session.activities.reduce(
      (sum, a) => sum + a.estimatedMinutes,
      0
    );
  }

  session.updatedAt = now;

  const response = { session };
  return reply.send(response);
});

// --- Admin routes ---

fastify.get("/admin/tenants", async (request, reply) => {
  const user = (request as any).user;
  try {
    requireRole(user, ["platform_admin"]);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  const response: ListTenantsResponse = {
    tenants: mockTenants
  };
  return reply.send(response);
});

fastify.get("/admin/tenants/:tenantId", async (request, reply) => {
  const user = (request as any).user;
  const params = z.object({ tenantId: z.string() }).parse(request.params);

  if (!user.roles.includes("platform_admin") && user.tenantId !== params.tenantId) {
    return reply.status(403).send({ error: "Forbidden for this tenant" });
  }

  const tenant = mockTenants.find((t) => t.id === params.tenantId);
  const config = mockTenantConfigs.find((c) => c.tenantId === params.tenantId);

  if (!tenant || !config) {
    return reply.status(404).send({ error: "Tenant not found" });
  }

  const response: GetTenantConfigResponse = {
    tenant,
    config
  };

  return reply.send(response);
});

fastify.get("/admin/tenants/:tenantId/districts", async (request, reply) => {
  const user = (request as any).user;
  const params = z.object({ tenantId: z.string() }).parse(request.params);

  try {
    requireRole(user, ["district_admin", "platform_admin"]);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user.roles.includes("platform_admin") && user.tenantId !== params.tenantId) {
    return reply.status(403).send({ error: "Forbidden for this tenant" });
  }

  const districts = mockDistricts.filter((d) => d.tenantId === params.tenantId);
  const response: ListDistrictsResponse = { districts };
  return reply.send(response);
});

fastify.get("/admin/tenants/:tenantId/schools", async (request, reply) => {
  const user = (request as any).user;
  const params = z.object({ tenantId: z.string() }).parse(request.params);
  const query = z.object({ districtId: z.string().optional() }).parse(request.query);

  try {
    requireRole(user, ["district_admin", "platform_admin"]);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user.roles.includes("platform_admin") && user.tenantId !== params.tenantId) {
    return reply.status(403).send({ error: "Forbidden for this tenant" });
  }

  let schools = mockSchools.filter((s) => s.tenantId === params.tenantId);
  if (query.districtId) {
    schools = schools.filter((s) => s.districtId === query.districtId);
  }

  const response: ListSchoolsResponse = { schools };
  return reply.send(response);
});

fastify.get("/admin/tenants/:tenantId/roles", async (request, reply) => {
  const user = (request as any).user;
  const params = z.object({ tenantId: z.string() }).parse(request.params);

  try {
    requireRole(user, ["district_admin", "platform_admin"]);
  } catch (err: any) {
    return reply.status(err.statusCode ?? 403).send({ error: err.message });
  }

  if (!user.roles.includes("platform_admin") && user.tenantId !== params.tenantId) {
    return reply.status(403).send({ error: "Forbidden for this tenant" });
  }

  const assignments = mockRoleAssignments.filter((a) => a.tenantId === params.tenantId);
  const response: ListRoleAssignmentsResponse = { assignments };
  return reply.send(response);
});

fastify
  .listen({ port: 4000, host: "0.0.0.0" })
  .then(() => {
    fastify.log.info("API Gateway listening on http://0.0.0.0:4000");
  })
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });
