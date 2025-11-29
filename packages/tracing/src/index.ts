import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import {
  trace,
  context,
  SpanStatusCode,
  Span,
  SpanKind,
  Tracer,
  Context,
} from '@opentelemetry/api';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

// ============================================================================
// Configuration Types
// ============================================================================

export interface TracingConfig {
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
  otlpEndpoint?: string;
  enabled?: boolean;
  samplingRatio?: number;
}

// ============================================================================
// SDK Initialization
// ============================================================================

let sdk: NodeSDK | null = null;
let isInitialized = false;

/**
 * Initialize OpenTelemetry tracing
 */
export function initTracing(config?: TracingConfig): void {
  if (isInitialized) {
    console.warn('Tracing already initialized');
    return;
  }

  const {
    serviceName = process.env.SERVICE_NAME || process.env.OTEL_SERVICE_NAME || 'aivo-web',
    serviceVersion = process.env.APP_VERSION || '1.0.0',
    environment = process.env.NODE_ENV || 'development',
    otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    enabled = process.env.OTEL_TRACING_ENABLED !== 'false',
    samplingRatio = parseFloat(process.env.OTEL_SAMPLING_RATIO || '1.0'),
  } = config || {};

  if (!enabled) {
    console.log('Tracing is disabled');
    return;
  }

  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment,
  });

  const traceExporter = new OTLPTraceExporter({
    url: otlpEndpoint,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  sdk = new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter) as any,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable fs instrumentation to reduce noise
        '@opentelemetry/instrumentation-fs': { enabled: false },
        // Configure HTTP instrumentation
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingPaths: ['/api/health', '/api/ready', '/api/metrics', '/_next'],
        },
      }),
    ],
  });

  sdk.start();
  isInitialized = true;

  console.log(`Tracing initialized for ${serviceName} (${environment})`);

  // Graceful shutdown
  const shutdown = async () => {
    if (sdk) {
      await sdk.shutdown();
      console.log('Tracing shutdown complete');
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

/**
 * Shutdown tracing gracefully
 */
export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
    isInitialized = false;
  }
}

// ============================================================================
// Tracer Access
// ============================================================================

const TRACER_NAME = 'aivo-app';

/**
 * Get the application tracer
 */
export function getTracer(name: string = TRACER_NAME): Tracer {
  return trace.getTracer(name);
}

// ============================================================================
// Span Creation Helpers
// ============================================================================

export interface SpanOptions {
  attributes?: Record<string, string | number | boolean>;
  kind?: SpanKind;
  parentContext?: Context;
}

/**
 * Create a span and execute an async operation within it
 */
export async function createSpan<T>(
  name: string,
  operation: (span: Span) => Promise<T>,
  options?: SpanOptions
): Promise<T> {
  const tracer = getTracer();
  const { attributes, kind = SpanKind.INTERNAL, parentContext } = options || {};

  const ctx = parentContext || context.active();

  return tracer.startActiveSpan(
    name,
    { kind },
    ctx,
    async (span) => {
      try {
        // Set initial attributes
        if (attributes) {
          Object.entries(attributes).forEach(([key, value]) => {
            span.setAttribute(key, value);
          });
        }

        const result = await operation(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

/**
 * Create a span and execute a sync operation within it
 */
export function createSpanSync<T>(
  name: string,
  operation: (span: Span) => T,
  options?: SpanOptions
): T {
  const tracer = getTracer();
  const { attributes, kind = SpanKind.INTERNAL, parentContext } = options || {};

  const ctx = parentContext || context.active();
  const span = tracer.startSpan(name, { kind }, ctx);

  try {
    // Set initial attributes
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });
    }

    const result = operation(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

// ============================================================================
// Business Operation Spans
// ============================================================================

/**
 * Trace a homework session operation
 */
export async function traceHomeworkOperation<T>(
  operationName: string,
  sessionId: string,
  learnerId: string,
  subject: string,
  operation: (span: Span) => Promise<T>
): Promise<T> {
  return createSpan(`homework.${operationName}`, operation, {
    attributes: {
      'homework.session_id': sessionId,
      'homework.learner_id': learnerId,
      'homework.subject': subject,
    },
  });
}

/**
 * Trace an AI request
 */
export async function traceAiRequest<T>(
  provider: string,
  model: string,
  requestType: string,
  operation: (span: Span) => Promise<T>
): Promise<T> {
  return createSpan(`ai.${requestType}`, operation, {
    kind: SpanKind.CLIENT,
    attributes: {
      'ai.provider': provider,
      'ai.model': model,
      'ai.request_type': requestType,
    },
  });
}

/**
 * Trace a database operation
 */
export async function traceDbOperation<T>(
  operation: string,
  model: string,
  dbOperation: (span: Span) => Promise<T>
): Promise<T> {
  return createSpan(`db.${operation}`, dbOperation, {
    kind: SpanKind.CLIENT,
    attributes: {
      'db.operation': operation,
      'db.model': model,
      'db.system': 'postgresql',
    },
  });
}

/**
 * Trace an assessment operation
 */
export async function traceAssessment<T>(
  assessmentType: string,
  learnerId: string,
  operation: (span: Span) => Promise<T>
): Promise<T> {
  return createSpan(`assessment.${assessmentType}`, operation, {
    attributes: {
      'assessment.type': assessmentType,
      'assessment.learner_id': learnerId,
    },
  });
}

/**
 * Trace a WebSocket message
 */
export async function traceWebSocketMessage<T>(
  messageType: string,
  direction: 'inbound' | 'outbound',
  connectionId: string,
  operation: (span: Span) => Promise<T>
): Promise<T> {
  return createSpan(`ws.${direction}.${messageType}`, operation, {
    kind: direction === 'outbound' ? SpanKind.PRODUCER : SpanKind.CONSUMER,
    attributes: {
      'ws.message_type': messageType,
      'ws.direction': direction,
      'ws.connection_id': connectionId,
    },
  });
}

// ============================================================================
// Context Propagation
// ============================================================================

/**
 * Extract trace context from headers
 */
export function extractTraceContext(headers: Record<string, string>): Context {
  // OpenTelemetry automatically handles W3C Trace Context propagation
  // This is primarily used for manual context extraction if needed
  return context.active();
}

/**
 * Inject trace context into headers
 */
export function injectTraceContext(headers: Record<string, string>): Record<string, string> {
  // OpenTelemetry automatically handles W3C Trace Context propagation
  // Headers are automatically injected by instrumentation
  return headers;
}

/**
 * Get the current trace ID
 */
export function getCurrentTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().traceId;
}

/**
 * Get the current span ID
 */
export function getCurrentSpanId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().spanId;
}

// ============================================================================
// Exports
// ============================================================================

export {
  trace,
  context,
  SpanStatusCode,
  SpanKind,
  Span,
  Tracer,
  Context,
};
