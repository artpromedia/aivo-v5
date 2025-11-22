'use client'

import type { Accommodation } from "@/lib/accommodations/accommodation-manager";

export interface AccommodationEffectivenessPoint {
  accommodation: Accommodation | string;
  engagement: number;
  completion: number;
  accuracy: number;
  sampleSize: number;
}

interface EffectivenessChartProps {
  data: AccommodationEffectivenessPoint[];
}

export function EffectivenessChart({ data }: EffectivenessChartProps) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">Not enough interaction data yet. Encourage teachers to log sessions.</p>;
  }

  return (
    <div className="space-y-4">
      {data.map((point) => (
        <div key={String(point.accommodation)} className="rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between text-sm font-medium text-slate-800">
            <span>{formatAccommodation(String(point.accommodation))}</span>
            <span className="text-xs text-slate-500">n={point.sampleSize}</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <Metric label="Engagement" value={point.engagement} />
            <Metric label="Completion" value={point.completion} />
            <Metric label="Accuracy" value={point.accuracy} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(value * 100, 100)}%` }} />
        </div>
        <span className="text-sm font-semibold text-slate-800">{Math.round(value * 100)}%</span>
      </div>
    </div>
  );
}

function formatAccommodation(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(" ");
}
