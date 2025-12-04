/**
 * @aivo/python-client
 *
 * Typed HTTP client for communicating with the AIVO Python Brain Service.
 * Provides typed wrappers for speech analysis, ML inference, and agent operations.
 *
 * @author artpromedia
 * @version 1.0.0
 */

import { z } from 'zod';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface BrainServiceConfig {
  /** Base URL of the Python Brain Service (default: http://localhost:5000) */
  baseUrl: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** API key for authentication (optional) */
  apiKey?: string;
  /** Retry configuration */
  retry?: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
}

const DEFAULT_CONFIG: BrainServiceConfig = {
  baseUrl: process.env.BRAIN_SERVICE_URL || 'http://localhost:5000',
  timeout: 30000,
  retry: {
    maxRetries: 3,
    retryDelayMs: 1000,
    backoffMultiplier: 2,
  },
};

// ============================================================================
// SCHEMAS - Request/Response Types
// ============================================================================

// Health Check
export const HealthStatusSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  version: z.string(),
  timestamp: z.string(),
  services: z.object({
    database: z.enum(['connected', 'disconnected', 'error']),
    redis: z.enum(['connected', 'disconnected', 'error']),
    agents: z.enum(['ready', 'initializing', 'error']),
  }),
  uptime: z.number(),
});

export type HealthStatus = z.infer<typeof HealthStatusSchema>;

// Speech Analysis
export const SpeechAnalysisRequestSchema = z.object({
  audioBase64: z.string(),
  sampleRate: z.number().default(16000),
  childAge: z.number().min(2).max(18),
  taskType: z.enum(['articulation', 'fluency', 'conversation', 'reading']),
  targetText: z.string().optional(),
  learnerId: z.string().optional(),
  tenantId: z.string().optional(),
});

export type SpeechAnalysisRequest = z.infer<typeof SpeechAnalysisRequestSchema>;

export const ArticulationErrorSchema = z.object({
  phoneme: z.string(),
  errorType: z.enum(['substitution', 'omission', 'distortion', 'addition']),
  position: z.enum(['initial', 'medial', 'final']),
  expected: z.string(),
  produced: z.string(),
  confidence: z.number().min(0).max(1),
  severity: z.enum(['mild', 'moderate', 'severe']),
});

export type ArticulationError = z.infer<typeof ArticulationErrorSchema>;

export const FluencyMetricsSchema = z.object({
  syllablesPerMinute: z.number(),
  wordsPerMinute: z.number(),
  fluencyScore: z.number().min(0).max(1),
  stutteringLikelihood: z.number().min(0).max(1),
  disfluencies: z.array(
    z.object({
      type: z.enum(['repetition', 'prolongation', 'block', 'revision', 'interjection']),
      startTime: z.number(),
      endTime: z.number(),
      word: z.string().optional(),
    }),
  ),
});

export type FluencyMetrics = z.infer<typeof FluencyMetricsSchema>;

export const SpeechAnalysisResponseSchema = z.object({
  transcription: z.string(),
  articulationErrors: z.array(ArticulationErrorSchema),
  fluencyMetrics: FluencyMetricsSchema,
  intelligibilityScore: z.number().min(0).max(1),
  ageAppropriateness: z.object({
    isAgeAppropriate: z.boolean(),
    percentile: z.number(),
    areasOfConcern: z.array(z.string()),
  }),
  recommendations: z.array(
    z.object({
      priority: z.enum(['high', 'medium', 'low']),
      category: z.string(),
      description: z.string(),
      exercises: z.array(z.string()),
    }),
  ),
  processingTimeMs: z.number(),
});

export type SpeechAnalysisResponse = z.infer<typeof SpeechAnalysisResponseSchema>;

// ML Inference
export const MLInferenceRequestSchema = z.object({
  modelType: z.enum([
    'personalized_learning',
    'difficulty_prediction',
    'engagement_prediction',
    'content_recommendation',
    'learning_style',
    'emotion_detection',
    'focus_prediction',
  ]),
  input: z.record(z.unknown()),
  learnerId: z.string().optional(),
  tenantId: z.string().optional(),
  options: z
    .object({
      returnProbabilities: z.boolean().optional(),
      topK: z.number().optional(),
      threshold: z.number().optional(),
    })
    .optional(),
});

export type MLInferenceRequest = z.infer<typeof MLInferenceRequestSchema>;

export const MLInferenceResponseSchema = z.object({
  prediction: z.unknown(),
  confidence: z.number().min(0).max(1),
  probabilities: z.record(z.number()).optional(),
  modelVersion: z.string(),
  processingTimeMs: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export type MLInferenceResponse = z.infer<typeof MLInferenceResponseSchema>;

// Agent Operations
export const AgentRequestSchema = z.object({
  agentType: z.enum([
    'virtual_brain',
    'tutor',
    'content',
    'assessment',
    'speech',
    'personalized_learning',
  ]),
  action: z.string(),
  payload: z.record(z.unknown()),
  learnerId: z.string().optional(),
  tenantId: z.string().optional(),
  sessionId: z.string().optional(),
});

export type AgentRequest = z.infer<typeof AgentRequestSchema>;

export const AgentResponseSchema = z.object({
  action: z.string(),
  result: z.unknown(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
  nextActions: z.array(z.string()).optional(),
  processingTimeMs: z.number(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// Focus Analytics
export const FocusAnalyticsRequestSchema = z.object({
  learnerId: z.string(),
  sessionId: z.string(),
  metrics: z.object({
    mouseMovements: z.array(
      z.object({
        x: z.number(),
        y: z.number(),
        timestamp: z.number(),
      }),
    ),
    keystrokes: z.array(
      z.object({
        key: z.string(),
        timestamp: z.number(),
      }),
    ),
    scrollEvents: z.array(
      z.object({
        scrollY: z.number(),
        timestamp: z.number(),
      }),
    ),
    focusChanges: z.array(
      z.object({
        focused: z.boolean(),
        timestamp: z.number(),
      }),
    ),
    sessionDuration: z.number(),
  }),
});

export type FocusAnalyticsRequest = z.infer<typeof FocusAnalyticsRequestSchema>;

export const FocusAnalyticsResponseSchema = z.object({
  focusScore: z.number().min(0).max(100),
  engagementLevel: z.enum(['high', 'medium', 'low', 'disengaged']),
  breakRecommended: z.boolean(),
  insights: z.array(z.string()),
  processingTimeMs: z.number(),
});

export type FocusAnalyticsResponse = z.infer<typeof FocusAnalyticsResponseSchema>;

// ============================================================================
// ERROR TYPES
// ============================================================================

export class BrainServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'BrainServiceError';
  }
}

export class BrainServiceTimeoutError extends BrainServiceError {
  constructor(message: string = 'Request timed out') {
    super(message, 408, 'TIMEOUT');
    this.name = 'BrainServiceTimeoutError';
  }
}

export class BrainServiceUnavailableError extends BrainServiceError {
  constructor(message: string = 'Brain service is unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'BrainServiceUnavailableError';
  }
}

// ============================================================================
// CLIENT IMPLEMENTATION
// ============================================================================

/**
 * Python Brain Service Client
 *
 * Provides typed HTTP methods for communicating with the AIVO Python backend.
 */
export class BrainServiceClient {
  private config: BrainServiceConfig;

  constructor(config?: Partial<BrainServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Make an HTTP request with retry logic
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
    schema?: z.ZodSchema<T>,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const { maxRetries, retryDelayMs, backoffMultiplier } = this.config.retry || {
      maxRetries: 3,
      retryDelayMs: 1000,
      backoffMultiplier: 2,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text();
          let errorDetails: unknown;
          try {
            errorDetails = JSON.parse(errorBody);
          } catch {
            errorDetails = errorBody;
          }

          throw new BrainServiceError(
            `Brain service request failed: ${response.status} ${response.statusText}`,
            response.status,
            'REQUEST_FAILED',
            errorDetails,
          );
        }

        const data = await response.json();

        // Validate response against schema if provided
        if (schema) {
          const result = schema.safeParse(data);
          if (!result.success) {
            throw new BrainServiceError(
              'Invalid response from brain service',
              500,
              'INVALID_RESPONSE',
              result.error.errors,
            );
          }
          return result.data;
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on validation errors or 4xx responses
        if (error instanceof BrainServiceError && error.statusCode < 500) {
          throw error;
        }

        // Check if it's an abort error (timeout)
        if ((error as Error).name === 'AbortError') {
          lastError = new BrainServiceTimeoutError();
        }

        // Wait before retrying
        if (attempt < maxRetries) {
          const delay = retryDelayMs * Math.pow(backoffMultiplier, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new BrainServiceUnavailableError();
  }

  // ============================================================================
  // HEALTH & STATUS
  // ============================================================================

  /**
   * Check if the brain service is healthy
   */
  async healthCheck(): Promise<HealthStatus> {
    return this.request('GET', '/health', undefined, HealthStatusSchema);
  }

  /**
   * Check if the service is ready to accept requests
   */
  async isReady(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  // ============================================================================
  // SPEECH ANALYSIS
  // ============================================================================

  /**
   * Analyze a speech sample for articulation, fluency, and other speech metrics
   */
  async analyzeSpeech(request: SpeechAnalysisRequest): Promise<SpeechAnalysisResponse> {
    const validated = SpeechAnalysisRequestSchema.parse(request);
    return this.request('POST', '/api/v1/speech/analyze', validated, SpeechAnalysisResponseSchema);
  }

  /**
   * Analyze articulation only (faster, focused analysis)
   */
  async analyzeArticulation(
    audioBase64: string,
    childAge: number,
    targetText?: string,
  ): Promise<SpeechAnalysisResponse> {
    return this.analyzeSpeech({
      audioBase64,
      sampleRate: 16000,
      childAge,
      taskType: 'articulation',
      targetText,
    });
  }

  /**
   * Analyze fluency only (faster, focused analysis)
   */
  async analyzeFluency(audioBase64: string, childAge: number): Promise<SpeechAnalysisResponse> {
    return this.analyzeSpeech({
      audioBase64,
      sampleRate: 16000,
      childAge,
      taskType: 'fluency',
    });
  }

  // ============================================================================
  // ML INFERENCE
  // ============================================================================

  /**
   * Run ML inference for various prediction tasks
   */
  async runInference(request: MLInferenceRequest): Promise<MLInferenceResponse> {
    const validated = MLInferenceRequestSchema.parse(request);
    return this.request('POST', '/api/v1/ml/inference', validated, MLInferenceResponseSchema);
  }

  /**
   * Predict difficulty adjustment for a learner
   */
  async predictDifficulty(
    learnerId: string,
    subject: string,
    currentLevel: number,
    recentPerformance: number[],
  ): Promise<MLInferenceResponse> {
    return this.runInference({
      modelType: 'difficulty_prediction',
      input: {
        subject,
        currentLevel,
        recentPerformance,
      },
      learnerId,
    });
  }

  /**
   * Predict content recommendations for a learner
   */
  async recommendContent(
    learnerId: string,
    subject: string,
    learningStyle: string,
    previousContent: string[],
  ): Promise<MLInferenceResponse> {
    return this.runInference({
      modelType: 'content_recommendation',
      input: {
        subject,
        learningStyle,
        previousContent,
      },
      learnerId,
    });
  }

  /**
   * Predict engagement level based on session data
   */
  async predictEngagement(
    learnerId: string,
    sessionData: Record<string, unknown>,
  ): Promise<MLInferenceResponse> {
    return this.runInference({
      modelType: 'engagement_prediction',
      input: sessionData,
      learnerId,
    });
  }

  // ============================================================================
  // AGENT OPERATIONS
  // ============================================================================

  /**
   * Invoke a Python-based agent
   */
  async invokeAgent(request: AgentRequest): Promise<AgentResponse> {
    const validated = AgentRequestSchema.parse(request);
    return this.request('POST', '/api/v1/agents/invoke', validated, AgentResponseSchema);
  }

  /**
   * Get status of an agent instance
   */
  async getAgentStatus(
    agentType: string,
    learnerId: string,
  ): Promise<{ status: string; lastActivity: string }> {
    return this.request('GET', `/api/v1/agents/${agentType}/status?learnerId=${learnerId}`);
  }

  // ============================================================================
  // FOCUS ANALYTICS
  // ============================================================================

  /**
   * Analyze focus and engagement metrics
   */
  async analyzeFocus(request: FocusAnalyticsRequest): Promise<FocusAnalyticsResponse> {
    const validated = FocusAnalyticsRequestSchema.parse(request);
    return this.request('POST', '/api/v1/analytics/focus', validated, FocusAnalyticsResponseSchema);
  }

  // ============================================================================
  // FEDERATED LEARNING
  // ============================================================================

  /**
   * Submit local model update for federated learning
   */
  async submitModelUpdate(
    learnerId: string,
    modelType: string,
    gradients: number[],
    localMetrics: Record<string, number>,
  ): Promise<{ accepted: boolean; globalVersion: number }> {
    return this.request('POST', '/api/v1/federated/update', {
      learnerId,
      modelType,
      gradients,
      localMetrics,
    });
  }

  /**
   * Get current global model for federated learning
   */
  async getGlobalModel(
    modelType: string,
  ): Promise<{ version: number; weights: number[]; metadata: Record<string, unknown> }> {
    return this.request('GET', `/api/v1/federated/model/${modelType}`);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let defaultClient: BrainServiceClient | null = null;

/**
 * Get or create the default Brain Service client
 */
export function getBrainServiceClient(config?: Partial<BrainServiceConfig>): BrainServiceClient {
  if (!defaultClient || config) {
    defaultClient = new BrainServiceClient(config);
  }
  return defaultClient;
}

/**
 * Create a new Brain Service client with custom configuration
 */
export function createBrainServiceClient(config: Partial<BrainServiceConfig>): BrainServiceClient {
  return new BrainServiceClient(config);
}

// Default export
export default BrainServiceClient;
