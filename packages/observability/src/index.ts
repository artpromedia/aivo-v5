import type { LogEntry, LogLevel, MetricPoint, TraceSpan } from "@aivo/types";

const SERVICE_NAME = process.env.AIVO_SERVICE_NAME || "unknown-service";

type LogMeta = Omit<LogEntry, "level" | "message" | "timestamp" | "service">;

export function log(level: LogLevel, message: string, meta: LogMeta = {}) {
  const entry: LogEntry = {
    level,
    service: SERVICE_NAME,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

export function info(message: string, meta?: LogMeta) {
  log("info", message, meta);
}

export function warn(message: string, meta?: LogMeta) {
  log("warn", message, meta);
}

export function error(message: string, meta?: LogMeta) {
  log("error", message, meta);
}

export function debug(message: string, meta?: LogMeta) {
  if (process.env.NODE_ENV === "development") {
    log("debug", message, meta);
  }
}

const metricsBuffer: MetricPoint[] = [];

export function recordMetric(point: MetricPoint) {
  metricsBuffer.push(point);
}

export function drainMetrics(): MetricPoint[] {
  const copy = [...metricsBuffer];
  metricsBuffer.length = 0;
  return copy;
}

export function startSpan(name: string, attributes?: Record<string, unknown>): TraceSpan {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    service: SERVICE_NAME,
    startTime: Date.now(),
    attributes
  };
}

export function endSpan(span: TraceSpan): TraceSpan {
  span.endTime = Date.now();
  return span;
}
