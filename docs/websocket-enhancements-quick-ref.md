# WebSocket Enhancements - Quick Reference

## 🚀 Quick Start

### Installation
```bash
cd services/brain-orchestrator
pnpm install
```

### Environment Setup
```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
SSL_ENABLED=false
CORS_ORIGIN=http://localhost:3000
```

### Start Development
```bash
# Start Redis (optional for scaling)
redis-server

# Start backend
pnpm dev
```

---

## 📋 Feature Checklist

- ✅ **Redis Pub/Sub** - Horizontal scaling
- ✅ **Prometheus Metrics** - Monitoring
- ✅ **Rate Limiting** - 100 msg/min per connection
- ✅ **SSL/TLS** - Secure wss:// connections
- ✅ **Offline Queue** - Auto-retry on reconnect
- ✅ **Connection Quality** - Real-time indicators

---

## 🔗 Quick Usage

### Backend - WebSocket Server
```typescript
// Auto-configured in websocket-server.ts
// Redis adapter enabled if REDIS_HOST is set
// Metrics exported at /metrics/prometheus
// Rate limiting: 100 messages per minute per connection
```

### Frontend - React Hook
```tsx
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useConnectionQuality } from '@/lib/hooks/useConnectionQuality';

function MyComponent() {
  const ws = useWebSocket({
    url: 'ws://localhost:4003',
    token: 'jwt-token',
    enableOfflineQueue: true
  });
  
  const quality = useConnectionQuality({
    status: ws.status,
    send: ws.send
  });
  
  return (
    <div>
      <ConnectionQualityBadge status={ws.status} metrics={quality} />
      <p>Queue: {ws.queueSize} messages</p>
    </div>
  );
}
```

### UI Components
```tsx
import { 
  ConnectionQualityIndicator,
  ConnectionQualityBadge,
  ConnectionQualityCard 
} from '@/components/websocket';

// Full indicator with details
<ConnectionQualityCard status={status} metrics={metrics} />

// Compact badge for headers
<ConnectionQualityBadge status={status} metrics={metrics} />

// Custom styling
<ConnectionQualityIndicator 
  status={status} 
  metrics={metrics}
  showDetails={true}
  compact={false}
  className="custom-class"
/>
```

---

## 📊 Monitoring Endpoints

```bash
# Prometheus metrics (for Grafana)
GET http://localhost:4003/metrics/prometheus

# JSON metrics (legacy)
GET http://localhost:4003/metrics
```

---

## 🔧 Configuration

### Rate Limiting
```typescript
// websocket-server.ts
const RATE_LIMIT_WINDOW = 60000;        // 1 minute
const RATE_LIMIT_MAX_MESSAGES = 100;    // Max messages
```

### Connection Quality
```typescript
// useConnectionQuality.ts
const DEFAULT_CHECK_INTERVAL = 10000;   // 10 seconds
const LATENCY_SAMPLES = 10;             // Sample size
```

### Offline Queue
```typescript
// useOfflineQueue.ts
const DEFAULT_MAX_QUEUE_SIZE = 100;     // Max messages
const DEFAULT_MAX_RETRIES = 3;          // Max retries
```

### SSL/TLS
```bash
# .env
SSL_ENABLED=true
SSL_KEY_PATH=/path/to/key.pem
SSL_CERT_PATH=/path/to/cert.pem
```

---

## 🎯 Key Metrics

| Metric | Description |
|--------|-------------|
| `websocket_connections_total` | Active connections |
| `websocket_message_latency_ms` | Message latency |
| `websocket_messages_sent_total` | Sent messages |
| `websocket_errors_total` | Error count |
| `websocket_active_sessions` | Agent sessions |

---

## 🐛 Quick Troubleshooting

### Redis not connecting?
```bash
redis-cli ping  # Should return PONG
```

### SSL errors?
```bash
# Check certificate
openssl x509 -in cert.pem -text -noout
```

### Rate limit too strict?
```typescript
// Increase in websocket-server.ts
const RATE_LIMIT_MAX_MESSAGES = 200;
```

### Queue not working?
```javascript
// Clear localStorage
localStorage.removeItem('aivo_websocket_queue');
```

---

## 📖 Full Documentation

See [websocket-enhancements.md](./websocket-enhancements.md) for complete details.

---

## 🎓 Files Modified/Created

### Backend
- ✅ `services/brain-orchestrator/src/websocket-server.ts` - Redis, metrics, rate limiting
- ✅ `services/brain-orchestrator/src/ssl-config.ts` - SSL/TLS configuration
- ✅ `services/brain-orchestrator/src/server.ts` - Metrics endpoint
- ✅ `services/brain-orchestrator/package.json` - Dependencies

### Frontend
- ✅ `apps/web/lib/hooks/useOfflineQueue.ts` - Offline queue
- ✅ `apps/web/lib/hooks/useConnectionQuality.ts` - Quality monitoring
- ✅ `apps/web/lib/hooks/useWebSocket.ts` - Queue integration
- ✅ `apps/web/components/websocket/ConnectionQualityIndicator.tsx` - UI component
- ✅ `apps/web/components/websocket/index.ts` - Exports

### Documentation
- ✅ `docs/websocket-enhancements.md` - Full guide
- ✅ `docs/websocket-enhancements-quick-ref.md` - This file

---

**Status**: ✅ All features implemented and ready for testing
**Next**: Install dependencies → Configure → Test → Deploy
