# AIVO Observability Setup

Complete observability stack for AIVO using OpenTelemetry, Prometheus, and Grafana.

## Quick Start

```bash
# Start the observability stack
docker-compose -f docker-compose.observability.yml up -d

# Access UIs
# Grafana: http://localhost:3100 (admin/admin)
# Prometheus: http://localhost:9090
# Jaeger: http://localhost:16686
```

## Components

| Component  | Port  | Purpose                       |
| ---------- | ----- | ----------------------------- |
| Grafana    | 3100  | Dashboards & visualization    |
| Prometheus | 9090  | Metrics collection & querying |
| Jaeger     | 16686 | Distributed tracing UI        |

## Service Integration

### Initialize Observability

In each service's entry point:

```typescript
import { initObservability, observabilityPlugin } from '@aivo/observability';

// Initialize at startup
initObservability({
  serviceName: 'api-gateway',
  serviceVersion: '1.0.0',
  environment: process.env.NODE_ENV,
});

// Add Fastify plugin
fastify.register(observabilityPlugin, {
  ignorePaths: ['/health', '/ready', '/metrics'],
  logRequests: true,
  recordMetrics: true,
});
```

### Record LLM Metrics

```typescript
import { recordLLMMetrics, withLLMTrace } from '@aivo/observability';

// Option 1: Manual recording
const startTime = Date.now();
const response = await openai.chat.completions.create({...});
recordLLMMetrics({
  provider: 'openai',
  model: 'gpt-4',
  type: 'chat',
  status: 'success',
  durationMs: Date.now() - startTime,
  promptTokens: response.usage?.prompt_tokens,
  completionTokens: response.usage?.completion_tokens,
  estimatedCost: calculateCost(response.usage),
});

// Option 2: Using wrapper
const response = await withLLMTrace('openai', 'gpt-4', async () => {
  return await openai.chat.completions.create({...});
});
```

### Record Errors

```typescript
import { recordError } from '@aivo/observability';

try {
  await riskyOperation();
} catch (err) {
  recordError({
    type: err.name || 'UnknownError',
    service: 'api-gateway',
    severity: 'high',
  });
  throw err;
}
```

### Use Decorators

```typescript
import { traced, timed, counted } from '@aivo/observability';

class LLMService {
  @traced('llm.generateResponse')
  @timed('llm_generation')
  async generateResponse(prompt: string) {
    // Automatically traced and timed
    return await this.model.generate(prompt);
  }

  @counted('api_calls')
  async callExternalAPI() {
    // Automatically counted
  }
}
```

## Metrics Endpoint

Each service should expose metrics at `/metrics/prometheus`:

```typescript
import { drainMetrics } from '@aivo/observability';

fastify.get('/metrics/prometheus', async (request, reply) => {
  const metrics = drainMetrics();

  // Convert to Prometheus format
  const lines = metrics.map((m) => {
    const labels = Object.entries(m.labels || {})
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${m.name}{${labels}} ${m.value} ${m.timestamp}`;
  });

  reply.type('text/plain').send(lines.join('\n'));
});
```

## Available Dashboards

### 1. Service Health (`/d/aivo-service-health`)

- Request latency (avg, by route)
- Request rate
- Error rate by type
- Service status (UP/DOWN)

### 2. LLM Usage & Costs (`/d/aivo-llm-usage`)

- Total tokens used (24h)
- Estimated cost (24h)
- LLM requests count
- Average LLM latency
- Tokens by provider/model
- Latency by provider/model
- Cost breakdown by provider/model
- LLM errors by provider
- Token usage distribution (pie chart)

### 3. Error Rates (`/d/aivo-error-rates`)

- Error rate (5m window)
- Total errors (1h)
- LLM errors (1h)
- Errors by type
- Errors by service
- Errors by severity
- HTTP 4xx/5xx errors
- Error distribution (pie chart)

## Environment Variables

```bash
# Service identification
AIVO_SERVICE_NAME=api-gateway
APP_VERSION=1.0.0
NODE_ENV=development

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_TRACING_ENABLED=true
OTEL_SAMPLING_RATIO=1.0

# Logging
LOG_LEVEL=debug  # debug, info, warn, error
```

## Troubleshooting

### No metrics in Prometheus

1. Check service is running: `curl http://localhost:4000/health`
2. Check metrics endpoint: `curl http://localhost:4000/metrics/prometheus`
3. Check Prometheus targets: http://localhost:9090/targets

### No traces in Jaeger

1. Verify OTLP endpoint is reachable
2. Check service logs for tracing errors
3. Ensure `OTEL_TRACING_ENABLED=true`

### Grafana shows no data

1. Check Prometheus datasource is configured
2. Verify time range is appropriate
3. Check query syntax in panel

## Production Considerations

1. **Retention**: Configure appropriate retention periods for Prometheus
2. **Sampling**: Reduce `OTEL_SAMPLING_RATIO` for high-traffic services
3. **Security**: Secure Grafana with proper authentication
4. **Alerts**: Configure alerting rules in Prometheus/Grafana
5. **Storage**: Use persistent volumes for Prometheus and Grafana data

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   api-gateway   │────▶│    Prometheus   │
└─────────────────┘     │     :9090       │
                        └────────┬────────┘
┌─────────────────┐              │
│  model-dispatch │──────────────┤
└─────────────────┘              │
                        ┌────────▼────────┐
┌─────────────────┐     │     Grafana     │
│brain-orchestrator────▶│     :3100       │
└─────────────────┘     └─────────────────┘
        │
        │               ┌─────────────────┐
        └──────────────▶│     Jaeger      │
         (OTLP traces)  │     :16686      │
                        └─────────────────┘
```
