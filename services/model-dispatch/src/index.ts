import { providerRegistry, type ModelRequest, type ModelResponse } from "./providers";
import type { ModelDispatchConfig, LLMProviderName } from "@aivo/types";

// Export the multi-provider service
export { MultiProviderAIService } from "./multi-provider-service";

// Export provider registry and types
export { providerRegistry, type ModelRequest, type ModelResponse } from "./providers";

// Export all AI provider types
export type {
  AIProviderConfig,
  AIModelConfig,
  AIUsageRecord,
  AIFallbackChainConfig,
  AICompletionRequest,
  AICompletionResponse,
  AIChatMessage,
  AIChatRequest,
  AIChatResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AIProviderHealth,
  AIUsageAnalytics,
  AICostBreakdown,
  AIProviderStats,
  ProviderType,
  AIUseCase,
  AIModelCapability,
} from "@aivo/types";

/**
 * Legacy function for backwards compatibility
 * @deprecated Use MultiProviderAIService instead for more features
 */
export async function callWithFailover(
  config: ModelDispatchConfig,
  request: ModelRequest
): Promise<ModelResponse> {
  const sequence: LLMProviderName[] = [config.primary, ...config.fallbacks];
  let lastError: unknown;

  for (const name of sequence) {
    const provider = providerRegistry[name];
    if (!provider) continue;
    try {
      const result = await provider.callModel(request);
      return result;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw new Error(`All model providers failed. Last error: ${String(lastError)}`);
}

// Re-export for convenience
export type { ModelDispatchConfig, LLMProviderName } from "@aivo/types";
