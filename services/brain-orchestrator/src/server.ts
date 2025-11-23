import { randomUUID } from "crypto";
import FastifyFactory, { type FastifyReply, type FastifyRequest } from "fastify";
import { z } from "zod";
import { generateLessonPlanMock } from "./brainOrchestrator";
import { planLearnerSession } from "./workflows/sessionPlanWorkflow";
import { getTutorOrchestrationService } from "./tutorOrchestration";
import { initializeWebSocketServer, metricsRegistry } from "./websocket-server.js";
import {
  info,
  error as logError,
  recordMetric,
  startSpan,
  endSpan,
  drainMetrics
} from "@aivo/observability";
import { incrementTenantUsage } from "@aivo/persistence";

const generateLessonSchema = z.object({
  learnerId: z.string(),
  tenantId: z.string(),
  subject: z.string(),
  region: z.string(),
  domain: z.string().optional()
});

const planSessionSchema = z.object({
  learnerId: z.string(),
  tenantId: z.string(),
  subject: z.string(),
  region: z.string()
});

const startTutorSessionSchema = z.object({
  sessionId: z.string(),
  learnerId: z.string(),
  activity: z.object({
    id: z.string(),
    subject: z.string(),
    topic: z.string().optional(),
    difficulty: z.number().optional()
  })
});

const tutorInputSchema = z.object({
  sessionId: z.string(),
  learnerInput: z.string(),
  inputType: z.enum(["question", "answer", "frustration", "confusion", "off_topic"]).optional()
});

const setQuestionSchema = z.object({
  sessionId: z.string(),
  question: z.object({
    id: z.string(),
    text: z.string(),
    type: z.enum(["multiple_choice", "short_answer", "numeric", "open_ended"]),
    correctAnswer: z.union([z.string(), z.number(), z.array(z.string())]).optional(),
    options: z.array(z.string()).optional(),
    hints: z.array(z.string()).optional()
  })
});

const fastify = FastifyFactory({ logger: true });
fastify.post("/lessons/generate", async (request: FastifyRequest, reply: FastifyReply) => {
  const requestId = (request.headers["x-request-id"] as string) ?? randomUUID();
  const span = startSpan("lessons_generate", { requestId });
  const startedAt = Date.now();
  const parsed = generateLessonSchema.parse(request.body);

  try {
    const { plan } = await generateLessonPlanMock({
      learnerId: parsed.learnerId,
      tenantId: parsed.tenantId,
      subject: parsed.subject as any,
      region: parsed.region as any,
      domain: parsed.domain as any
    });

    const duration = Date.now() - startedAt;
    recordMetric({
      name: "lessons_generated_total",
      value: 1,
      labels: {
        tenantId: parsed.tenantId,
        subject: parsed.subject
      },
      timestamp: Date.now()
    });
    recordMetric({
      name: "lessons_generate_latency_ms",
      value: duration,
      labels: {
        tenantId: parsed.tenantId
      },
      timestamp: Date.now()
    });
    info("Lesson generated", {
      tenantId: parsed.tenantId,
      meta: { durationMs: duration, requestId }
    });
    endSpan(span);
    return reply.send({ plan, requestId });
  } catch (err) {
    logError("Lesson generation failed", {
      tenantId: parsed.tenantId,
      meta: { error: err instanceof Error ? err.message : String(err), requestId }
    });
    endSpan(span);
    return reply.status(500).send({ error: "Failed to generate lesson", requestId });
  }
});

fastify.post("/sessions/plan", async (request: FastifyRequest, reply: FastifyReply) => {
  const requestId = (request.headers["x-request-id"] as string) ?? randomUUID();
  const span = startSpan("sessions_plan", { requestId });
  const startedAt = Date.now();
  const parsed = planSessionSchema.parse(request.body);

  try {
    const run = await planLearnerSession({
      learnerId: parsed.learnerId,
      tenantId: parsed.tenantId,
      subject: parsed.subject as any,
      region: parsed.region as any
    });

    const duration = Date.now() - startedAt;
    recordMetric({
      name: "sessions_planned_total",
      value: 1,
      labels: {
        tenantId: parsed.tenantId,
        subject: parsed.subject
      },
      timestamp: Date.now()
    });
    recordMetric({
      name: "sessions_plan_latency_ms",
      value: duration,
      labels: {
        tenantId: parsed.tenantId
      },
      timestamp: Date.now()
    });

    await incrementTenantUsage({
      tenantId: parsed.tenantId,
      date: new Date().toISOString().slice(0, 10),
      sessionsPlanned: 1
    });

    info("Session planned", {
      tenantId: parsed.tenantId,
      meta: { durationMs: duration, requestId }
    });
    endSpan(span);
    return reply.send({ run, requestId });
  } catch (err) {
    logError("Session planning failed", {
      tenantId: parsed.tenantId,
      meta: { error: err instanceof Error ? err.message : String(err), requestId }
    });
    endSpan(span);
    return reply.status(500).send({ error: "Failed to plan session", requestId });
  }
});

// Tutor Orchestration Endpoints
fastify.post("/tutor/sessions/start", async (request: FastifyRequest, reply: FastifyReply) => {
  const requestId = (request.headers["x-request-id"] as string) ?? randomUUID();
  const span = startSpan("tutor_session_start", { requestId });
  const parsed = startTutorSessionSchema.parse(request.body);

  try {
    const tutorService = getTutorOrchestrationService();
    await tutorService.startSession(
      parsed.sessionId,
      parsed.learnerId,
      parsed.activity
    );

    info("Tutor session started", {
      meta: { sessionId: parsed.sessionId, learnerId: parsed.learnerId, requestId }
    });
    endSpan(span);
    return reply.send({ success: true, sessionId: parsed.sessionId, requestId });
  } catch (err) {
    logError("Tutor session start failed", {
      meta: { error: err instanceof Error ? err.message : String(err), requestId }
    });
    endSpan(span);
    return reply.status(500).send({ error: "Failed to start tutor session", requestId });
  }
});

fastify.post("/tutor/input", async (request: FastifyRequest, reply: FastifyReply) => {
  const requestId = (request.headers["x-request-id"] as string) ?? randomUUID();
  const span = startSpan("tutor_input", { requestId });
  const startedAt = Date.now();
  const parsed = tutorInputSchema.parse(request.body);

  try {
    const tutorService = getTutorOrchestrationService();
    const response = await tutorService.processLearnerInput(
      parsed.sessionId,
      parsed.learnerInput,
      parsed.inputType
    );

    const duration = Date.now() - startedAt;
    recordMetric({
      name: "tutor_interactions_total",
      value: 1,
      labels: {
        inputType: parsed.inputType || "question",
        responseType: response.type
      },
      timestamp: Date.now()
    });
    recordMetric({
      name: "tutor_interaction_latency_ms",
      value: duration,
      timestamp: Date.now()
    });

    info("Tutor interaction processed", {
      meta: { sessionId: parsed.sessionId, durationMs: duration, requestId }
    });
    endSpan(span);
    return reply.send({ response, requestId });
  } catch (err) {
    logError("Tutor interaction failed", {
      meta: { error: err instanceof Error ? err.message : String(err), requestId }
    });
    endSpan(span);
    return reply.status(500).send({ error: "Failed to process tutor input", requestId });
  }
});

fastify.post("/tutor/questions/set", async (request: FastifyRequest, reply: FastifyReply) => {
  const requestId = (request.headers["x-request-id"] as string) ?? randomUUID();
  const parsed = setQuestionSchema.parse(request.body);

  try {
    const tutorService = getTutorOrchestrationService();
    tutorService.setCurrentQuestion(parsed.sessionId, parsed.question);

    return reply.send({ success: true, requestId });
  } catch (err) {
    logError("Set question failed", {
      meta: { error: err instanceof Error ? err.message : String(err), requestId }
    });
    return reply.status(500).send({ error: "Failed to set question", requestId });
  }
});

fastify.get("/tutor/sessions/:sessionId/history", async (request: FastifyRequest, reply: FastifyReply) => {
  const requestId = (request.headers["x-request-id"] as string) ?? randomUUID();
  const { sessionId } = request.params as { sessionId: string };

  try {
    const tutorService = getTutorOrchestrationService();
    const history = tutorService.getConversationHistory(sessionId);

    return reply.send({ history, requestId });
  } catch (err) {
    logError("Get conversation history failed", {
      meta: { error: err instanceof Error ? err.message : String(err), requestId }
    });
    return reply.status(500).send({ error: "Failed to get history", requestId });
  }
});

fastify.get("/tutor/sessions/:sessionId/summary", async (request: FastifyRequest, reply: FastifyReply) => {
  const requestId = (request.headers["x-request-id"] as string) ?? randomUUID();
  const { sessionId } = request.params as { sessionId: string };

  try {
    const tutorService = getTutorOrchestrationService();
    const summary = tutorService.getSessionSummary(sessionId);

    if (!summary) {
      return reply.status(404).send({ error: "Session not found", requestId });
    }

    return reply.send({ summary, requestId });
  } catch (err) {
    logError("Get session summary failed", {
      meta: { error: err instanceof Error ? err.message : String(err), requestId }
    });
    return reply.status(500).send({ error: "Failed to get summary", requestId });
  }
});

fastify.get("/tutor/learners/:learnerId/insights", async (request: FastifyRequest, reply: FastifyReply) => {
  const requestId = (request.headers["x-request-id"] as string) ?? randomUUID();
  const { learnerId } = request.params as { learnerId: string };

  try {
    const tutorService = getTutorOrchestrationService();
    const insights = await tutorService.getConversationInsights(learnerId);

    return reply.send({ insights, requestId });
  } catch (err) {
    logError("Get conversation insights failed", {
      meta: { error: err instanceof Error ? err.message : String(err), requestId }
    });
    return reply.status(500).send({ error: "Failed to get insights", requestId });
  }
});

fastify.post("/tutor/sessions/:sessionId/end", async (request: FastifyRequest, reply: FastifyReply) => {
  const requestId = (request.headers["x-request-id"] as string) ?? randomUUID();
  const { sessionId } = request.params as { sessionId: string };

  try {
    const tutorService = getTutorOrchestrationService();
    await tutorService.endSession(sessionId);

    info("Tutor session ended", {
      meta: { sessionId, requestId }
    });

    return reply.send({ success: true, requestId });
  } catch (err) {
    logError("End tutor session failed", {
      meta: { error: err instanceof Error ? err.message : String(err), requestId }
    });
    return reply.status(500).send({ error: "Failed to end session", requestId });
  }
});

fastify.get("/metrics", async (_request, reply) => {
  const metrics = drainMetrics();
  return reply.send({ metrics });
});

// Prometheus metrics endpoint
fastify.get("/metrics/prometheus", async (_request, reply) => {
  reply.type("text/plain");
  return reply.send(await metricsRegistry.metrics());
});

fastify
  .listen({ port: 4003, host: "0.0.0.0" })
  .then(() => {
    info("Brain Orchestrator listening", { meta: { port: 4003 } });
    
    // Initialize WebSocket server on the same HTTP server
    const httpServer = fastify.server;
    const io = initializeWebSocketServer(httpServer);
    
    info("WebSocket server initialized", { meta: { port: 4003 } });
  })
  .catch((err: unknown) => {
    logError("Brain Orchestrator failed to start", {
      meta: { error: err instanceof Error ? err.message : String(err) }
    });
    process.exit(1);
  });
