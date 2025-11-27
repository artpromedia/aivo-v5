/**
 * Model Dispatch Service - Enhanced Server
 * Multi-Provider AI system with automatic fallback, cost tracking, and admin management
 */

import { randomUUID } from "crypto";
import Fastify from "fastify";
import { z } from "zod";
import { callWithFailover } from "./index";
import { multiProviderAIService } from "./multi-provider-service";
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
  logSafetyIncident,
  // AI Provider persistence
  createAIProvider,
  updateAIProvider,
  deleteAIProvider,
  getAIProvider,
  listAIProviders,
  createAIModel,
  updateAIModel,
  deleteAIModel,
  listAIModels,
  createFallbackChain,
  updateFallbackChain,
  deleteFallbackChain,
  getFallbackChain,
  listFallbackChains,
  getUsageAnalytics,
  getCostBreakdown,
  getHealthDashboard,
  createBudget,
  updateBudget,
  createAIExperiment,
  updateAIExperiment,
  getExperimentResults,
} from "@aivo/persistence";

const fastify = Fastify({ logger: false });

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

const legacyBodySchema = z.object({
  prompt: z.string(),
  system: z.string().optional(),
  config: z
    .object({
      primary: z.enum(["openai", "anthropic", "google", "meta", "cohere", "mistral", "huggingface", "groq", "together", "replicate", "azure_openai", "aws_bedrock", "custom", "aivo_brain"]),
      fallbacks: z.array(z.enum(["openai", "anthropic", "google", "meta", "cohere", "mistral", "huggingface", "groq", "together", "replicate", "azure_openai", "aws_bedrock", "custom", "aivo_brain"]))
    })
    .optional(),
  learnerId: z.string().optional(),
  tenantId: z.string().optional(),
  selProfile: z.any().optional()
});

const completionSchema = z.object({
  prompt: z.string(),
  systemPrompt: z.string().optional(),
  useCase: z.string(),
  preferredProvider: z.string().optional(),
  preferredModel: z.string().optional(),
  maxRetries: z.number().optional(),
  budget: z.number().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  metadata: z.object({
    tenantId: z.string().optional(),
    learnerId: z.string().optional(),
    userId: z.string().optional(),
    requestId: z.string().optional(),
  }).optional(),
});

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant", "function"]),
    content: z.string(),
    name: z.string().optional(),
  })),
  useCase: z.string(),
  preferredProvider: z.string().optional(),
  preferredModel: z.string().optional(),
  maxRetries: z.number().optional(),
  budget: z.number().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().optional(),
  metadata: z.object({
    tenantId: z.string().optional(),
    learnerId: z.string().optional(),
    userId: z.string().optional(),
    requestId: z.string().optional(),
  }).optional(),
});

const embeddingSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  useCase: z.string().optional(),
  preferredProvider: z.string().optional(),
  preferredModel: z.string().optional(),
  metadata: z.object({
    tenantId: z.string().optional(),
    learnerId: z.string().optional(),
    userId: z.string().optional(),
  }).optional(),
});

const providerSchema = z.object({
  providerType: z.enum(["OPENAI", "ANTHROPIC", "GOOGLE", "META", "COHERE", "MISTRAL", "HUGGINGFACE", "GROQ", "TOGETHER", "REPLICATE", "AZURE_OPENAI", "AWS_BEDROCK", "CUSTOM", "AIVO_BRAIN"]),
  name: z.string(),
  apiEndpoint: z.string().optional(),
  apiKey: z.string().optional(),
  priority: z.number().optional(),
  rateLimitRpm: z.number().optional(),
  rateLimitTpm: z.number().optional(),
  costPer1kInput: z.number().optional(),
  costPer1kOutput: z.number().optional(),
  config: z.any().optional(),
  healthCheckUrl: z.string().optional(),
});

const modelSchema = z.object({
  providerId: z.string(),
  modelIdentifier: z.string(),
  displayName: z.string(),
  capabilities: z.array(z.string()),
  maxTokens: z.number(),
  contextWindow: z.number(),
  costPer1kInput: z.number(),
  costPer1kOutput: z.number(),
  useCases: z.array(z.string()).optional(),
  qualityTier: z.enum(["ECONOMY", "STANDARD", "PREMIUM"]).optional(),
  supportedLanguages: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  metadata: z.any().optional(),
});

const fallbackChainSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  useCase: z.string(),
  isDefault: z.boolean().optional(),
  maxRetries: z.number().optional(),
  retryDelayMs: z.number().optional(),
  timeoutMs: z.number().optional(),
  budgetLimit: z.number().optional(),
  providers: z.array(z.object({
    providerId: z.string(),
    priority: z.number(),
    modelOverride: z.string().optional(),
    config: z.any().optional(),
  })),
});

const budgetSchema = z.object({
  tenantId: z.string().optional(),
  learnerId: z.string().optional(),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  budgetAmount: z.number(),
  alertThreshold: z.number().optional(),
  hardLimit: z.boolean().optional(),
});

const experimentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  useCase: z.string(),
  trafficPercent: z.number().optional(),
  variants: z.array(z.object({
    name: z.string(),
    providerId: z.string().optional(),
    modelId: z.string().optional(),
    config: z.any().optional(),
    trafficWeight: z.number().optional(),
  })),
});

// ============================================================================
// LEGACY DISPATCH ENDPOINT (backward compatible)
// ============================================================================

fastify.post("/dispatch", async (request, reply) => {
  const requestId = (request.headers["x-request-id"] as string) ?? randomUUID();
  const span = startSpan("model_dispatch", { requestId });
  const startedAt = Date.now();

  const parsed = legacyBodySchema.parse(request.body);
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

      config.primary = filtered[0] as typeof config.primary;
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
        severity: (safetyScan.severity?.toUpperCase() ?? "WATCH") as "WATCH" | "CONCERN" | "CRITICAL",
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

// ============================================================================
// NEW AI API ENDPOINTS
// ============================================================================

// Unified completion endpoint
fastify.post("/api/ai/completion", async (request, reply) => {
  try {
    const body = completionSchema.parse(request.body);
    const result = await multiProviderAIService.complete(body);
    return reply.send(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Completion endpoint error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Chat completion endpoint
fastify.post("/api/ai/chat", async (request, reply) => {
  try {
    const body = chatSchema.parse(request.body);
    const result = await multiProviderAIService.chat(body);
    return reply.send(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Chat endpoint error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Embedding endpoint
fastify.post("/api/ai/embedding", async (request, reply) => {
  try {
    const body = embeddingSchema.parse(request.body);
    const result = await multiProviderAIService.embed(body);
    return reply.send(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Embedding endpoint error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// ============================================================================
// ADMIN API ENDPOINTS - PROVIDERS
// ============================================================================

// List all providers
fastify.get("/api/admin/ai/providers", async (request, reply) => {
  try {
    const query = request.query as { activeOnly?: string; providerType?: string };
    const providers = await listAIProviders({
      activeOnly: query.activeOnly === "true",
      providerType: query.providerType,
    });
    return reply.send({ providers });
  } catch (err) {
    logError("List providers error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Get single provider
fastify.get("/api/admin/ai/providers/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const provider = await getAIProvider(id);
    if (!provider) {
      return reply.status(404).send({ error: "Provider not found" });
    }
    return reply.send({ provider });
  } catch (err) {
    logError("Get provider error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Create provider
fastify.post("/api/admin/ai/providers", async (request, reply) => {
  try {
    const body = providerSchema.parse(request.body);
    // TODO: Encrypt API key before storing
    const provider = await createAIProvider({
      ...body,
      apiKeyEncrypted: body.apiKey, // Should encrypt in production
    });
    info("AI provider created", { meta: { providerId: provider.id, providerType: body.providerType } });
    return reply.status(201).send({ provider });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Create provider error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Update provider
fastify.put("/api/admin/ai/providers/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const body = providerSchema.partial().parse(request.body);
    const provider = await updateAIProvider(id, {
      ...body,
      apiKeyEncrypted: body.apiKey,
    });
    info("AI provider updated", { meta: { providerId: id } });
    return reply.send({ provider });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Update provider error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Delete provider
fastify.delete("/api/admin/ai/providers/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    await deleteAIProvider(id);
    info("AI provider deleted", { meta: { providerId: id } });
    return reply.status(204).send();
  } catch (err) {
    logError("Delete provider error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// ============================================================================
// ADMIN API ENDPOINTS - MODELS
// ============================================================================

// List models
fastify.get("/api/admin/ai/models", async (request, reply) => {
  try {
    const query = request.query as {
      providerId?: string;
      activeOnly?: string;
      capability?: string;
      useCase?: string;
    };
    const models = await listAIModels({
      providerId: query.providerId,
      activeOnly: query.activeOnly === "true",
      capability: query.capability,
      useCase: query.useCase,
    });
    return reply.send({ models });
  } catch (err) {
    logError("List models error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Create model
fastify.post("/api/admin/ai/models", async (request, reply) => {
  try {
    const body = modelSchema.parse(request.body);
    const model = await createAIModel(body);
    info("AI model created", { meta: { modelId: model.id, providerId: body.providerId } });
    return reply.status(201).send({ model });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Create model error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Update model
fastify.put("/api/admin/ai/models/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const body = modelSchema.partial().parse(request.body);
    const model = await updateAIModel(id, body);
    info("AI model updated", { meta: { modelId: id } });
    return reply.send({ model });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Update model error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Delete model
fastify.delete("/api/admin/ai/models/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    await deleteAIModel(id);
    info("AI model deleted", { meta: { modelId: id } });
    return reply.status(204).send();
  } catch (err) {
    logError("Delete model error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// ============================================================================
// ADMIN API ENDPOINTS - FALLBACK CHAINS
// ============================================================================

// List fallback chains
fastify.get("/api/admin/ai/fallback-chains", async (request, reply) => {
  try {
    const query = request.query as { useCase?: string; activeOnly?: string };
    const chains = await listFallbackChains({
      useCase: query.useCase,
      activeOnly: query.activeOnly === "true",
    });
    return reply.send({ chains });
  } catch (err) {
    logError("List fallback chains error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Get fallback chain
fastify.get("/api/admin/ai/fallback-chains/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const chain = await getFallbackChain(id);
    if (!chain) {
      return reply.status(404).send({ error: "Fallback chain not found" });
    }
    return reply.send({ chain });
  } catch (err) {
    logError("Get fallback chain error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Create fallback chain
fastify.post("/api/admin/ai/fallback-chains", async (request, reply) => {
  try {
    const body = fallbackChainSchema.parse(request.body);
    const chain = await createFallbackChain(body);
    info("Fallback chain created", { meta: { chainId: chain.id, useCase: body.useCase } });
    return reply.status(201).send({ chain });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Create fallback chain error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Update fallback chain
fastify.put("/api/admin/ai/fallback-chains/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const body = fallbackChainSchema.partial().parse(request.body);
    const chain = await updateFallbackChain(id, body);
    info("Fallback chain updated", { meta: { chainId: id } });
    return reply.send({ chain });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Update fallback chain error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Delete fallback chain
fastify.delete("/api/admin/ai/fallback-chains/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    await deleteFallbackChain(id);
    info("Fallback chain deleted", { meta: { chainId: id } });
    return reply.status(204).send();
  } catch (err) {
    logError("Delete fallback chain error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// ============================================================================
// ADMIN API ENDPOINTS - ANALYTICS
// ============================================================================

// Usage analytics
fastify.get("/api/admin/ai/usage", async (request, reply) => {
  try {
    const query = request.query as {
      startDate?: string;
      endDate?: string;
      tenantId?: string;
      providerId?: string;
      useCase?: string;
    };
    
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    
    const analytics = await getUsageAnalytics({
      startDate,
      endDate,
      tenantId: query.tenantId,
      providerId: query.providerId,
      useCase: query.useCase,
    });
    
    return reply.send(analytics);
  } catch (err) {
    logError("Usage analytics error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Cost breakdown
fastify.get("/api/admin/ai/costs", async (request, reply) => {
  try {
    const query = request.query as {
      startDate?: string;
      endDate?: string;
      tenantId?: string;
    };
    
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const costs = await getCostBreakdown({
      startDate,
      endDate,
      tenantId: query.tenantId,
    });
    
    return reply.send(costs);
  } catch (err) {
    logError("Cost breakdown error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Health dashboard
fastify.get("/api/admin/ai/health", async (request, reply) => {
  try {
    const health = await getHealthDashboard();
    return reply.send(health);
  } catch (err) {
    logError("Health dashboard error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Run health check on all providers
fastify.post("/api/admin/ai/health/check", async (request, reply) => {
  try {
    const results = await multiProviderAIService.checkAllProviderHealth();
    return reply.send({ results });
  } catch (err) {
    logError("Health check error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// ============================================================================
// ADMIN API ENDPOINTS - BUDGETS
// ============================================================================

// Create budget
fastify.post("/api/admin/ai/budgets", async (request, reply) => {
  try {
    const body = budgetSchema.parse(request.body);
    const budget = await createBudget(body);
    info("Budget created", { meta: { budgetId: budget.id } });
    return reply.status(201).send({ budget });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Create budget error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Update budget
fastify.put("/api/admin/ai/budgets/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const body = budgetSchema.partial().parse(request.body);
    const budget = await updateBudget(id, body);
    info("Budget updated", { meta: { budgetId: id } });
    return reply.send({ budget });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Update budget error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// ============================================================================
// ADMIN API ENDPOINTS - EXPERIMENTS
// ============================================================================

// Create experiment
fastify.post("/api/admin/ai/experiments", async (request, reply) => {
  try {
    const body = experimentSchema.parse(request.body);
    const experiment = await createAIExperiment(body);
    info("Experiment created", { meta: { experimentId: experiment.id } });
    return reply.status(201).send({ experiment });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Create experiment error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Update experiment
fastify.put("/api/admin/ai/experiments/:id", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const body = experimentSchema.partial().parse(request.body);
    const experiment = await updateAIExperiment(id, body);
    info("Experiment updated", { meta: { experimentId: id } });
    return reply.send({ experiment });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid request", details: err.errors });
    }
    logError("Update experiment error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// Get experiment results
fastify.get("/api/admin/ai/experiments/:id/results", async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const results = await getExperimentResults(id);
    return reply.send({ results });
  } catch (err) {
    logError("Get experiment results error", { meta: { error: String(err) } });
    return reply.status(500).send({ error: "Internal server error" });
  }
});

// ============================================================================
// METRICS ENDPOINT
// ============================================================================

fastify.get("/metrics", async (_request, reply) => {
  const metrics = drainMetrics();
  return reply.send({ metrics });
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

fastify.get("/health", async (_request, reply) => {
  return reply.send({ status: "healthy", timestamp: new Date().toISOString() });
});

// ============================================================================
// START SERVER
// ============================================================================

fastify.listen({ port: 4001, host: "0.0.0.0" })
  .then(() => {
    info("Model Dispatch Service listening", { meta: { port: 4001 } });
  })
  .catch((err) => {
    logError("Model Dispatch failed to start", { meta: { error: String(err) } });
    process.exit(1);
  });
