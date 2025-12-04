/**
 * Python Brain Service Router
 *
 * Routes specific task types to the Python FastAPI backend for:
 * - Speech analysis (articulation, fluency, prosody)
 * - Complex ML inference (federated learning, personalization)
 * - Focus analytics and engagement prediction
 *
 * @author artpromedia
 */

import { z } from 'zod';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BRAIN_SERVICE_URL = process.env.BRAIN_SERVICE_URL || 'http://brain-service:5000';
const BRAIN_SERVICE_TIMEOUT = parseInt(process.env.BRAIN_SERVICE_TIMEOUT || '30000', 10);

// ============================================================================
// TASK ROUTING CONFIGURATION
// ============================================================================

/**
 * Tasks that should be routed to the Python Brain Service
 */
export const PYTHON_ROUTED_TASKS = {
  // Speech analysis tasks
  speech_analysis: true,
  articulation_analysis: true,
  fluency_analysis: true,
  prosody_analysis: true,
  speech_transcription: true,

  // ML inference tasks
  difficulty_prediction: true,
  engagement_prediction: true,
  content_recommendation: true,
  learning_style_detection: true,
  emotion_detection: true,
  focus_prediction: true,
  personalized_learning: true,

  // Focus analytics
  focus_analytics: true,
  break_prediction: true,
  attention_analysis: true,

  // Federated learning
  federated_model_update: true,
  federated_aggregation: true,
} as const;

export type PythonRoutedTask = keyof typeof PYTHON_ROUTED_TASKS;

/**
 * Check if a task should be routed to Python
 */
export function shouldRouteToPhython(taskType: string): boolean {
  return taskType in PYTHON_ROUTED_TASKS;
}

// ============================================================================
// REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const BrainServiceRequestSchema = z.object({
  taskType: z.string(),
  payload: z.record(z.unknown()),
  metadata: z
    .object({
      learnerId: z.string().optional(),
      tenantId: z.string().optional(),
      sessionId: z.string().optional(),
      requestId: z.string().optional(),
    })
    .optional(),
  options: z
    .object({
      timeout: z.number().optional(),
      priority: z.enum(['low', 'normal', 'high']).optional(),
    })
    .optional(),
});

export type BrainServiceRequest = z.infer<typeof BrainServiceRequestSchema>;

export const BrainServiceResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown(),
  error: z.string().optional(),
  processingTimeMs: z.number(),
  metadata: z
    .object({
      modelVersion: z.string().optional(),
      confidence: z.number().optional(),
    })
    .optional(),
});

export type BrainServiceResponse = z.infer<typeof BrainServiceResponseSchema>;

// ============================================================================
// BRAIN SERVICE CLIENT
// ============================================================================

/**
 * Call the Python Brain Service for routed tasks
 */
export async function callBrainService(
  request: BrainServiceRequest,
): Promise<BrainServiceResponse> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    request.options?.timeout || BRAIN_SERVICE_TIMEOUT,
  );

  try {
    // Determine the endpoint based on task type
    const endpoint = getEndpointForTask(request.taskType);

    const response = await fetch(`${BRAIN_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': request.metadata?.requestId || crypto.randomUUID(),
        'X-Tenant-ID': request.metadata?.tenantId || '',
        'X-Learner-ID': request.metadata?.learnerId || '',
      },
      body: JSON.stringify(request.payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        data: null,
        error: `Brain service error ${response.status}: ${errorText}`,
        processingTimeMs: Date.now() - startTime,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data,
      processingTimeMs: Date.now() - startTime,
      metadata: {
        modelVersion: data.modelVersion,
        confidence: data.confidence,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);

    const errorMessage =
      error instanceof Error
        ? error.name === 'AbortError'
          ? 'Brain service request timed out'
          : error.message
        : String(error);

    return {
      success: false,
      data: null,
      error: errorMessage,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Get the appropriate API endpoint for a task type
 */
function getEndpointForTask(taskType: string): string {
  const endpoints: Record<string, string> = {
    // Speech analysis endpoints
    speech_analysis: '/api/v1/speech/analyze',
    articulation_analysis: '/api/v1/speech/articulation',
    fluency_analysis: '/api/v1/speech/fluency',
    prosody_analysis: '/api/v1/speech/prosody',
    speech_transcription: '/api/v1/speech/transcribe',

    // ML inference endpoints
    difficulty_prediction: '/api/v1/ml/predict/difficulty',
    engagement_prediction: '/api/v1/ml/predict/engagement',
    content_recommendation: '/api/v1/ml/recommend/content',
    learning_style_detection: '/api/v1/ml/detect/learning-style',
    emotion_detection: '/api/v1/ml/detect/emotion',
    focus_prediction: '/api/v1/ml/predict/focus',
    personalized_learning: '/api/v1/ml/personalize',

    // Focus analytics endpoints
    focus_analytics: '/api/v1/analytics/focus',
    break_prediction: '/api/v1/analytics/break',
    attention_analysis: '/api/v1/analytics/attention',

    // Federated learning endpoints
    federated_model_update: '/api/v1/federated/update',
    federated_aggregation: '/api/v1/federated/aggregate',
  };

  return endpoints[taskType] || '/api/v1/generic';
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export interface BrainServiceHealth {
  healthy: boolean;
  latencyMs: number;
  version?: string;
  services?: {
    database: string;
    redis: string;
    agents: string;
  };
  error?: string;
}

/**
 * Check the health of the Python Brain Service
 */
export async function checkBrainServiceHealth(): Promise<BrainServiceHealth> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${BRAIN_SERVICE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        error: `Health check failed with status ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      healthy: data.status === 'healthy',
      latencyMs: Date.now() - startTime,
      version: data.version,
      services: data.services,
    };
  } catch (error) {
    return {
      healthy: false,
      latencyMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// SPEECH ANALYSIS HELPERS
// ============================================================================

export interface SpeechAnalysisPayload {
  audioBase64: string;
  sampleRate?: number;
  childAge: number;
  taskType: 'articulation' | 'fluency' | 'conversation' | 'reading';
  targetText?: string;
  learnerId?: string;
  tenantId?: string;
}

/**
 * Route speech analysis to Python Brain Service
 */
export async function routeSpeechAnalysis(
  payload: SpeechAnalysisPayload,
  requestId?: string,
): Promise<BrainServiceResponse> {
  return callBrainService({
    taskType: 'speech_analysis',
    payload: {
      audioBase64: payload.audioBase64,
      sampleRate: payload.sampleRate || 16000,
      childAge: payload.childAge,
      taskType: payload.taskType,
      targetText: payload.targetText,
    },
    metadata: {
      learnerId: payload.learnerId,
      tenantId: payload.tenantId,
      requestId,
    },
  });
}

// ============================================================================
// ML INFERENCE HELPERS
// ============================================================================

export interface MLInferencePayload {
  modelType: string;
  input: Record<string, unknown>;
  learnerId?: string;
  tenantId?: string;
  options?: {
    returnProbabilities?: boolean;
    topK?: number;
    threshold?: number;
  };
}

/**
 * Route ML inference to Python Brain Service
 */
export async function routeMLInference(
  payload: MLInferencePayload,
  requestId?: string,
): Promise<BrainServiceResponse> {
  return callBrainService({
    taskType: payload.modelType,
    payload: {
      input: payload.input,
      options: payload.options,
    },
    metadata: {
      learnerId: payload.learnerId,
      tenantId: payload.tenantId,
      requestId,
    },
  });
}

// ============================================================================
// FOCUS ANALYTICS HELPERS
// ============================================================================

export interface FocusAnalyticsPayload {
  learnerId: string;
  sessionId: string;
  metrics: {
    mouseMovements?: Array<{ x: number; y: number; timestamp: number }>;
    keystrokes?: Array<{ key: string; timestamp: number }>;
    scrollEvents?: Array<{ scrollY: number; timestamp: number }>;
    focusChanges?: Array<{ focused: boolean; timestamp: number }>;
    sessionDuration: number;
  };
  tenantId?: string;
}

/**
 * Route focus analytics to Python Brain Service
 */
export async function routeFocusAnalytics(
  payload: FocusAnalyticsPayload,
  requestId?: string,
): Promise<BrainServiceResponse> {
  return callBrainService({
    taskType: 'focus_analytics',
    payload: {
      learnerId: payload.learnerId,
      sessionId: payload.sessionId,
      metrics: payload.metrics,
    },
    metadata: {
      learnerId: payload.learnerId,
      tenantId: payload.tenantId,
      requestId,
    },
  });
}
