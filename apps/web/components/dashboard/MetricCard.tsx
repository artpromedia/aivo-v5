'use client'

import type { TrendDirection } from "@/lib/types/dashboard";

export type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendDirection?: TrendDirection;
};

const directionClasses: Record<TrendDirection, string> = {
  up: "text-emerald-600 bg-emerald-50",
  down: "text-rose-600 bg-rose-50",
  flat: "text-slate-500 bg-slate-100"
};

export function MetricCard({ title, value, subtitle, trend, trendDirection = "up" }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      {trend && (
        <span
          className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${directionClasses[trendDirection]} w-fit`}
        >
          {trendDirection === "up" && "▲"}
          {trendDirection === "down" && "▼"}
          {trendDirection === "flat" && "■"}
          {trend}
        </span>
      )}
    </div>
  );
}
