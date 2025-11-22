'use client'

import type { CSSProperties } from "react";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type BarChartProps<TData> = {
  data: TData[];
  xKey: keyof TData;
  yKey: keyof TData;
  height?: number;
  color?: string;
  style?: CSSProperties;
};

export function BarChart<TData extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  height = 260,
  color = "#6366f1",
  style
}: BarChartProps<TData>) {
  if (!data?.length) {
    return <EmptyChartState message="No domain data yet" height={height} />;
  }

  return (
    <div style={{ height, width: "100%", ...style }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 8, left: 0, right: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey as string} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(99,102,241,0.08)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
              background: "white"
            }}
          />
          <Bar dataKey={yKey as string} fill={color} radius={[8, 8, 8, 8]} maxBarSize={48} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChartState({ message, height }: { message: string; height: number }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500"
      style={{ minHeight: height }}
    >
      <span>{message}</span>
      <span className="text-xs text-slate-400">Domain performance populates after first lesson</span>
    </div>
  );
}
