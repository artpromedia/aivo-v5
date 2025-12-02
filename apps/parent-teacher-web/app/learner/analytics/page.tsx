"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../AuthProvider";
import type { LearnerAnalyticsOverview } from "@aivo/types";
import {
  Loader2,
  Lock,
  BarChart3,
  TrendingUp,
  Brain,
  Sprout,
  MessageCircle,
  Heart,
  ArrowLeft,
  FileText,
} from "lucide-react";

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
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-violet-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign In Required</h2>
          <p className="text-slate-600 mb-4">
            Please sign in to view learner progress
          </p>
          <Link
            href="/login"
            className="block w-full py-3 bg-theme-primary hover:bg-theme-primary/90 text-white font-semibold rounded-2xl shadow-lg transition-all"
          >
            Sign In →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
      {/* Back Navigation */}
      <Link 
        href="/learner"
        className="inline-flex items-center gap-2 text-theme-primary hover:text-theme-primary/80 font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Overview
      </Link>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-theme-primary/60 to-theme-primary rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Progress & Insights</h1>
              <p className="text-slate-500 mt-1">
                Understand how AIVO sees your learner&apos;s progress and why it suggests certain difficulty levels
              </p>
            </div>
          </div>
        </header>

        {loading && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-3" />
            <p className="text-slate-500">Loading analytics...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-600 text-sm">Error: {error}</p>
          </div>
        )}

        {analytics && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Subject Progress */}
            <section className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-violet-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Subject Progress</h2>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Each subject shows how mastery and difficulty have changed over time.
              </p>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {analytics.subjects.map((s) => (
                  <article
                    key={s.subject}
                    className="bg-lavender-50 rounded-2xl p-4 border border-lavender-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-bold text-theme-primary uppercase tracking-wide">
                          {s.subject}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Enrolled: Grade {s.enrolledGrade} • Working at: Grade {s.currentAssessedGradeLevel}
                        </p>
                      </div>
                    </div>
                    {s.timeseries.length === 0 ? (
                      <div className="bg-white rounded-xl p-3 text-center">
                        <Sprout className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                        <p className="text-xs text-slate-500 mt-1">
                          No practice data yet. AIVO will build this view as your learner engages.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {s.timeseries.map((pt) => (
                          <div 
                            key={`${s.subject}-${pt.date}`} 
                            className="bg-white rounded-xl p-3 flex justify-between items-center"
                          >
                            <span className="text-xs font-medium text-slate-700">{pt.date}</span>
                            <div className="flex gap-3 text-xs">
                              <span className="bg-theme-primary/10 text-theme-primary px-2 py-1 rounded-full">
                                Mastery: {(pt.masteryScore * 100).toFixed(0)}%
                              </span>
                              <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded-full">
                                {pt.minutesPracticed} min
                              </span>
                              <span className="bg-mint-100 text-emerald-700 px-2 py-1 rounded-full">
                                Level {pt.difficultyLevel}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            {/* Difficulty Explanations */}
            <section className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-violet-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Why AIVO Chooses This Difficulty</h2>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                AIVO tries to be gentle and predictable. Here&apos;s how it explains its difficulty choices.
              </p>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {analytics.difficultySummaries.map((d) => (
                  <article
                    key={d.subject}
                    className="bg-lavender-50 rounded-2xl p-4 border border-lavender-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-bold text-theme-primary uppercase tracking-wide">
                          {d.subject}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 bg-white text-slate-700 rounded-full text-xs">
                            Current: Grade <span className="font-bold ml-1">{d.currentDifficultyLevel}</span>
                          </span>
                          <span className="inline-flex items-center px-2 py-1 bg-theme-primary/10 text-theme-primary rounded-full text-xs">
                            Target: Grade <span className="font-bold ml-1">{d.targetDifficultyLevel}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 bg-white rounded-xl p-3 flex items-start gap-2">
                      <MessageCircle className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                      <span>{d.rationale}</span>
                    </p>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">AIVO considers:</p>
                      <ul className="space-y-2">
                        {d.factors.map((f) => (
                          <li
                            key={f.label}
                            className="bg-white rounded-xl p-3 flex justify-between items-center gap-2"
                          >
                            <span className="text-xs font-semibold text-slate-700">{f.label}</span>
                            <span className="text-xs text-slate-500 text-right">{f.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
                {analytics.difficultySummaries.length === 0 && (
                  <div className="bg-lavender-50 rounded-2xl p-6 text-center">
                    <FileText className="w-8 h-8 text-violet-400 mx-auto mb-3" />
                    <p className="text-slate-600 text-sm">
                      AIVO doesn&apos;t have enough data yet to explain difficulty choices. Once baseline and sessions are recorded, you&apos;ll see detailed reasons here.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-4">
          <Heart className="w-4 h-4 text-violet-400" />
          Understanding helps us support your learner better
        </div>
      </div>
    </main>
  );
}
