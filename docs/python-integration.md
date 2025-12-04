# Python Integration Architecture

This document describes the integration between the Node.js services and the Python FastAPI backend (Brain Service) in AIVO v5.

## Overview

AIVO v5 uses a hybrid architecture that combines:

- **Node.js services** for API gateway, model dispatch, and orchestration
- **Python FastAPI backend** for ML inference, speech analysis, and complex AI tasks

The integration uses **HTTP/REST** communication (Option A) with plans to migrate to gRPC for lower latency in the future.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client Applications                             │
│              (learner-web, parent-teacher-web, mobile apps)                  │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API Gateway (Node.js)                             │
│                              Port: 4000                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Auth      │  │   Health    │  │   Routes    │  │   Brain Proxy       │ │
│  │   JWT/CSRF  │  │   Checks    │  │   CRUD      │  │   /health/brain     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
┌───────────────────────────────┐   ┌───────────────────────────────────────┐
│   Model Dispatch (Node.js)    │   │      Python Brain Service             │
│        Port: 4001             │   │           Port: 5000                  │
│  ┌─────────────────────────┐  │   │  ┌─────────────────────────────────┐  │
│  │   Multi-Provider AI     │  │   │  │   Speech Analysis               │  │
│  │   - OpenAI, Anthropic   │──┼───┼─▶│   - Articulation                │  │
│  │   - Google, Mistral     │  │   │  │   - Fluency                     │  │
│  │   - Brain Router        │  │   │  │   - Prosody                     │  │
│  └─────────────────────────┘  │   │  └─────────────────────────────────┘  │
│  ┌─────────────────────────┐  │   │  ┌─────────────────────────────────┐  │
│  │   Speech/ML Routing     │──┼───┼─▶│   ML Inference                  │  │
│  │   POST /api/brain/*     │  │   │  │   - Difficulty Prediction       │  │
│  └─────────────────────────┘  │   │  │   - Content Recommendation      │  │
└───────────────────────────────┘   │  │   - Engagement Prediction       │  │
                                    │  │   - Learning Style Detection    │  │
                                    │  └─────────────────────────────────┘  │
                                    │  ┌─────────────────────────────────┐  │
                                    │  │   Focus Analytics               │  │
                                    │  │   - Attention Analysis          │  │
                                    │  │   - Break Prediction            │  │
                                    │  └─────────────────────────────────┘  │
                                    │  ┌─────────────────────────────────┐  │
                                    │  │   Federated Learning            │  │
                                    │  │   - Model Updates               │  │
                                    │  │   - Aggregation                 │  │
                                    │  └─────────────────────────────────┘  │
                                    └───────────────────────────────────────┘
                                                      │
                                    ┌─────────────────┴─────────────────┐
                                    │                                   │
                                    ▼                                   ▼
                          ┌─────────────────┐               ┌─────────────────┐
                          │   PostgreSQL    │               │     Redis       │
                          │   Port: 5432    │               │   Port: 6379    │
                          └─────────────────┘               └─────────────────┘
```

## Services

### 1. API Gateway (Node.js - Fastify)

- **Port**: 4000
- **Purpose**: Central entry point for all client requests
- **Responsibilities**:
  - JWT authentication and authorization
  - CSRF protection
  - Rate limiting
  - Request routing
  - Health check aggregation

### 2. Model Dispatch (Node.js - Fastify)

- **Port**: 4001
- **Purpose**: AI model routing and fallback management
- **Responsibilities**:
  - Route requests to appropriate AI providers
  - Automatic failover between providers
  - Cost tracking and budget management
  - Route Python-specific tasks to Brain Service

### 3. Brain Service (Python - FastAPI)

- **Port**: 5000
- **Purpose**: ML inference and speech analysis
- **Responsibilities**:
  - Speech analysis (articulation, fluency, prosody)
  - ML model inference
  - Focus analytics
  - Federated learning coordination

## Task Routing

The following tasks are routed to the Python Brain Service:

### Speech Analysis Tasks

| Task                    | Endpoint                      | Description                  |
| ----------------------- | ----------------------------- | ---------------------------- |
| `speech_analysis`       | `/api/v1/speech/analyze`      | Full speech analysis         |
| `articulation_analysis` | `/api/v1/speech/articulation` | Articulation error detection |
| `fluency_analysis`      | `/api/v1/speech/fluency`      | Fluency metrics              |
| `prosody_analysis`      | `/api/v1/speech/prosody`      | Prosody analysis             |
| `speech_transcription`  | `/api/v1/speech/transcribe`   | Speech-to-text               |

### ML Inference Tasks

| Task                       | Endpoint                           | Description                   |
| -------------------------- | ---------------------------------- | ----------------------------- |
| `difficulty_prediction`    | `/api/v1/ml/predict/difficulty`    | Predict difficulty adjustment |
| `engagement_prediction`    | `/api/v1/ml/predict/engagement`    | Predict engagement level      |
| `content_recommendation`   | `/api/v1/ml/recommend/content`     | Content recommendations       |
| `learning_style_detection` | `/api/v1/ml/detect/learning-style` | Learning style detection      |
| `emotion_detection`        | `/api/v1/ml/detect/emotion`        | Emotion detection             |
| `focus_prediction`         | `/api/v1/ml/predict/focus`         | Focus prediction              |
| `personalized_learning`    | `/api/v1/ml/personalize`           | Personalized learning path    |

### Focus Analytics Tasks

| Task                 | Endpoint                      | Description             |
| -------------------- | ----------------------------- | ----------------------- |
| `focus_analytics`    | `/api/v1/analytics/focus`     | Focus score calculation |
| `break_prediction`   | `/api/v1/analytics/break`     | Break recommendation    |
| `attention_analysis` | `/api/v1/analytics/attention` | Attention analysis      |

### Federated Learning Tasks

| Task                     | Endpoint                      | Description         |
| ------------------------ | ----------------------------- | ------------------- |
| `federated_model_update` | `/api/v1/federated/update`    | Submit model update |
| `federated_aggregation`  | `/api/v1/federated/aggregate` | Aggregate updates   |

## Packages

### @aivo/python-client

A typed HTTP client for communicating with the Python Brain Service.

```typescript
import { getBrainServiceClient, type SpeechAnalysisRequest } from '@aivo/python-client';

const client = getBrainServiceClient({
  baseUrl: 'http://brain-service:5000',
  timeout: 30000,
});

// Check health
const health = await client.healthCheck();
console.log(health.status); // "healthy"

// Analyze speech
const result = await client.analyzeSpeech({
  audioBase64: 'base64-encoded-audio',
  sampleRate: 16000,
  childAge: 7,
  taskType: 'articulation',
});

console.log(result.articulationErrors);
console.log(result.fluencyMetrics);

// Run ML inference
const prediction = await client.runInference({
  modelType: 'difficulty_prediction',
  input: {
    subject: 'math',
    currentLevel: 5,
    recentPerformance: [0.8, 0.75, 0.9],
  },
  learnerId: 'learner-123',
});

console.log(prediction.prediction);
console.log(prediction.confidence);
```

## Docker Configuration

### docker-compose.yml

```yaml
services:
  brain-service:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: aivo-brain-service
    ports:
      - '5000:5000'
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=postgresql+asyncpg://aivo:aivopass@db:5432/aivo_v5
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SPEECH_API_URL=${SPEECH_API_URL}
      - SPEECH_API_KEY=${SPEECH_API_KEY}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./backend/models:/app/models
    networks:
      - aivo-network
    healthcheck:
      test: ['CMD', 'python', '-c', "import requests; requests.get('http://localhost:5000/health')"]
      interval: 30s
      timeout: 10s
      start_period: 15s
      retries: 3
    restart: unless-stopped
```

## Environment Variables

### Required for Brain Service Communication

| Variable                | Description                     | Default                     |
| ----------------------- | ------------------------------- | --------------------------- |
| `BRAIN_SERVICE_URL`     | URL of the Python Brain Service | `http://brain-service:5000` |
| `BRAIN_SERVICE_TIMEOUT` | Request timeout in milliseconds | `30000`                     |

### Required for Brain Service

| Variable         | Description                   |
| ---------------- | ----------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string  |
| `REDIS_URL`      | Redis connection string       |
| `OPENAI_API_KEY` | OpenAI API key for embeddings |
| `SPEECH_API_URL` | Speech recognition API URL    |
| `SPEECH_API_KEY` | Speech recognition API key    |

## Health Checks

### API Gateway Health Endpoints

| Endpoint               | Description                             |
| ---------------------- | --------------------------------------- |
| `GET /health`          | Basic health check                      |
| `GET /ready`           | Readiness check (database connectivity) |
| `GET /health/detailed` | All service health statuses             |
| `GET /health/brain`    | Python Brain Service health             |

### Example Response - /health/detailed

```json
{
  "status": "healthy",
  "timestamp": "2025-12-04T14:30:00.000Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "healthy",
      "latencyMs": 5
    },
    "redis": {
      "status": "healthy",
      "latencyMs": 2
    },
    "brainService": {
      "status": "healthy",
      "latencyMs": 15,
      "version": "1.0.0"
    },
    "modelDispatch": {
      "status": "healthy",
      "latencyMs": 10
    }
  }
}
```

## Error Handling

### Retry Configuration

The Python client includes automatic retry with exponential backoff:

```typescript
const client = new BrainServiceClient({
  retry: {
    maxRetries: 3,
    retryDelayMs: 1000,
    backoffMultiplier: 2,
  },
});
```

### Error Types

| Error                          | Status Code | Description           |
| ------------------------------ | ----------- | --------------------- |
| `BrainServiceError`            | Various     | General service error |
| `BrainServiceTimeoutError`     | 408         | Request timed out     |
| `BrainServiceUnavailableError` | 503         | Service unavailable   |

## Future: gRPC Integration (Option B)

For lower latency communication, a gRPC integration is planned:

1. **Define .proto files** for inter-service communication
2. **Generate TypeScript and Python stubs**
3. **Replace HTTP with gRPC** for high-frequency endpoints

### Planned Proto Definition

```protobuf
syntax = "proto3";

package aivo.brain;

service BrainService {
  rpc AnalyzeSpeech (SpeechRequest) returns (SpeechResponse);
  rpc RunInference (InferenceRequest) returns (InferenceResponse);
  rpc AnalyzeFocus (FocusRequest) returns (FocusResponse);
}

message SpeechRequest {
  bytes audio = 1;
  int32 sample_rate = 2;
  int32 child_age = 3;
  string task_type = 4;
}

message SpeechResponse {
  string transcription = 1;
  repeated ArticulationError errors = 2;
  FluencyMetrics fluency = 3;
}
```

## Testing

### Unit Tests

```typescript
import { BrainServiceClient } from '@aivo/python-client';

describe('BrainServiceClient', () => {
  const client = new BrainServiceClient({
    baseUrl: 'http://localhost:5000',
  });

  it('should check health', async () => {
    const health = await client.healthCheck();
    expect(health.status).toBe('healthy');
  });

  it('should analyze speech', async () => {
    const result = await client.analyzeSpeech({
      audioBase64: '...',
      sampleRate: 16000,
      childAge: 7,
      taskType: 'articulation',
    });
    expect(result.transcription).toBeDefined();
  });
});
```

### Integration Tests

```bash
# Start services
docker-compose up -d

# Run integration tests
pnpm test:integration

# Check health
curl http://localhost:4000/health/detailed
```

## Monitoring

### Metrics

- Request latency by task type
- Error rates by service
- Throughput by endpoint

### Logging

All inter-service communication is logged with:

- Request ID
- Tenant ID
- Learner ID
- Processing time
- Error details

## Security

### Authentication

- API Gateway authenticates all requests via JWT
- Internal service communication uses service-to-service tokens
- Brain Service validates X-Request-ID headers

### Rate Limiting

- Per-tenant rate limits applied at API Gateway
- Brain Service has its own rate limiting for ML endpoints

## Troubleshooting

### Common Issues

1. **Brain Service Unavailable**

   ```
   Check: docker logs aivo-brain-service
   Fix: Ensure DATABASE_URL and REDIS_URL are correct
   ```

2. **Timeout Errors**

   ```
   Check: Network connectivity between services
   Fix: Increase BRAIN_SERVICE_TIMEOUT or check service load
   ```

3. **Speech Analysis Fails**
   ```
   Check: SPEECH_API_KEY and SPEECH_API_URL
   Fix: Verify API credentials and quota
   ```

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [AIVO Speech Analysis Agent](./speech-analysis-agent.md)
- [Federated Learning Implementation](./federated-learning-implementation.md)
