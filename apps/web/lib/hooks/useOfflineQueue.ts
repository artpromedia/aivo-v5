/**
 * Offline Message Queue Hook
 * Author: artpromedia
 * Date: 2025-11-23
 * 
 * Stores messages when offline and sends them when connection is restored
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketMessage } from './useWebSocket';

interface QueuedMessage extends WebSocketMessage {
  id: string;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

interface OfflineQueueOptions {
  maxQueueSize?: number;
  maxRetries?: number;
  persistToStorage?: boolean;
  storageKey?: string;
}

interface UseOfflineQueueReturn {
  queueMessage: (message: WebSocketMessage) => void;
  processQueue: () => void;
  clearQueue: () => void;
  queueSize: number;
  isPending: boolean;
}

const DEFAULT_MAX_QUEUE_SIZE = 100;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_STORAGE_KEY = 'aivo_websocket_queue';

export function useOfflineQueue(
  sendMessage: (message: WebSocketMessage) => void,
  isConnected: boolean,
  options: OfflineQueueOptions = {}
): UseOfflineQueueReturn {
  const {
    maxQueueSize = DEFAULT_MAX_QUEUE_SIZE,
    maxRetries = DEFAULT_MAX_RETRIES,
    persistToStorage = true,
    storageKey = DEFAULT_STORAGE_KEY
  } = options;

  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [isPending, setIsPending] = useState(false);
  const processingRef = useRef(false);

  /**
   * Load queue from localStorage on mount
   */
  useEffect(() => {
    if (persistToStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsedQueue = JSON.parse(stored) as QueuedMessage[];
          setQueue(parsedQueue);
          console.log(`[OfflineQueue] Loaded ${parsedQueue.length} messages from storage`);
        }
      } catch (error) {
        console.error('[OfflineQueue] Failed to load from storage:', error);
      }
    }
  }, [storageKey, persistToStorage]);

  /**
   * Persist queue to localStorage whenever it changes
   */
  useEffect(() => {
    if (persistToStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(queue));
      } catch (error) {
        console.error('[OfflineQueue] Failed to save to storage:', error);
      }
    }
  }, [queue, storageKey, persistToStorage]);

  /**
   * Add message to queue
   */
  const queueMessage = useCallback((message: WebSocketMessage) => {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
      maxRetries
    };

    setQueue((prevQueue) => {
      // Check queue size limit
      if (prevQueue.length >= maxQueueSize) {
        console.warn('[OfflineQueue] Queue size limit reached, removing oldest message');
        return [...prevQueue.slice(1), queuedMessage];
      }
      return [...prevQueue, queuedMessage];
    });

    console.log(`[OfflineQueue] Message queued: ${message.type}`);
  }, [maxQueueSize, maxRetries]);

  /**
   * Process queued messages
   */
  const processQueue = useCallback(async () => {
    if (processingRef.current || queue.length === 0 || !isConnected) {
      return;
    }

    processingRef.current = true;
    setIsPending(true);

    console.log(`[OfflineQueue] Processing ${queue.length} messages...`);

    const updatedQueue: QueuedMessage[] = [];

    for (const queuedMessage of queue) {
      try {
        // Send message
        const { id, timestamp, retries, maxRetries: _, ...message } = queuedMessage;
        sendMessage(message);

        console.log(`[OfflineQueue] Sent message: ${message.type} (queued ${Date.now() - timestamp}ms ago)`);
      } catch (error) {
        console.error(`[OfflineQueue] Failed to send message:`, error);

        // Retry logic
        if (queuedMessage.retries < queuedMessage.maxRetries) {
          updatedQueue.push({
            ...queuedMessage,
            retries: queuedMessage.retries + 1
          });
        } else {
          console.warn(`[OfflineQueue] Message exceeded max retries, discarding: ${queuedMessage.type}`);
        }
      }
    }

    setQueue(updatedQueue);
    setIsPending(false);
    processingRef.current = false;

    if (updatedQueue.length === 0) {
      console.log('[OfflineQueue] All messages processed successfully');
    } else {
      console.log(`[OfflineQueue] ${updatedQueue.length} messages remaining for retry`);
    }
  }, [queue, isConnected, sendMessage]);

  /**
   * Clear queue
   */
  const clearQueue = useCallback(() => {
    setQueue([]);
    if (persistToStorage && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    console.log('[OfflineQueue] Queue cleared');
  }, [storageKey, persistToStorage]);

  /**
   * Auto-process queue when connection is restored
   */
  useEffect(() => {
    if (isConnected && queue.length > 0) {
      console.log('[OfflineQueue] Connection restored, processing queue...');
      processQueue();
    }
  }, [isConnected, queue.length, processQueue]);

  return {
    queueMessage,
    processQueue,
    clearQueue,
    queueSize: queue.length,
    isPending
  };
}
