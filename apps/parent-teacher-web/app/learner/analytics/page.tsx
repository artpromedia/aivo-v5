"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../AuthProvider";
import type { LearnerAnalyticsOverview } from "@aivo/types";

const MOCK_LEARNER_ID = "demo-learner";

export default function LearnerAnalyticsPage() {
  const { apiClient, state } = useAuth();
  const [analytics, setAnalytics] = useState<LearnerAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.user) return;
    setLoading(true);
    setError(null);
    apiClient
      .getLearnerAnalytics(MOCK_LEARNER_ID)
      .then((res) => setAnalytics(res.analytics))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [apiClient, state.user]);

  if (!state.user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <p className="text-sm">
          Please sign in to view learner progress. Go to <span className="font-mono">/login</span>.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-5xl space-y-4">
        <header className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex justify-between items-start gap-3">
          <div>
            <h1 className="text-xl font-semibold">Progress &amp; Insights</h1>
            <p className="text-xs text-slate-300 mt-1">
              Understand how AIVO sees your learner&apos;s progress and why it suggests certain difficulty levels.
            </p>
          </div>
        </header>

        {loading && (
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 text-xs text-slate-300">
            Loading analytics…
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-red-900/40 border border-red-700 p-3 text-xs text-red-100">
            Error: {error}
          </div>
        )}

        {analytics && (
          <div className="grid gap-4 md:grid-cols-[1.6fr,1.4fr]">
            <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
              <h2 className="text-sm font-semibold">Subject Progress</h2>
              <p className="text-[11px] text-slate-300">
                Each subject shows how mastery and difficulty have changed over time.
              </p>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {analytics.subjects.map((s) => (
                  <article
                    key={s.subject}
                    className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          {s.subject.toUpperCase()}
                        </p>
                        <p className="text-[11px] text-slate-300">
                          Enrolled grade: <span className="font-semibold">{s.enrolledGrade}</span>{" "}
                          • Working level: <span className="font-semibold">Grade {s.currentAssessedGradeLevel}</span>
                        </p>
                      </div>
                    </div>
                    {s.timeseries.length === 0 ? (
                      <p className="text-[11px] text-slate-500">
                        No practice data yet; AIVO will build this view as your learner engages.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {s.timeseries.map((pt) => (
                          <li key={`${s.subject}-${pt.date}`} className="flex justify-between">
                            <span>{pt.date}</span>
                            <span>
                              Mastery: {(pt.masteryScore * 100).toFixed(0)}% • Minutes: {pt.minutesPracticed} • Level: {pt.difficultyLevel}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
              <h2 className="text-sm font-semibold">Why AIVO Chooses This Difficulty</h2>
              <p className="text-[11px] text-slate-300">
                AIVO tries to be gentle and predictable. Here&apos;s how it explains its difficulty choices.
              </p>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {analytics.difficultySummaries.map((d) => (
                  <article
                    key={d.subject}
                    className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          {d.subject.toUpperCase()}
                        </p>
                        <p className="text-[11px] text-slate-200 mt-1">
                          Current level: grade <span className="font-semibold">{d.currentDifficultyLevel}</span>
                          {" • "}
                          Target (when ready): grade <span className="font-semibold">{d.targetDifficultyLevel}</span>
                        </p>
                        <p className="text-[11px] text-slate-300 mt-1">{d.rationale}</p>
                      </div>
                    </div>
                    <div className="mt-1">
                      <p className="text-[10px] text-slate-400 mb-1">AIVO considers:</p>
                      <ul className="space-y-1">
                        {d.factors.map((f) => (
                          <li
                            key={f.label}
                            className="flex justify-between gap-2 text-[11px] text-slate-300"
                          >
                            <span className="font-semibold">{f.label}</span>
                            <span className="text-slate-400 flex-1 text-right">{f.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
                {analytics.difficultySummaries.length === 0 && (
                  <p className="text-[11px] text-slate-400">
                    AIVO doesn&apos;t have enough data yet to explain difficulty choices. Once baseline and sessions are
                    recorded, you&apos;ll see detailed reasons here.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
