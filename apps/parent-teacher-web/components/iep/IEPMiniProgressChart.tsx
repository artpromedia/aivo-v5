'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { IEPGoal } from '../../types/iep';

// ============================================================================
// Types
// ============================================================================

interface IEPMiniProgressChartProps {
  goal: IEPGoal;
  width?: number;
  height?: number;
  showTarget?: boolean;
}

interface ChartDataPoint {
  index: number;
  value: number;
}

// ============================================================================
// Mini Progress Chart Component
// ============================================================================

export function IEPMiniProgressChart({
  goal,
  width = 120,
  height = 50,
  showTarget = true,
}: IEPMiniProgressChartProps) {
  // Prepare chart data
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return goal.dataPoints
      .slice()
      .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())
      .map((dp, index) => ({
        index,
        value: dp.value,
      }));
  }, [goal.dataPoints]);

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    const values = [...goal.dataPoints.map((d) => d.value), goal.targetValue];
    if (values.length === 0) return [0, 100];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.15;
    return [Math.max(0, min - padding), max + padding];
  }, [goal.dataPoints, goal.targetValue]);

  // Determine line color based on progress
  const lineColor = useMemo(() => {
    if (goal.status === 'achieved') return '#10b981'; // emerald
    if (goal.status === 'at_risk') return '#ef4444'; // red
    if (goal.status === 'needs_review') return '#f59e0b'; // amber
    return '#6366f1'; // indigo
  }, [goal.status]);

  // Empty state
  if (goal.dataPoints.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg text-gray-300"
        style={{ width, height }}
      >
        <span className="text-xs">No data</span>
      </div>
    );
  }

  // Single point - show just the value
  if (goal.dataPoints.length === 1) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ width, height }}
      >
        <span className="text-sm font-bold" style={{ color: lineColor }}>
          {chartData[0].value.toFixed(1)}
        </span>
      </div>
    );
  }

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <YAxis domain={yDomain} hide />
          <XAxis dataKey="index" hide />

          {/* Target line */}
          {showTarget && (
            <ReferenceLine
              y={goal.targetValue}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}

          {/* Data line */}
          <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

export function IEPMiniProgressChartSkeleton({
  width = 120,
  height = 50,
}: {
  width?: number;
  height?: number;
}) {
  return <div className="bg-gray-100 rounded-lg animate-pulse" style={{ width, height }} />;
}
