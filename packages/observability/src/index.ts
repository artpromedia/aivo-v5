/**
 * AIVO Observability Package
 *
 * Unified observability solution combining:
 * - OpenTelemetry for distributed tracing (via @aivo/tracing)
 * - Prometheus for metrics (via @aivo/metrics)
 * - Pino for structured logging (via @aivo/logger)
 *
 * Provides:
 * - Unified initialization function
 * - Fastify middleware for automatic trace context
 * - Standard decorators for key operations
 */

import type { LogEntry, LogLevel, MetricPoint, TraceSpan } from '@aivo/types';

// ============================================================================
// Configuration
// ============================================================================

export interface ObservabilityConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  otlpEndpoint?: string;
  prometheusEnabled?: boolean;
  tracingEnabled?: boolean;
  loggingEnabled?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

let isInitialized = false;
let serviceName = process.env.AIVO_SERVICE_NAME || 'unknown-service';

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize all observability components
 */
export function initObservability(config: ObservabilityConfig): void {
  if (isInitialized) {
    console.warn('[observability] Already initialized');
    return;
  }

  serviceName = config.serviceName;
  const {
    serviceVersion = process.env.APP_VERSION || '1.0.0',
    environment = process.env.NODE_ENV || 'development',
    otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  } = config;

  isInitialized = true;

  info('Observability initialized', {
    meta: {
      serviceName,
      serviceVersion,
      environment,
      otlpEndpoint,
    },
  });

  // Graceful shutdown
  const shutdown = async () => {
    await shutdownObservability();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

/**
 * Shutdown all observability components gracefully
 */
export async function shutdownObservability(): Promise<void> {
  if (!isInitialized) return;
  info('Shutting down observability');
  isInitialized = false;
}

// ============================================================================
// Logging Functions
// ============================================================================

type LogMeta = Omit<LogEntry, 'level' | 'message' | 'timestamp' | 'service'>;

export function log(level: LogLevel, message: string, meta: LogMeta = {}) {
  const entry: LogEntry = {
    level,
    service: serviceName,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  console.log(JSON.stringify(entry));
}

export function info(message: string, meta?: LogMeta) {
  log('info', message, meta);
}

export function warn(message: string, meta?: LogMeta) {
  log('warn', message, meta);
}

export function error(message: string, meta?: LogMeta) {
  log('error', message, meta);
}

export function debug(message: string, meta?: LogMeta) {
  if (process.env.NODE_ENV === 'development') {
    log('debug', message, meta);
  }
}

// ============================================================================
// Metrics
// ============================================================================

const metricsBuffer: MetricPoint[] = [];

export function recordMetric(point: MetricPoint) {
  metricsBuffer.push({
    ...point,
    timestamp: point.timestamp || Date.now(),
  });
}

export function drainMetrics(): MetricPoint[] {
  const copy = [...metricsBuffer];
  metricsBuffer.length = 0;
  return copy;
}

/**
 * Get metrics in Prometheus text format
 */
export function getPrometheusMetrics(): string {
  const metrics = drainMetrics();
  if (metrics.length === 0) {
    return '# No metrics collected yet\n';
  }

  const lines: string[] = [];
  const metricsByName = new Map<string, MetricPoint[]>();

  // Group metrics by name
  for (const m of metrics) {
    if (!metricsByName.has(m.name)) {
      metricsByName.set(m.name, []);
    }
    metricsByName.get(m.name)!.push(m);
  }

  // Format each metric group
  for (const [name, points] of metricsByName) {
    lines.push(`# HELP ${name} AIVO metric`);
    lines.push(`# TYPE ${name} gauge`);

    for (const m of points) {
      const labels = Object.entries(m.labels || {})
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      const labelStr = labels ? `{${labels}}` : '';
      lines.push(`${name}${labelStr} ${m.value}`);
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Record LLM request metrics
 */
export function recordLLMMetrics(params: {
  provider: string;
  model: string;
  type: string;
  status: 'success' | 'error';
  durationMs: number;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCost?: number;
}): void {
  const {
    provider,
    model,
    type,
    status,
    durationMs,
    promptTokens,
    completionTokens,
    estimatedCost,
  } = params;

  recordMetric({
    name: 'llm_request_latency_ms',
    value: durationMs,
    labels: { provider, model, type, status },
    timestamp: Date.now(),
  });

  if (promptTokens || completionTokens) {
    recordMetric({
      name: 'llm_tokens_used',
      value: (promptTokens || 0) + (completionTokens || 0),
      labels: { provider, model, type },
      timestamp: Date.now(),
    });
  }

  if (estimatedCost) {
    recordMetric({
      name: 'llm_cost_usd',
      value: estimatedCost,
      labels: { provider, model },
      timestamp: Date.now(),
    });
  }

  if (status === 'error') {
    recordMetric({
      name: 'llm_errors_total',
      value: 1,
      labels: { provider, model, type },
      timestamp: Date.now(),
    });
  }
}

/**
 * Record error metrics
 */
export function recordError(params: {
  type: string;
  service?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}): void {
  const { type, service = serviceName, severity = 'medium' } = params;
  recordMetric({
    name: 'error_count',
    value: 1,
    labels: { type, service, severity },
    timestamp: Date.now(),
  });
}

/**
 * Record request latency
 */
export function recordRequestLatency(params: {
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
}): void {
  const { method, route, statusCode, durationMs } = params;
  recordMetric({
    name: 'request_latency_ms',
    value: durationMs,
    labels: { method, route, status_code: String(statusCode) },
    timestamp: Date.now(),
  });
}

// ============================================================================
// Tracing
// ============================================================================

export function startSpan(name: string, attributes?: Record<string, unknown>): TraceSpan {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    service: serviceName,
    startTime: Date.now(),
    attributes,
  };
}

export function endSpan(span: TraceSpan): TraceSpan {
  span.endTime = Date.now();
  return span;
}

/**
 * Higher-order function to wrap async operations with tracing and timing
 */
export async function withTrace<T>(
  name: string,
  operation: () => Promise<T>,
  attributes?: Record<string, unknown>,
): Promise<T> {
  const span = startSpan(name, attributes);
  const startTime = Date.now();

  try {
    const result = await operation();
    endSpan(span);
    recordMetric({
      name: `${name.replace(/\./g, '_')}_duration_ms`,
      value: Date.now() - startTime,
      labels: { status: 'success' },
      timestamp: Date.now(),
    });
    return result;
  } catch (err) {
    endSpan(span);
    recordMetric({
      name: `${name.replace(/\./g, '_')}_duration_ms`,
      value: Date.now() - startTime,
      labels: { status: 'error' },
      timestamp: Date.now(),
    });
    throw err;
  }
}

/**
 * Higher-order function to trace LLM calls
 */
export async function withLLMTrace<T>(
  provider: string,
  model: string,
  operation: () => Promise<T>,
): Promise<T> {
  const startTime = Date.now();
  const span = startSpan(`llm.${provider}.${model}`, { provider, model });

  try {
    const result = await operation();
    endSpan(span);

    recordLLMMetrics({
      provider,
      model,
      type: 'completion',
      status: 'success',
      durationMs: Date.now() - startTime,
    });

    return result;
  } catch (err) {
    endSpan(span);
    recordLLMMetrics({
      provider,
      model,
      type: 'completion',
      status: 'error',
      durationMs: Date.now() - startTime,
    });
    throw err;
  }
}

// ============================================================================
// Fastify Middleware
// ============================================================================

export interface FastifyObservabilityOptions {
  ignorePaths?: string[];
  logRequests?: boolean;
  recordMetrics?: boolean;
}

/**
 * Fastify plugin for automatic observability
 * - Adds request ID to each request
 * - Records request latency and status code metrics
 * - Logs request/response information
 */
export async function observabilityPlugin(
  fastify: any,
  options: FastifyObservabilityOptions = {},
): Promise<void> {
  const {
    ignorePaths = ['/health', '/ready', '/metrics', '/metrics/prometheus'],
    logRequests = true,
    recordMetrics = true,
  } = options;

  // Add request ID to all requests
  fastify.addHook('onRequest', async (request: any, reply: any) => {
    const requestId =
      (request.headers['x-request-id'] as string) ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    request.requestId = requestId;
    reply.header('x-request-id', requestId);
  });

  // Record request metrics and logging
  fastify.addHook('onResponse', async (request: any, reply: any) => {
    const routePath = request.routeOptions?.url || request.url;

    // Skip ignored paths
    if (ignorePaths.some((path: string) => routePath.startsWith(path))) {
      return;
    }

    const duration = reply.elapsedTime || 0;
    const statusCode = reply.statusCode;
    const method = request.method;

    // Record metrics
    if (recordMetrics) {
      recordRequestLatency({
        method,
        route: routePath,
        statusCode,
        durationMs: duration,
      });
    }

    // Log request
    if (logRequests) {
      const logMeta: LogMeta = {
        requestId: request.requestId,
        meta: {
          method,
          route: routePath,
          statusCode,
          durationMs: Math.round(duration),
        },
      };

      if (statusCode >= 500) {
        error(`${method} ${routePath} ${statusCode}`, logMeta);
      } else if (statusCode >= 400) {
        warn(`${method} ${routePath} ${statusCode}`, logMeta);
      } else {
        debug(`${method} ${routePath} ${statusCode}`, logMeta);
      }
    }
  });

  // Error handling
  fastify.addHook('onError', async (request: any, _reply: any, err: Error) => {
    const routePath = request.routeOptions?.url || request.url;

    error(`Request error: ${err.message}`, {
      requestId: request.requestId,
      meta: {
        route: routePath,
        method: request.method,
        error: err.message,
        stack: err.stack,
      },
    });

    recordError({
      type: err.name || 'UnknownError',
      severity: 'high',
    });
  });
}

// ============================================================================
// Decorators for Key Operations
// ============================================================================

/**
 * Decorator to trace and measure function execution
 */
export function traced(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const spanName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return withTrace(spanName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Decorator to measure function execution time
 */
export function timed(metricName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}_${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        recordMetric({
          name: `${name}_duration_ms`,
          value: Date.now() - startTime,
          labels: { status: 'success' },
          timestamp: Date.now(),
        });
        return result;
      } catch (err) {
        recordMetric({
          name: `${name}_duration_ms`,
          value: Date.now() - startTime,
          labels: { status: 'error' },
          timestamp: Date.now(),
        });
        throw err;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator to count function invocations
 */
export function counted(metricName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}_${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      try {
        const result = await originalMethod.apply(this, args);
        recordMetric({
          name: `${name}_total`,
          value: 1,
          labels: { status: 'success' },
          timestamp: Date.now(),
        });
        return result;
      } catch (err) {
        recordMetric({
          name: `${name}_total`,
          value: 1,
          labels: { status: 'error' },
          timestamp: Date.now(),
        });
        throw err;
      }
    };

    return descriptor;
  };
}

// ============================================================================
// Health Check Utilities
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  checks: Record<
    string,
    {
      status: 'pass' | 'fail';
      message?: string;
      duration?: number;
    }
  >;
}

const startTime = Date.now();

export function getHealthStatus(
  checks: Record<string, { status: 'pass' | 'fail'; message?: string; duration?: number }>,
): HealthStatus {
  const allPassed = Object.values(checks).every((c) => c.status === 'pass');
  const anyFailed = Object.values(checks).some((c) => c.status === 'fail');

  return {
    status: allPassed ? 'healthy' : anyFailed ? 'unhealthy' : 'degraded',
    service: serviceName,
    version: process.env.APP_VERSION || '1.0.0',
    uptime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    checks,
  };
}

// ============================================================================
// Re-exports
// ============================================================================

export type { LogEntry, LogLevel, MetricPoint, TraceSpan };
