# WebSocket Enhancements - Implementation Guide

**Author**: artpromedia  
**Date**: November 23, 2025  
**Version**: 5.1.0

## 🎯 Overview

This document describes the advanced WebSocket enhancements implemented for AIVO v5.1, including horizontal scaling, monitoring, rate limiting, SSL/TLS support, offline queuing, and connection quality indicators.

---

## ✅ Implemented Features

### 1. Redis Pub/Sub for Horizontal Scaling

**Purpose**: Enable multiple server instances to communicate and scale horizontally.

**Implementation**:
- Added `@socket.io/redis-adapter` for Socket.IO
- Added `ioredis` client for Redis connectivity
- Automatic fallback to single-instance mode if Redis is unavailable

**Files Modified**:
- `services/brain-orchestrator/package.json` - Added dependencies
- `services/brain-orchestrator/src/websocket-server.ts` - Integrated Redis adapter

**Configuration** (`.env`):
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Usage**:
```typescript
// Automatically configured in websocket-server.ts
// If REDIS_HOST is set, Redis adapter is used
// Otherwise, runs in single-instance mode
```

**Benefits**:
- Multiple server instances can share WebSocket connections
- Load balancing across instances
- Seamless horizontal scaling
- Automatic failover

---

### 2. Prometheus Metrics Export

**Purpose**: Export metrics for Grafana and monitoring dashboards.

**Metrics Collected**:
- `websocket_connections_total` - Active connections (Gauge)
- `websocket_connections_count` - Total connections established (Counter)
- `websocket_disconnections_total` - Total disconnections by reason (Counter)
- `websocket_messages_sent_total` - Messages sent by event type (Counter)
- `websocket_messages_received_total` - Messages received by event type (Counter)
- `websocket_message_latency_ms` - Message processing latency (Histogram)
- `websocket_errors_total` - Errors by type (Counter)
- `websocket_active_sessions` - Active agent sessions (Gauge)

**Files Added**:
- Metrics integrated into `services/brain-orchestrator/src/websocket-server.ts`

**Files Modified**:
- `services/brain-orchestrator/src/server.ts` - Added `/metrics/prometheus` endpoint
- `services/brain-orchestrator/package.json` - Added `prom-client`

**Endpoints**:
```bash
# Prometheus metrics (text format)
GET http://localhost:4003/metrics/prometheus

# JSON metrics (legacy)
GET http://localhost:4003/metrics
```

**Grafana Dashboard Integration**:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'aivo-websocket'
    static_configs:
      - targets: ['localhost:4003']
    metrics_path: '/metrics/prometheus'
    scrape_interval: 15s
```

---

### 3. Rate Limiting per Connection

**Purpose**: Prevent abuse and ensure fair resource usage.

**Configuration**:
- **Window**: 60 seconds (1 minute)
- **Max Messages**: 100 messages per window
- **Storage**: In-memory map (cleared on disconnect)

**Implementation**:
- Rate limiting logic in `websocket-server.ts`
- Automatic cleanup on disconnect
- Per-socket tracking

**Response on Rate Limit**:
```json
{
  "error": "Rate limit exceeded. Please slow down.",
  "rateLimited": true
}
```

**Customization**:
```typescript
// In websocket-server.ts
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_MESSAGES = 100; // Max messages
```

---

### 4. SSL/TLS Support (wss://)

**Purpose**: Secure WebSocket connections in production.

**Files Added**:
- `services/brain-orchestrator/src/ssl-config.ts` - SSL configuration utilities

**Configuration** (`.env`):
```bash
# Enable SSL/TLS
SSL_ENABLED=true

# Certificate paths
SSL_KEY_PATH=/path/to/private-key.pem
SSL_CERT_PATH=/path/to/certificate.pem
SSL_CA_PATH=/path/to/ca-bundle.pem  # Optional
SSL_PASSPHRASE=your-passphrase      # Optional
```

**Development Mode**:
```bash
SSL_ENABLED=false
# Uses ws:// protocol
```

**Production Mode**:
```bash
SSL_ENABLED=true
# Uses wss:// protocol
```

**Certificate Generation** (Let's Encrypt):
```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Certificate files
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
```

**Certificate Generation** (Self-signed for testing):
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Use in .env
SSL_KEY_PATH=./key.pem
SSL_CERT_PATH=./cert.pem
```

---

### 5. Offline Message Queue

**Purpose**: Store messages when offline and send when reconnected.

**Files Added**:
- `apps/web/lib/hooks/useOfflineQueue.ts` - Queue management hook

**Files Modified**:
- `apps/web/lib/hooks/useWebSocket.ts` - Integrated offline queue

**Features**:
- Automatic queuing when disconnected
- Persistent storage in localStorage
- Automatic retry with backoff
- Maximum queue size limit
- Message expiration

**Configuration**:
```typescript
const ws = useWebSocket({
  url: 'ws://localhost:4003',
  token: 'your-token',
  enableOfflineQueue: true,  // Enable queue (default: true)
});

// Access queue info
console.log('Queue size:', ws.queueSize);

// Clear queue manually
ws.clearQueue();
```

**Queue Options**:
```typescript
// In useOfflineQueue.ts
{
  maxQueueSize: 100,           // Max messages in queue
  maxRetries: 3,               // Max retry attempts
  persistToStorage: true,      // Save to localStorage
  storageKey: 'aivo_websocket_queue'
}
```

**Behavior**:
1. When offline, messages are queued
2. When connected, queue is automatically processed
3. Failed messages are retried up to `maxRetries`
4. Queue persists across page reloads (if enabled)

---

### 6. Connection Quality Indicator

**Purpose**: Real-time connection quality monitoring and visualization.

**Files Added**:
- `apps/web/lib/hooks/useConnectionQuality.ts` - Quality monitoring hook
- `apps/web/components/websocket/ConnectionQualityIndicator.tsx` - UI component
- `apps/web/components/websocket/index.ts` - Exports

**Metrics**:
- **Latency**: Current and average round-trip time
- **Packet Loss**: Percentage of lost packets
- **Stability**: Connection variance indicator
- **Quality**: Excellent / Good / Fair / Poor / Offline

**Quality Thresholds**:
```typescript
Excellent: < 100ms
Good:      < 250ms
Fair:      < 500ms
Poor:      >= 500ms
Offline:   Disconnected
```

**Usage - Full Indicator**:
```tsx
import { ConnectionQualityCard } from '@/components/websocket';

function MyComponent() {
  const ws = useWebSocket({ ... });
  const quality = useConnectionQuality({
    status: ws.status,
    send: ws.send
  });

  return (
    <ConnectionQualityCard 
      status={ws.status} 
      metrics={quality} 
    />
  );
}
```

**Usage - Compact Badge**:
```tsx
import { ConnectionQualityBadge } from '@/components/websocket';

function Header() {
  return (
    <header>
      <ConnectionQualityBadge 
        status={ws.status} 
        metrics={quality} 
      />
    </header>
  );
}
```

**Monitoring Configuration**:
```typescript
const quality = useConnectionQuality({
  status: ws.status,
  send: ws.send,
  checkInterval: 10000  // Check every 10 seconds
});

// Manual control
quality.startMonitoring();
quality.stopMonitoring();
```

---

## 🚀 Installation

### 1. Install Dependencies

**Backend (Node.js/TypeScript)**:
```bash
cd services/brain-orchestrator
pnpm install
```

This installs:
- `@socket.io/redis-adapter@^8.3.0`
- `ioredis@^5.4.1`
- `prom-client@^15.1.3`

**Frontend (Next.js)**:
```bash
cd apps/web
pnpm install
```

Dependencies already in package.json:
- `socket.io-client@^4.8.1`

### 2. Configure Environment

Create/update `.env` files:

**Backend** (`services/brain-orchestrator/.env`):
```bash
# Redis Configuration (for horizontal scaling)
REDIS_HOST=localhost
REDIS_PORT=6379

# SSL/TLS Configuration (for production)
SSL_ENABLED=false
SSL_KEY_PATH=/path/to/key.pem
SSL_CERT_PATH=/path/to/cert.pem

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Secret
NEXTAUTH_SECRET=your-secret-key
```

**Frontend** (`apps/web/.env`):
```bash
# WebSocket URL
NEXT_PUBLIC_WS_URL=ws://localhost:4003
# Or for production with SSL:
# NEXT_PUBLIC_WS_URL=wss://your-domain.com
```

### 3. Start Services

**Development**:
```bash
# Start Redis (if using horizontal scaling)
redis-server

# Start backend
cd services/brain-orchestrator
pnpm dev

# Start frontend
cd apps/web
pnpm dev
```

**Production**:
```bash
# Build
cd services/brain-orchestrator
pnpm build

# Start with PM2
pm2 start ecosystem.config.js
```

---

## 📊 Monitoring Setup

### Prometheus Configuration

Create `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'aivo-websocket'
    static_configs:
      - targets: ['localhost:4003']
    metrics_path: '/metrics/prometheus'
```

Start Prometheus:
```bash
prometheus --config.file=prometheus.yml
```

### Grafana Dashboard

1. Add Prometheus data source
2. Import dashboard JSON or create custom panels
3. Key metrics to visualize:
   - Active connections over time
   - Message throughput (messages/sec)
   - Latency percentiles (p50, p95, p99)
   - Error rate
   - Disconnection reasons

Example Grafana Queries:
```promql
# Active connections
websocket_connections_total

# Message rate
rate(websocket_messages_sent_total[5m])

# P95 latency
histogram_quantile(0.95, 
  rate(websocket_message_latency_ms_bucket[5m])
)

# Error rate
rate(websocket_errors_total[5m])
```

---

## 🔧 Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | - | Redis server hostname |
| `REDIS_PORT` | `6379` | Redis server port |
| `SSL_ENABLED` | `false` | Enable SSL/TLS |
| `SSL_KEY_PATH` | - | Path to private key |
| `SSL_CERT_PATH` | - | Path to certificate |
| `SSL_CA_PATH` | - | Path to CA bundle (optional) |
| `SSL_PASSPHRASE` | - | Key passphrase (optional) |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |

### Rate Limiting

```typescript
const RATE_LIMIT_WINDOW = 60000;        // 1 minute
const RATE_LIMIT_MAX_MESSAGES = 100;    // Max messages per window
```

### Connection Quality

```typescript
const DEFAULT_CHECK_INTERVAL = 10000;   // Check every 10 seconds
const LATENCY_SAMPLES = 10;             // Sample size for averaging
```

### Offline Queue

```typescript
const DEFAULT_MAX_QUEUE_SIZE = 100;     // Max queued messages
const DEFAULT_MAX_RETRIES = 3;          // Max retry attempts
const DEFAULT_STORAGE_KEY = 'aivo_websocket_queue';
```

---

## 🧪 Testing

### Test WebSocket Connection

```javascript
// Browser console
const socket = io('http://localhost:4003', {
  auth: { 
    token: 'your-jwt-token',
    learnerId: 'test_123'
  }
});

// Test rate limiting
for (let i = 0; i < 150; i++) {
  socket.emit('agent:learning', {
    action: 'start_session'
  }, (response) => {
    console.log(i, response);
  });
}
```

### Load Testing

```bash
# Using artillery
npm install -g artillery

# Create test file: load-test.yml
artillery run load-test.yml
```

### Metrics Verification

```bash
# Check Prometheus metrics
curl http://localhost:4003/metrics/prometheus

# Should see:
# websocket_connections_total
# websocket_messages_sent_total
# etc.
```

---

## 🐛 Troubleshooting

### Redis Connection Issues

**Problem**: Redis adapter fails to connect

**Solution**:
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Check Redis logs
tail -f /var/log/redis/redis-server.log

# Verify .env configuration
echo $REDIS_HOST
```

### SSL Certificate Issues

**Problem**: SSL certificate not found or invalid

**Solutions**:
```bash
# Verify file paths
ls -la /path/to/cert.pem

# Check certificate validity
openssl x509 -in cert.pem -text -noout

# Test with self-signed cert
SSL_ENABLED=true \
SSL_KEY_PATH=./key.pem \
SSL_CERT_PATH=./cert.pem \
npm start
```

### Rate Limit Issues

**Problem**: Rate limit too restrictive

**Solution**: Adjust limits in `websocket-server.ts`:
```typescript
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX_MESSAGES = 200;  // Increase
```

### Offline Queue Issues

**Problem**: Queue not persisting

**Solution**:
```javascript
// Check localStorage
console.log(localStorage.getItem('aivo_websocket_queue'));

// Clear corrupted queue
localStorage.removeItem('aivo_websocket_queue');
```

---

## 📈 Performance Considerations

### Scaling Guidelines

**Single Instance**:
- Up to 1,000 concurrent connections
- No Redis required
- Simple deployment

**Multiple Instances with Redis**:
- 10,000+ concurrent connections
- Redis Pub/Sub required
- Load balancer needed
- Sticky sessions recommended

### Resource Requirements

**Per 1,000 Connections**:
- CPU: ~1 core
- Memory: ~500MB
- Redis: ~100MB
- Bandwidth: ~10 Mbps (varies by message rate)

### Optimization Tips

1. **Enable Redis clustering** for high availability
2. **Use sticky sessions** for load balancing
3. **Monitor latency** and adjust check intervals
4. **Tune rate limits** based on usage patterns
5. **Regular metrics review** to identify bottlenecks

---

## 🔐 Security Best Practices

1. **Always use SSL/TLS in production** (`wss://`)
2. **Validate JWT tokens** on every connection
3. **Implement rate limiting** to prevent abuse
4. **Monitor for anomalies** using Prometheus alerts
5. **Rotate certificates** regularly
6. **Use Redis authentication** if exposed
7. **Limit CORS origins** to known domains
8. **Log security events** for audit

---

## 📝 Summary

All six enhancements have been successfully implemented:

✅ **Redis Pub/Sub** - Horizontal scaling support  
✅ **Prometheus Metrics** - Comprehensive monitoring  
✅ **Rate Limiting** - Per-connection abuse prevention  
✅ **SSL/TLS** - Secure wss:// connections  
✅ **Offline Queue** - Resilient message delivery  
✅ **Connection Quality** - Real-time quality indicators  

These enhancements provide enterprise-grade WebSocket capabilities with scalability, security, observability, and reliability.

---

## 🔗 Related Documentation

- [WebSocket Integration Guide](./websocket-integration-guide.md)
- [Agent Integration Implementation](./agent-integration-implementation-summary.md)
- [Agent Orchestration Guide](./agent-orchestration-guide.md)

---

**Next Steps**:
1. Install dependencies: `pnpm install`
2. Configure environment variables
3. Start Redis (if using)
4. Test each feature
5. Set up monitoring dashboards
6. Deploy to production

For questions or issues, refer to the troubleshooting section or contact the development team.
