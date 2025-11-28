/**
 * Multi-Provider AI Service
 * Core service for managing AI provider selection, fallback, and execution
 */

import { randomUUID } from "crypto";
import type {
  AICompletionRequest,
  AIChatRequest,
  AIEmbeddingRequest,
  AIResponse,
  AIEmbeddingResponse,
  AIErrorResponse,
  AIStreamChunk,
  AIFallbackChain,
  AIProvider,
  AIModel,
  ProviderType,
  ProviderHealthStatus,
  RateLimitState,
} from "@aivo/types";
import {
  getActiveProvidersByPriority,
  getDefaultFallbackChainForUseCase,
  getFallbackChain,
  getModelsForUseCase,
  getDefaultModelForProvider,
  getModelByIdentifier,
  logAIUsage,
  logProviderHealth,
  checkBudgetStatus,
  incrementBudgetSpent,
  getActiveBudget,
  getRunningExperiment,
  logExperimentResult,
} from "@aivo/persistence";
import { info, warn, error as logError, recordMetric, startSpan, endSpan } from "@aivo/observability";
import { providerRegistry, type ProviderClient } from "./providers";

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitBucket {
  requests: number;
  tokens: number;
  windowStart: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function getRateLimitState(providerId: string, config?: { rpm?: number; tpm?: number }): RateLimitState {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  let bucket = rateLimitBuckets.get(providerId);
  
  // Reset bucket if window expired
  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { requests: 0, tokens: 0, windowStart: now };
    rateLimitBuckets.set(providerId, bucket);
  }
  
  const requestsRemaining = (config?.rpm ?? Infinity) - bucket.requests;
  const tokensRemaining = (config?.tpm ?? Infinity) - bucket.tokens;
  const resetAt = new Date(bucket.windowStart + windowMs).toISOString();
  
  return {
    providerId,
    requestsRemaining: Math.max(0, requestsRemaining),
    tokensRemaining: Math.max(0, tokensRemaining),
    resetAt,
    isLimited: requestsRemaining <= 0 || tokensRemaining <= 0,
  };
}

function consumeRateLimit(providerId: string, tokens: number): void {
  const bucket = rateLimitBuckets.get(providerId);
  if (bucket) {
    bucket.requests++;
    bucket.tokens += tokens;
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, baseDelay: number): number {
  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * exponentialDelay * 0.1;
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Retryable errors
    if (
      message.includes("rate limit") ||
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("503") ||
      message.includes("502") ||
      message.includes("500") ||
      message.includes("overloaded")
    ) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// PROVIDER SELECTION
// ============================================================================

export interface ProviderSelection {
  provider: AIProvider;
  model: AIModel;
  client: ProviderClient;
}

async function selectProvider(
  useCase: string,
  options?: {
    preferredProvider?: string;
    preferredModel?: string;
    excludeProviders?: string[];
    qualityTier?: string;
  }
): Promise<ProviderSelection | null> {
  // If preferred provider/model specified, try that first
  if (options?.preferredProvider) {
    const providers = await getActiveProvidersByPriority();
    const provider = providers.find(
      (p) =>
        (p.id === options.preferredProvider || p.providerType.toLowerCase() === options.preferredProvider?.toLowerCase()) &&
        !options?.excludeProviders?.includes(p.id)
    );
    
    if (provider) {
      const providerTypeLower = provider.providerType.toLowerCase() as keyof typeof providerRegistry;
      const client = providerRegistry[providerTypeLower];
      
      if (client) {
        let model: AIModel | null = null;
        
        if (options?.preferredModel) {
          const foundModel = await getModelByIdentifier(provider.id, options.preferredModel);
          if (foundModel && foundModel.isActive) {
            model = foundModel as unknown as AIModel;
          }
        }
        
        if (!model) {
          const defaultModel = await getDefaultModelForProvider(provider.id);
          if (defaultModel) {
            model = defaultModel as unknown as AIModel;
          } else if (provider.models?.length > 0) {
            model = provider.models[0] as unknown as AIModel;
          }
        }
        
        if (model) {
          return {
            provider: provider as unknown as AIProvider,
            model,
            client,
          };
        }
      }
    }
  }
  
  // Otherwise, get models suitable for the use case
  const models = await getModelsForUseCase(useCase, {
    qualityTier: options?.qualityTier,
    activeOnly: true,
  });
  
  // Filter out excluded providers
  const filteredModels = models.filter(
    (m) => !options?.excludeProviders?.includes(m.providerId)
  );
  
  for (const model of filteredModels) {
    const providerTypeLower = model.provider.providerType.toLowerCase() as keyof typeof providerRegistry;
    const client = providerRegistry[providerTypeLower];
    
    if (client) {
      // Check rate limits
      const rateLimitState = getRateLimitState(model.providerId, {
        rpm: model.provider.rateLimitRpm ?? undefined,
        tpm: model.provider.rateLimitTpm ?? undefined,
      });
      
      if (!rateLimitState.isLimited) {
        return {
          provider: model.provider as unknown as AIProvider,
          model: model as unknown as AIModel,
          client,
        };
      }
    }
  }
  
  return null;
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class MultiProviderAIService {
  /**
   * Execute a completion request with automatic fallback
   */
  async complete(request: AICompletionRequest): Promise<AIResponse | AIErrorResponse> {
    const requestId = request.metadata?.requestId ?? randomUUID();
    const span = startSpan("ai_completion", { requestId, useCase: request.useCase });
    const startTime = Date.now();
    
    try {
      // Check budget
      const budgetStatus = await checkBudgetStatus({
        tenantId: request.metadata?.tenantId,
        learnerId: request.metadata?.learnerId,
      });
      
      if (!budgetStatus.withinBudget) {
        endSpan(span);
        return {
          success: false,
          requestId,
          error: {
            code: "BUDGET_EXCEEDED",
            message: "AI usage budget has been exceeded",
            retryable: false,
          },
        };
      }
      
      // Get fallback chain for use case
      const chain = await getDefaultFallbackChainForUseCase(request.useCase);
      
      if (chain) {
        return await this.executeWithFallbackChain(request, chain as unknown as AIFallbackChain, requestId);
      }
      
      // No chain configured, use dynamic provider selection
      return await this.executeWithDynamicFallback(request, requestId);
    } catch (err) {
      const latency = Date.now() - startTime;
      logError("AI completion failed", {
        requestId,
        meta: { error: err instanceof Error ? err.message : String(err), latencyMs: latency },
      });
      
      endSpan(span);
      
      return {
        success: false,
        requestId,
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Unknown error",
          retryable: false,
        },
      };
    }
  }
  
  /**
   * Execute a chat completion request
   */
  async chat(request: AIChatRequest): Promise<AIResponse | AIErrorResponse> {
    // Convert chat messages to a prompt format for now
    // In a full implementation, this would use provider-specific chat APIs
    const systemMessage = request.messages.find((m) => m.role === "system");
    const userMessages = request.messages.filter((m) => m.role !== "system");
    
    const prompt = userMessages.map((m) => `${m.role}: ${m.content}`).join("\n");
    
    return this.complete({
      prompt,
      systemPrompt: systemMessage?.content,
      useCase: request.useCase,
      preferredProvider: request.preferredProvider,
      preferredModel: request.preferredModel,
      maxRetries: request.maxRetries,
      budget: request.budget,
      maxTokens: request.maxTokens,
      temperature: request.temperature,
      metadata: request.metadata,
    });
  }
  
  /**
   * Generate embeddings
   */
  async embed(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse | AIErrorResponse> {
    const requestId = randomUUID();
    
    // For embeddings, prefer providers with embedding capability
    const selection = await selectProvider(request.useCase ?? "general", {
      preferredProvider: request.preferredProvider,
      preferredModel: request.preferredModel,
    });
    
    if (!selection) {
      return {
        success: false,
        requestId,
        error: {
          code: "NO_PROVIDER",
          message: "No embedding provider available",
          retryable: false,
        },
      };
    }
    
    // Mock embedding response for now
    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    const embeddings = inputs.map(() => Array(1536).fill(0).map(() => Math.random() - 0.5));
    
    return {
      success: true,
      requestId,
      provider: selection.provider.providerType,
      model: selection.model.modelIdentifier,
      embeddings,
      usage: { totalTokens: inputs.join(" ").split(" ").length },
      cost: 0,
      latencyMs: 100,
    };
  }
  
  /**
   * Execute request with a configured fallback chain
   */
  private async executeWithFallbackChain(
    request: AICompletionRequest,
    chain: AIFallbackChain,
    requestId: string
  ): Promise<AIResponse | AIErrorResponse> {
    const startTime = Date.now();
    const fallbackAttempts: Array<{
      provider: string;
      model: string;
      errorCode: string;
      errorMessage: string;
    }> = [];
    
    const maxRetries = request.maxRetries ?? chain.maxRetries;
    const timeout = chain.timeoutMs;
    const excludeProviders: string[] = [];
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Get next provider from chain
      const chainProvider = chain.providers.find(
        (cp) => !excludeProviders.includes(cp.providerId)
      );
      
      if (!chainProvider || !chainProvider.provider) {
        break;
      }
      
      const provider = chainProvider.provider;
      const providerTypeLower = provider.providerType.toLowerCase() as keyof typeof providerRegistry;
      const client = providerRegistry[providerTypeLower];
      
      if (!client) {
        excludeProviders.push(chainProvider.providerId);
        continue;
      }
      
      // Get model
      let modelId = chainProvider.modelOverride;
      let model: AIModel | null = null;
      
      if (modelId) {
        const foundModel = await getModelByIdentifier(provider.id, modelId);
        if (foundModel) {
          model = foundModel as unknown as AIModel;
        }
      }
      
      if (!model) {
        const defaultModel = await getDefaultModelForProvider(provider.id);
        model = defaultModel as unknown as AIModel | null;
      }
      
      if (!model) {
        excludeProviders.push(chainProvider.providerId);
        continue;
      }
      
      try {
        // Apply timeout
        const result = await Promise.race([
          client.callModel({
            prompt: request.prompt,
            system: request.systemPrompt,
            maxTokens: request.maxTokens,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), timeout)
          ),
        ]);
        
        const latency = Date.now() - startTime;
        
        // Calculate tokens and cost (simplified)
        const inputTokens = Math.ceil(request.prompt.length / 4);
        const outputTokens = Math.ceil(result.content.length / 4);
        const cost =
          (inputTokens / 1000) * model.costPer1kInput +
          (outputTokens / 1000) * model.costPer1kOutput;
        
        // Check budget limit
        if (request.budget && cost > request.budget) {
          excludeProviders.push(chainProvider.providerId);
          fallbackAttempts.push({
            provider: provider.providerType,
            model: model.modelIdentifier,
            errorCode: "BUDGET_LIMIT",
            errorMessage: `Cost ${cost.toFixed(4)} exceeds budget ${request.budget}`,
          });
          continue;
        }
        
        // Log usage
        await logAIUsage({
          providerId: provider.id,
          modelId: model.id,
          tenantId: request.metadata?.tenantId,
          learnerId: request.metadata?.learnerId,
          userId: request.metadata?.userId,
          useCase: request.useCase,
          requestId,
          inputTokens,
          outputTokens,
          cost,
          latencyMs: latency,
          success: true,
          fallbackUsed: attempt > 0,
          fallbackFrom: attempt > 0 ? fallbackAttempts[0]?.provider : undefined,
        });
        
        // Update rate limit consumption
        consumeRateLimit(provider.id, inputTokens + outputTokens);
        
        // Update budget
        const budget = await getActiveBudget({
          tenantId: request.metadata?.tenantId,
          learnerId: request.metadata?.learnerId,
        });
        if (budget) {
          await incrementBudgetSpent(budget.id, cost);
        }
        
        // Record metrics
        recordMetric({
          name: "ai_request_latency_ms",
          value: latency,
          labels: {
            provider: provider.providerType,
            model: model.modelIdentifier,
            useCase: request.useCase,
            success: "true",
          },
          timestamp: Date.now(),
        });
        
        info("AI request completed", {
          requestId,
          meta: {
            provider: provider.providerType,
            model: model.modelIdentifier,
            latencyMs: latency,
            cost,
            fallbackUsed: attempt > 0,
          },
        });
        
        return {
          success: true,
          requestId,
          provider: provider.providerType,
          model: model.modelIdentifier,
          content: result.content,
          usage: {
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
          },
          cost,
          latencyMs: latency,
          fallbackUsed: attempt > 0,
          fallbackChain: fallbackAttempts.map((f) => f.provider),
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        
        fallbackAttempts.push({
          provider: provider.providerType,
          model: model.modelIdentifier,
          errorCode: "PROVIDER_ERROR",
          errorMessage,
        });
        
        // Log failed attempt
        await logAIUsage({
          providerId: provider.id,
          modelId: model.id,
          tenantId: request.metadata?.tenantId,
          learnerId: request.metadata?.learnerId,
          useCase: request.useCase,
          requestId,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          latencyMs: Date.now() - startTime,
          success: false,
          errorMessage,
        });
        
        warn("AI provider failed, attempting fallback", {
          requestId,
          meta: {
            provider: provider.providerType,
            model: model.modelIdentifier,
            error: errorMessage,
            attempt,
          },
        });
        
        excludeProviders.push(chainProvider.providerId);
        
        // Apply backoff before retry
        if (attempt < maxRetries && isRetryableError(err)) {
          await sleep(calculateBackoff(attempt, chain.retryDelayMs));
        }
      }
    }
    
    // All attempts failed
    const latency = Date.now() - startTime;
    
    recordMetric({
      name: "ai_request_errors_total",
      value: 1,
      labels: {
        useCase: request.useCase,
        errorType: "all_providers_failed",
      },
      timestamp: Date.now(),
    });
    
    return {
      success: false,
      requestId,
      error: {
        code: "ALL_PROVIDERS_FAILED",
        message: "All providers in fallback chain failed",
        retryable: false,
      },
      fallbackAttempts,
    };
  }
  
  /**
   * Execute request with dynamic provider selection (no configured chain)
   */
  private async executeWithDynamicFallback(
    request: AICompletionRequest,
    requestId: string
  ): Promise<AIResponse | AIErrorResponse> {
    const startTime = Date.now();
    const maxRetries = request.maxRetries ?? 3;
    const excludeProviders: string[] = [];
    const fallbackAttempts: Array<{
      provider: string;
      model: string;
      errorCode: string;
      errorMessage: string;
    }> = [];
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const selection = await selectProvider(request.useCase, {
        preferredProvider: attempt === 0 ? request.preferredProvider : undefined,
        preferredModel: attempt === 0 ? request.preferredModel : undefined,
        excludeProviders,
      });
      
      if (!selection) {
        break;
      }
      
      const { provider, model, client } = selection;
      
      try {
        const result = await client.callModel({
          prompt: request.prompt,
          system: request.systemPrompt,
          maxTokens: request.maxTokens,
        });
        
        const latency = Date.now() - startTime;
        const inputTokens = Math.ceil(request.prompt.length / 4);
        const outputTokens = Math.ceil(result.content.length / 4);
        const cost =
          (inputTokens / 1000) * model.costPer1kInput +
          (outputTokens / 1000) * model.costPer1kOutput;
        
        // Log usage
        await logAIUsage({
          providerId: provider.id,
          modelId: model.id,
          tenantId: request.metadata?.tenantId,
          learnerId: request.metadata?.learnerId,
          userId: request.metadata?.userId,
          useCase: request.useCase,
          requestId,
          inputTokens,
          outputTokens,
          cost,
          latencyMs: latency,
          success: true,
          fallbackUsed: attempt > 0,
          fallbackFrom: attempt > 0 ? fallbackAttempts[0]?.provider : undefined,
        });
        
        consumeRateLimit(provider.id, inputTokens + outputTokens);
        
        return {
          success: true,
          requestId,
          provider: provider.providerType,
          model: model.modelIdentifier,
          content: result.content,
          usage: {
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
          },
          cost,
          latencyMs: latency,
          fallbackUsed: attempt > 0,
          fallbackChain: fallbackAttempts.map((f) => f.provider),
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        
        fallbackAttempts.push({
          provider: provider.providerType,
          model: model.modelIdentifier,
          errorCode: "PROVIDER_ERROR",
          errorMessage,
        });
        
        excludeProviders.push(provider.id);
        
        if (attempt < maxRetries && isRetryableError(err)) {
          await sleep(calculateBackoff(attempt, 1000));
        }
      }
    }
    
    return {
      success: false,
      requestId,
      error: {
        code: "ALL_PROVIDERS_FAILED",
        message: "All available providers failed",
        retryable: false,
      },
      fallbackAttempts,
    };
  }
  
  /**
   * Check health of a specific provider
   */
  async checkHealth(providerId: string): Promise<{
    healthy: boolean;
    status: ProviderHealthStatus;
    latencyMs?: number;
    error?: string;
  }> {
    try {
      // For now, return mock health check
      // In production, this would call the provider's health endpoint
      const status: ProviderHealthStatus = "HEALTHY";
      const latencyMs = Math.floor(Math.random() * 100) + 50;
      
      await logProviderHealth({
        providerId,
        status,
        latencyMs,
      });
      
      return {
        healthy: true,
        status,
        latencyMs,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      await logProviderHealth({
        providerId,
        status: "UNHEALTHY",
        errorMessage,
      });
      
      return {
        healthy: false,
        status: "UNHEALTHY",
        error: errorMessage,
      };
    }
  }
  
  /**
   * Run health checks on all active providers
   */
  async checkAllProviderHealth(): Promise<Array<{
    providerId: string;
    providerType: string;
    healthy: boolean;
    status: ProviderHealthStatus;
    latencyMs?: number;
    error?: string;
  }>> {
    const providers = await getActiveProvidersByPriority();
    
    const results = await Promise.all(
      providers.map(async (provider) => {
        const health = await this.checkHealth(provider.id);
        return {
          providerId: provider.id,
          providerType: provider.providerType,
          ...health,
        };
      })
    );
    
    return results;
  }
  
  /**
   * Select variant for A/B testing
   */
  async selectExperimentVariant(
    useCase: string,
    learnerId?: string
  ): Promise<{ experimentId: string; variantId: string; variantName: string } | null> {
    const experiment = await getRunningExperiment(useCase);
    
    if (!experiment || experiment.variants.length === 0) {
      return null;
    }
    
    // Check if this request should be included in experiment
    if (Math.random() > experiment.trafficPercent) {
      return null;
    }
    
    // Select variant based on traffic weights
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.trafficWeight, 0);
    let random = Math.random() * totalWeight;
    
    for (const variant of experiment.variants) {
      random -= variant.trafficWeight;
      if (random <= 0) {
        return {
          experimentId: experiment.id,
          variantId: variant.id,
          variantName: variant.name,
        };
      }
    }
    
    // Fallback to first variant
    const firstVariant = experiment.variants[0];
    return {
      experimentId: experiment.id,
      variantId: firstVariant.id,
      variantName: firstVariant.name,
    };
  }
}

// Export singleton instance
export const multiProviderAIService = new MultiProviderAIService();
