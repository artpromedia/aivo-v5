'use client'

import { Card, CardContent } from "@/components/ui/Card";

const domainIcons: Record<string, string> = {
  READING: "📖",
  MATH: "➗",
  SPEECH: "🗣️",
  SEL: "💞",
  SCIENCE: "🔬"
};

export interface KPICardProps {
  domain: string;
  current?: number;
  trend?: { improvement: number; struggling: boolean };
  prediction?: {
    predictedLevel30Days?: number;
    predictedLevel90Days?: number;
    recommendedIntervention?: string;
    confidence?: number;
  } | null;
}

export function KPICard({ domain, current, trend, prediction }: KPICardProps) {
  const icon = domainIcons[domain] ?? "📊";
  const delta = trend ? Number(trend.improvement.toFixed(1)) : 0;
  const deltaLabel = `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`;
  const isDown = (trend?.struggling ?? false) || delta < 0;

  return (
    <Card className="border-none bg-gradient-to-br from-white to-slate-50 shadow-soft">
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{domain.replace(/_/g, " ")}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{current ? `${current.toFixed(1)}%` : "--"}</p>
            <TrendBadge label={deltaLabel} down={isDown} />
          </div>
          <span className="text-3xl" aria-hidden>
            {icon}
          </span>
        </div>
        {prediction && (
          <div className="mt-4 rounded-2xl bg-white/70 p-3 text-xs text-slate-600">
            <p>
              30d: <strong>{prediction.predictedLevel30Days?.toFixed(1) ?? "--"}</strong> • 90d: <strong>{prediction.predictedLevel90Days?.toFixed(1) ?? "--"}</strong>
            </p>
            <p className="mt-1">{prediction.recommendedIntervention ?? "Consistent progress"}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrendBadge({ label, down }: { label: string; down: boolean }) {
  return (
    <span
      className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        down ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
      }`}
    >
      {down ? "▼" : "▲"} {label}
    </span>
  );
}
