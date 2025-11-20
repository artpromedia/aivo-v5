export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  service: string;
  message: string;
  timestamp: string;
  tenantId?: string;
  learnerId?: string;
  userId?: string;
  requestId?: string;
  meta?: Record<string, unknown>;
}

export interface MetricPoint {
  name: string; // e.g. "llm_request_latency_ms"
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

export interface TraceSpan {
  id: string;
  parentId?: string;
  name: string;
  service: string;
  startTime: number;
  endTime?: number;
  attributes?: Record<string, unknown>;
}
