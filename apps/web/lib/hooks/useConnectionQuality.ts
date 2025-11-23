/**
 * Connection Quality Indicator Hook
 * Author: artpromedia
 * Date: 2025-11-23
 * 
 * Monitors WebSocket connection quality including latency and stability
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketStatus } from './useWebSocket';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

export interface ConnectionQualityMetrics {
  quality: ConnectionQuality;
  latency: number;
  avgLatency: number;
  packetLoss: number;
  isStable: boolean;
  lastChecked: number;
}

interface UseConnectionQualityOptions {
  status: WebSocketStatus;
  send: (message: any) => void;
  onMessage?: (handler: (message: any) => void) => void;
  checkInterval?: number;
}

interface UseConnectionQualityReturn extends ConnectionQualityMetrics {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  isMonitoring: boolean;
}

const DEFAULT_CHECK_INTERVAL = 10000; // 10 seconds
const LATENCY_SAMPLES = 10;

export function useConnectionQuality(
  options: UseConnectionQualityOptions
): UseConnectionQualityReturn {
  const {
    status,
    send,
    checkInterval = DEFAULT_CHECK_INTERVAL
  } = options;

  const [quality, setQuality] = useState<ConnectionQuality>('offline');
  const [latency, setLatency] = useState<number>(0);
  const [avgLatency, setAvgLatency] = useState<number>(0);
  const [packetLoss, setPacketLoss] = useState<number>(0);
  const [isStable, setIsStable] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<number>(Date.now());
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);

  const latencySamplesRef = useRef<number[]>([]);
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPingsRef = useRef<Map<string, number>>(new Map());
  const sentPingsRef = useRef<number>(0);
  const receivedPongsRef = useRef<number>(0);

  /**
   * Calculate connection quality based on latency
   */
  const calculateQuality = useCallback((avgLat: number): ConnectionQuality => {
    if (status !== 'connected') return 'offline';
    if (avgLat < 100) return 'excellent';
    if (avgLat < 250) return 'good';
    if (avgLat < 500) return 'fair';
    return 'poor';
  }, [status]);

  /**
   * Update average latency
   */
  const updateLatencyAverage = useCallback(() => {
    if (latencySamplesRef.current.length === 0) return;

    const sum = latencySamplesRef.current.reduce((a, b) => a + b, 0);
    const avg = sum / latencySamplesRef.current.length;
    
    setAvgLatency(Math.round(avg));
    setQuality(calculateQuality(avg));

    // Check stability (variance < 30%)
    const variance = Math.sqrt(
      latencySamplesRef.current.reduce((sum, val) => 
        sum + Math.pow(val - avg, 2), 0
      ) / latencySamplesRef.current.length
    );
    setIsStable(variance / avg < 0.3);
  }, [calculateQuality]);

  /**
   * Send ping to measure latency
   */
  const sendPing = useCallback(() => {
    if (status !== 'connected') return;

    const pingId = `ping_${Date.now()}_${Math.random()}`;
    const startTime = Date.now();
    
    pendingPingsRef.current.set(pingId, startTime);
    sentPingsRef.current++;

    send({ type: 'quality_ping', pingId });

    // Timeout after 5 seconds
    pingTimeoutRef.current = setTimeout(() => {
      if (pendingPingsRef.current.has(pingId)) {
        pendingPingsRef.current.delete(pingId);
        // Count as packet loss
        const loss = ((sentPingsRef.current - receivedPongsRef.current) / sentPingsRef.current) * 100;
        setPacketLoss(Math.round(loss));
      }
    }, 5000);
  }, [status, send]);

  /**
   * Handle pong response
   */
  const handlePong = useCallback((message: any) => {
    if (message.type === 'quality_pong' && message.pingId) {
      const startTime = pendingPingsRef.current.get(message.pingId);
      
      if (startTime) {
        const latencyMs = Date.now() - startTime;
        
        setLatency(latencyMs);
        receivedPongsRef.current++;
        
        // Add to samples
        latencySamplesRef.current.push(latencyMs);
        if (latencySamplesRef.current.length > LATENCY_SAMPLES) {
          latencySamplesRef.current.shift();
        }
        
        updateLatencyAverage();
        
        // Calculate packet loss
        const loss = ((sentPingsRef.current - receivedPongsRef.current) / sentPingsRef.current) * 100;
        setPacketLoss(Math.round(loss));
        
        pendingPingsRef.current.delete(message.pingId);
        setLastChecked(Date.now());
      }
    }
  }, [updateLatencyAverage]);

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback(() => {
    if (isMonitoring || status !== 'connected') return;

    console.log('[ConnectionQuality] Starting monitoring');
    setIsMonitoring(true);

    // Initial ping
    sendPing();

    // Schedule regular pings
    monitorIntervalRef.current = setInterval(() => {
      sendPing();
    }, checkInterval);
  }, [isMonitoring, status, sendPing, checkInterval]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    console.log('[ConnectionQuality] Stopping monitoring');
    setIsMonitoring(false);

    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }

    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = null;
    }
  }, []);

  /**
   * Auto-start monitoring when connected
   */
  useEffect(() => {
    if (status === 'connected' && !isMonitoring) {
      startMonitoring();
    } else if (status !== 'connected' && isMonitoring) {
      stopMonitoring();
      setQuality('offline');
    }
  }, [status, isMonitoring, startMonitoring, stopMonitoring]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // You would need to integrate handlePong with your WebSocket message handler
  // This is typically done in the parent component

  return {
    quality,
    latency,
    avgLatency,
    packetLoss,
    isStable,
    lastChecked,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
}
