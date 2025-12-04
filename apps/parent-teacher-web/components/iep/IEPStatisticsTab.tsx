'use client';

import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calculator,
  BarChart2,
  Target,
  Calendar,
} from 'lucide-react';
import type { IEPGoal, IEPDataPoint } from '../../types/iep';

interface IEPStatisticsTabProps {
  goal: IEPGoal;
}

interface DataStats {
  count: number;
  average: number;
  min: { value: number; date: string } | null;
  max: { value: number; date: string } | null;
  standardDeviation: number;
  trend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
  progressToTarget: number;
}

function calculateStats(dataPoints: IEPDataPoint[], targetValue: number): DataStats | null {
  if (dataPoints.length === 0) return null;

  // Sort by date
  const sorted = [...dataPoints].sort(
    (a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime(),
  );

  const values = sorted.map((dp) => dp.value);
  const count = values.length;

  // Average
  const sum = values.reduce((acc, v) => acc + v, 0);
  const average = sum / count;

  // Min/Max with dates
  const minPoint = sorted.reduce((min, dp) => (dp.value < min.value ? dp : min), sorted[0]);
  const maxPoint = sorted.reduce((max, dp) => (dp.value > max.value ? dp : max), sorted[0]);

  const min = { value: minPoint.value, date: minPoint.measurementDate };
  const max = { value: maxPoint.value, date: maxPoint.measurementDate };

  // Standard Deviation
  const squaredDiffs = values.map((v) => Math.pow(v - average, 2));
  const avgSquaredDiff = squaredDiffs.reduce((acc, v) => acc + v, 0) / count;
  const standardDeviation = Math.sqrt(avgSquaredDiff);

  // Trend calculation (linear regression)
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  let trendPercentage = 0;

  if (count >= 2) {
    const firstHalf = values.slice(0, Math.ceil(count / 2));
    const secondHalf = values.slice(Math.floor(count / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    trendPercentage = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (trendPercentage > 5) {
      trend = 'improving';
    } else if (trendPercentage < -5) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }
  }

  // Progress to target
  const currentValue = sorted[sorted.length - 1].value;
  const startValue = sorted[0].value;
  const progressToTarget =
    startValue !== targetValue
      ? ((currentValue - startValue) / (targetValue - startValue)) * 100
      : currentValue >= targetValue
        ? 100
        : 0;

  return {
    count,
    average,
    min,
    max,
    standardDeviation,
    trend,
    trendPercentage,
    progressToTarget,
  };
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function IEPStatisticsTab({ goal }: IEPStatisticsTabProps) {
  const stats = useMemo(
    () => calculateStats(goal.dataPoints, goal.targetValue),
    [goal.dataPoints, goal.targetValue],
  );

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Statistics Yet</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Add data points to see statistics and trends for this goal.
        </p>
      </div>
    );
  }

  const TrendIcon =
    stats.trend === 'improving' ? TrendingUp : stats.trend === 'declining' ? TrendingDown : Minus;
  const trendColor =
    stats.trend === 'improving'
      ? 'text-emerald-600 bg-emerald-50'
      : stats.trend === 'declining'
        ? 'text-red-600 bg-red-50'
        : 'text-gray-600 bg-gray-50';

  return (
    <div className="space-y-6">
      {/* Trend Banner */}
      <div className={`rounded-xl p-4 flex items-center gap-4 ${trendColor}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${trendColor}`}>
          <TrendIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {stats.trend === 'improving'
              ? 'Improving'
              : stats.trend === 'declining'
                ? 'Declining'
                : 'Stable'}
          </p>
          <p className="text-xs opacity-80">
            {stats.trend === 'stable'
              ? 'Performance is consistent'
              : `${Math.abs(stats.trendPercentage).toFixed(1)}% ${stats.trend === 'improving' ? 'increase' : 'decrease'} over time`}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Data Points */}
        <div className="bg-violet-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-medium text-violet-600">Total Data Points</span>
          </div>
          <p className="text-2xl font-bold text-violet-700">{stats.count}</p>
        </div>

        {/* Average */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Average</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {stats.average.toFixed(1)}
            <span className="text-sm font-normal ml-1">{goal.unit}</span>
          </p>
        </div>

        {/* Minimum */}
        <div className="bg-amber-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-600">Minimum</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">
            {stats.min?.value.toFixed(1)}
            <span className="text-sm font-normal ml-1">{goal.unit}</span>
          </p>
          {stats.min && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(stats.min.date)}
            </p>
          )}
        </div>

        {/* Maximum */}
        <div className="bg-emerald-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-600">Maximum</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            {stats.max?.value.toFixed(1)}
            <span className="text-sm font-normal ml-1">{goal.unit}</span>
          </p>
          {stats.max && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(stats.max.date)}
            </p>
          )}
        </div>
      </div>

      {/* Progress to Target */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-medium text-gray-700">Progress to Target</span>
          </div>
          <span className="text-sm font-bold text-violet-600">
            {Math.min(100, Math.max(0, stats.progressToTarget)).toFixed(0)}%
          </span>
        </div>
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, stats.progressToTarget))}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>
            Start: {goal.dataPoints.length > 0 ? goal.dataPoints[0].value.toFixed(1) : '-'}{' '}
            {goal.unit}
          </span>
          <span>
            Target: {goal.targetValue} {goal.unit}
          </span>
        </div>
      </div>

      {/* Standard Deviation (optional advanced stat) */}
      {stats.count >= 3 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Standard Deviation</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.standardDeviation < 5
                  ? 'Low variability - consistent performance'
                  : stats.standardDeviation < 10
                    ? 'Moderate variability - some fluctuation'
                    : 'High variability - significant fluctuation'}
              </p>
            </div>
            <p className="text-xl font-bold text-gray-700">±{stats.standardDeviation.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Single data point notice */}
      {stats.count === 1 && (
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-sm text-blue-700">
            Add more data points to see trends and advanced statistics.
          </p>
        </div>
      )}
    </div>
  );
}
