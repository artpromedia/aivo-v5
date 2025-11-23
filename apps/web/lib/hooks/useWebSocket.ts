/**
 * WebSocket Hook for Real-time Communication
 * Author: artpromedia
 * Date: 2025-11-23
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export type WebSocketStatus = 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'error' 
  | 'reconnecting';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketOptions {
  url: string;
  token: string;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export interface UseWebSocketReturn {
  status: WebSocketStatus;
  isConnected: boolean;
  send: (message: WebSocketMessage) => void;
  connect: () => void;
  disconnect: () => void;
  lastMessage: WebSocketMessage | null;
  reconnectAttempts: number;
}

export function useWebSocket(options: WebSocketOptions): UseWebSocketReturn {
  const {
    url,
    token,
    autoConnect = true,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const clearPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const startPingInterval = useCallback(() => {
    clearPingInterval();
    
    // Send ping every 30 seconds to keep connection alive
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }, [clearPingInterval]);

  const connect = useCallback(() => {
    // Don't connect if already connecting or connected
    if (
      wsRef.current && 
      (wsRef.current.readyState === WebSocket.CONNECTING ||
       wsRef.current.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    try {
      setStatus('connecting');
      
      // Construct WebSocket URL with token
      const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setStatus('connected');
        setReconnectAttempts(0);
        shouldReconnectRef.current = true;
        startPingInterval();
        onOpen?.();
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected', event.code, event.reason);
        setStatus('disconnected');
        clearPingInterval();
        onClose?.(event);

        // Attempt reconnection if enabled
        if (
          reconnect &&
          shouldReconnectRef.current &&
          reconnectAttempts < maxReconnectAttempts
        ) {
          setStatus('reconnecting');
          clearReconnectTimeout();
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `[WebSocket] Reconnecting... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`
            );
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.log('[WebSocket] Max reconnection attempts reached');
          setStatus('error');
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error', error);
        setStatus('error');
        onError?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message', error);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection failed', error);
      setStatus('error');
    }
  }, [
    url,
    token,
    reconnect,
    reconnectInterval,
    maxReconnectAttempts,
    reconnectAttempts,
    onOpen,
    onClose,
    onError,
    onMessage,
    clearReconnectTimeout,
    startPingInterval,
    clearPingInterval,
  ]);

  const disconnect = useCallback(() => {
    console.log('[WebSocket] Disconnecting');
    shouldReconnectRef.current = false;
    clearReconnectTimeout();
    clearPingInterval();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setStatus('disconnected');
  }, [clearReconnectTimeout, clearPingInterval]);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WebSocket] Failed to send message', error);
      }
    } else {
      console.warn('[WebSocket] Cannot send message, not connected');
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]);

  // Reconnect when token changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      disconnect();
      connect();
    }
  }, [token]);

  return {
    status,
    isConnected: status === 'connected',
    send,
    connect,
    disconnect,
    lastMessage,
    reconnectAttempts,
  };
}
