'use client'

import type { CSSProperties } from "react";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type LineChartProps<TData> = {
  data: TData[];
  xKey: keyof TData;
  yKey: keyof TData;
  height?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
};

export function LineChart<TData extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  height = 260,
  color = "#f97316",
  strokeWidth = 3,
  style
}: LineChartProps<TData>) {
  if (!data?.length) {
    return <EmptyChartState message="No trend data yet" height={height} />;
  }

  const formatTick = (value: string | number) => {
    if (typeof value === "string" && value.includes("T")) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString("en", { month: "short", day: "numeric" });
      }
    }
    return typeof value === "string" ? value : String(value);
  };

  return (
    <div style={{ height, width: "100%", ...style }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 8, left: 4, right: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey={xKey as string}
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatTick}
          />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
              background: "white"
            }}
          />
          <Line
            type="monotone"
            dataKey={yKey as string}
            stroke={color}
            strokeWidth={strokeWidth}
            dot={{ r: 4, strokeWidth: 2, fill: "white" }}
            activeDot={{ r: 6 }}
          />
        </RechartsLineChart>
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
      <span className="text-xs text-slate-400">Data will stream in once learners start a session</span>
    </div>
  );
}
