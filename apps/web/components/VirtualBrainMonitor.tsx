/**
 * Virtual Brain Monitor Component - Real-time Cognitive State Display
 * Author: artpromedia
 * Date: 2025-11-23
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useWebSocketContext } from '../lib/contexts/WebSocketContext';
import { 
  CognitiveState, 
  PerformanceMetrics,
  virtualBrainClient 
} from '../lib/services/virtualBrainClient';

interface VirtualBrainMonitorProps {
  learnerId: string;
  showPerformance?: boolean;
  showRecommendations?: boolean;
  className?: string;
}

export function VirtualBrainMonitor({
  learnerId,
  showPerformance = true,
  showRecommendations = true,
  className = '',
}: VirtualBrainMonitorProps) {
  const { isConnected, subscribeLearner, unsubscribeLearner, subscribedLearners } = useWebSocketContext();
  
  const [cognitiveState, setCognitiveState] = useState<CognitiveState | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Subscribe to learner updates when connected
  useEffect(() => {
    if (isConnected && !subscribedLearners.has(learnerId)) {
      subscribeLearner(learnerId);
    }

    return () => {
      if (subscribedLearners.has(learnerId)) {
        unsubscribeLearner(learnerId);
      }
    };
  }, [isConnected, learnerId, subscribeLearner, unsubscribeLearner, subscribedLearners]);

  // Listen for state updates
  useEffect(() => {
    const unsubscribeState = virtualBrainClient.onStateUpdate(learnerId, (state) => {
      setCognitiveState(state);
      setLastUpdate(new Date());
    });

    const unsubscribeResponse = virtualBrainClient.onResponse(learnerId, (response) => {
      if (response.state) {
        setCognitiveState(response.state);
      }
      if (response.performance) {
        setPerformance(response.performance);
      }
      if (response.recommendations) {
        setRecommendations(response.recommendations);
      }
      setLastUpdate(new Date());
    });

    return () => {
      unsubscribeState();
      unsubscribeResponse();
    };
  }, [learnerId]);

  const getStateColor = (value: number): string => {
    if (value >= 0.7) return 'bg-green-500';
    if (value >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStateLabel = (value: number): string => {
    if (value >= 0.7) return 'High';
    if (value >= 0.4) return 'Medium';
    return 'Low';
  };

  if (!isConnected) {
    return (
      <div className={`rounded-lg border border-yellow-300 bg-yellow-50 p-4 ${className}`}>
        <p className="text-sm text-yellow-800">
          🔌 Connecting to Virtual Brain...
        </p>
      </div>
    );
  }

  if (!cognitiveState) {
    return (
      <div className={`rounded-lg border border-gray-300 bg-gray-50 p-4 ${className}`}>
        <p className="text-sm text-gray-600">
          ⏳ Waiting for cognitive state data...
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Cognitive State */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            🧠 Cognitive State
          </h3>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {/* Engagement Level */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Engagement</span>
              <span className="text-sm text-gray-600">
                {getStateLabel(cognitiveState.engagement_level)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getStateColor(cognitiveState.engagement_level)}`}
                style={{ width: `${cognitiveState.engagement_level * 100}%` }}
              />
            </div>
          </div>

          {/* Cognitive Load */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Cognitive Load</span>
              <span className="text-sm text-gray-600">
                {getStateLabel(cognitiveState.cognitive_load)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getStateColor(1 - cognitiveState.cognitive_load)}`}
                style={{ width: `${cognitiveState.cognitive_load * 100}%` }}
              />
            </div>
          </div>

          {/* Confidence Level */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Confidence</span>
              <span className="text-sm text-gray-600">
                {getStateLabel(cognitiveState.confidence_level)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getStateColor(cognitiveState.confidence_level)}`}
                style={{ width: `${cognitiveState.confidence_level * 100}%` }}
              />
            </div>
          </div>

          {/* Frustration Level */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Frustration</span>
              <span className="text-sm text-gray-600">
                {getStateLabel(cognitiveState.frustration_level)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getStateColor(1 - cognitiveState.frustration_level)}`}
                style={{ width: `${cognitiveState.frustration_level * 100}%` }}
              />
            </div>
          </div>

          {/* Motivation Level */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Motivation</span>
              <span className="text-sm text-gray-600">
                {getStateLabel(cognitiveState.motivation_level)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getStateColor(cognitiveState.motivation_level)}`}
                style={{ width: `${cognitiveState.motivation_level * 100}%` }}
              />
            </div>
          </div>

          {/* Fatigue Level */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Fatigue</span>
              <span className="text-sm text-gray-600">
                {getStateLabel(cognitiveState.fatigue_level)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getStateColor(1 - cognitiveState.fatigue_level)}`}
                style={{ width: `${cognitiveState.fatigue_level * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {showPerformance && performance && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            📊 Performance Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <div className="text-sm text-blue-600">Accuracy</div>
              <div className="text-2xl font-bold text-blue-900">
                {(performance.accuracy * 100).toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <div className="text-sm text-green-600">Consistency</div>
              <div className="text-2xl font-bold text-green-900">
                {(performance.consistency * 100).toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg bg-theme-primary/10 p-3">
              <div className="text-sm text-theme-primary">Response Time</div>
              <div className="text-2xl font-bold text-theme-primary">
                {performance.response_time.toFixed(1)}s
              </div>
            </div>
            <div className="rounded-lg bg-orange-50 p-3">
              <div className="text-sm text-orange-600">Improvement</div>
              <div className="text-2xl font-bold text-orange-900">
                {(performance.improvement_rate * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            💡 AI Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-blue-500">•</span>
                <span className="text-sm text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
