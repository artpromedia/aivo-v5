import type { LLMProviderName } from "@aivo/types";

export type ModelRequest = {
  prompt: string;
  system?: string;
  maxTokens?: number;
};

export type ModelResponse = {
  provider: LLMProviderName;
  content: string;
};

export interface ProviderClient {
  name: LLMProviderName;
  callModel(request: ModelRequest): Promise<ModelResponse>;
}

// TODO: wire real SDK calls; for now just mock
class OpenAIClient implements ProviderClient {
  name: LLMProviderName = "openai";
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    return {
      provider: this.name,
      content: `[OpenAI mock response] ${request.prompt}`
    };
  }
}

class AnthropicClient implements ProviderClient {
  name: LLMProviderName = "anthropic";
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    return {
      provider: this.name,
      content: `[Anthropic mock response] ${request.prompt}`
    };
  }
}

class GoogleClient implements ProviderClient {
  name: LLMProviderName = "google";
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    return {
      provider: this.name,
      content: `[Google mock response] ${request.prompt}`
    };
  }
}

class MetaClient implements ProviderClient {
  name: LLMProviderName = "meta";
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    return {
      provider: this.name,
      content: `[Meta mock response] ${request.prompt}`
    };
  }
}

export const providerRegistry: Record<LLMProviderName, ProviderClient> = {
  openai: new OpenAIClient(),
  anthropic: new AnthropicClient(),
  google: new GoogleClient(),
  meta: new MetaClient()
};
