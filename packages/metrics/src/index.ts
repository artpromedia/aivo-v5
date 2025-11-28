import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  Summary,
  collectDefaultMetrics,
} from 'prom-client';

// Create a registry for all metrics
export const metricsRegistry = new Registry();

// Add default labels
metricsRegistry.setDefaultLabels({
  app: 'aivo',
  version: process.env.APP_VERSION || '1.0.0',
});

// Collect default Node.js metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({
  register: metricsRegistry,
  prefix: 'aivo_nodejs_',
});

// ============================================================================
// HTTP Request Metrics
// ============================================================================

export const httpRequestDuration = new Histogram({
  name: 'aivo_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [metricsRegistry],
});

export const httpRequestsTotal = new Counter({
  name: 'aivo_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [metricsRegistry],
});

export const httpRequestSize = new Summary({
  name: 'aivo_http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'] as const,
  registers: [metricsRegistry],
});

export const httpResponseSize = new Summary({
  name: 'aivo_http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route'] as const,
  registers: [metricsRegistry],
});

// ============================================================================
// AI/LLM Metrics
// ============================================================================

export const aiRequestDuration = new Histogram({
  name: 'aivo_ai_request_duration_seconds',
  help: 'Duration of AI/LLM requests in seconds',
  labelNames: ['provider', 'model', 'type'] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [metricsRegistry],
});

export const aiRequestsTotal = new Counter({
  name: 'aivo_ai_requests_total',
  help: 'Total number of AI/LLM requests',
  labelNames: ['provider', 'model', 'type', 'status'] as const,
  registers: [metricsRegistry],
});

export const aiTokensUsed = new Counter({
  name: 'aivo_ai_tokens_total',
  help: 'Total AI tokens used',
  labelNames: ['provider', 'model', 'type'] as const, // type: prompt, completion
  registers: [metricsRegistry],
});

export const aiCost = new Counter({
  name: 'aivo_ai_cost_usd',
  help: 'Estimated AI cost in USD',
  labelNames: ['provider', 'model'] as const,
  registers: [metricsRegistry],
});

// ============================================================================
// Learning Session Metrics
// ============================================================================

export const activeLearningSessions = new Gauge({
  name: 'aivo_active_learning_sessions',
  help: 'Number of currently active learning sessions',
  labelNames: ['type', 'subject'] as const, // type: homework, tutor, assessment
  registers: [metricsRegistry],
});

export const learningSessionsTotal = new Counter({
  name: 'aivo_learning_sessions_total',
  help: 'Total learning sessions created',
  labelNames: ['type', 'subject', 'grade_level'] as const,
  registers: [metricsRegistry],
});

export const learningSessionDuration = new Histogram({
  name: 'aivo_learning_session_duration_seconds',
  help: 'Duration of learning sessions in seconds',
  labelNames: ['type', 'subject', 'completion_status'] as const,
  buckets: [60, 300, 600, 900, 1200, 1800, 3600, 7200],
  registers: [metricsRegistry],
});

// ============================================================================
// Homework Metrics
// ============================================================================

export const homeworkSessionsCreated = new Counter({
  name: 'aivo_homework_sessions_created_total',
  help: 'Total homework sessions created',
  labelNames: ['subject', 'grade_level'] as const,
  registers: [metricsRegistry],
});

export const homeworkQuestionsAnswered = new Counter({
  name: 'aivo_homework_questions_answered_total',
  help: 'Total homework questions answered',
  labelNames: ['subject', 'correct'] as const,
  registers: [metricsRegistry],
});

export const homeworkHintsRequested = new Counter({
  name: 'aivo_homework_hints_requested_total',
  help: 'Total hints requested during homework',
  labelNames: ['subject', 'hint_level'] as const,
  registers: [metricsRegistry],
});

// ============================================================================
// Assessment Metrics
// ============================================================================

export const assessmentCompletions = new Counter({
  name: 'aivo_assessment_completions_total',
  help: 'Total assessments completed',
  labelNames: ['type', 'grade_level', 'subject'] as const,
  registers: [metricsRegistry],
});

export const assessmentScores = new Histogram({
  name: 'aivo_assessment_scores',
  help: 'Distribution of assessment scores (0-100)',
  labelNames: ['type', 'subject'] as const,
  buckets: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  registers: [metricsRegistry],
});

export const baselineAssessments = new Counter({
  name: 'aivo_baseline_assessments_total',
  help: 'Total baseline assessments completed',
  labelNames: ['domain'] as const, // reading, math, writing, etc.
  registers: [metricsRegistry],
});

// ============================================================================
// Emotion & Regulation Metrics
// ============================================================================

export const emotionCheckins = new Counter({
  name: 'aivo_emotion_checkins_total',
  help: 'Total emotion check-ins recorded',
  labelNames: ['emotion', 'intensity_bucket'] as const, // intensity: low, medium, high
  registers: [metricsRegistry],
});

export const regulationStrategiesUsed = new Counter({
  name: 'aivo_regulation_strategies_total',
  help: 'Total regulation strategies used',
  labelNames: ['strategy_type', 'trigger'] as const,
  registers: [metricsRegistry],
});

export const calmCornerVisits = new Counter({
  name: 'aivo_calm_corner_visits_total',
  help: 'Total visits to calm corner',
  labelNames: ['activity_type'] as const,
  registers: [metricsRegistry],
});

export const focusBreaksTaken = new Counter({
  name: 'aivo_focus_breaks_total',
  help: 'Total focus breaks taken',
  labelNames: ['break_type', 'triggered_by'] as const, // triggered_by: scheduled, user, system
  registers: [metricsRegistry],
});

// ============================================================================
// Database Metrics
// ============================================================================

export const dbQueryDuration = new Histogram({
  name: 'aivo_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'] as const,
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

export const dbQueriesTotal = new Counter({
  name: 'aivo_db_queries_total',
  help: 'Total database queries executed',
  labelNames: ['operation', 'model', 'status'] as const,
  registers: [metricsRegistry],
});

export const dbConnectionPool = new Gauge({
  name: 'aivo_db_connection_pool_size',
  help: 'Database connection pool metrics',
  labelNames: ['state'] as const, // idle, busy, total
  registers: [metricsRegistry],
});

// ============================================================================
// WebSocket Metrics
// ============================================================================

export const wsConnectionsActive = new Gauge({
  name: 'aivo_websocket_connections_active',
  help: 'Number of active WebSocket connections',
  labelNames: ['type'] as const, // tutor, session, notification
  registers: [metricsRegistry],
});

export const wsMessagesTotal = new Counter({
  name: 'aivo_websocket_messages_total',
  help: 'Total WebSocket messages sent/received',
  labelNames: ['direction', 'type'] as const, // direction: inbound, outbound
  registers: [metricsRegistry],
});

// ============================================================================
// Error Metrics
// ============================================================================

export const errorRate = new Counter({
  name: 'aivo_application_errors_total',
  help: 'Total application errors',
  labelNames: ['type', 'service', 'severity'] as const,
  registers: [metricsRegistry],
});

export const unhandledExceptions = new Counter({
  name: 'aivo_unhandled_exceptions_total',
  help: 'Total unhandled exceptions',
  labelNames: ['type'] as const,
  registers: [metricsRegistry],
});

// ============================================================================
// Authentication Metrics
// ============================================================================

export const authAttempts = new Counter({
  name: 'aivo_auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['method', 'status'] as const, // status: success, failure
  registers: [metricsRegistry],
});

export const activeUsers = new Gauge({
  name: 'aivo_active_users',
  help: 'Number of currently active users',
  labelNames: ['role'] as const, // learner, teacher, parent, admin
  registers: [metricsRegistry],
});

// ============================================================================
// Cache Metrics
// ============================================================================

export const cacheHits = new Counter({
  name: 'aivo_cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_name'] as const,
  registers: [metricsRegistry],
});

export const cacheMisses = new Counter({
  name: 'aivo_cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_name'] as const,
  registers: [metricsRegistry],
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Record an HTTP request with timing
 */
export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  durationSeconds: number
): void {
  const labels = { method, route, status_code: String(statusCode) };
  httpRequestDuration.observe(labels, durationSeconds);
  httpRequestsTotal.inc(labels);
}

/**
 * Record an AI request with timing
 */
export function recordAiRequest(
  provider: string,
  model: string,
  type: string,
  status: 'success' | 'error',
  durationSeconds: number,
  promptTokens?: number,
  completionTokens?: number
): void {
  aiRequestDuration.observe({ provider, model, type }, durationSeconds);
  aiRequestsTotal.inc({ provider, model, type, status });

  if (promptTokens) {
    aiTokensUsed.inc({ provider, model, type: 'prompt' }, promptTokens);
  }
  if (completionTokens) {
    aiTokensUsed.inc({ provider, model, type: 'completion' }, completionTokens);
  }
}

/**
 * Record a database query with timing
 */
export function recordDbQuery(
  operation: string,
  model: string,
  status: 'success' | 'error',
  durationSeconds: number
): void {
  dbQueryDuration.observe({ operation, model }, durationSeconds);
  dbQueriesTotal.inc({ operation, model, status });
}

/**
 * Start a session timer and return a function to end it
 */
export function startSessionTimer(
  type: string,
  subject: string
): () => { durationSeconds: number } {
  const startTime = Date.now();
  activeLearningSessions.inc({ type, subject });

  return () => {
    const durationSeconds = (Date.now() - startTime) / 1000;
    activeLearningSessions.dec({ type, subject });
    return { durationSeconds };
  };
}

/**
 * Get all metrics as text for Prometheus scraping
 */
export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}

/**
 * Get the content type for metrics
 */
export function getMetricsContentType(): string {
  return metricsRegistry.contentType;
}

// Export the registry for advanced use cases
export { Registry, Counter, Histogram, Gauge, Summary };
