/**
 * WebSocket Context Provider
 * Author: artpromedia
 * Date: 2025-11-23
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket, WebSocketMessage, WebSocketStatus, UseWebSocketReturn } from '../hooks/useWebSocket';

interface WebSocketContextValue extends UseWebSocketReturn {
  subscribeLearner: (learnerId: string) => void;
  unsubscribeLearner: (learnerId: string) => void;
  sendVirtualBrainInteraction: (data: any) => void;
  getState: (learnerId: string) => void;
  adaptContent: (data: any) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  subscribedLearners: Set<string>;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export interface WebSocketProviderProps {
  children: React.ReactNode;
  url: string;
  token: string;
  autoConnect?: boolean;
  onStateUpdate?: (data: any) => void;
  onVirtualBrainResponse?: (data: any) => void;
  onError?: (error: any) => void;
}

export function WebSocketProvider({
  children,
  url,
  token,
  autoConnect = true,
  onStateUpdate,
  onVirtualBrainResponse,
  onError,
}: WebSocketProviderProps) {
  const [subscribedLearners, setSubscribedLearners] = useState<Set<string>>(new Set());

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'state_update':
        console.log('[WebSocket] State update received', message);
        onStateUpdate?.(message);
        break;

      case 'virtual_brain_response':
        console.log('[WebSocket] Virtual Brain response', message);
        onVirtualBrainResponse?.(message);
        break;

      case 'content_adapted':
        console.log('[WebSocket] Content adapted', message);
        break;

      case 'connection_established':
        console.log('[WebSocket] Connection established', message);
        break;

      case 'subscribed':
        console.log('[WebSocket] Subscribed to learner', message.learner_id);
        if (message.learner_id) {
          setSubscribedLearners((prev) => new Set(prev).add(message.learner_id));
        }
        break;

      case 'unsubscribed':
        console.log('[WebSocket] Unsubscribed from learner', message.learner_id);
        if (message.learner_id) {
          setSubscribedLearners((prev) => {
            const next = new Set(prev);
            next.delete(message.learner_id);
            return next;
          });
        }
        break;

      case 'room_joined':
        console.log('[WebSocket] Joined room', message.room_id);
        break;

      case 'room_left':
        console.log('[WebSocket] Left room', message.room_id);
        break;

      case 'user_joined':
        console.log('[WebSocket] User joined room', message);
        break;

      case 'user_left':
        console.log('[WebSocket] User left room', message);
        break;

      case 'error':
        console.error('[WebSocket] Error message', message.error);
        onError?.(message);
        break;

      case 'pong':
        // Keep-alive response
        break;

      default:
        console.log('[WebSocket] Unknown message type', message.type);
    }
  };

  const ws = useWebSocket({
    url,
    token,
    autoConnect,
    reconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    onMessage: handleMessage,
    onOpen: () => {
      console.log('[WebSocketProvider] Connected');
    },
    onClose: () => {
      console.log('[WebSocketProvider] Disconnected');
      // Clear subscriptions on disconnect
      setSubscribedLearners(new Set());
    },
    onError: (error) => {
      console.error('[WebSocketProvider] Error', error);
      onError?.({ type: 'connection_error', error });
    },
  });

  const subscribeLearner = (learnerId: string) => {
    ws.send({
      type: 'subscribe_learner',
      learner_id: learnerId,
    });
  };

  const unsubscribeLearner = (learnerId: string) => {
    ws.send({
      type: 'unsubscribe_learner',
      learner_id: learnerId,
    });
  };

  const sendVirtualBrainInteraction = (data: any) => {
    ws.send({
      type: 'virtual_brain_interact',
      data,
    });
  };

  const getState = (learnerId: string) => {
    ws.send({
      type: 'get_state',
      learner_id: learnerId,
    });
  };

  const adaptContent = (data: any) => {
    ws.send({
      type: 'adapt_content',
      data,
    });
  };

  const joinRoom = (roomId: string) => {
    ws.send({
      type: 'join_room',
      room_id: roomId,
    });
  };

  const leaveRoom = (roomId: string) => {
    ws.send({
      type: 'leave_room',
      room_id: roomId,
    });
  };

  const value: WebSocketContextValue = {
    ...ws,
    subscribeLearner,
    unsubscribeLearner,
    sendVirtualBrainInteraction,
    getState,
    adaptContent,
    joinRoom,
    leaveRoom,
    subscribedLearners,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  
  return context;
}
