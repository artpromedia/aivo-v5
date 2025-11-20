"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
exports.info = info;
exports.warn = warn;
exports.error = error;
exports.debug = debug;
exports.recordMetric = recordMetric;
exports.drainMetrics = drainMetrics;
exports.startSpan = startSpan;
exports.endSpan = endSpan;
const SERVICE_NAME = process.env.AIVO_SERVICE_NAME || "unknown-service";
function log(level, message, meta = {}) {
    const entry = {
        level,
        service: SERVICE_NAME,
        message,
        timestamp: new Date().toISOString(),
        ...meta
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
}
function info(message, meta) {
    log("info", message, meta);
}
function warn(message, meta) {
    log("warn", message, meta);
}
function error(message, meta) {
    log("error", message, meta);
}
function debug(message, meta) {
    if (process.env.NODE_ENV === "development") {
        log("debug", message, meta);
    }
}
const metricsBuffer = [];
function recordMetric(point) {
    metricsBuffer.push(point);
}
function drainMetrics() {
    const copy = [...metricsBuffer];
    metricsBuffer.length = 0;
    return copy;
}
function startSpan(name, attributes) {
    return {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        service: SERVICE_NAME,
        startTime: Date.now(),
        attributes
    };
}
function endSpan(span) {
    span.endTime = Date.now();
    return span;
}
