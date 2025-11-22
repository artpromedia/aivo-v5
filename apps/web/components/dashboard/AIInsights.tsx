'use client'

import type { AIInsight } from "@/lib/types/dashboard";

type AIInsightsProps = {
  insights: AIInsight[];
  emptyLabel?: string;
};

export function AIInsights({ insights, emptyLabel = "AI will share insights once data appears" }: AIInsightsProps) {
  if (!insights?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <article key={`${insight.title}-${index}`} className="rounded-xl border border-slate-200 bg-blue-50/70 p-4">
          <div className="flex items-start gap-3">
            {insight.icon && <span className="text-2xl" aria-hidden>{insight.icon}</span>}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900">{insight.title}</h4>
                {insight.impact && (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-cyan-600">
                    {insight.impact}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">{insight.description}</p>
              {insight.action && <p className="text-xs font-semibold text-slate-900">Next: {insight.action}</p>}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
