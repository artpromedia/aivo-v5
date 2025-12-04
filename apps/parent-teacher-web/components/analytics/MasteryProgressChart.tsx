'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

interface MasteryProgressChartProps {
  subjects: LearnerSubjectProgressOverview[];
}

interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

export function MasteryProgressChart({ subjects }: MasteryProgressChartProps) {
  const chartData = useMemo(() => {
    // Collect all unique dates
    const allDates = new Set<string>();
    subjects.forEach((s) => {
      s.timeseries.forEach((pt) => allDates.add(pt.date));
    });

    // Sort dates
    const sortedDates = Array.from(allDates).sort();

    // Build chart data with all subjects
    return sortedDates.map((date) => {
      const point: ChartDataPoint = { date };
      subjects.forEach((s) => {
        const match = s.timeseries.find((pt) => pt.date === date);
        if (match) {
          point[s.subject] = Math.round(match.masteryScore * 100);
        }
      });
      return point;
    });
  }, [subjects]);

  const subjectsWithData = useMemo(() => {
    return subjects.filter((s) => s.timeseries.length > 0);
  }, [subjects]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-lavender-50 rounded-2xl">
        <p className="text-slate-500 text-sm">No mastery data available yet</p>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#64748B' }}
            tickLine={{ stroke: '#CBD5E1' }}
            axisLine={{ stroke: '#CBD5E1' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#64748B' }}
            tickLine={{ stroke: '#CBD5E1' }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number) => [`${value}%`, 'Mastery']}
            labelStyle={{ fontWeight: 600, color: '#1E293B' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
          />
          {subjectsWithData.map((s) => (
            <Line
              key={s.subject}
              type="monotone"
              dataKey={s.subject}
              stroke={SUBJECT_COLORS[s.subject] || SUBJECT_COLORS.DEFAULT}
              strokeWidth={2}
              dot={{ r: 4, fill: SUBJECT_COLORS[s.subject] || SUBJECT_COLORS.DEFAULT }}
              activeDot={{ r: 6 }}
              name={s.subject}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
