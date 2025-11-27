/**
 * Multi-Provider AI System Types
 * Supports 8+ AI providers with automatic fallback, cost tracking, and admin management
 */

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export type ProviderType =
  | "OPENAI"
  | "ANTHROPIC"
  | "GOOGLE"
  | "META"
  | "COHERE"
  | "MISTRAL"
  | "HUGGINGFACE"
  | "GROQ"
  | "TOGETHER"
  | "REPLICATE"
  | "AZURE_OPENAI"
  | "AWS_BEDROCK"
  | "CUSTOM"
  | "AIVO_BRAIN";

export type ProviderHealthStatus = "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "UNKNOWN";

export type ModelQualityTier = "ECONOMY" | "STANDARD" | "PREMIUM";

export type ModelCapability =
  | "chat"
  | "completion"
  | "embedding"
  | "vision"
  | "audio"
  | "function_calling"
  | "streaming"
  | "json_mode";

export type AIUseCase =
  | "homework_help"
  | "assessment"
  | "tutoring"
  | "iep_analysis"
  | "speech_analysis"
  | "content_generation"
  | "summarization"
  | "translation"
  | "general";

export type BudgetPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export type AIExperimentStatus = "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED";

// ============================================================================
// PROVIDER & MODEL INTERFACES
// ============================================================================

export interface AIProvider {
  id: string;
  providerType: ProviderType;
  name: string;
  apiEndpoint?: string;
  isActive: boolean;
  priority: number;
  rateLimitRpm?: number;
  rateLimitTpm?: number;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  config?: ProviderConfig;
  healthStatus: ProviderHealthStatus;
  lastHealthCheck?: string;
  healthCheckUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderConfig {
  // Common config
  timeout?: number;
  maxRetries?: number;
  
  // OpenAI specific
  organization?: string;
  
  // Azure OpenAI specific
  azureDeploymentId?: string;
  azureApiVersion?: string;
  
  // AWS Bedrock specific
  awsRegion?: string;
  
  // Custom/Self-hosted specific
  authType?: "bearer" | "api_key" | "basic" | "none";
  customHeaders?: Record<string, string>;
  
  // Additional arbitrary config
  [key: string]: unknown;
}

export interface AIModel {
  id: string;
  providerId: string;
  modelIdentifier: string;
  displayName: string;
  capabilities: ModelCapability[];
  maxTokens: number;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  isActive: boolean;
  isDefault: boolean;
  useCases: AIUseCase[];
  qualityTier: ModelQualityTier;
  supportedLanguages: string[];
  metadata?: ModelMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ModelMetadata {
  releaseDate?: string;
  deprecationDate?: string;
  knowledgeCutoff?: string;
  trainingData?: string;
  notes?: string;
  benchmarks?: Record<string, number>;
  [key: string]: unknown;
}

// ============================================================================
// FALLBACK CHAIN INTERFACES
// ============================================================================

export interface AIFallbackChain {
  id: string;
  name: string;
  description?: string;
  useCase: AIUseCase | string;
  isActive: boolean;
  isDefault: boolean;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  budgetLimit?: number;
  providers: AIFallbackChainProvider[];
  createdAt: string;
  updatedAt: string;
}

export interface AIFallbackChainProvider {
  id: string;
  chainId: string;
  providerId: string;
  priority: number;
  modelOverride?: string;
  config?: ProviderConfig;
  provider?: AIProvider;
  createdAt: string;
}

// ============================================================================
// USAGE & COST TRACKING
// ============================================================================

export interface AIUsageLog {
  id: string;
  providerId: string;
  modelId?: string;
  tenantId?: string;
  learnerId?: string;
  userId?: string;
  useCase: string;
  requestId?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  fallbackUsed: boolean;
  fallbackFrom?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface AIBudget {
  id: string;
  tenantId?: string;
  learnerId?: string;
  period: BudgetPeriod;
  budgetAmount: number;
  spentAmount: number;
  alertThreshold: number;
  hardLimit: boolean;
  periodStart: string;
  periodEnd?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIProviderHealthLog {
  id: string;
  providerId: string;
  status: ProviderHealthStatus;
  latencyMs?: number;
  errorMessage?: string;
  checkedAt: string;
}

// ============================================================================
// A/B TESTING
// ============================================================================

export interface AIExperiment {
  id: string;
  name: string;
  description?: string;
  useCase: string;
  status: AIExperimentStatus;
  startDate?: string;
  endDate?: string;
  trafficPercent: number;
  variants: AIExperimentVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface AIExperimentVariant {
  id: string;
  experimentId: string;
  name: string;
  providerId?: string;
  modelId?: string;
  config?: Record<string, unknown>;
  trafficWeight: number;
  createdAt: string;
}

export interface AIExperimentResult {
  id: string;
  experimentId: string;
  variantId: string;
  learnerId?: string;
  success: boolean;
  latencyMs: number;
  cost: number;
  qualityScore?: number;
  userFeedback?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface AICompletionRequest {
  prompt: string;
  systemPrompt?: string;
  useCase: AIUseCase | string;
  preferredProvider?: string;
  preferredModel?: string;
  maxRetries?: number;
  budget?: number;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  responseFormat?: "text" | "json";
  stream?: boolean;
  metadata?: {
    tenantId?: string;
    learnerId?: string;
    userId?: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

export interface AIChatMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  useCase: AIUseCase | string;
  preferredProvider?: string;
  preferredModel?: string;
  maxRetries?: number;
  budget?: number;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  responseFormat?: "text" | "json";
  stream?: boolean;
  functions?: AIFunctionDefinition[];
  functionCall?: "auto" | "none" | { name: string };
  metadata?: {
    tenantId?: string;
    learnerId?: string;
    userId?: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

export interface AIFunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface AIEmbeddingRequest {
  input: string | string[];
  useCase?: AIUseCase | string;
  preferredProvider?: string;
  preferredModel?: string;
  metadata?: {
    tenantId?: string;
    learnerId?: string;
    userId?: string;
    [key: string]: unknown;
  };
}

export interface AIResponse {
  success: boolean;
  requestId: string;
  provider: string;
  model: string;
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost: number;
  latencyMs: number;
  fallbackUsed: boolean;
  fallbackChain?: string[];
  finishReason?: "stop" | "length" | "function_call" | "content_filter";
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface AIEmbeddingResponse {
  success: boolean;
  requestId: string;
  provider: string;
  model: string;
  embeddings: number[][];
  usage: {
    totalTokens: number;
  };
  cost: number;
  latencyMs: number;
}

export interface AIStreamChunk {
  requestId: string;
  provider: string;
  model: string;
  content: string;
  finishReason?: "stop" | "length" | "function_call" | "content_filter";
  done: boolean;
}

export interface AIErrorResponse {
  success: false;
  requestId: string;
  error: {
    code: string;
    message: string;
    provider?: string;
    retryable: boolean;
  };
  fallbackAttempts?: Array<{
    provider: string;
    model: string;
    errorCode: string;
    errorMessage: string;
  }>;
}

// ============================================================================
// ANALYTICS & DASHBOARD TYPES
// ============================================================================

export interface AIUsageAnalytics {
  period: {
    start: string;
    end: string;
  };
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatencyMs: number;
  byProvider: Array<{
    providerId: string;
    providerName: string;
    requests: number;
    tokens: number;
    cost: number;
    avgLatencyMs: number;
    errorRate: number;
  }>;
  byUseCase: Array<{
    useCase: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
  byDay: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

export interface AIProviderStatus {
  id: string;
  name: string;
  providerType: ProviderType;
  healthStatus: ProviderHealthStatus;
  isActive: boolean;
  lastHealthCheck?: string;
  recentLatencyMs?: number;
  errorRateLast24h: number;
  requestsLast24h: number;
  modelsCount: number;
  activeModelsCount: number;
}

export interface AICostBreakdown {
  period: {
    start: string;
    end: string;
  };
  totalCost: number;
  budgetAmount?: number;
  budgetRemaining?: number;
  byProvider: Array<{
    providerId: string;
    providerName: string;
    cost: number;
    percentage: number;
  }>;
  byUseCase: Array<{
    useCase: string;
    cost: number;
    percentage: number;
  }>;
  byModel: Array<{
    modelId: string;
    modelName: string;
    provider: string;
    cost: number;
    percentage: number;
  }>;
  projectedMonthlyTotal: number;
}

export interface AIHealthDashboard {
  overallStatus: ProviderHealthStatus;
  providers: AIProviderStatus[];
  recentIncidents: Array<{
    providerId: string;
    providerName: string;
    timestamp: string;
    status: ProviderHealthStatus;
    errorMessage?: string;
  }>;
  uptime24h: number;
  avgResponseTime24h: number;
}

// ============================================================================
// ADMIN API TYPES
// ============================================================================

export interface CreateProviderRequest {
  providerType: ProviderType;
  name: string;
  apiEndpoint?: string;
  apiKey?: string;
  priority?: number;
  rateLimitRpm?: number;
  rateLimitTpm?: number;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  config?: ProviderConfig;
  healthCheckUrl?: string;
}

export interface UpdateProviderRequest {
  name?: string;
  apiEndpoint?: string;
  apiKey?: string;
  isActive?: boolean;
  priority?: number;
  rateLimitRpm?: number;
  rateLimitTpm?: number;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  config?: ProviderConfig;
  healthCheckUrl?: string;
}

export interface CreateModelRequest {
  providerId: string;
  modelIdentifier: string;
  displayName: string;
  capabilities: ModelCapability[];
  maxTokens: number;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  useCases?: AIUseCase[];
  qualityTier?: ModelQualityTier;
  supportedLanguages?: string[];
  isDefault?: boolean;
  metadata?: ModelMetadata;
}

export interface UpdateModelRequest {
  displayName?: string;
  capabilities?: ModelCapability[];
  maxTokens?: number;
  contextWindow?: number;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  isActive?: boolean;
  isDefault?: boolean;
  useCases?: AIUseCase[];
  qualityTier?: ModelQualityTier;
  supportedLanguages?: string[];
  metadata?: ModelMetadata;
}

export interface CreateFallbackChainRequest {
  name: string;
  description?: string;
  useCase: AIUseCase | string;
  isDefault?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  budgetLimit?: number;
  providers: Array<{
    providerId: string;
    priority: number;
    modelOverride?: string;
    config?: ProviderConfig;
  }>;
}

export interface UpdateFallbackChainRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  budgetLimit?: number;
  providers?: Array<{
    providerId: string;
    priority: number;
    modelOverride?: string;
    config?: ProviderConfig;
  }>;
}

export interface CreateBudgetRequest {
  tenantId?: string;
  learnerId?: string;
  period: BudgetPeriod;
  budgetAmount: number;
  alertThreshold?: number;
  hardLimit?: boolean;
}

export interface UpdateBudgetRequest {
  budgetAmount?: number;
  alertThreshold?: number;
  hardLimit?: boolean;
  isActive?: boolean;
}

// ============================================================================
// PROVIDER SDK INTERFACES
// ============================================================================

export interface AIProviderSDK {
  name: ProviderType;
  
  // Core methods
  complete(request: AICompletionRequest): Promise<AIResponse>;
  chat(request: AIChatRequest): Promise<AIResponse>;
  embed?(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse>;
  
  // Streaming
  streamChat?(request: AIChatRequest): AsyncIterableIterator<AIStreamChunk>;
  streamComplete?(request: AICompletionRequest): AsyncIterableIterator<AIStreamChunk>;
  
  // Health check
  healthCheck(): Promise<{
    healthy: boolean;
    latencyMs: number;
    error?: string;
  }>;
  
  // Token counting (provider-specific)
  countTokens?(text: string, model?: string): Promise<number>;
}

export interface ProviderSDKConfig {
  apiKey: string;
  apiEndpoint?: string;
  organization?: string;
  timeout?: number;
  maxRetries?: number;
  customHeaders?: Record<string, string>;
  [key: string]: unknown;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface RateLimitState {
  providerId: string;
  requestsRemaining: number;
  tokensRemaining: number;
  resetAt: string;
  isLimited: boolean;
}

export interface RateLimitConfig {
  requestsPerMinute?: number;
  tokensPerMinute?: number;
  requestsPerDay?: number;
  tokensPerDay?: number;
  concurrentRequests?: number;
}
