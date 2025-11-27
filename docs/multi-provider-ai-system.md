# Multi-Provider AI System Documentation

## Overview

The AIVO v5 Multi-Provider AI System is a comprehensive solution for managing multiple AI providers with automatic fallback, cost tracking, rate limiting, and intelligent routing. It supports 9+ AI providers and enables use-case specific model selection.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Provider AI Service                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   OpenAI    │  │  Anthropic  │  │   Google    │  ...        │
│  │   Client    │  │   Client    │  │   Client    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Fallback Chain Manager                         ││
│  │  - Use-case routing                                         ││
│  │  - Priority-based selection                                 ││
│  │  - Automatic failover                                       ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                Rate Limiter & Health Monitor                ││
│  │  - Per-provider rate limits (RPM/TPM)                       ││
│  │  - Health status tracking                                   ││
│  │  - Automatic degradation                                    ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Usage & Cost Tracking                          ││
│  │  - Per-request logging                                      ││
│  │  - Analytics aggregation                                    ││
│  │  - Budget monitoring                                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Supported Providers

| Provider | Status | Features | Models |
|----------|--------|----------|--------|
| OpenAI | ✅ Full | Chat, Completion, Embedding, Vision, Function Calling | GPT-4o, GPT-4-turbo, GPT-3.5-turbo |
| Anthropic | ✅ Full | Chat, Vision | Claude 3 Opus, Sonnet, Haiku |
| Google | ✅ Full | Chat, Embedding, Vision | Gemini Pro, Gemini Flash |
| Meta (Llama) | ✅ Via Partner | Chat | Llama 3.1 70B, 8B |
| Cohere | ✅ Full | Chat, Embedding | Command R+, Command R |
| Mistral | ✅ Full | Chat, Embedding | Mistral Large, Medium, Small |
| HuggingFace | ✅ Full | Chat, Embedding | Open models |
| Groq | ✅ Full | Chat | Llama, Mixtral (fast inference) |
| Custom | ✅ Full | Configurable | Any OpenAI-compatible API |
| Aivo Brain | ✅ Full | Internal | Fine-tuned education models |

## Database Schema

### AIProvider
```prisma
model AIProvider {
  id              String    @id @default(cuid())
  providerType    ProviderType
  name            String
  isActive        Boolean   @default(true)
  priority        Int       @default(100)
  apiKey          String?   // Encrypted
  apiEndpoint     String?
  config          Json?
  healthStatus    String    @default("UNKNOWN")
  lastHealthCheck DateTime?
  rateLimitRpm    Int?
  rateLimitTpm    Int?
  currentRpmUsage Int       @default(0)
  currentTpmUsage Int       @default(0)
  costPer1kInput  Float?
  costPer1kOutput Float?
}
```

### AIModel
```prisma
model AIModel {
  id              String    @id @default(cuid())
  providerId      String
  modelIdentifier String
  displayName     String
  capabilities    AIModelCapability[]
  maxTokens       Int       @default(4096)
  contextWindow   Int       @default(128000)
  costPer1kInput  Float
  costPer1kOutput Float
  isActive        Boolean   @default(true)
  isDefault       Boolean   @default(false)
  useCases        AIUseCase[]
  qualityTier     String    @default("STANDARD")
}
```

### AIFallbackChain
```prisma
model AIFallbackChain {
  id          String    @id @default(cuid())
  name        String
  description String?
  useCase     AIUseCase
  providers   Json      // Ordered list of provider IDs with priorities
  isActive    Boolean   @default(true)
  isDefault   Boolean   @default(false)
  maxRetries  Int       @default(3)
  timeoutMs   Int       @default(30000)
}
```

## API Endpoints

### AI Operations

#### POST /api/ai/completion
Generate text completion with automatic provider selection and fallback.

```json
{
  "prompt": "Explain photosynthesis to a 5th grader",
  "maxTokens": 500,
  "temperature": 0.7,
  "useCase": "homework_help",
  "metadata": {
    "learnerId": "learner_123",
    "sessionId": "session_456"
  }
}
```

#### POST /api/ai/chat
Multi-turn chat completion with context.

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful tutor" },
    { "role": "user", "content": "What is the Pythagorean theorem?" }
  ],
  "maxTokens": 1000,
  "useCase": "tutoring"
}
```

#### POST /api/ai/embedding
Generate text embeddings for semantic search.

```json
{
  "input": "The mitochondria is the powerhouse of the cell",
  "model": "text-embedding-3-small"
}
```

### Admin Endpoints

#### GET /api/admin/ai/providers
List all configured AI providers with their status.

#### POST /api/admin/ai/providers
Add a new AI provider.

#### PUT /api/admin/ai/providers/:id
Update provider configuration.

#### GET /api/admin/ai/models
List all available models across providers.

#### POST /api/admin/ai/models
Register a new model.

#### GET /api/admin/ai/fallback-chains
List all fallback chains.

#### POST /api/admin/ai/fallback-chains
Create a new fallback chain.

#### GET /api/admin/ai/usage
Get usage analytics with filters.

Query params:
- `startDate`: ISO date string
- `endDate`: ISO date string
- `providerId`: Filter by provider
- `useCase`: Filter by use case

#### GET /api/admin/ai/costs
Get cost breakdown.

Query params:
- `startDate`: ISO date string
- `endDate`: ISO date string
- `groupBy`: 'provider' | 'useCase' | 'model'

#### GET /api/admin/ai/health
Get real-time health status of all providers.

## Use Cases

The system supports routing requests to specific models based on use case:

| Use Case | Description | Recommended Tier |
|----------|-------------|------------------|
| `homework_help` | General homework assistance | Standard |
| `tutoring` | Interactive tutoring sessions | Premium |
| `assessment` | Quiz and test generation | Standard |
| `iep_analysis` | IEP document analysis | Premium |
| `speech_analysis` | Speech pattern analysis | Premium |
| `content_generation` | Educational content creation | Standard |
| `summarization` | Document summarization | Economy |
| `general` | General purpose | Standard |

## Fallback Chain Configuration

Example fallback chain for homework help:

```json
{
  "name": "Homework Help Chain",
  "useCase": "homework_help",
  "providers": [
    { "providerId": "openai_prod", "priority": 1 },
    { "providerId": "anthropic_prod", "priority": 2 },
    { "providerId": "groq_backup", "priority": 3 }
  ],
  "maxRetries": 3,
  "timeoutMs": 30000
}
```

## Rate Limiting

The system implements per-provider rate limiting:

- **RPM (Requests Per Minute)**: Maximum requests per minute
- **TPM (Tokens Per Minute)**: Maximum tokens per minute

When rate limits are approached, the system automatically:
1. Throttles requests to that provider
2. Routes to next provider in fallback chain
3. Logs rate limit events for monitoring

## Cost Tracking

All API calls are logged with:
- Input/output token counts
- Calculated cost based on model pricing
- Use case and metadata
- Latency metrics

Cost analytics are available via:
- Admin dashboard charts
- API endpoint for programmatic access
- Scheduled reports (configurable)

## Health Monitoring

Providers are continuously monitored for:
- Response latency
- Error rates
- Availability

Health statuses:
- `HEALTHY`: Normal operation
- `DEGRADED`: Elevated errors or latency
- `UNHEALTHY`: Not responding or high error rate
- `UNKNOWN`: Not recently checked

## Code Examples

### Using MultiProviderAIService

```typescript
import { MultiProviderAIService } from "@aivo/model-dispatch-service";

const service = new MultiProviderAIService();

// Chat completion with automatic provider selection
const response = await service.chat({
  messages: [
    { role: "user", content: "Explain quantum computing" }
  ],
  useCase: "tutoring",
  maxTokens: 1000
});

// Get usage analytics
const analytics = await service.getUsageAnalytics({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  endDate: new Date()
});

// Check provider health
const health = await service.checkHealth();
```

### Direct Provider Access (Legacy)

```typescript
import { callWithFailover } from "@aivo/model-dispatch-service";

const result = await callWithFailover(
  {
    primary: "openai",
    fallbacks: ["anthropic", "google"]
  },
  {
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: "Hello" }]
  }
);
```

## Admin Dashboard

The admin dashboard is available at `/ai-providers` and includes:

1. **Provider Management**
   - Add/edit/disable providers
   - Configure API keys and endpoints
   - Set rate limits and priorities

2. **Model Configuration**
   - Register models per provider
   - Set capabilities and use cases
   - Configure pricing

3. **Fallback Chains**
   - Create use-case specific chains
   - Set provider priorities
   - Configure retry behavior

4. **Analytics**
   - Request volume charts
   - Cost breakdown by provider/use case
   - Latency trends

5. **Health Monitoring**
   - Real-time provider status
   - Error rate tracking
   - Incident history

## Environment Variables

```env
# Provider API Keys (encrypted at rest)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...
COHERE_API_KEY=...
MISTRAL_API_KEY=...
HUGGINGFACE_API_KEY=hf_...

# Service Configuration
MODEL_DISPATCH_PORT=4001
AI_SERVICE_DEFAULT_TIMEOUT=30000
AI_SERVICE_MAX_RETRIES=3

# Cost Alerts
AI_DAILY_BUDGET_ALERT=100
AI_MONTHLY_BUDGET_LIMIT=3000
```

## Security Considerations

1. **API Key Encryption**: All API keys are encrypted at rest
2. **Access Control**: Admin endpoints require appropriate permissions
3. **Audit Logging**: All configuration changes are logged
4. **Rate Limiting**: Prevents abuse and controls costs
5. **Input Validation**: All inputs are sanitized and validated

## Monitoring & Alerts

The system integrates with the AIVO observability stack:

- **Metrics**: Prometheus-compatible `/metrics` endpoint
- **Logs**: Structured JSON logging
- **Traces**: OpenTelemetry integration
- **Alerts**: Configurable thresholds for:
  - Error rate spikes
  - Latency degradation
  - Cost budget exceeded
  - Provider health issues
