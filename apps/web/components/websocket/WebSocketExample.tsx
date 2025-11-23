/**
 * WebSocket with Connection Quality - Example Usage
 * Author: artpromedia
 * Date: 2025-11-23
 */

'use client';

import React from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useConnectionQuality } from '@/lib/hooks/useConnectionQuality';
import { 
  ConnectionQualityBadge, 
  ConnectionQualityCard 
} from '@/components/websocket';

export function WebSocketExampleComponent() {
  // Initialize WebSocket with offline queue
  const ws = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4003',
    token: 'your-jwt-token-here',
    autoConnect: true,
    reconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    enableOfflineQueue: true, // Enable offline message queue
    onMessage: (message) => {
      console.log('Received:', message);
    },
    onOpen: () => {
      console.log('Connected!');
    },
    onClose: () => {
      console.log('Disconnected');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  // Initialize connection quality monitoring
  const quality = useConnectionQuality({
    status: ws.status,
    send: ws.send,
    checkInterval: 10000 // Check every 10 seconds
  });

  // Send a message
  const handleSendMessage = () => {
    ws.send({
      type: 'agent:learning',
      action: 'start_session',
      data: { /* your data */ }
    });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header with compact badge */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <h1 className="text-xl font-bold">WebSocket Example</h1>
        <ConnectionQualityBadge 
          status={ws.status} 
          metrics={quality} 
        />
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Connection info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Connection Info</h2>
          <div className="space-y-2 text-sm">
            <div>Status: <span className="font-mono">{ws.status}</span></div>
            <div>Connected: {ws.isConnected ? '✅' : '❌'}</div>
            <div>Reconnect Attempts: {ws.reconnectAttempts}</div>
            <div>Queue Size: {ws.queueSize} messages</div>
          </div>
          <div className="mt-4 space-x-2">
            <button
              onClick={ws.connect}
              disabled={ws.isConnected}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Connect
            </button>
            <button
              onClick={ws.disconnect}
              disabled={!ws.isConnected}
              className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-50"
            >
              Disconnect
            </button>
            <button
              onClick={ws.clearQueue}
              disabled={ws.queueSize === 0}
              className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
            >
              Clear Queue
            </button>
          </div>
        </div>

        {/* Connection quality card */}
        <ConnectionQualityCard 
          status={ws.status} 
          metrics={quality} 
        />
      </div>

      {/* Test message button */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-2">Send Test Message</h2>
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Send Message
        </button>
        {ws.queueSize > 0 && (
          <p className="mt-2 text-sm text-orange-600">
            ⚠️ {ws.queueSize} message(s) queued (offline)
          </p>
        )}
      </div>

      {/* Last message */}
      {ws.lastMessage && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Last Message</h2>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
            {JSON.stringify(ws.lastMessage, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default WebSocketExampleComponent;
