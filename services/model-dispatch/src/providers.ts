/**
 * AI Provider Client Implementations
 * SDK wrappers for each supported AI provider
 */

import type { LLMProviderName } from "@aivo/types";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Together from "together-ai";
import { CohereClientV2 } from "cohere-ai";
import { Mistral } from "@mistralai/mistralai";
import Groq from "groq-sdk";
import Replicate from "replicate";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export type ModelRequest = {
  prompt: string;
  system?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  model?: string;
  timeout?: number;
};

export type ModelResponse = {
  provider: LLMProviderName;
  content: string;
  finishReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
};

export interface ProviderClient {
  name: LLMProviderName;
  callModel(request: ModelRequest): Promise<ModelResponse>;
  healthCheck?(): Promise<{ healthy: boolean; latencyMs: number; error?: string }>;
  countTokens?(text: string): Promise<number>;
}

// ============================================================================
// OPENAI PROVIDER
// ============================================================================

class OpenAIClient implements ProviderClient {
  name: LLMProviderName = "openai";
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 60000,
      });
    }
    return this.client;
  }
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const client = this.getClient();
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      
      if (request.system) {
        messages.push({ role: "system", content: request.system });
      }
      messages.push({ role: "user", content: request.prompt });

      const response = await client.chat.completions.create({
        model: request.model || "gpt-4-turbo",
        messages,
        max_tokens: request.maxTokens || 2048,
        temperature: request.temperature ?? 0.7,
        top_p: request.topP,
        stop: request.stopSequences,
      });

      const choice = response.choices[0];
      return {
        provider: this.name,
        content: choice.message.content || "",
        finishReason: choice.finish_reason || "stop",
        usage: response.usage ? {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
        } : undefined,
      };
    } catch (err) {
      console.error("[OpenAI] Error:", err);
      throw new Error(`OpenAI API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = this.getClient();
      await client.models.list();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// ANTHROPIC PROVIDER
// ============================================================================

class AnthropicClient implements ProviderClient {
  name: LLMProviderName = "anthropic";
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({ 
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    return this.client;
  }
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const client = this.getClient();
      const response = await client.messages.create({
        model: request.model || "claude-3-5-sonnet-20241022",
        max_tokens: request.maxTokens || 2048,
        system: request.system,
        messages: [{ role: "user", content: request.prompt }],
        temperature: request.temperature,
        top_p: request.topP,
        stop_sequences: request.stopSequences,
      });

      const textContent = response.content.find(c => c.type === "text");
      return {
        provider: this.name,
        content: textContent?.type === "text" ? textContent.text : "",
        finishReason: response.stop_reason || "end_turn",
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (err) {
      console.error("[Anthropic] Error:", err);
      throw new Error(`Anthropic API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = this.getClient();
      // Make a minimal request to check health
      await client.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 5,
        messages: [{ role: "user", content: "Hi" }],
      });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// GOOGLE PROVIDER (Gemini)
// ============================================================================

class GoogleClient implements ProviderClient {
  name: LLMProviderName = "google";
  private genAI: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
    }
    return this.genAI;
  }
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const genAI = this.getClient();
      const model = genAI.getGenerativeModel({ 
        model: request.model || "gemini-1.5-pro",
        generationConfig: {
          maxOutputTokens: request.maxTokens || 2048,
          temperature: request.temperature ?? 0.7,
          topP: request.topP,
          stopSequences: request.stopSequences,
        },
        systemInstruction: request.system,
      });

      const result = await model.generateContent(request.prompt);
      const response = result.response;
      const text = response.text();

      return {
        provider: this.name,
        content: text,
        finishReason: response.candidates?.[0]?.finishReason || "STOP",
        usage: response.usageMetadata ? {
          inputTokens: response.usageMetadata.promptTokenCount || 0,
          outputTokens: response.usageMetadata.candidatesTokenCount || 0,
        } : undefined,
      };
    } catch (err) {
      console.error("[Google] Error:", err);
      throw new Error(`Google AI API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const genAI = this.getClient();
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      await model.generateContent("Hi");
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// META PROVIDER (Llama via Together)
// ============================================================================

class MetaClient implements ProviderClient {
  name: LLMProviderName = "meta";
  private client: Together | null = null;

  private getClient(): Together {
    if (!this.client) {
      this.client = new Together({ apiKey: process.env.TOGETHER_API_KEY });
    }
    return this.client;
  }
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const client = this.getClient();
      const response = await client.chat.completions.create({
        model: request.model || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages: [
          ...(request.system ? [{ role: "system" as const, content: request.system }] : []),
          { role: "user" as const, content: request.prompt },
        ],
        max_tokens: request.maxTokens || 2048,
        temperature: request.temperature ?? 0.7,
        top_p: request.topP,
        stop: request.stopSequences,
      });

      const choice = response.choices[0];
      return {
        provider: this.name,
        content: choice.message?.content || "",
        finishReason: choice.finish_reason || "stop",
        usage: response.usage ? {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
        } : undefined,
      };
    } catch (err) {
      console.error("[Meta/Together] Error:", err);
      throw new Error(`Meta/Together API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = this.getClient();
      await client.models.list();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// COHERE PROVIDER
// ============================================================================

class CohereClient implements ProviderClient {
  name: LLMProviderName = "cohere";
  private client: CohereClientV2 | null = null;

  private getClient(): CohereClientV2 {
    if (!this.client) {
      this.client = new CohereClientV2({ token: process.env.COHERE_API_KEY });
    }
    return this.client;
  }
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const client = this.getClient();
      const response = await client.chat({
        model: request.model || "command-r-plus",
        messages: [
          ...(request.system ? [{ role: "system" as const, content: request.system }] : []),
          { role: "user" as const, content: request.prompt },
        ],
        maxTokens: request.maxTokens || 2048,
        temperature: request.temperature,
        p: request.topP,
        stopSequences: request.stopSequences,
      });

      const textContent = response.message?.content?.find(c => c.type === "text");
      return {
        provider: this.name,
        content: textContent?.type === "text" ? textContent.text : "",
        finishReason: response.finishReason || "COMPLETE",
        usage: response.usage ? {
          inputTokens: response.usage.tokens?.inputTokens || 0,
          outputTokens: response.usage.tokens?.outputTokens || 0,
        } : undefined,
      };
    } catch (err) {
      console.error("[Cohere] Error:", err);
      throw new Error(`Cohere API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = this.getClient();
      await client.chat({
        model: "command-r",
        messages: [{ role: "user", content: "Hi" }],
        maxTokens: 5,
      });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// MISTRAL PROVIDER
// ============================================================================

class MistralClient implements ProviderClient {
  name: LLMProviderName = "mistral";
  private client: Mistral | null = null;

  private getClient(): Mistral {
    if (!this.client) {
      this.client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
    }
    return this.client;
  }
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const client = this.getClient();
      const response = await client.chat.complete({
        model: request.model || "mistral-large-latest",
        messages: [
          ...(request.system ? [{ role: "system" as const, content: request.system }] : []),
          { role: "user" as const, content: request.prompt },
        ],
        maxTokens: request.maxTokens || 2048,
        temperature: request.temperature,
        topP: request.topP,
        stop: request.stopSequences,
      });

      const choice = response.choices?.[0];
      const content = choice?.message?.content;
      return {
        provider: this.name,
        content: typeof content === "string" ? content : "",
        finishReason: choice?.finishReason || "stop",
        usage: response.usage ? {
          inputTokens: response.usage.promptTokens,
          outputTokens: response.usage.completionTokens,
        } : undefined,
      };
    } catch (err) {
      console.error("[Mistral] Error:", err);
      throw new Error(`Mistral API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = this.getClient();
      await client.models.list();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// HUGGINGFACE PROVIDER
// ============================================================================

class HuggingFaceClient implements ProviderClient {
  name: LLMProviderName = "huggingface";
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const model = request.model || "mistralai/Mixtral-8x7B-Instruct-v0.1";
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: request.system 
              ? `${request.system}\n\nUser: ${request.prompt}\n\nAssistant:` 
              : request.prompt,
            parameters: {
              max_new_tokens: request.maxTokens || 2048,
              temperature: request.temperature ?? 0.7,
              top_p: request.topP,
              stop: request.stopSequences,
              return_full_text: false,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as Array<{ generated_text: string }>;
      const generatedText = data[0]?.generated_text || "";

      return {
        provider: this.name,
        content: generatedText,
        finishReason: "stop",
        usage: {
          inputTokens: Math.ceil(request.prompt.length / 4),
          outputTokens: Math.ceil(generatedText.length / 4),
        },
      };
    } catch (err) {
      console.error("[HuggingFace] Error:", err);
      throw new Error(`HuggingFace API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/gpt2",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: "Hello" }),
        }
      );
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// GROQ PROVIDER
// ============================================================================

class GroqClient implements ProviderClient {
  name: LLMProviderName = "groq";
  private client: Groq | null = null;

  private getClient(): Groq {
    if (!this.client) {
      this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return this.client;
  }
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const client = this.getClient();
      const response = await client.chat.completions.create({
        model: request.model || "llama-3.3-70b-versatile",
        messages: [
          ...(request.system ? [{ role: "system" as const, content: request.system }] : []),
          { role: "user" as const, content: request.prompt },
        ],
        max_tokens: request.maxTokens || 2048,
        temperature: request.temperature ?? 0.7,
        top_p: request.topP,
        stop: request.stopSequences,
      });

      const choice = response.choices[0];
      return {
        provider: this.name,
        content: choice.message?.content || "",
        finishReason: choice.finish_reason || "stop",
        usage: response.usage ? {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
        } : undefined,
      };
    } catch (err) {
      console.error("[Groq] Error:", err);
      throw new Error(`Groq API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = this.getClient();
      await client.models.list();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// TOGETHER AI PROVIDER
// ============================================================================

class TogetherClient implements ProviderClient {
  name: LLMProviderName = "together";
  private client: Together | null = null;

  private getClient(): Together {
    if (!this.client) {
      this.client = new Together({ apiKey: process.env.TOGETHER_API_KEY });
    }
    return this.client;
  }
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const client = this.getClient();
      const response = await client.chat.completions.create({
        model: request.model || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages: [
          ...(request.system ? [{ role: "system" as const, content: request.system }] : []),
          { role: "user" as const, content: request.prompt },
        ],
        max_tokens: request.maxTokens || 2048,
        temperature: request.temperature ?? 0.7,
        top_p: request.topP,
        stop: request.stopSequences,
      });

      const choice = response.choices[0];
      return {
        provider: this.name,
        content: choice.message?.content || "",
        finishReason: choice.finish_reason || "stop",
        usage: response.usage ? {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
        } : undefined,
      };
    } catch (err) {
      console.error("[Together] Error:", err);
      throw new Error(`Together API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = this.getClient();
      await client.models.list();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// REPLICATE PROVIDER
// ============================================================================

class ReplicateClient implements ProviderClient {
  name: LLMProviderName = "replicate";
  private client: Replicate | null = null;

  private getClient(): Replicate {
    if (!this.client) {
      this.client = new Replicate({ auth: process.env.REPLICATE_API_KEY });
    }
    return this.client;
  }
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const client = this.getClient();
      const model = request.model || "meta/llama-2-70b-chat";
      
      const output = await client.run(model as `${string}/${string}`, {
        input: {
          prompt: request.system 
            ? `${request.system}\n\nUser: ${request.prompt}\n\nAssistant:` 
            : request.prompt,
          max_new_tokens: request.maxTokens || 2048,
          temperature: request.temperature ?? 0.7,
          top_p: request.topP,
        },
      });

      // Replicate returns an array of strings or a single string
      const content = Array.isArray(output) ? output.join("") : String(output);

      return {
        provider: this.name,
        content,
        finishReason: "stop",
        usage: {
          inputTokens: Math.ceil(request.prompt.length / 4),
          outputTokens: Math.ceil(content.length / 4),
        },
      };
    } catch (err) {
      console.error("[Replicate] Error:", err);
      throw new Error(`Replicate API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = this.getClient();
      await client.models.get("meta", "llama-2-70b-chat");
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// AZURE OPENAI PROVIDER
// ============================================================================

class AzureOpenAIClient implements ProviderClient {
  name: LLMProviderName = "azure_openai";
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
        defaultQuery: { "api-version": "2024-02-01" },
        defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
      });
    }
    return this.client;
  }
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const client = this.getClient();
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      
      if (request.system) {
        messages.push({ role: "system", content: request.system });
      }
      messages.push({ role: "user", content: request.prompt });

      const response = await client.chat.completions.create({
        model: request.model || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4",
        messages,
        max_tokens: request.maxTokens || 2048,
        temperature: request.temperature ?? 0.7,
        top_p: request.topP,
        stop: request.stopSequences,
      });

      const choice = response.choices[0];
      return {
        provider: this.name,
        content: choice.message.content || "",
        finishReason: choice.finish_reason || "stop",
        usage: response.usage ? {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
        } : undefined,
      };
    } catch (err) {
      console.error("[Azure OpenAI] Error:", err);
      throw new Error(`Azure OpenAI API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const client = this.getClient();
      await client.models.list();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// AWS BEDROCK PROVIDER
// ============================================================================

class AWSBedrockClient implements ProviderClient {
  name: LLMProviderName = "aws_bedrock";
  private client: BedrockRuntimeClient | null = null;

  private getClient(): BedrockRuntimeClient {
    if (!this.client) {
      this.client = new BedrockRuntimeClient({ 
        region: process.env.AWS_REGION || "us-east-1",
      });
    }
    return this.client;
  }
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const client = this.getClient();
      const modelId = request.model || "anthropic.claude-3-sonnet-20240229-v1:0";
      
      // Build the request body based on model provider
      let requestBody: Record<string, unknown>;
      
      if (modelId.startsWith("anthropic.")) {
        requestBody = {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: request.maxTokens || 2048,
          system: request.system,
          messages: [{ role: "user", content: request.prompt }],
          temperature: request.temperature,
          top_p: request.topP,
          stop_sequences: request.stopSequences,
        };
      } else if (modelId.startsWith("meta.")) {
        requestBody = {
          prompt: request.system 
            ? `${request.system}\n\nUser: ${request.prompt}\n\nAssistant:`
            : request.prompt,
          max_gen_len: request.maxTokens || 2048,
          temperature: request.temperature ?? 0.7,
          top_p: request.topP,
        };
      } else {
        // Default format (Amazon Titan, etc.)
        requestBody = {
          inputText: request.system 
            ? `${request.system}\n\n${request.prompt}`
            : request.prompt,
          textGenerationConfig: {
            maxTokenCount: request.maxTokens || 2048,
            temperature: request.temperature ?? 0.7,
            topP: request.topP,
            stopSequences: request.stopSequences,
          },
        };
      }

      const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify(requestBody),
        contentType: "application/json",
        accept: "application/json",
      });

      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Parse response based on model provider
      let content = "";
      let usage = { inputTokens: 0, outputTokens: 0 };

      if (modelId.startsWith("anthropic.")) {
        content = responseBody.content?.[0]?.text || "";
        usage = {
          inputTokens: responseBody.usage?.input_tokens || 0,
          outputTokens: responseBody.usage?.output_tokens || 0,
        };
      } else if (modelId.startsWith("meta.")) {
        content = responseBody.generation || "";
        usage = {
          inputTokens: responseBody.prompt_token_count || 0,
          outputTokens: responseBody.generation_token_count || 0,
        };
      } else {
        content = responseBody.results?.[0]?.outputText || responseBody.outputText || "";
        usage = {
          inputTokens: responseBody.inputTextTokenCount || 0,
          outputTokens: responseBody.results?.[0]?.tokenCount || 0,
        };
      }

      return {
        provider: this.name,
        content,
        finishReason: responseBody.stop_reason || "stop",
        usage,
      };
    } catch (err) {
      console.error("[AWS Bedrock] Error:", err);
      throw new Error(`AWS Bedrock API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      // For Bedrock, we can't easily list models without additional permissions
      // Just verify the client can be created
      this.getClient();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// CUSTOM/SELF-HOSTED PROVIDER (OpenAI-compatible)
// ============================================================================

class CustomClient implements ProviderClient {
  name: LLMProviderName = "custom";
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const endpoint = process.env.CUSTOM_AI_ENDPOINT;
      if (!endpoint) {
        throw new Error("CUSTOM_AI_ENDPOINT environment variable not set");
      }

      const response = await fetch(`${endpoint}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.CUSTOM_AI_API_KEY && {
            "Authorization": `Bearer ${process.env.CUSTOM_AI_API_KEY}`,
          }),
        },
        body: JSON.stringify({
          model: request.model || "custom-model",
          messages: [
            ...(request.system ? [{ role: "system", content: request.system }] : []),
            { role: "user", content: request.prompt },
          ],
          max_tokens: request.maxTokens || 2048,
          temperature: request.temperature ?? 0.7,
          top_p: request.topP,
          stop: request.stopSequences,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Custom API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as {
        choices: Array<{
          message: { content: string };
          finish_reason: string;
        }>;
        usage?: {
          prompt_tokens: number;
          completion_tokens: number;
        };
      };

      const choice = data.choices[0];
      return {
        provider: this.name,
        content: choice.message.content || "",
        finishReason: choice.finish_reason || "stop",
        usage: data.usage ? {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
        } : undefined,
      };
    } catch (err) {
      console.error("[Custom] Error:", err);
      throw new Error(`Custom API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const endpoint = process.env.CUSTOM_AI_ENDPOINT;
      if (!endpoint) {
        throw new Error("CUSTOM_AI_ENDPOINT not configured");
      }
      const response = await fetch(`${endpoint}/v1/models`, {
        headers: process.env.CUSTOM_AI_API_KEY 
          ? { "Authorization": `Bearer ${process.env.CUSTOM_AI_API_KEY}` }
          : {},
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// AIVO BRAIN PROVIDER (Custom trained curriculum model)
// ============================================================================

class AivoBrainClient implements ProviderClient {
  name: LLMProviderName = "aivo_brain";
  
  async callModel(request: ModelRequest): Promise<ModelResponse> {
    try {
      const endpoint = process.env.AIVO_BRAIN_ENDPOINT;
      if (!endpoint) {
        throw new Error("AIVO_BRAIN_ENDPOINT environment variable not set");
      }

      const response = await fetch(`${endpoint}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.AIVO_BRAIN_API_KEY && {
            "Authorization": `Bearer ${process.env.AIVO_BRAIN_API_KEY}`,
          }),
        },
        body: JSON.stringify({
          prompt: request.prompt,
          system: request.system,
          curriculum_context: true,
          max_tokens: request.maxTokens || 2048,
          temperature: request.temperature ?? 0.7,
          top_p: request.topP,
          stop_sequences: request.stopSequences,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AIVO Brain API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as {
        content: string;
        finish_reason?: string;
        usage?: {
          input_tokens: number;
          output_tokens: number;
        };
      };

      return {
        provider: this.name,
        content: data.content || "",
        finishReason: data.finish_reason || "stop",
        usage: data.usage ? {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
        } : undefined,
      };
    } catch (err) {
      console.error("[AIVO Brain] Error:", err);
      throw new Error(`AIVO Brain API error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const endpoint = process.env.AIVO_BRAIN_ENDPOINT;
      if (!endpoint) {
        throw new Error("AIVO_BRAIN_ENDPOINT not configured");
      }
      const response = await fetch(`${endpoint}/health`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================

export const providerRegistry: Record<string, ProviderClient> = {
  openai: new OpenAIClient(),
  anthropic: new AnthropicClient(),
  google: new GoogleClient(),
  meta: new MetaClient(),
  cohere: new CohereClient(),
  mistral: new MistralClient(),
  huggingface: new HuggingFaceClient(),
  groq: new GroqClient(),
  together: new TogetherClient(),
  replicate: new ReplicateClient(),
  azure_openai: new AzureOpenAIClient(),
  aws_bedrock: new AWSBedrockClient(),
  custom: new CustomClient(),
  aivo_brain: new AivoBrainClient(),
};

/**
 * Get a provider client by type
 */
export function getProviderClient(providerType: string): ProviderClient | undefined {
  return providerRegistry[providerType.toLowerCase()];
}

/**
 * Get all available provider types
 */
export function getAvailableProviders(): string[] {
  return Object.keys(providerRegistry);
}
