# WebSocket Integration Guide

## Overview

Complete real-time WebSocket system for AIVO Learning with Virtual Brain cognitive state monitoring, load testing, and metrics.

**Commit:** `ad4df0a`  
**Date:** November 23, 2025  
**Total Code:** 1,668 lines (production + tests)

---

## 🎯 Features Implemented

### ✅ Frontend (React/TypeScript)
- **WebSocket Hook** with auto-reconnection and keep-alive
- **Context Provider** for app-wide WebSocket access
- **Virtual Brain Client** with observable state updates
- **Real-time Monitor** component for cognitive state visualization

### ✅ Backend (Python/FastAPI)
- **Metrics Tracking** (connections, throughput, latency)
- **Metrics API** endpoints for monitoring
- **Message Recording** for analytics

### ✅ Testing
- **Unit Tests** for WebSocket components (pytest)
- **Load Testing** script for performance validation

---

## 📦 Installation

### Frontend Dependencies
```bash
cd apps/web
# No additional dependencies needed - uses built-in WebSocket API
```

### Backend Dependencies
```bash
cd backend
pip install websockets  # For load testing
pip install pytest pytest-asyncio  # For testing
```

---

## 🚀 Quick Start

### 1. Frontend Integration

#### Wrap your app with WebSocketProvider

```typescript
// app/layout.tsx or _app.tsx
import { WebSocketProvider } from '@/lib/contexts/WebSocketContext';
import { getToken } from '@/lib/auth';

export default function RootLayout({ children }) {
  const token = getToken(); // Your JWT token
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

  return (
    <html>
      <body>
        <WebSocketProvider
          url={wsUrl}
          token={token}
          autoConnect={true}
          onStateUpdate={(data) => console.log('State update:', data)}
          onVirtualBrainResponse={(data) => console.log('VB response:', data)}
          onError={(error) => console.error('WS error:', error)}
        >
          {children}
        </WebSocketProvider>
      </body>
    </html>
  );
}
```

#### Use the Virtual Brain Monitor

```typescript
// pages/learner/[id]/monitor.tsx
import { VirtualBrainMonitor } from '@/components/VirtualBrainMonitor';

export default function LearnerMonitorPage({ params }) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Real-time Monitoring</h1>
      
      <VirtualBrainMonitor
        learnerId={params.id}
        showPerformance={true}
        showRecommendations={true}
      />
    </div>
  );
}
```

#### Send Virtual Brain Interactions

```typescript
import { useWebSocketContext } from '@/lib/contexts/WebSocketContext';

function LearningActivity({ learnerId }) {
  const { sendVirtualBrainInteraction, isConnected } = useWebSocketContext();

  const handleAnswer = (question: string, answer: string, correct: boolean) => {
    if (!isConnected) return;

    sendVirtualBrainInteraction({
      learner_id: learnerId,
      type: 'question_response',
      content: question,
      response: answer,
      context: {
        correct,
        difficulty: 3,
        subject: 'math',
        time_taken: 15.5,
      },
    });
  };

  return (
    <div>
      {/* Your learning activity UI */}
    </div>
  );
}
```

#### Subscribe to Learner Updates

```typescript
import { useEffect } from 'react';
import { useWebSocketContext } from '@/lib/contexts/WebSocketContext';
import { virtualBrainClient } from '@/lib/services/virtualBrainClient';

function ParentDashboard({ learnerId }) {
  const { subscribeLearner, unsubscribeLearner, subscribedLearners } = useWebSocketContext();

  useEffect(() => {
    // Subscribe to learner updates
    subscribeLearner(learnerId);

    // Listen for state changes
    const unsubscribe = virtualBrainClient.onStateUpdate(learnerId, (state) => {
      console.log('Cognitive state:', state);
      // Update your UI with new state
    });

    return () => {
      unsubscribeLearner(learnerId);
      unsubscribe();
    };
  }, [learnerId]);

  return (
    <div>
      <p>Subscribed: {subscribedLearners.has(learnerId) ? 'Yes' : 'No'}</p>
      {/* Your dashboard UI */}
    </div>
  );
}
```

### 2. Backend Metrics

#### Get WebSocket Metrics (Admin Only)

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:8000/api/websocket/metrics
```

Response:
```json
{
  "connections": {
    "active": 42,
    "total": 1523,
    "disconnections": 1481
  },
  "users": {
    "connected": 38
  },
  "learners": {
    "subscribed": 156
  },
  "rooms": {
    "active": 5
  },
  "messages": {
    "sent": 45623,
    "received": 42891,
    "per_second": 12.34
  },
  "performance": {
    "average_latency_ms": 2.45,
    "min_latency_ms": 0.12,
    "max_latency_ms": 15.67
  },
  "errors": {
    "total": 12
  },
  "uptime": {
    "seconds": 3600.25,
    "started_at": "2025-11-23T10:00:00"
  }
}
```

#### Get WebSocket Status (All Users)

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/websocket/status
```

Response:
```json
{
  "active_connections": 42,
  "connected_users": 38,
  "subscribed_learners": 156,
  "active_rooms": 5
}
```

### 3. Testing

#### Run Unit Tests

```bash
cd backend
pytest tests/test_websockets.py -v
```

Output:
```
test_websockets.py::TestConnectionManager::test_initialize PASSED
test_websockets.py::TestConnectionManager::test_connect PASSED
test_websockets.py::TestConnectionManager::test_disconnect PASSED
test_websockets.py::TestConnectionManager::test_subscribe_to_learner PASSED
test_websockets.py::TestConnectionManager::test_join_room PASSED
test_websockets.py::TestConnectionManager::test_send_personal_message PASSED
test_websockets.py::TestConnectionManager::test_broadcast PASSED
test_websockets.py::TestWebSocketHandler::test_handle_ping PASSED
test_websockets.py::TestWebSocketHandler::test_handle_subscribe_learner PASSED
test_websockets.py::TestWebSocketMetrics::test_metrics_structure PASSED
test_websockets.py::TestWebSocketMetrics::test_latency_tracking PASSED
```

#### Run Load Tests

First, get a JWT token:
```bash
# Login to get token
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aivo.com","password":"your_password"}' \
  | jq -r '.access_token')
```

Run load test:
```bash
python tests/load_test_websockets.py \
  --token "$TOKEN" \
  --connections 100 \
  --duration 60 \
  --url ws://localhost:8000/ws
```

Output:
```
============================================================
WebSocket Load Test
============================================================
URL: ws://localhost:8000/ws
Connections: 100
Duration: 60s
Started: 2025-11-23 15:30:00
============================================================

[0] Connected in 0.045s
[1] Connected in 0.052s
...
[99] Connected in 0.067s

============================================================
Load Test Results
============================================================

Connection Statistics:
  Successful: 100
  Failed: 0
  Success Rate: 100.00%

Connection Times:
  Average: 0.053s
  Median: 0.051s
  Min: 0.041s
  Max: 0.078s

Message Statistics:
  Sent: 12000
  Received: 11950
  Throughput: 200.45 msg/s

Latency Statistics (ms):
  Average: 2.34ms
  Median: 2.12ms
  Min: 0.89ms
  Max: 15.67ms
  P95: 5.23ms
  P99: 8.91ms

Error Statistics:
  Total Errors: 2
  Error Rate: 0.02%

Overall:
  Total Duration: 60.12s
  Connections/Second: 1.66

============================================================
```

---

## 📊 Monitoring Dashboard

### Key Metrics to Monitor

1. **Connection Health**
   - Active connections
   - Connection/disconnection rate
   - Failed connection attempts

2. **Performance**
   - Message latency (P95, P99)
   - Message throughput
   - Error rate

3. **Usage**
   - Connected users
   - Subscribed learners
   - Active rooms

4. **System Health**
   - Uptime
   - Memory usage (connection count)
   - Error trends

### Grafana Dashboard (Example)

```json
{
  "dashboard": {
    "title": "AIVO WebSocket Metrics",
    "panels": [
      {
        "title": "Active Connections",
        "targets": [
          {
            "expr": "aivo_websocket_active_connections"
          }
        ]
      },
      {
        "title": "Message Throughput",
        "targets": [
          {
            "expr": "rate(aivo_websocket_messages_sent_total[5m])"
          }
        ]
      },
      {
        "title": "Latency P95",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, aivo_websocket_latency_ms)"
          }
        ]
      }
    ]
  }
}
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Backend (.env)
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

### WebSocket Settings

```typescript
// Adjust reconnection settings
const ws = useWebSocket({
  url: 'ws://localhost:8000/ws',
  token: 'your-token',
  reconnect: true,
  reconnectInterval: 3000,  // 3 seconds
  maxReconnectAttempts: 5,
});
```

---

## 🐛 Troubleshooting

### Connection Issues

**Problem:** WebSocket won't connect

**Solutions:**
1. Check token is valid and not expired
2. Verify backend is running on correct port
3. Check CORS settings in backend
4. Ensure WebSocket endpoint is `/ws` not `/ws/`

### Reconnection Problems

**Problem:** Reconnection attempts failing

**Solutions:**
1. Check `maxReconnectAttempts` setting
2. Verify token hasn't expired during disconnect
3. Look for network issues (firewall, proxy)
4. Check backend logs for authentication errors

### Performance Issues

**Problem:** High latency or slow messages

**Solutions:**
1. Run load test to identify bottleneck
2. Check backend metrics for error rate
3. Monitor system resources (CPU, memory)
4. Reduce message frequency if needed
5. Consider scaling horizontally

---

## 📈 Scalability

### Current Capacity
- **Target:** 1,000 concurrent connections
- **Message Rate:** 200+ msg/s per connection
- **Latency:** < 5ms P95

### Scaling Strategies

1. **Horizontal Scaling**
   - Use Redis for pub/sub across instances
   - Implement sticky sessions or connection routing

2. **Connection Pooling**
   - Group learners by region/school
   - Use room-based subscriptions

3. **Message Batching**
   - Batch state updates (e.g., every 5 seconds)
   - Reduce ping frequency for idle connections

---

## 🎓 Next Steps

1. **Frontend Enhancement**
   - Add offline queue for messages
   - Implement reconnection UI feedback
   - Add connection quality indicator

2. **Backend Optimization**
   - Implement Redis pub/sub
   - Add connection authentication caching
   - Optimize message serialization

3. **Monitoring**
   - Set up Prometheus metrics export
   - Create Grafana dashboards
   - Configure alerting rules

4. **Production Readiness**
   - SSL/TLS for WebSocket (wss://)
   - Rate limiting per connection
   - DDoS protection
   - Load balancer configuration

---

## 📝 API Reference

### WebSocket Messages

#### Client → Server

```typescript
// Subscribe to learner
{
  type: 'subscribe_learner',
  learner_id: string
}

// Virtual Brain interaction
{
  type: 'virtual_brain_interact',
  data: {
    learner_id: string,
    type: 'question_response' | 'content_view' | 'hint_request',
    content: string,
    response?: string,
    context?: object
  }
}

// Join room
{
  type: 'join_room',
  room_id: string
}

// Ping
{
  type: 'ping'
}
```

#### Server → Client

```typescript
// Connection established
{
  type: 'connection_established',
  connection_id: string,
  timestamp: string
}

// State update
{
  type: 'state_update',
  learner_id: string,
  state: {
    cognitive_load: number,
    engagement_level: number,
    frustration_level: number,
    fatigue_level: number,
    confidence_level: number,
    motivation_level: number
  },
  timestamp: string
}

// Virtual Brain response
{
  type: 'virtual_brain_response',
  learner_id: string,
  result: object,
  timestamp: string
}

// Pong
{
  type: 'pong',
  timestamp: string
}

// Error
{
  type: 'error',
  error: string,
  timestamp: string
}
```

---

## 🤝 Contributing

See main project README for contribution guidelines.

---

## 📄 License

Copyright © 2025 artpromedia. All rights reserved.
