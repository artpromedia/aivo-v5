/**
 * Connection Quality Indicator Component
 * Author: artpromedia
 * Date: 2025-11-23
 * 
 * Visual indicator for WebSocket connection quality and status
 */

'use client';

import React from 'react';
import { ConnectionQuality, ConnectionQualityMetrics } from '../../lib/hooks/useConnectionQuality';
import { WebSocketStatus } from '../../lib/hooks/useWebSocket';

interface ConnectionQualityIndicatorProps {
  status: WebSocketStatus;
  metrics: ConnectionQualityMetrics;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function ConnectionQualityIndicator({
  status,
  metrics,
  showDetails = false,
  compact = false,
  className = ''
}: ConnectionQualityIndicatorProps) {
  const getStatusColor = (quality: ConnectionQuality): string => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-orange-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (quality: ConnectionQuality): string => {
    switch (quality) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (quality: ConnectionQuality): string => {
    switch (quality) {
      case 'excellent':
        return '📶';
      case 'good':
        return '📶';
      case 'fair':
        return '📡';
      case 'poor':
        return '⚠️';
      case 'offline':
        return '🔴';
      default:
        return '❓';
    }
  };

  const isConnecting = status === 'connecting' || status === 'reconnecting';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(metrics.quality)} ${isConnecting ? 'animate-pulse' : ''}`} />
        {!isConnecting && (
          <span className="text-xs text-gray-600">
            {metrics.latency}ms
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div 
          className={`w-3 h-3 rounded-full ${getStatusColor(metrics.quality)} ${isConnecting ? 'animate-pulse' : ''}`}
          title={getStatusText(metrics.quality)}
        />
        <span className="text-2xl">{getStatusIcon(metrics.quality)}</span>
      </div>

      {/* Status Text */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900">
            {isConnecting ? 'Connecting...' : getStatusText(metrics.quality)}
          </span>
          {metrics.isStable && status === 'connected' && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
              Stable
            </span>
          )}
        </div>
        
        {showDetails && status === 'connected' && (
          <div className="mt-1 text-xs text-gray-500 space-y-0.5">
            <div>Latency: {metrics.latency}ms (avg: {metrics.avgLatency}ms)</div>
            {metrics.packetLoss > 0 && (
              <div className="text-orange-600">
                Packet Loss: {metrics.packetLoss}%
              </div>
            )}
            <div className="text-gray-400">
              Last checked: {new Date(metrics.lastChecked).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Quality Bars */}
      {!showDetails && status === 'connected' && (
        <div className="flex items-end gap-0.5 h-4">
          <div className={`w-1 h-2 rounded-sm ${metrics.quality !== 'offline' ? getStatusColor(metrics.quality) : 'bg-gray-300'}`} />
          <div className={`w-1 h-3 rounded-sm ${['excellent', 'good', 'fair'].includes(metrics.quality) ? getStatusColor(metrics.quality) : 'bg-gray-300'}`} />
          <div className={`w-1 h-4 rounded-sm ${['excellent', 'good'].includes(metrics.quality) ? getStatusColor(metrics.quality) : 'bg-gray-300'}`} />
          <div className={`w-1 h-4 rounded-sm ${metrics.quality === 'excellent' ? getStatusColor(metrics.quality) : 'bg-gray-300'}`} />
        </div>
      )}
    </div>
  );
}

/**
 * Compact badge version for headers/toolbars
 */
export function ConnectionQualityBadge({
  status,
  metrics,
  className = ''
}: Omit<ConnectionQualityIndicatorProps, 'showDetails' | 'compact'>) {
  return (
    <ConnectionQualityIndicator
      status={status}
      metrics={metrics}
      compact={true}
      className={className}
    />
  );
}

/**
 * Detailed card version for dashboards
 */
export function ConnectionQualityCard({
  status,
  metrics,
  className = ''
}: Omit<ConnectionQualityIndicatorProps, 'showDetails' | 'compact'>) {
  return (
    <ConnectionQualityIndicator
      status={status}
      metrics={metrics}
      showDetails={true}
      className={className}
    />
  );
}
