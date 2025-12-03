'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { IEPGoal, IEPGoalStatus } from '../../types/iep';
import { STATUS_CONFIG } from '../../types/iep';

// ============================================================================
// Types
// ============================================================================

interface IEPStatusPieChartProps {
  goals: IEPGoal[];
  size?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  status: IEPGoalStatus;
}

// ============================================================================
// Color mapping for chart
// ============================================================================

const STATUS_COLORS: Record<IEPGoalStatus, string> = {
  achieved: '#10b981', // emerald-500
  on_track: '#3b82f6', // blue-500
  needs_review: '#f59e0b', // amber-500
  at_risk: '#ef4444', // red-500
  not_started: '#9ca3af', // gray-400
};

// ============================================================================
// Component
// ============================================================================

export function IEPStatusPieChart({
  goals,
  size = 200,
  showLegend = true,
  showTooltip = true,
}: IEPStatusPieChartProps) {
  // Calculate status distribution
  const chartData = useMemo<ChartDataItem[]>(() => {
    const statusCounts = new Map<IEPGoalStatus, number>();

    for (const goal of goals) {
      const current = statusCounts.get(goal.status) ?? 0;
      statusCounts.set(goal.status, current + 1);
    }

    const data: ChartDataItem[] = [];
    for (const [status, count] of statusCounts) {
      if (count > 0) {
        data.push({
          name: STATUS_CONFIG[status].label,
          value: count,
          color: STATUS_COLORS[status],
          status,
        });
      }
    }

    // Sort by status priority: achieved, on_track, needs_review, at_risk, not_started
    const statusOrder: IEPGoalStatus[] = [
      'achieved',
      'on_track',
      'needs_review',
      'at_risk',
      'not_started',
    ];
    data.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

    return data;
  }, [goals]);

  // Empty state
  if (goals.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-400"
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <span className="text-3xl">📊</span>
          <p className="text-sm mt-2">No goals yet</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: size, height: showLegend ? size + 60 : size }}>
      <ResponsiveContainer width="100%" height={size}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.25}
            outerRadius={size * 0.4}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={2}
            stroke="#fff"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ChartDataItem;
                  return (
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">{data.name}</p>
                      <p className="text-sm text-gray-600">
                        {data.value} goal{data.value !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {showLegend && (
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {chartData.map((item) => (
            <div key={item.status} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-600">
                {item.name} ({item.value})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Mini Chart for compact views
// ============================================================================

interface IEPStatusMiniChartProps {
  goals: IEPGoal[];
  size?: number;
}

export function IEPStatusMiniChart({ goals, size = 80 }: IEPStatusMiniChartProps) {
  const chartData = useMemo<ChartDataItem[]>(() => {
    const statusCounts = new Map<IEPGoalStatus, number>();

    for (const goal of goals) {
      const current = statusCounts.get(goal.status) ?? 0;
      statusCounts.set(goal.status, current + 1);
    }

    const data: ChartDataItem[] = [];
    for (const [status, count] of statusCounts) {
      if (count > 0) {
        data.push({
          name: STATUS_CONFIG[status].label,
          value: count,
          color: STATUS_COLORS[status],
          status,
        });
      }
    }

    return data;
  }, [goals]);

  if (goals.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-full text-gray-400"
        style={{ width: size, height: size }}
      >
        <span className="text-lg">📊</span>
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.3}
            outerRadius={size * 0.45}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={1}
            stroke="#fff"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
