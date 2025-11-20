import { randomUUID } from "crypto";
import FastifyFactory, { type FastifyReply, type FastifyRequest } from "fastify";
import { z } from "zod";
import { generateLessonPlanMock } from "./brainOrchestrator";
import { planLearnerSession } from "./workflows/sessionPlanWorkflow";
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

fastify.get("/metrics", async (_request, reply) => {
  const metrics = drainMetrics();
  return reply.send({ metrics });
});

fastify
  .listen({ port: 4003, host: "0.0.0.0" })
  .then(() => {
    info("Brain Orchestrator listening", { meta: { port: 4003 } });
  })
  .catch((err: unknown) => {
    logError("Brain Orchestrator failed to start", {
      meta: { error: err instanceof Error ? err.message : String(err) }
    });
    process.exit(1);
  });
