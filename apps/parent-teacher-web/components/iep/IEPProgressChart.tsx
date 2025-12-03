'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { IEPGoal, IEPDataPoint } from '../../types/iep';
import { formatDate } from '../../types/iep';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface IEPProgressChartProps {
  goal: IEPGoal;
  height?: number;
  showTarget?: boolean;
  showTrendLine?: boolean;
  showLegend?: boolean;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  value: number;
  context?: string;
  notes?: string;
}

interface TrendResult {
  slope: number;
  intercept: number;
  direction: 'up' | 'down' | 'flat';
}

// ============================================================================
// Linear Regression for Trend Line
// ============================================================================

function calculateTrendLine(dataPoints: ChartDataPoint[]): TrendResult | null {
  if (dataPoints.length < 2) return null;

  const n = dataPoints.length;
  const xValues = dataPoints.map((_, i) => i);
  const yValues = dataPoints.map((d) => d.value);

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((total, x, i) => total + x * yValues[i], 0);
  const sumXX = xValues.reduce((total, x) => total + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const direction: 'up' | 'down' | 'flat' = slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'flat';

  return { slope, intercept, direction };
}

// ============================================================================
// Statistics Calculation
// ============================================================================

function calculateStats(dataPoints: IEPDataPoint[]) {
  if (dataPoints.length === 0) {
    return { average: 0, min: 0, max: 0, count: 0 };
  }

  const values = dataPoints.map((d) => d.value);
  const sum = values.reduce((a, b) => a + b, 0);
  const average = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return { average, min, max, count: values.length };
}

// ============================================================================
// Custom Tooltip
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint; value: number }>;
  unit: string;
}

function CustomTooltip({ active, payload, unit }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 min-w-[160px]">
      <p className="text-xs text-gray-500 mb-1">{data.displayDate}</p>
      <p className="text-lg font-bold text-gray-900">
        {data.value.toFixed(1)} <span className="text-sm font-normal text-gray-500">{unit}</span>
      </p>
      {data.context && <p className="text-xs text-gray-500 mt-1 capitalize">📍 {data.context}</p>}
      {data.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-2">💬 {data.notes}</p>}
    </div>
  );
}

// ============================================================================
// Main Chart Component
// ============================================================================

export function IEPProgressChart({
  goal,
  height = 300,
  showTarget = true,
  showTrendLine = true,
  showLegend = true,
}: IEPProgressChartProps) {
  // Prepare chart data
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return goal.dataPoints
      .slice()
      .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())
      .map((dp) => ({
        date: dp.measurementDate,
        displayDate: formatDate(dp.measurementDate),
        value: dp.value,
        context: dp.context,
        notes: dp.notes,
      }));
  }, [goal.dataPoints]);

  // Calculate trend
  const trend = useMemo(() => calculateTrendLine(chartData), [chartData]);

  // Add trend line points to data
  const dataWithTrend = useMemo(() => {
    if (!trend || !showTrendLine || chartData.length < 2) return chartData;

    return chartData.map((point, index) => ({
      ...point,
      trend: trend.intercept + trend.slope * index,
    }));
  }, [chartData, trend, showTrendLine]);

  // Calculate statistics
  const stats = useMemo(() => calculateStats(goal.dataPoints), [goal.dataPoints]);

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    const values = [...goal.dataPoints.map((d) => d.value), goal.targetValue];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    return [Math.max(0, min - padding), max + padding];
  }, [goal.dataPoints, goal.targetValue]);

  // Empty state
  if (goal.dataPoints.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl"
        style={{ height }}
      >
        <span className="text-4xl mb-3">📊</span>
        <p className="text-gray-600 font-medium">No data points yet</p>
        <p className="text-gray-400 text-sm">Start tracking progress to see the chart</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataWithTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => value.toFixed(0)}
            />
            <Tooltip content={<CustomTooltip unit={goal.unit} />} />

            {/* Target line */}
            {showTarget && (
              <ReferenceLine
                y={goal.targetValue}
                stroke="#10b981"
                strokeDasharray="8 4"
                strokeWidth={2}
                label={{
                  value: `Target: ${goal.targetValue}`,
                  position: 'right',
                  fill: '#10b981',
                  fontSize: 11,
                }}
              />
            )}

            {/* Trend line */}
            {showTrendLine && trend && chartData.length >= 2 && (
              <Line
                type="linear"
                dataKey="trend"
                stroke="#9333ea"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                name="Trend"
              />
            )}

            {/* Actual data line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
              name="Progress"
            />

            {showLegend && <Legend wrapperStyle={{ paddingTop: 10 }} />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Average" value={stats.average.toFixed(1)} unit={goal.unit} />
        <StatCard label="Min" value={stats.min.toFixed(1)} unit={goal.unit} />
        <StatCard label="Max" value={stats.max.toFixed(1)} unit={goal.unit} />
        <StatCard
          label="Trend"
          value={trend ? <TrendIndicator direction={trend.direction} /> : 'N/A'}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Stat Card
// ============================================================================

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
}

function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">
        {value}
        {unit && <span className="text-xs font-normal text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

// ============================================================================
// Trend Indicator
// ============================================================================

function TrendIndicator({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  if (direction === 'up') {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <TrendingUp className="w-4 h-4" />
        Up
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className="inline-flex items-center gap-1 text-red-600">
        <TrendingDown className="w-4 h-4" />
        Down
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-gray-500">
      <Minus className="w-4 h-4" />
      Flat
    </span>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

export function IEPProgressChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-gray-100 rounded-2xl" style={{ height }} />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 rounded-xl p-3 h-16" />
        ))}
      </div>
    </div>
  );
}
