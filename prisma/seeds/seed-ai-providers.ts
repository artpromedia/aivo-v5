/**
 * AI Provider Seed Script
 * Populates the database with default AI providers and models
 * 
 * Run with: npx tsx prisma/seeds/seed-ai-providers.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Seeding AI Providers...\n");

  // ==========================================================================
  // PROVIDERS
  // ==========================================================================
  
  const providers = [
    {
      providerType: "OPENAI",
      name: "OpenAI",
      priority: 10,
      rateLimitRpm: 60,
      rateLimitTpm: 90000,
      costPer1kInput: 0.01,
      costPer1kOutput: 0.03,
      healthStatus: "HEALTHY",
      config: {
        baseUrl: "https://api.openai.com/v1",
      },
    },
    {
      providerType: "ANTHROPIC",
      name: "Anthropic",
      priority: 20,
      rateLimitRpm: 50,
      rateLimitTpm: 100000,
      costPer1kInput: 0.008,
      costPer1kOutput: 0.024,
      healthStatus: "HEALTHY",
      config: {
        baseUrl: "https://api.anthropic.com",
      },
    },
    {
      providerType: "GOOGLE",
      name: "Google Gemini",
      priority: 30,
      rateLimitRpm: 60,
      rateLimitTpm: 120000,
      costPer1kInput: 0.00025,
      costPer1kOutput: 0.0005,
      healthStatus: "HEALTHY",
      config: {
        baseUrl: "https://generativelanguage.googleapis.com",
      },
    },
    {
      providerType: "META",
      name: "Meta (Llama)",
      priority: 35,
      rateLimitRpm: 60,
      rateLimitTpm: 100000,
      costPer1kInput: 0.0,
      costPer1kOutput: 0.0,
      healthStatus: "HEALTHY",
      config: {
        baseUrl: "https://llama-api.meta.com/v1",
        note: "Open-source models - costs vary by hosting provider",
      },
    },
    {
      providerType: "GROQ",
      name: "Groq (Inference Platform)",
      priority: 40,
      rateLimitRpm: 30,
      rateLimitTpm: 30000,
      costPer1kInput: 0.0001,
      costPer1kOutput: 0.0002,
      healthStatus: "HEALTHY",
      config: {
        baseUrl: "https://api.groq.com/openai/v1",
        note: "Ultra-fast inference for open models (Llama, Mixtral, etc.)",
      },
    },
    {
      providerType: "COHERE",
      name: "Cohere",
      priority: 50,
      rateLimitRpm: 100,
      rateLimitTpm: 100000,
      costPer1kInput: 0.0005,
      costPer1kOutput: 0.0015,
      healthStatus: "HEALTHY",
      config: {
        baseUrl: "https://api.cohere.ai/v1",
      },
    },
    {
      providerType: "MISTRAL",
      name: "Mistral AI",
      priority: 60,
      rateLimitRpm: 100,
      rateLimitTpm: 100000,
      costPer1kInput: 0.0007,
      costPer1kOutput: 0.0007,
      healthStatus: "HEALTHY",
      config: {
        baseUrl: "https://api.mistral.ai/v1",
      },
    },
  ];

  const createdProviders: Record<string, string> = {};

  for (const provider of providers) {
    const existing = await prisma.aIProvider.findFirst({
      where: { providerType: provider.providerType as any },
    });

    if (existing) {
      console.log(`  ⏭️  ${provider.name} already exists, skipping...`);
      createdProviders[provider.providerType] = existing.id;
      continue;
    }

    const created = await prisma.aIProvider.create({
      data: provider as any,
    });
    createdProviders[provider.providerType] = created.id;
    console.log(`  ✅ Created provider: ${provider.name}`);
  }

  console.log("\n📦 Seeding AI Models...\n");

  // ==========================================================================
  // MODELS
  // ==========================================================================
  
  const models = [
    // ==========================================================================
    // OpenAI Models - Latest as of Nov 2025
    // ==========================================================================
    {
      providerId: createdProviders["OPENAI"],
      modelIdentifier: "gpt-5",
      displayName: "GPT-5",
      capabilities: ["chat", "completion", "vision", "reasoning", "function_calling", "streaming", "json_mode", "agentic"],
      maxTokens: 128000,
      contextWindow: 1000000,
      costPer1kInput: 0.03,
      costPer1kOutput: 0.12,
      useCases: ["tutoring", "assessment", "iep_analysis", "content_generation"],
      qualityTier: "PREMIUM",
      isDefault: true,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi", "ru"],
    },
    {
      providerId: createdProviders["OPENAI"],
      modelIdentifier: "gpt-5-mini",
      displayName: "GPT-5 Mini",
      capabilities: ["chat", "completion", "vision", "reasoning", "function_calling", "streaming", "json_mode"],
      maxTokens: 65536,
      contextWindow: 500000,
      costPer1kInput: 0.006,
      costPer1kOutput: 0.024,
      useCases: ["homework_help", "tutoring", "assessment", "general"],
      qualityTier: "PREMIUM",
      isDefault: false,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi", "ru"],
    },
    {
      providerId: createdProviders["OPENAI"],
      modelIdentifier: "o1",
      displayName: "OpenAI o1 (Reasoning)",
      capabilities: ["chat", "completion", "vision", "reasoning", "streaming"],
      maxTokens: 100000,
      contextWindow: 200000,
      costPer1kInput: 0.015,
      costPer1kOutput: 0.06,
      useCases: ["assessment", "iep_analysis", "tutoring", "content_generation"],
      qualityTier: "PREMIUM",
      isDefault: false,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["OPENAI"],
      modelIdentifier: "o1-mini",
      displayName: "OpenAI o1-mini (Fast Reasoning)",
      capabilities: ["chat", "completion", "reasoning", "streaming"],
      maxTokens: 65536,
      contextWindow: 128000,
      costPer1kInput: 0.003,
      costPer1kOutput: 0.012,
      useCases: ["homework_help", "assessment", "tutoring"],
      qualityTier: "STANDARD",
      isDefault: false,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["OPENAI"],
      modelIdentifier: "gpt-4o",
      displayName: "GPT-4o",
      capabilities: ["chat", "completion", "vision", "function_calling", "streaming", "json_mode"],
      maxTokens: 16384,
      contextWindow: 128000,
      costPer1kInput: 0.0025,
      costPer1kOutput: 0.01,
      useCases: ["homework_help", "tutoring", "assessment", "iep_analysis", "content_generation"],
      qualityTier: "STANDARD",
      isDefault: false,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["OPENAI"],
      modelIdentifier: "gpt-4o-mini",
      displayName: "GPT-4o Mini",
      capabilities: ["chat", "completion", "vision", "function_calling", "streaming", "json_mode"],
      maxTokens: 16384,
      contextWindow: 128000,
      costPer1kInput: 0.00015,
      costPer1kOutput: 0.0006,
      useCases: ["homework_help", "summarization", "general"],
      qualityTier: "ECONOMY",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["OPENAI"],
      modelIdentifier: "text-embedding-3-large",
      displayName: "Text Embedding 3 Large",
      capabilities: ["embedding"],
      maxTokens: 8191,
      contextWindow: 8191,
      costPer1kInput: 0.00013,
      costPer1kOutput: 0,
      useCases: ["general"],
      qualityTier: "PREMIUM",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["OPENAI"],
      modelIdentifier: "text-embedding-3-small",
      displayName: "Text Embedding 3 Small",
      capabilities: ["embedding"],
      maxTokens: 8191,
      contextWindow: 8191,
      costPer1kInput: 0.00002,
      costPer1kOutput: 0,
      useCases: ["general"],
      qualityTier: "ECONOMY",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    
    // ==========================================================================
    // Anthropic Models - Latest as of Nov 2025 (Claude 4.5 family)
    // ==========================================================================
    {
      providerId: createdProviders["ANTHROPIC"],
      modelIdentifier: "claude-opus-4-5-20251120",
      displayName: "Claude Opus 4.5",
      capabilities: ["chat", "vision", "function_calling", "streaming", "computer_use", "reasoning", "agentic"],
      maxTokens: 32768,
      contextWindow: 500000,
      costPer1kInput: 0.02,
      costPer1kOutput: 0.10,
      useCases: ["iep_analysis", "content_generation", "assessment", "tutoring"],
      qualityTier: "PREMIUM",
      isDefault: false,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi", "ru"],
    },
    {
      providerId: createdProviders["ANTHROPIC"],
      modelIdentifier: "claude-sonnet-4-5-20251120",
      displayName: "Claude Sonnet 4.5",
      capabilities: ["chat", "vision", "function_calling", "streaming", "computer_use", "reasoning"],
      maxTokens: 16384,
      contextWindow: 400000,
      costPer1kInput: 0.004,
      costPer1kOutput: 0.02,
      useCases: ["homework_help", "tutoring", "assessment", "iep_analysis", "content_generation"],
      qualityTier: "PREMIUM",
      isDefault: true,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi", "ru"],
    },
    {
      providerId: createdProviders["ANTHROPIC"],
      modelIdentifier: "claude-haiku-4-5-20251120",
      displayName: "Claude Haiku 4.5",
      capabilities: ["chat", "vision", "function_calling", "streaming"],
      maxTokens: 8192,
      contextWindow: 200000,
      costPer1kInput: 0.001,
      costPer1kOutput: 0.005,
      useCases: ["homework_help", "summarization", "general"],
      qualityTier: "STANDARD",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi", "ru"],
    },
    {
      providerId: createdProviders["ANTHROPIC"],
      modelIdentifier: "claude-sonnet-4-20250514",
      displayName: "Claude Sonnet 4",
      capabilities: ["chat", "vision", "function_calling", "streaming", "computer_use"],
      maxTokens: 16384,
      contextWindow: 200000,
      costPer1kInput: 0.003,
      costPer1kOutput: 0.015,
      useCases: ["homework_help", "tutoring", "assessment", "iep_analysis", "content_generation"],
      qualityTier: "STANDARD",
      isDefault: false,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["ANTHROPIC"],
      modelIdentifier: "claude-3-5-sonnet-20241022",
      displayName: "Claude 3.5 Sonnet v2",
      capabilities: ["chat", "vision", "function_calling", "streaming", "computer_use"],
      maxTokens: 8192,
      contextWindow: 200000,
      costPer1kInput: 0.003,
      costPer1kOutput: 0.015,
      useCases: ["homework_help", "tutoring", "assessment", "iep_analysis", "content_generation"],
      qualityTier: "STANDARD",
      isDefault: false,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["ANTHROPIC"],
      modelIdentifier: "claude-3-5-haiku-20241022",
      displayName: "Claude 3.5 Haiku",
      capabilities: ["chat", "vision", "function_calling", "streaming"],
      maxTokens: 8192,
      contextWindow: 200000,
      costPer1kInput: 0.0008,
      costPer1kOutput: 0.004,
      useCases: ["homework_help", "summarization", "general"],
      qualityTier: "ECONOMY",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    
    // ==========================================================================
    // Google Models - Latest Gemini 3.0 as of Nov 2025
    // ==========================================================================
    {
      providerId: createdProviders["GOOGLE"],
      modelIdentifier: "gemini-3.0-ultra",
      displayName: "Gemini 3.0 Ultra",
      capabilities: ["chat", "vision", "audio", "video", "function_calling", "streaming", "reasoning", "agentic", "realtime"],
      maxTokens: 65536,
      contextWindow: 4000000,
      costPer1kInput: 0.01,
      costPer1kOutput: 0.04,
      useCases: ["tutoring", "assessment", "iep_analysis", "content_generation", "speech_analysis"],
      qualityTier: "PREMIUM",
      isDefault: false,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi", "ru"],
    },
    {
      providerId: createdProviders["GOOGLE"],
      modelIdentifier: "gemini-3.0-pro",
      displayName: "Gemini 3.0 Pro",
      capabilities: ["chat", "vision", "audio", "video", "function_calling", "streaming", "reasoning", "realtime"],
      maxTokens: 32768,
      contextWindow: 2000000,
      costPer1kInput: 0.002,
      costPer1kOutput: 0.008,
      useCases: ["homework_help", "tutoring", "assessment", "speech_analysis", "content_generation"],
      qualityTier: "PREMIUM",
      isDefault: true,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi", "ru"],
    },
    {
      providerId: createdProviders["GOOGLE"],
      modelIdentifier: "gemini-3.0-flash",
      displayName: "Gemini 3.0 Flash",
      capabilities: ["chat", "vision", "audio", "video", "function_calling", "streaming", "realtime"],
      maxTokens: 16384,
      contextWindow: 1000000,
      costPer1kInput: 0.0002,
      costPer1kOutput: 0.0008,
      useCases: ["homework_help", "tutoring", "speech_analysis", "general"],
      qualityTier: "STANDARD",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi", "ru"],
    },
    {
      providerId: createdProviders["GOOGLE"],
      modelIdentifier: "gemini-2.0-flash",
      displayName: "Gemini 2.0 Flash",
      capabilities: ["chat", "vision", "audio", "video", "function_calling", "streaming", "realtime"],
      maxTokens: 8192,
      contextWindow: 1000000,
      costPer1kInput: 0.0001,
      costPer1kOutput: 0.0004,
      useCases: ["homework_help", "tutoring", "speech_analysis", "general"],
      qualityTier: "ECONOMY",
      isDefault: false,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["GOOGLE"],
      modelIdentifier: "gemini-1.5-flash",
      displayName: "Gemini 1.5 Flash",
      capabilities: ["chat", "vision", "audio", "streaming"],
      maxTokens: 8192,
      contextWindow: 1000000,
      costPer1kInput: 0.000075,
      costPer1kOutput: 0.0003,
      useCases: ["homework_help", "summarization", "general"],
      qualityTier: "ECONOMY",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    
    // ==========================================================================
    // Meta Llama Models - Official Meta releases (Nov 2025)
    // ==========================================================================
    {
      providerId: createdProviders["META"],
      modelIdentifier: "llama-4-405b",
      displayName: "Llama 4 405B",
      capabilities: ["chat", "completion", "function_calling", "streaming", "reasoning", "vision"],
      maxTokens: 32768,
      contextWindow: 256000,
      costPer1kInput: 0.0,
      costPer1kOutput: 0.0,
      useCases: ["tutoring", "assessment", "iep_analysis", "content_generation"],
      qualityTier: "PREMIUM",
      isDefault: true,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi", "ru"],
    },
    {
      providerId: createdProviders["META"],
      modelIdentifier: "llama-4-70b",
      displayName: "Llama 4 70B",
      capabilities: ["chat", "completion", "function_calling", "streaming", "vision"],
      maxTokens: 16384,
      contextWindow: 128000,
      costPer1kInput: 0.0,
      costPer1kOutput: 0.0,
      useCases: ["homework_help", "tutoring", "assessment", "content_generation"],
      qualityTier: "PREMIUM",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi", "ru"],
    },
    {
      providerId: createdProviders["META"],
      modelIdentifier: "llama-4-8b",
      displayName: "Llama 4 8B",
      capabilities: ["chat", "completion", "function_calling", "streaming"],
      maxTokens: 8192,
      contextWindow: 128000,
      costPer1kInput: 0.0,
      costPer1kOutput: 0.0,
      useCases: ["homework_help", "summarization", "general"],
      qualityTier: "STANDARD",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["META"],
      modelIdentifier: "llama-3.3-70b",
      displayName: "Llama 3.3 70B",
      capabilities: ["chat", "completion", "function_calling", "streaming"],
      maxTokens: 32768,
      contextWindow: 128000,
      costPer1kInput: 0.0,
      costPer1kOutput: 0.0,
      useCases: ["homework_help", "tutoring", "general"],
      qualityTier: "STANDARD",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    
    // ==========================================================================
    // Groq Inference Platform - Fast inference for open models
    // ==========================================================================
    {
      providerId: createdProviders["GROQ"],
      modelIdentifier: "llama-3.3-70b-versatile",
      displayName: "Llama 3.3 70B (via Groq)",
      capabilities: ["chat", "function_calling", "streaming"],
      maxTokens: 32768,
      contextWindow: 128000,
      costPer1kInput: 0.00059,
      costPer1kOutput: 0.00079,
      useCases: ["homework_help", "tutoring", "assessment", "content_generation"],
      qualityTier: "PREMIUM",
      isDefault: true,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["GROQ"],
      modelIdentifier: "llama-3.1-70b-versatile",
      displayName: "Llama 3.1 70B (via Groq)",
      capabilities: ["chat", "streaming"],
      maxTokens: 8192,
      contextWindow: 128000,
      costPer1kInput: 0.00059,
      costPer1kOutput: 0.00079,
      useCases: ["homework_help", "tutoring", "general"],
      qualityTier: "STANDARD",
      supportedLanguages: ["en", "es", "fr", "de", "pt"],
    },
    {
      providerId: createdProviders["GROQ"],
      modelIdentifier: "llama-3.1-8b-instant",
      displayName: "Llama 3.1 8B (via Groq)",
      capabilities: ["chat", "streaming"],
      maxTokens: 8192,
      contextWindow: 128000,
      costPer1kInput: 0.00005,
      costPer1kOutput: 0.00008,
      useCases: ["homework_help", "summarization", "general"],
      qualityTier: "ECONOMY",
      supportedLanguages: ["en", "es", "fr", "de", "pt"],
    },
    {
      providerId: createdProviders["GROQ"],
      modelIdentifier: "mixtral-8x7b-32768",
      displayName: "Mixtral 8x7B (via Groq)",
      capabilities: ["chat", "streaming"],
      maxTokens: 32768,
      contextWindow: 32768,
      costPer1kInput: 0.00024,
      costPer1kOutput: 0.00024,
      useCases: ["homework_help", "summarization", "general"],
      qualityTier: "ECONOMY",
      supportedLanguages: ["en", "es", "fr", "de", "it"],
    },
    
    // ==========================================================================
    // Cohere Models - Latest Command R as of Nov 2025
    // ==========================================================================
    {
      providerId: createdProviders["COHERE"],
      modelIdentifier: "command-r-plus-08-2024",
      displayName: "Command R+ (Aug 2024)",
      capabilities: ["chat", "function_calling", "rag", "streaming"],
      maxTokens: 4096,
      contextWindow: 128000,
      costPer1kInput: 0.0025,
      costPer1kOutput: 0.01,
      useCases: ["homework_help", "tutoring", "content_generation", "iep_analysis"],
      qualityTier: "PREMIUM",
      isDefault: true,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["COHERE"],
      modelIdentifier: "command-r-08-2024",
      displayName: "Command R (Aug 2024)",
      capabilities: ["chat", "function_calling", "rag", "streaming"],
      maxTokens: 4096,
      contextWindow: 128000,
      costPer1kInput: 0.00015,
      costPer1kOutput: 0.0006,
      useCases: ["homework_help", "summarization", "general"],
      qualityTier: "STANDARD",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["COHERE"],
      modelIdentifier: "embed-english-v3.0",
      displayName: "Embed English v3",
      capabilities: ["embedding"],
      maxTokens: 512,
      contextWindow: 512,
      costPer1kInput: 0.0001,
      costPer1kOutput: 0,
      useCases: ["general"],
      qualityTier: "STANDARD",
      supportedLanguages: ["en"],
    },
    {
      providerId: createdProviders["COHERE"],
      modelIdentifier: "embed-multilingual-v3.0",
      displayName: "Embed Multilingual v3",
      capabilities: ["embedding"],
      maxTokens: 512,
      contextWindow: 512,
      costPer1kInput: 0.0001,
      costPer1kOutput: 0,
      useCases: ["general"],
      qualityTier: "STANDARD",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi"],
    },
    
    // ==========================================================================
    // Mistral Models - Latest as of Nov 2024
    // ==========================================================================
    {
      providerId: createdProviders["MISTRAL"],
      modelIdentifier: "mistral-large-latest",
      displayName: "Mistral Large 2",
      capabilities: ["chat", "function_calling", "streaming", "json_mode"],
      maxTokens: 131072,
      contextWindow: 131072,
      costPer1kInput: 0.002,
      costPer1kOutput: 0.006,
      useCases: ["homework_help", "tutoring", "assessment", "content_generation", "iep_analysis"],
      qualityTier: "PREMIUM",
      isDefault: true,
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "it", "ru"],
    },
    {
      providerId: createdProviders["MISTRAL"],
      modelIdentifier: "pixtral-large-latest",
      displayName: "Pixtral Large",
      capabilities: ["chat", "vision", "function_calling", "streaming"],
      maxTokens: 131072,
      contextWindow: 131072,
      costPer1kInput: 0.002,
      costPer1kOutput: 0.006,
      useCases: ["homework_help", "assessment", "content_generation"],
      qualityTier: "PREMIUM",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["MISTRAL"],
      modelIdentifier: "mistral-small-latest",
      displayName: "Mistral Small",
      capabilities: ["chat", "function_calling", "streaming", "json_mode"],
      maxTokens: 32768,
      contextWindow: 32768,
      costPer1kInput: 0.0002,
      costPer1kOutput: 0.0006,
      useCases: ["homework_help", "summarization", "general"],
      qualityTier: "STANDARD",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
    {
      providerId: createdProviders["MISTRAL"],
      modelIdentifier: "codestral-latest",
      displayName: "Codestral",
      capabilities: ["chat", "code", "streaming"],
      maxTokens: 32768,
      contextWindow: 32768,
      costPer1kInput: 0.0002,
      costPer1kOutput: 0.0006,
      useCases: ["content_generation", "general"],
      qualityTier: "STANDARD",
      supportedLanguages: ["en"],
    },
    {
      providerId: createdProviders["MISTRAL"],
      modelIdentifier: "mistral-embed",
      displayName: "Mistral Embed",
      capabilities: ["embedding"],
      maxTokens: 8192,
      contextWindow: 8192,
      costPer1kInput: 0.0001,
      costPer1kOutput: 0,
      useCases: ["general"],
      qualityTier: "STANDARD",
      supportedLanguages: ["en", "es", "fr", "de", "pt", "zh", "ja", "ko"],
    },
  ];

  for (const model of models) {
    if (!model.providerId) {
      console.log(`  ⚠️  Skipping ${model.displayName} - provider not found`);
      continue;
    }

    const existing = await prisma.aIModel.findFirst({
      where: {
        providerId: model.providerId,
        modelIdentifier: model.modelIdentifier,
      },
    });

    if (existing) {
      console.log(`  ⏭️  ${model.displayName} already exists, skipping...`);
      continue;
    }

    await prisma.aIModel.create({
      data: model as any,
    });
    console.log(`  ✅ Created model: ${model.displayName}`);
  }

  console.log("\n🔗 Seeding Fallback Chains...\n");

  // ==========================================================================
  // FALLBACK CHAINS
  // ==========================================================================
  
  const fallbackChains = [
    {
      name: "Homework Help Chain",
      description: "Primary chain for homework assistance with fast fallbacks",
      useCase: "homework_help",
      isDefault: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      timeoutMs: 30000,
      providers: [
        { providerType: "OPENAI", priority: 1 },
        { providerType: "ANTHROPIC", priority: 2 },
        { providerType: "GROQ", priority: 3 },
      ],
    },
    {
      name: "Tutoring Chain",
      description: "High-quality chain for interactive tutoring",
      useCase: "tutoring",
      isDefault: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      timeoutMs: 45000,
      providers: [
        { providerType: "ANTHROPIC", priority: 1 },
        { providerType: "OPENAI", priority: 2 },
        { providerType: "GOOGLE", priority: 3 },
      ],
    },
    {
      name: "Assessment Chain",
      description: "Reliable chain for assessments and quizzes",
      useCase: "assessment",
      isDefault: true,
      maxRetries: 5,
      retryDelayMs: 2000,
      timeoutMs: 60000,
      providers: [
        { providerType: "OPENAI", priority: 1 },
        { providerType: "ANTHROPIC", priority: 2 },
        { providerType: "MISTRAL", priority: 3 },
      ],
    },
    {
      name: "IEP Analysis Chain",
      description: "High-quality chain for IEP document analysis",
      useCase: "iep_analysis",
      isDefault: true,
      maxRetries: 3,
      retryDelayMs: 2000,
      timeoutMs: 90000,
      providers: [
        { providerType: "ANTHROPIC", priority: 1 },
        { providerType: "OPENAI", priority: 2 },
        { providerType: "GOOGLE", priority: 3 },
      ],
    },
    {
      name: "Speech Analysis Chain",
      description: "Chain optimized for speech pattern analysis",
      useCase: "speech_analysis",
      isDefault: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      timeoutMs: 45000,
      providers: [
        { providerType: "GOOGLE", priority: 1 },
        { providerType: "OPENAI", priority: 2 },
      ],
    },
    {
      name: "Content Generation Chain",
      description: "Chain for generating educational content",
      useCase: "content_generation",
      isDefault: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      timeoutMs: 60000,
      providers: [
        { providerType: "ANTHROPIC", priority: 1 },
        { providerType: "OPENAI", priority: 2 },
        { providerType: "MISTRAL", priority: 3 },
      ],
    },
    {
      name: "Summarization Chain",
      description: "Cost-effective chain for summarization tasks",
      useCase: "summarization",
      isDefault: true,
      maxRetries: 3,
      retryDelayMs: 500,
      timeoutMs: 20000,
      providers: [
        { providerType: "GROQ", priority: 1 },
        { providerType: "MISTRAL", priority: 2 },
        { providerType: "GOOGLE", priority: 3 },
      ],
    },
    {
      name: "General Purpose Chain",
      description: "Balanced chain for general use cases",
      useCase: "general",
      isDefault: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      timeoutMs: 30000,
      providers: [
        { providerType: "OPENAI", priority: 1 },
        { providerType: "ANTHROPIC", priority: 2 },
        { providerType: "GROQ", priority: 3 },
        { providerType: "MISTRAL", priority: 4 },
      ],
    },
  ];

  for (const chain of fallbackChains) {
    const existing = await prisma.aIFallbackChain.findFirst({
      where: { useCase: chain.useCase },
    });

    if (existing) {
      console.log(`  ⏭️  ${chain.name} already exists, skipping...`);
      continue;
    }

    const { providers, ...chainData } = chain;

    const createdChain = await prisma.aIFallbackChain.create({
      data: chainData,
    });

    // Create chain provider links
    for (const providerLink of providers) {
      const providerId = createdProviders[providerLink.providerType];
      if (!providerId) {
        console.log(`    ⚠️  Provider ${providerLink.providerType} not found for chain`);
        continue;
      }

      await prisma.aIFallbackChainProvider.create({
        data: {
          chainId: createdChain.id,
          providerId,
          priority: providerLink.priority,
        },
      });
    }

    console.log(`  ✅ Created chain: ${chain.name}`);
  }

  console.log("\n✨ AI Provider seeding complete!\n");
  
  // Print summary
  const providerCount = await prisma.aIProvider.count();
  const modelCount = await prisma.aIModel.count();
  const chainCount = await prisma.aIFallbackChain.count();
  
  console.log("📊 Summary:");
  console.log(`   - Providers: ${providerCount}`);
  console.log(`   - Models: ${modelCount}`);
  console.log(`   - Fallback Chains: ${chainCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error seeding AI providers:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
