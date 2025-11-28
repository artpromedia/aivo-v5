# @aivo/logger

Structured logging package for AIVO v5 educational platform.

## Features

- **Pino-based logging**: High-performance JSON logging
- **Log levels**: debug, info, warn, error
- **Context support**: Attach request IDs, user IDs, etc.
- **Sensitive data redaction**: Automatic redaction of passwords, tokens, etc.
- **Browser support**: Client-side logging with Sentry integration
- **Production transports**: Datadog, HTTP endpoints

## Installation

```bash
pnpm add @aivo/logger
```

## Usage

### Server-side (Node.js/Next.js API routes)

```typescript
import { createLogger } from '@aivo/logger';

const logger = createLogger('my-service');

logger.info('User logged in', { userId: 'user123' });
logger.error('Failed to process request', error, { requestId: 'req123' });
```

### Client-side (React components)

```typescript
import { createClientLogger } from '@aivo/logger';

const logger = createClientLogger('MyComponent');

logger.info('Component mounted');
logger.error('API call failed', error);
```

### With request context

```typescript
const logger = createLogger('api');

// Create child logger with request context
const reqLogger = logger.child({
  requestId: 'req-123',
  userId: 'user-456',
});

reqLogger.info('Processing request');
reqLogger.info('Request complete', { duration: 150 });
```

## Configuration

### Environment Variables

- `LOG_LEVEL`: Set log level (trace, debug, info, warn, error, fatal)
- `NODE_ENV`: Determines formatting (pretty in dev, JSON in prod)
- `SERVICE_NAME`: Service name in log output

### Sensitive Data Redaction

The following fields are automatically redacted:
- password, token, apiKey, secret
- authorization, cookie headers
- Nested versions (*.password, etc.)

## Log Format

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "pid": 12345,
  "service": "aivo",
  "module": "homework-api",
  "requestId": "req-123",
  "userId": "user-456",
  "msg": "Homework session created"
}
```
