'use client'

import type { AIRecommendation } from "@/lib/types/dashboard";

const urgencyMap: Record<AIRecommendation["urgency"], { label: string; className: string }> = {
  high: { label: "High", className: "bg-rose-100 text-rose-700" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700" },
  low: { label: "Low", className: "bg-emerald-100 text-emerald-700" }
};

const personaLabel: Record<AIRecommendation["persona"], string> = {
  learner: "Learner",
  group: "Group",
  family: "Family"
};

type RecommendationListProps = {
  recommendations: AIRecommendation[];
};

export function RecommendationList({ recommendations }: RecommendationListProps) {
  if (!recommendations?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        AI hasn’t queued any actions yet.
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {recommendations.map((recommendation) => {
        const urgency = urgencyMap[recommendation.urgency];
        return (
          <li key={recommendation.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>{personaLabel[recommendation.persona]}</span>
                <span>•</span>
                <span className={`rounded-full px-2 py-0.5 ${urgency.className}`}>{urgency.label}</span>
              </div>
              <p className="text-xs font-semibold text-slate-500">{recommendation.expectedImpact}</p>
            </div>
            <h4 className="mt-2 text-base font-semibold text-slate-900">{recommendation.title}</h4>
            <p className="text-sm text-slate-600">{recommendation.rationale}</p>
          </li>
        );
      })}
    </ul>
  );
}
