import { providerRegistry, type ModelRequest, type ModelResponse } from "./providers";
import type { ModelDispatchConfig, LLMProviderName } from "@aivo/types";

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
