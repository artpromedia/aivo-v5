import { randomUUID } from "crypto";
import Fastify from "fastify";
import { z } from "zod";
import { callWithFailover } from "./index";
import type { ModelDispatchConfig } from "@aivo/types";
import {
  info,
  warn,
  error as logError,
  recordMetric,
  startSpan,
  endSpan,
  drainMetrics
} from "@aivo/observability";
import {
  applyToneGuidelines,
  scanForSafetyConcerns
} from "@aivo/guardrails";
import {
  getOrCreateTenantLimits,
  getTenantUsageForDate,
  incrementTenantUsage,
  logSafetyIncident
} from "@aivo/persistence";

const fastify = Fastify({ logger: false });

const bodySchema = z.object({
  prompt: z.string(),
  system: z.string().optional(),
  config: z
    .object({
      primary: z.enum(["openai", "anthropic", "google", "meta"]),
      fallbacks: z.array(z.enum(["openai", "anthropic", "google", "meta"]))
    })
    .optional(),
  learnerId: z.string().optional(),
  tenantId: z.string().optional(),
  selProfile: z.any().optional()
});

fastify.post("/dispatch", async (request, reply) => {
  const requestId = (request.headers["x-request-id"] as string) ?? randomUUID();
  const span = startSpan("model_dispatch", { requestId });
  const startedAt = Date.now();

  const parsed = bodySchema.parse(request.body);
  const tenantId = parsed.tenantId ?? undefined;
  const today = new Date().toISOString().slice(0, 10);
  const config: ModelDispatchConfig = parsed.config ?? {
    primary: "openai",
    fallbacks: ["anthropic", "google", "meta"]
  };

  try {
    if (tenantId) {
      const limits = await getOrCreateTenantLimits(tenantId);
      const allowedProviders = (limits.allowedProviders as string[] | null) ?? null;
      const blockedProviders = (limits.blockedProviders as string[] | null) ?? null;

      const providerSequence = [config.primary, ...config.fallbacks];
      const filtered = providerSequence.filter((provider) => {
        if (blockedProviders && blockedProviders.includes(provider)) {
          return false;
        }
        if (allowedProviders && !allowedProviders.includes(provider)) {
          return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        warn("No providers allowed for tenant", { tenantId, requestId });
        endSpan(span);
        return reply.status(403).send({ error: "No AI providers allowed for this tenant." });
      }

  config.primary = filtered[0];
  config.fallbacks = filtered.slice(1) as typeof config.fallbacks;

      if (limits.maxDailyLlmCalls != null) {
        const usage = await getTenantUsageForDate(tenantId, today);
        const used = usage?.llmCalls ?? 0;
        if (used >= limits.maxDailyLlmCalls) {
          warn("Tenant exceeded LLM quota", {
            tenantId,
            requestId,
            meta: { used, limit: limits.maxDailyLlmCalls }
          });
          endSpan(span);
          return reply.status(429).send({ error: "Daily LLM quota exceeded." });
        }
        if (used >= Math.floor(limits.maxDailyLlmCalls * 0.8)) {
          reply.header(
            "x-aivo-usage-warning",
            `LLM quota ${used}/${limits.maxDailyLlmCalls} approaching limit`
          );
        }
      }
    }

    const adjustedPrompt = applyToneGuidelines(parsed.prompt, parsed.selProfile);
    const result = await callWithFailover(config, {
      prompt: adjustedPrompt,
      system: parsed.system
    });

    const duration = Date.now() - startedAt;

    recordMetric({
      name: "llm_request_latency_ms",
      value: duration,
      labels: {
        provider: result.provider,
        tenantId: tenantId ?? "unknown"
      },
      timestamp: Date.now()
    });

    info("LLM call success", {
      tenantId,
      requestId,
      meta: {
        provider: result.provider,
        durationMs: duration
      }
    });

    if (tenantId) {
      await incrementTenantUsage({
        tenantId,
        date: today,
        llmCalls: 1
      });
    }

    const safetyScan = scanForSafetyConcerns(result.content ?? "");
    if (safetyScan.flagged && tenantId) {
      await logSafetyIncident({
        tenantId,
        learnerId: parsed.learnerId,
        type: safetyScan.type ?? "inappropriate_language",
        severity: safetyScan.severity ?? "watch",
        message: `Guardrails flagged output: ${(safetyScan.matches ?? []).join(", ")}`,
        rawModelResponse: result.content
      });
    }

    endSpan(span);
    return reply.send({ ...result, requestId });
  } catch (err) {
    const duration = Date.now() - startedAt;

    recordMetric({
      name: "llm_request_errors_total",
      value: 1,
      labels: {
        tenantId: tenantId ?? "unknown"
      },
      timestamp: Date.now()
    });

    logError("LLM call failed", {
      tenantId,
      requestId,
      meta: {
        error: err instanceof Error ? err.message : String(err),
        durationMs: duration
      }
    });

    endSpan(span);
    return reply.status(500).send({ error: "Model dispatch failed.", requestId });
  }
});

fastify.get("/metrics", async (_request, reply) => {
  const metrics = drainMetrics();
  return reply.send({ metrics });
});

fastify.listen({ port: 4001, host: "0.0.0.0" })
  .then(() => {
    info("Model Dispatch listening", { meta: { port: 4001 } });
  })
  .catch((err) => {
    logError("Model Dispatch failed to start", { meta: { error: String(err) } });
    process.exit(1);
  });
