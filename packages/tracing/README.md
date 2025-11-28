# @aivo/tracing

OpenTelemetry distributed tracing for the AIVO educational platform.

## Installation

```bash
pnpm add @aivo/tracing
```

## Usage

### Initialization

Initialize tracing early in your application (before any other imports if possible):

```typescript
// instrumentation.ts (for Next.js)
import { initTracing } from '@aivo/tracing';

initTracing({
  serviceName: 'aivo-web',
  serviceVersion: '1.0.0',
  environment: 'production',
  otlpEndpoint: 'http://jaeger:4318/v1/traces',
});

export {};
```

### Creating Spans

```typescript
import { createSpan, traceHomeworkOperation, traceAiRequest } from '@aivo/tracing';

// Generic span
const result = await createSpan('my-operation', async (span) => {
  span.setAttribute('custom.attribute', 'value');
  // Your operation here
  return someResult;
});

// Business-specific spans
const homework = await traceHomeworkOperation(
  'create-session',
  'session-123',
  'learner-456',
  'math',
  async (span) => {
    // Create homework session
    return session;
  }
);

// AI request tracing
const response = await traceAiRequest(
  'openai',
  'gpt-4',
  'homework-help',
  async (span) => {
    span.setAttribute('ai.prompt_tokens', 150);
    // Make AI request
    span.setAttribute('ai.completion_tokens', 200);
    return aiResponse;
  }
);
```

### Available Tracing Helpers

- `createSpan(name, operation, options?)` - Generic async span
- `createSpanSync(name, operation, options?)` - Generic sync span
- `traceHomeworkOperation(op, sessionId, learnerId, subject, fn)` - Homework operations
- `traceAiRequest(provider, model, type, fn)` - AI/LLM requests
- `traceDbOperation(operation, model, fn)` - Database operations
- `traceAssessment(type, learnerId, fn)` - Assessment operations
- `traceWebSocketMessage(type, direction, connectionId, fn)` - WebSocket messages

### Context Access

```typescript
import { getCurrentTraceId, getCurrentSpanId } from '@aivo/tracing';

// Get current trace/span IDs for logging correlation
const traceId = getCurrentTraceId();
const spanId = getCurrentSpanId();
```

### Shutdown

```typescript
import { shutdownTracing } from '@aivo/tracing';

// Graceful shutdown
await shutdownTracing();
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVICE_NAME` | Service name for traces | `aivo-web` |
| `APP_VERSION` | Application version | `1.0.0` |
| `NODE_ENV` | Deployment environment | `development` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector endpoint | `http://localhost:4318/v1/traces` |
| `OTEL_TRACING_ENABLED` | Enable/disable tracing | `true` |
| `OTEL_SAMPLING_RATIO` | Sampling ratio (0.0-1.0) | `1.0` |

### Programmatic Configuration

```typescript
initTracing({
  serviceName: 'aivo-web',
  serviceVersion: '1.0.0',
  environment: 'production',
  otlpEndpoint: 'http://jaeger:4318/v1/traces',
  enabled: true,
  samplingRatio: 0.1, // Sample 10% of traces in production
});
```

## Integration with Backends

### Jaeger

```yaml
# docker-compose.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "4318:4318"    # OTLP HTTP
    environment:
      - COLLECTOR_OTLP_ENABLED=true
```

### Grafana Tempo

```yaml
# tempo.yml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
```

## Next.js Integration

Create `instrumentation.ts` in your app root:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initTracing } = await import('@aivo/tracing');
    initTracing();
  }
}
```

## License

MIT
