import { debug, error, info, recordMetric, startSpan, endSpan, warn } from "@aivo/observability";

export type ObservabilityContext = {
  userId?: string;
  tenantId?: string;
  learnerId?: string;
  requestId?: string;
};

export type ObservabilityMeta = Record<string, unknown>;

function buildLogMeta(context?: ObservabilityContext, meta?: ObservabilityMeta) {
  return {
    ...(context?.userId ? { userId: context.userId } : {}),
    ...(context?.tenantId ? { tenantId: context.tenantId } : {}),
    ...(context?.learnerId ? { learnerId: context.learnerId } : {}),
    ...(context?.requestId ? { requestId: context.requestId } : {}),
    ...(meta ? { meta } : {})
  };
}

function buildMetricLabels(context?: ObservabilityContext, labels?: Record<string, string>) {
  return {
    ...(context?.userId ? { userId: context.userId } : {}),
    ...(context?.tenantId ? { tenantId: context.tenantId } : {}),
    ...(context?.learnerId ? { learnerId: context.learnerId } : {}),
    ...(context?.requestId ? { requestId: context.requestId } : {}),
    ...(labels ?? {})
  };
}

export function logInfo(message: string, context?: ObservabilityContext, meta?: ObservabilityMeta) {
  info(message, buildLogMeta(context, meta));
}

export function logWarn(message: string, context?: ObservabilityContext, meta?: ObservabilityMeta) {
  warn(message, buildLogMeta(context, meta));
}

export function logError(message: string, context?: ObservabilityContext, meta?: ObservabilityMeta) {
  error(message, buildLogMeta(context, meta));
}

export function logDebug(message: string, context?: ObservabilityContext, meta?: ObservabilityMeta) {
  debug(message, buildLogMeta(context, meta));
}

export function recordMetricPoint(
  name: string,
  value: number,
  context?: ObservabilityContext,
  labels?: Record<string, string>
) {
  recordMetric({
    name,
    value,
    timestamp: Date.now(),
    labels: buildMetricLabels(context, labels)
  });
}

type TraceOptions = {
  context?: ObservabilityContext;
  attributes?: Record<string, unknown>;
  durationMetric?: string;
  labels?: Record<string, string>;
};

export async function traceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  options: TraceOptions = {}
): Promise<T> {
  const { context, attributes, durationMetric, labels } = options;
  const span = startSpan(name, { ...attributes, ...context });
  const startTime = Date.now();
  try {
    return await fn();
  } catch (err) {
    logError(`${name} failed`, context, {
      error: err instanceof Error ? err.message : String(err)
    });
    span.attributes = {
      ...(span.attributes ?? {}),
      error: err instanceof Error ? err.message : String(err)
    };
    throw err;
  } finally {
    endSpan(span);
    if (durationMetric) {
      recordMetricPoint(durationMetric, Date.now() - startTime, context, labels);
    }
  }
}
