# @aivo/metrics

Prometheus metrics collection for the AIVO educational platform.

## Installation

```bash
pnpm add @aivo/metrics
```

## Usage

### Basic Usage

```typescript
import {
  recordHttpRequest,
  recordAiRequest,
  recordDbQuery,
  homeworkSessionsCreated,
  emotionCheckins,
  getMetrics,
} from '@aivo/metrics';

// Record HTTP requests
recordHttpRequest('GET', '/api/homework', 200, 0.125);

// Record AI requests
recordAiRequest(
  'openai',
  'gpt-4',
  'homework-help',
  'success',
  2.5,
  150,  // prompt tokens
  200   // completion tokens
);

// Record database queries
recordDbQuery('findMany', 'Homework', 'success', 0.045);

// Increment counters
homeworkSessionsCreated.inc({ subject: 'math', grade_level: '5' });
emotionCheckins.inc({ emotion: 'happy', intensity_bucket: 'high' });

// Get metrics for Prometheus
const metricsText = await getMetrics();
```

### Session Tracking

```typescript
import { startSessionTimer, learningSessionDuration } from '@aivo/metrics';

// Start tracking a session
const endSession = startSessionTimer('homework', 'math');

// ... session activity ...

// End the session and record duration
const { durationSeconds } = endSession();
learningSessionDuration.observe(
  { type: 'homework', subject: 'math', completion_status: 'completed' },
  durationSeconds
);
```

### Available Metrics

#### HTTP Metrics
- `aivo_http_request_duration_seconds` - Request duration histogram
- `aivo_http_requests_total` - Total request counter
- `aivo_http_request_size_bytes` - Request size summary
- `aivo_http_response_size_bytes` - Response size summary

#### AI/LLM Metrics
- `aivo_ai_request_duration_seconds` - AI request duration
- `aivo_ai_requests_total` - Total AI requests
- `aivo_ai_tokens_total` - Token usage
- `aivo_ai_cost_usd` - Estimated costs

#### Learning Metrics
- `aivo_active_learning_sessions` - Active sessions gauge
- `aivo_learning_sessions_total` - Total sessions
- `aivo_learning_session_duration_seconds` - Session duration
- `aivo_homework_sessions_created_total` - Homework sessions
- `aivo_homework_questions_answered_total` - Questions answered
- `aivo_assessment_completions_total` - Completed assessments
- `aivo_assessment_scores` - Score distribution

#### Emotion & Regulation
- `aivo_emotion_checkins_total` - Emotion check-ins
- `aivo_regulation_strategies_total` - Strategies used
- `aivo_calm_corner_visits_total` - Calm corner visits
- `aivo_focus_breaks_total` - Focus breaks taken

#### Database Metrics
- `aivo_db_query_duration_seconds` - Query duration
- `aivo_db_queries_total` - Total queries
- `aivo_db_connection_pool_size` - Connection pool state

#### WebSocket Metrics
- `aivo_websocket_connections_active` - Active connections
- `aivo_websocket_messages_total` - Message counter

#### Error Metrics
- `aivo_application_errors_total` - Application errors
- `aivo_unhandled_exceptions_total` - Unhandled exceptions

#### Authentication Metrics
- `aivo_auth_attempts_total` - Auth attempts
- `aivo_active_users` - Active user gauge

#### Cache Metrics
- `aivo_cache_hits_total` - Cache hits
- `aivo_cache_misses_total` - Cache misses

### Exposing Metrics Endpoint

```typescript
// In your API route (Next.js App Router)
import { NextResponse } from 'next/server';
import { getMetrics, getMetricsContentType } from '@aivo/metrics';

export async function GET() {
  const metrics = await getMetrics();
  return new NextResponse(metrics, {
    headers: { 'Content-Type': getMetricsContentType() },
  });
}
```

### Prometheus Configuration

```yaml
scrape_configs:
  - job_name: 'aivo-web'
    static_configs:
      - targets: ['aivo-web:3000']
    metrics_path: /api/metrics
    bearer_token: your-metrics-token
```

## Environment Variables

- `APP_VERSION` - Application version for default labels

## License

MIT
