/**
 * WebSocket Load Test
 * 
 * Tests WebSocket connections for real-time features:
 * - Tutoring sessions
 * - Live emotion updates
 * - Collaborative features
 */

import { check, sleep } from 'k6';
import ws from 'k6/ws';
import { Counter, Rate, Trend } from 'k6/metrics';
import http from 'k6/http';
import { config } from '../config';

// Custom metrics
const wsConnections = new Counter('ws_connections');
const wsMessages = new Counter('ws_messages');
const wsErrors = new Rate('ws_errors');
const wsLatency = new Trend('ws_latency');
const wsConnectionTime = new Trend('ws_connection_time');

export const options = {
  scenarios: {
    // WebSocket connection test
    websocketTest: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '3m', target: 200 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    'ws_errors': ['rate<0.05'],           // Less than 5% WebSocket errors
    'ws_latency': ['p(95)<1000'],          // 95% message latency under 1s
    'ws_connection_time': ['p(95)<2000'],  // Connection established under 2s
    'ws_connections': ['count>100'],       // At least 100 connections
  },
  tags: {
    testType: 'websocket-load',
  },
};

// Get auth token
function getToken(vuId: number): string {
  const email = `test-learner-${vuId % config.testUsers.learners}@${config.testUsers.emailDomain}`;
  
  const res = http.post(
    `${config.baseUrl}/api/auth/login`,
    JSON.stringify({
      email,
      password: config.testUsers.passwordTemplate,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  if (res.status === 200) {
    return res.json('token') as string;
  }
  
  return '';
}

export default function () {
  const vuId = __VU;
  const token = getToken(vuId);
  
  if (!token) {
    wsErrors.add(1);
    return;
  }
  
  const wsUrl = `${config.wsUrl}/ws/tutor?token=${token}`;
  const connectionStart = Date.now();
  
  const response = ws.connect(wsUrl, {}, function (socket) {
    wsConnections.add(1);
    wsConnectionTime.add(Date.now() - connectionStart);
    
    socket.on('open', () => {
      console.log(`VU ${vuId}: WebSocket connected`);
      
      // Send initial presence message
      socket.send(JSON.stringify({
        type: 'presence',
        data: {
          userId: `test-learner-${vuId}`,
          status: 'online',
        },
      }));
      wsMessages.add(1);
    });
    
    socket.on('message', (data: string) => {
      wsMessages.add(1);
      
      try {
        const message = JSON.parse(data);
        
        // Measure latency for ping-pong messages
        if (message.type === 'pong' && message.timestamp) {
          wsLatency.add(Date.now() - message.timestamp);
        }
        
        // Handle different message types
        switch (message.type) {
          case 'welcome':
            console.log(`VU ${vuId}: Received welcome`);
            break;
          case 'emotion_update':
            // Acknowledge emotion update
            socket.send(JSON.stringify({
              type: 'ack',
              messageId: message.id,
            }));
            wsMessages.add(1);
            break;
          case 'hint':
            // Process hint message
            console.log(`VU ${vuId}: Received hint`);
            break;
        }
      } catch (e) {
        console.error(`VU ${vuId}: Failed to parse message: ${data}`);
      }
    });
    
    socket.on('error', (e: Error) => {
      console.error(`VU ${vuId}: WebSocket error: ${e.message}`);
      wsErrors.add(1);
    });
    
    socket.on('close', () => {
      console.log(`VU ${vuId}: WebSocket closed`);
    });
    
    // Simulate user activity
    let messageCount = 0;
    const maxMessages = 20;
    
    // Send periodic messages
    socket.setInterval(() => {
      if (messageCount >= maxMessages) {
        socket.close();
        return;
      }
      
      const messageType = Math.random();
      
      if (messageType < 0.3) {
        // Send emotion update (30%)
        const emotions = ['happy', 'calm', 'focused', 'anxious', 'tired'];
        socket.send(JSON.stringify({
          type: 'emotion',
          data: {
            emotion: emotions[Math.floor(Math.random() * emotions.length)],
            intensity: Math.floor(Math.random() * 10) + 1,
            timestamp: Date.now(),
          },
        }));
      } else if (messageType < 0.6) {
        // Send ping for latency measurement (30%)
        socket.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now(),
        }));
      } else if (messageType < 0.8) {
        // Request hint (20%)
        socket.send(JSON.stringify({
          type: 'hint_request',
          data: {
            questionId: `q-${Math.floor(Math.random() * 100)}`,
            context: 'Need help with this problem',
          },
        }));
      } else {
        // Send typing indicator (20%)
        socket.send(JSON.stringify({
          type: 'typing',
          data: {
            isTyping: Math.random() > 0.5,
          },
        }));
      }
      
      wsMessages.add(1);
      messageCount++;
    }, 3000); // Every 3 seconds
    
    // Keep connection alive for the test duration
    socket.setTimeout(() => {
      socket.close();
    }, 60000); // Close after 60 seconds
  });
  
  const success = check(response, {
    'WebSocket connection established': (r) => r && r.status === 101,
  });
  
  if (!success) {
    wsErrors.add(1);
  }
  
  sleep(1);
}

export function handleSummary(data: object) {
  return {
    'websocket-load-results.json': JSON.stringify(data, null, 2),
  };
}
