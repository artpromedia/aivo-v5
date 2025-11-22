'use client'

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import type { AIRecommendation, TeacherStudentSummary } from "@/lib/types/dashboard";

export function AIRecommendations({ recommendations, students }: { recommendations: AIRecommendation[]; students: TeacherStudentSummary[] }) {
  const [highlighted, setHighlighted] = useState<AIRecommendation[]>(recommendations.slice(0, 3));

  useEffect(() => {
    setHighlighted(recommendations.slice(0, 3));
  }, [recommendations]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Class Insights" subtitle="AI-generated snapshots" />
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {highlighted.map((insight) => (
              <InsightCard key={insight.id} icon="✨" title={insight.title} description={insight.rationale} action="View Details" />
            ))}
            {!highlighted.length && <p className="text-sm text-slate-500">No insights yet.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Student Recommendations" subtitle="Prioritized by urgency" />
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{findStudentName(rec, students)}</h4>
                    <p className="text-sm text-slate-600">{rec.rationale}</p>
                  </div>
                  <PriorityPill priority={rec.urgency} />
                </div>
                <div className="mt-3 flex gap-2 text-sm">
                  <button className="rounded bg-blue-500 px-3 py-1 text-white">Implement</button>
                  <button className="rounded border border-slate-200 px-3 py-1">Customize</button>
                  <button className="rounded border border-slate-200 px-3 py-1">Dismiss</button>
                </div>
              </div>
            ))}
            {!recommendations.length && <p className="text-sm text-slate-500">AI recommendations will appear once assessments are complete.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InsightCard({ icon, title, description, action }: { icon: string; title: string; description: string; action: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-2xl">{icon}</div>
      <h4 className="mt-3 text-base font-semibold text-slate-900">{title}</h4>
      <p className="text-sm text-slate-500">{description}</p>
      <button className="mt-3 text-sm font-semibold text-blue-600">{action}</button>
    </div>
  );
}

function PriorityPill({ priority }: { priority: AIRecommendation["urgency"] }) {
  const map = {
    high: "bg-rose-100 text-rose-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-emerald-100 text-emerald-700"
  } as const;
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${map[priority]}`}>{priority.toUpperCase()}</span>;
}

function findStudentName(rec: AIRecommendation, students: TeacherStudentSummary[]) {
  if (rec.persona === "learner") {
    const match = students.find((student) => rec.title.includes(student.firstName) || rec.title.includes(student.lastName));
    if (match) {
      return `${match.firstName} ${match.lastName}`;
    }
  }
  return rec.title;
}
