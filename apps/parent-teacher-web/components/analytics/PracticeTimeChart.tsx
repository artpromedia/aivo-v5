'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { LearnerSubjectProgressOverview } from '@aivo/types';

// Color palette for different subjects
const SUBJECT_COLORS: Record<string, string> = {
  MATH: '#8B5CF6', // violet
  READING: '#10B981', // emerald
  WRITING: '#F59E0B', // amber
  SCIENCE: '#3B82F6', // blue
  SOCIAL_STUDIES: '#EC4899', // pink
  DEFAULT: '#6366F1', // indigo
};

interface PracticeTimeChartProps {
  subjects: LearnerSubjectProgressOverview[];
}

type TimePeriod = 'weekly' | 'monthly' | 'all';

export function PracticeTimeChart({ subjects }: PracticeTimeChartProps) {
  const [period, setPeriod] = useState<TimePeriod>('all');

  const chartData = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return subjects.map((s) => {
      let filteredTimeseries = s.timeseries;

      if (period === 'weekly') {
        filteredTimeseries = s.timeseries.filter((pt) => new Date(pt.date) >= weekAgo);
      } else if (period === 'monthly') {
        filteredTimeseries = s.timeseries.filter((pt) => new Date(pt.date) >= monthAgo);
      }

      const totalMinutes = filteredTimeseries.reduce((sum, pt) => sum + pt.minutesPracticed, 0);

      return {
        subject: s.subject,
        minutes: totalMinutes,
        color: SUBJECT_COLORS[s.subject] || SUBJECT_COLORS.DEFAULT,
      };
    });
  }, [subjects, period]);

  const hasData = chartData.some((d) => d.minutes > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64 bg-lavender-50 rounded-2xl">
        <p className="text-slate-500 text-sm">No practice time data available yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Period Toggle */}
      <div className="flex gap-2 mb-4">
        {(['weekly', 'monthly', 'all'] as TimePeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              period === p
                ? 'bg-theme-primary text-white'
                : 'bg-lavender-100 text-slate-600 hover:bg-lavender-200'
            }`}
          >
            {p === 'weekly' ? 'Last 7 Days' : p === 'monthly' ? 'Last 30 Days' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="subject"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={{ stroke: '#CBD5E1' }}
              axisLine={{ stroke: '#CBD5E1' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={{ stroke: '#CBD5E1' }}
              axisLine={{ stroke: '#CBD5E1' }}
              tickFormatter={(value) => `${value}m`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number) => [`${value} minutes`, 'Practice Time']}
              labelStyle={{ fontWeight: 600, color: '#1E293B' }}
            />
            <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
