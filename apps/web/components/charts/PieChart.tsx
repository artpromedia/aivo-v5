'use client'

import type { CSSProperties } from "react";
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts";

type PieChartProps<TData> = {
  data: TData[];
  valueKey: keyof TData;
  nameKey: keyof TData;
  height?: number;
  colors?: string[];
  style?: CSSProperties;
};

const defaultColors = ["#22c55e", "#fde047", "#fb923c", "#f43f5e", "#38bdf8"];

export function PieChart<TData extends Record<string, unknown>>({
  data,
  nameKey,
  valueKey,
  height = 240,
  colors = defaultColors,
  style
}: PieChartProps<TData>) {
  if (!data?.length) {
    return <EmptyChartState message="No distribution data yet" height={height} />;
  }

  return (
    <div style={{ height, width: "100%", ...style }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey={valueKey as string}
            nameKey={nameKey as string}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
          >
            {data.map((entry, index) => {
              const label = String(entry[nameKey as string] ?? index);
              const record = entry as Record<string, unknown>;
              const fill = typeof record.color === "string" ? (record.color as string) : colors[index % colors.length];
              return <Cell key={`${label}-${index}`} fill={fill} />;
            })}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value}%`, name]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
              background: "white"
            }}
          />
        </RechartsPieChart>
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
      <span className="text-xs text-slate-400">AI will visualize focus once data streams in</span>
    </div>
  );
}
