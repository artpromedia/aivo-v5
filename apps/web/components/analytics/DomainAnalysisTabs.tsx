'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { StatusBadge } from "@/components/ui/StatusBadge";

const DOMAINS = ["READING", "MATH", "SPEECH", "SEL", "SCIENCE"] as const;

type Trend = { improvement: number; struggling: boolean; daysStruggling: number };

type Prediction = {
  predictedLevel30Days?: number;
  predictedLevel90Days?: number;
  recommendedIntervention?: string;
  confidence?: number;
};

interface DomainAnalysisTabsProps {
  analytics?: {
    current: Record<string, number>;
    trends: Record<string, Trend>;
  } | null;
  predictions?: Record<string, Prediction> | null;
  benchmarks?: {
    neurotypical?: Record<string, number> | null;
    neurodiverse?: Record<string, number> | null;
    comparison?: Record<string, { vsNeurotypical: string; vsNeurodiverse: string; performance: string }> | null;
  } | null;
}

export function DomainAnalysisTabs({ analytics, predictions, benchmarks }: DomainAnalysisTabsProps) {
  return (
    <Tabs defaultValue={DOMAINS[0]} className="space-y-6">
      <TabsList className="flex flex-wrap gap-3">
        {DOMAINS.map((domain) => (
          <TabsTrigger key={domain} value={domain}>
            {domain}
          </TabsTrigger>
        ))}
      </TabsList>

      {DOMAINS.map((domain) => {
        const trend = analytics?.trends?.[domain];
        const prediction = predictions?.[domain];
        const comparison = benchmarks?.comparison?.[domain];
        return (
          <TabsContent key={domain} value={domain} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">Current score</p>
                <p className="text-4xl font-bold text-slate-900">{analytics?.current?.[domain]?.toFixed(1) ?? "--"}%</p>
              </div>
              <StatusBadge
                status={trend?.struggling ? "ALERT" : "HEALTHY"}
                label={trend?.struggling ? "Needs support" : "On track"}
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MetricBlock title="30 day forecast" value={prediction?.predictedLevel30Days?.toFixed(1)} subtitle="Projected level" />
              <MetricBlock title="90 day forecast" value={prediction?.predictedLevel90Days?.toFixed(1)} subtitle="Extended outlook" />
              <MetricBlock title="Confidence" value={`${Math.round((prediction?.confidence ?? 0) * 100)}%`} subtitle="Model certainty" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Benchmark comparison</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <ComparisonRow label="Neurotypical" value={comparison?.vsNeurotypical} />
                  <ComparisonRow label="Neurodiverse" value={comparison?.vsNeurodiverse} />
                  <ComparisonRow label="Performance" value={comparison?.performance?.replace(/_/g, " ")} />
                </dl>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-inner">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended action</p>
                <p className="mt-2 text-base text-slate-700">{prediction?.recommendedIntervention ?? "Continue current strategy"}</p>
                {trend?.struggling && (
                  <p className="mt-3 text-sm text-rose-500">
                    {trend.daysStruggling} days below mastery. Consider extra support sessions.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function MetricBlock({ title, value, subtitle }: { title: string; value?: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? "--"}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function ComparisonRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between text-slate-700">
      <span>{label}</span>
      <strong>{value ?? "--"}</strong>
    </div>
  );
}
