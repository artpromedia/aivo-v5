# WebSocket Enhancements - Installation Instructions

## ✅ All Features Implemented

Six optional WebSocket enhancements have been successfully implemented:

1. ✅ **Redis Pub/Sub** for horizontal scaling
2. ✅ **Prometheus Metrics** export for Grafana
3. ✅ **Rate Limiting** per connection (100 msg/min)
4. ✅ **SSL/TLS** support for production (wss://)
5. ✅ **Offline Queue** for resilient message delivery
6. ✅ **Connection Quality** indicator in UI

---

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
# Backend dependencies
cd services/brain-orchestrator
pnpm install

# This installs:
# - @socket.io/redis-adapter@^8.3.0
# - ioredis@^5.4.1
# - prom-client@^15.1.3
```

### Step 2: Optional - Install Redis

**Only needed for horizontal scaling (multiple server instances)**

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Windows (via WSL or Docker)
docker run -d -p 6379:6379 redis:alpine

# Verify Redis is running
redis-cli ping  # Should return: PONG
```

### Step 3: Configure Environment

Create or update `.env` file in `services/brain-orchestrator/`:

```bash
# Basic Configuration
CORS_ORIGIN=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Redis (Optional - for horizontal scaling)
REDIS_HOST=localhost
REDIS_PORT=6379

# SSL/TLS (For Production)
SSL_ENABLED=false
# SSL_KEY_PATH=/path/to/private-key.pem
# SSL_CERT_PATH=/path/to/certificate.pem
```

### Step 4: Start Development Server

```bash
# From services/brain-orchestrator
pnpm dev

# You should see:
# ✅ WebSocket server initialized
# ✅ Redis adapter connected (if Redis is configured)
# OR
# ℹ️  Running without Redis adapter (single instance mode)
```

### Step 5: Verify Installation

Open browser console and test:

```javascript
// Connect to WebSocket
const socket = io('http://localhost:4003', {
  auth: { 
    token: 'your-jwt-token',
    learnerId: 'test_123'
  }
});

// Test connection
socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

// Check metrics
fetch('http://localhost:4003/metrics/prometheus')
  .then(r => r.text())
  .then(console.log);
```

---

## 📋 What's New

### Backend Enhancements

**File: `services/brain-orchestrator/src/websocket-server.ts`**
- ✅ Redis Pub/Sub adapter for multi-instance scaling
- ✅ Prometheus metrics collection (8 metric types)
- ✅ Per-connection rate limiting (100 msg/min)
- ✅ Connection quality monitoring

**File: `services/brain-orchestrator/src/ssl-config.ts`** (NEW)
- ✅ SSL/TLS configuration utilities
- ✅ Certificate validation
- ✅ Automatic fallback to HTTP

**File: `services/brain-orchestrator/src/server.ts`**
- ✅ `/metrics/prometheus` endpoint added
- ✅ Metrics registry export

**File: `services/brain-orchestrator/package.json`**
- ✅ New dependencies added

### Frontend Enhancements

**File: `apps/web/lib/hooks/useOfflineQueue.ts`** (NEW)
- ✅ Automatic message queuing when offline
- ✅ Persistent storage in localStorage
- ✅ Auto-retry with backoff
- ✅ Queue size management

**File: `apps/web/lib/hooks/useConnectionQuality.ts`** (NEW)
- ✅ Real-time latency monitoring
- ✅ Packet loss detection
- ✅ Connection stability analysis
- ✅ Quality classification (excellent/good/fair/poor)

**File: `apps/web/lib/hooks/useWebSocket.ts`**
- ✅ Integrated offline queue
- ✅ Queue management methods

**File: `apps/web/components/websocket/ConnectionQualityIndicator.tsx`** (NEW)
- ✅ Visual connection quality indicator
- ✅ Three variants: Full, Badge, Card
- ✅ Real-time metrics display

### Documentation

- ✅ `docs/websocket-enhancements.md` - Complete implementation guide
- ✅ `docs/websocket-enhancements-quick-ref.md` - Quick reference
- ✅ `docs/WEBSOCKET_ENHANCEMENTS_INSTALL.md` - This file

---

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_HOST` | No | - | Redis hostname for scaling |
| `REDIS_PORT` | No | `6379` | Redis port |
| `SSL_ENABLED` | No | `false` | Enable SSL/TLS (wss://) |
| `SSL_KEY_PATH` | If SSL enabled | - | Path to SSL private key |
| `SSL_CERT_PATH` | If SSL enabled | - | Path to SSL certificate |
| `CORS_ORIGIN` | Yes | `http://localhost:3000` | Allowed origin |

### Rate Limiting (Configurable in Code)

```typescript
// services/brain-orchestrator/src/websocket-server.ts
const RATE_LIMIT_WINDOW = 60000;        // 1 minute
const RATE_LIMIT_MAX_MESSAGES = 100;    // Max messages per window
```

### Connection Quality (Configurable in Code)

```typescript
// apps/web/lib/hooks/useConnectionQuality.ts
const DEFAULT_CHECK_INTERVAL = 10000;   // Check every 10 seconds
const LATENCY_SAMPLES = 10;             // Sample size for averaging
```

### Offline Queue (Configurable in Code)

```typescript
// apps/web/lib/hooks/useOfflineQueue.ts
const DEFAULT_MAX_QUEUE_SIZE = 100;     // Max queued messages
const DEFAULT_MAX_RETRIES = 3;          // Max retry attempts
```

---

## 📊 Monitoring Setup

### Prometheus

Create `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'aivo-websocket'
    static_configs:
      - targets: ['localhost:4003']
    metrics_path: '/metrics/prometheus'
    scrape_interval: 15s
```

Start Prometheus:

```bash
prometheus --config.file=prometheus.yml
```

Access at: http://localhost:9090

### Grafana

1. Add Prometheus data source (http://localhost:9090)
2. Create dashboard with panels for:
   - Active connections
   - Message throughput
   - Latency percentiles
   - Error rate
   - Session count

Example queries:

```promql
# Active connections
websocket_connections_total

# Message rate (per second)
rate(websocket_messages_sent_total[5m])

# P95 latency
histogram_quantile(0.95, rate(websocket_message_latency_ms_bucket[5m]))
```

---

## 🧪 Testing

### Test Rate Limiting

```javascript
// Browser console - send 150 messages rapidly
for (let i = 0; i < 150; i++) {
  socket.emit('agent:learning', {
    action: 'start_session'
  }, (response) => {
    if (response.rateLimited) {
      console.log(`❌ Rate limited at message ${i}`);
    }
  });
}
```

### Test Offline Queue

```javascript
// Browser console
// 1. Send message
ws.send({ type: 'test', data: 'hello' });

// 2. Disconnect
ws.disconnect();

// 3. Try to send (should queue)
ws.send({ type: 'test', data: 'queued message' });

// 4. Reconnect
ws.connect();

// Queue should auto-process
console.log('Queue size:', ws.queueSize);
```

### Test Connection Quality

```tsx
// In your React component
const quality = useConnectionQuality({
  status: ws.status,
  send: ws.send
});

console.log('Quality:', quality.quality);
console.log('Latency:', quality.latency, 'ms');
console.log('Packet Loss:', quality.packetLoss, '%');
```

---

## 🐛 Troubleshooting

### Issue: Redis connection failed

**Symptoms**: `❌ Redis adapter connection failed`

**Solutions**:
1. Check Redis is running: `redis-cli ping`
2. Verify REDIS_HOST and REDIS_PORT in `.env`
3. Check Redis logs: `tail -f /var/log/redis/redis-server.log`
4. Alternative: Remove Redis env vars to run in single-instance mode

### Issue: SSL certificate errors

**Symptoms**: SSL certificate not found or invalid

**Solutions**:
1. Verify file paths exist: `ls -la /path/to/cert.pem`
2. Check certificate validity: `openssl x509 -in cert.pem -text`
3. For development: Set `SSL_ENABLED=false`
4. Generate self-signed cert for testing:
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

### Issue: Rate limit too restrictive

**Symptoms**: Legitimate requests being blocked

**Solution**: Increase limits in `websocket-server.ts`:
```typescript
const RATE_LIMIT_MAX_MESSAGES = 200;  // Increase from 100
```

### Issue: Offline queue not persisting

**Symptoms**: Queue lost on page reload

**Solutions**:
1. Check localStorage: `localStorage.getItem('aivo_websocket_queue')`
2. Clear corrupted data: `localStorage.removeItem('aivo_websocket_queue')`
3. Verify browser supports localStorage
4. Check browser console for errors

---

## 📈 Performance Guidelines

### Single Instance (No Redis)
- **Capacity**: Up to 1,000 concurrent connections
- **Resources**: 1 CPU core, 500MB RAM
- **Setup**: No additional configuration needed

### Multi-Instance (With Redis)
- **Capacity**: 10,000+ concurrent connections
- **Resources**: 1 CPU core + 500MB RAM per instance, plus Redis
- **Setup**: Configure REDIS_HOST, use load balancer

### Optimization Tips

1. **Enable Redis** if you need >1,000 connections
2. **Use sticky sessions** with load balancer
3. **Monitor metrics** regularly via Grafana
4. **Tune rate limits** based on usage patterns
5. **Enable SSL/TLS** in production

---

## 🔒 Security Checklist

- [ ] SSL/TLS enabled in production (`SSL_ENABLED=true`)
- [ ] JWT token validation on connection
- [ ] Rate limiting configured appropriately
- [ ] CORS origins restricted to known domains
- [ ] Redis password set (if Redis exposed)
- [ ] Certificates renewed regularly
- [ ] Monitoring alerts configured
- [ ] Security events logged

---

## ✅ Verification Checklist

After installation, verify:

- [ ] Dependencies installed: `pnpm list`
- [ ] Redis running (if used): `redis-cli ping`
- [ ] Server starts: `pnpm dev`
- [ ] WebSocket connects: Browser console test
- [ ] Metrics available: `curl http://localhost:4003/metrics/prometheus`
- [ ] Rate limiting works: Send >100 messages
- [ ] Offline queue works: Disconnect and send
- [ ] Connection quality displays: UI component renders

---

## 🎯 Next Steps

1. ✅ Install dependencies → `pnpm install`
2. ✅ Configure environment → Update `.env`
3. ✅ Start services → `pnpm dev`
4. ✅ Test features → Browser console
5. ⏭️ Set up monitoring → Prometheus + Grafana
6. ⏭️ Deploy to production → SSL/TLS enabled

---

## 📚 Documentation

- **Full Guide**: [websocket-enhancements.md](./websocket-enhancements.md)
- **Quick Reference**: [websocket-enhancements-quick-ref.md](./websocket-enhancements-quick-ref.md)
- **WebSocket Integration**: [websocket-integration-guide.md](./websocket-integration-guide.md)

---

## 🆘 Support

For issues or questions:
1. Check troubleshooting section above
2. Review full documentation
3. Check server logs for errors
4. Verify configuration in `.env`
5. Contact development team

---

**Status**: ✅ Ready for installation and testing  
**Version**: 5.1.0  
**Date**: November 23, 2025  
**Author**: artpromedia
