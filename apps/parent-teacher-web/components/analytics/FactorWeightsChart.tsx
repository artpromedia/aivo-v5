'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { ExplainableRecommendationFactor } from '@aivo/types';

interface FactorWeightsChartProps {
  factors: ExplainableRecommendationFactor[];
  subject: string;
}

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#6366F1'];

export function FactorWeightsChart({ factors, subject: _subject }: FactorWeightsChartProps) {
  const chartData = useMemo(() => {
    return factors.map((f) => ({
      name: f.label,
      value: Math.round(f.weight * 100),
      description: f.description,
    }));
  }, [factors]);

  if (factors.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-lavender-50 rounded-xl">
        <p className="text-slate-500 text-sm">No factor data available</p>
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}%`}
            labelLine={false}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number, name: string) => [`${value}%`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface FactorWeightsBarProps {
  factors: ExplainableRecommendationFactor[];
}

export function FactorWeightsBar({ factors }: FactorWeightsBarProps) {
  if (factors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {factors.map((f, index) => {
        const percentage = Math.round(f.weight * 100);
        return (
          <div key={f.label} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-700">{f.label}</span>
              <span className="text-slate-500">{percentage}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
