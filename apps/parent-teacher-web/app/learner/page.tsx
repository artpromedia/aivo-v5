"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AivoApiClient } from "@aivo/api-client";
import type {
  CaregiverLearnerOverview,
  NotificationSummary,
  DifficultyChangeProposal
} from "@aivo/types";

const client = new AivoApiClient(
  typeof window === "undefined"
    ? "http://localhost:4000"
    : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000",
  async () => null
);

function LearnerOverviewInner() {
  const searchParams = useSearchParams();
  const learnerId = searchParams.get("learnerId") ?? "demo-learner";
  const [overview, setOverview] = useState<CaregiverLearnerOverview | null>(null);
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [processingProposalId, setProcessingProposalId] = useState<string | null>(null);
  const [markingNotifId, setMarkingNotifId] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.getCaregiverLearnerOverview(learnerId);
      setOverview(res.overview);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [learnerId]);

  const loadNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    setNotifError(null);
    try {
      const res = await client.listNotifications();
      setNotifications(res.items);
    } catch (e) {
      setNotifError((e as Error).message);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  async function handleDecision(proposalId: string, approve: boolean) {
    setProcessingProposalId(proposalId);
    try {
      await client.decideOnDifficultyProposal({ proposalId, approve });
      await loadOverview();
      await loadNotifications();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessingProposalId(null);
    }
  }

  async function markNotificationRead(id: string) {
    setMarkingNotifId(id);
    try {
      await client.markNotificationRead(id);
      await loadNotifications();
    } catch (e) {
      setNotifError((e as Error).message);
    } finally {
      setMarkingNotifId(null);
    }
  }

  useEffect(() => {
    void loadOverview();
    void loadNotifications();
  }, [learnerId, loadOverview, loadNotifications]);

  const learnerName = overview?.learner.displayName ?? "Your learner";

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
      {/* Back Navigation */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-theme-primary hover:text-theme-primary/80 font-medium mb-6"
      >
        <span className="text-lg">←</span> Back to Dashboard
      </Link>

      <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[2fr,1fr]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Card */}
          <header className="bg-white rounded-3xl shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-theme-primary/60 to-theme-primary rounded-2xl flex items-center justify-center text-3xl">
                👧
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {learnerName}&apos;s Learning Journey
                </h1>
                <p className="text-slate-500 mt-1">
                  See how AIVO is supporting your learner
                </p>
                {overview && (
                  <div className="flex gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-1 bg-lavender-100 text-theme-primary rounded-full text-xs font-medium">
                      Grade {overview.learner.currentGrade}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                      📍 {overview.learner.region}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {loading && (
            <div className="bg-white rounded-3xl shadow-lg p-6 text-center">
              <div className="animate-spin text-3xl mb-2">🌟</div>
              <p className="text-slate-500">Loading learner overview...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-red-600 text-sm">Error: {error}</p>
            </div>
          )}

          {overview && (
            <>
              {/* Subjects & Levels */}
              <section className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📚</span>
                  <h2 className="text-lg font-semibold text-slate-900">Subjects & Levels</h2>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  AIVO compares enrolled grade with functional level to gently adjust difficulty.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {overview.subjects.map((s) => (
                    <article
                      key={s.subject}
                      className="bg-lavender-50 rounded-2xl p-4 border border-lavender-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-theme-primary uppercase tracking-wide">
                            {s.subject}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            Enrolled: <span className="font-semibold">Grade {s.enrolledGrade}</span>
                          </p>
                          <p className="text-sm text-slate-600">
                            Working at: <span className="font-semibold text-theme-primary">Grade {s.assessedGradeLevel}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Mastery</p>
                          <p className="text-2xl font-bold text-theme-primary">
                            {(s.masteryScore * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-lavender-200 flex justify-between items-center">
                        <span className="text-xs text-slate-500">AIVO suggests:</span>
                        <span
                          className={`text-xs font-semibold rounded-full px-3 py-1 ${
                            s.difficultyRecommendation === "harder"
                              ? "bg-emerald-100 text-emerald-700"
                              : s.difficultyRecommendation === "easier"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {s.difficultyRecommendation === "harder" && "⬆️ "}
                          {s.difficultyRecommendation === "easier" && "⬇️ "}
                          {s.difficultyRecommendation
                            ? s.difficultyRecommendation.charAt(0).toUpperCase() + s.difficultyRecommendation.slice(1)
                            : "Maintain"}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Baseline Summary */}
              <section className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🎯</span>
                  <h2 className="text-lg font-semibold text-slate-900">Baseline Summary</h2>
                </div>
                {overview.lastBaselineSummary ? (
                  <>
                    <p className="text-slate-600 mb-4">
                      {overview.lastBaselineSummary.notes}
                    </p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {overview.lastBaselineSummary.subjectLevels.map((lvl) => (
                        <div key={lvl.subject} className="flex items-center gap-2 bg-lavender-50 rounded-xl p-3">
                          <span className="text-lg">📖</span>
                          <span className="text-sm text-slate-700">
                            <span className="font-semibold">{lvl.subject}</span>: enrolled {lvl.enrolledGrade}, working at Grade {lvl.assessedGradeLevel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-lavender-50 rounded-2xl p-4 text-center">
                    <span className="text-3xl mb-2 block">📝</span>
                    <p className="text-slate-500">No baseline summary yet. It will appear after assessment.</p>
                  </div>
                )}
              </section>

              {/* Difficulty Approvals */}
              <section className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">✅</span>
                  <h2 className="text-lg font-semibold text-slate-900">Difficulty Approvals</h2>
                </div>
                {overview.pendingDifficultyProposals.length === 0 ? (
                  <div className="bg-mint-50 rounded-2xl p-4 text-center">
                    <span className="text-3xl mb-2 block">🎉</span>
                    <p className="text-emerald-700">All caught up! No pending approvals.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {overview.pendingDifficultyProposals.map((p: DifficultyChangeProposal) => (
                      <li
                        key={p.id}
                        className="bg-sunshine-50 border border-amber-200 rounded-2xl p-4"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{p.direction === "harder" ? "⬆️" : "⬇️"}</span>
                              <p className="font-semibold text-slate-900">
                                {p.subject.toUpperCase()}
                              </p>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">
                              Change from Grade {p.fromAssessedGradeLevel} to Grade {p.toAssessedGradeLevel}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              Reason: {p.rationale}
                            </p>
                          </div>
                          <span className="text-xs font-semibold rounded-full px-3 py-1 bg-amber-200 text-amber-800">
                            PENDING
                          </span>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            disabled={processingProposalId === p.id}
                            onClick={() => handleDecision(p.id, true)}
                            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-60"
                          >
                            {processingProposalId === p.id ? "Approving..." : "✓ Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={processingProposalId === p.id}
                            onClick={() => handleDecision(p.id, false)}
                            className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-60"
                          >
                            {processingProposalId === p.id ? "Rejecting..." : "✗ Reject"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Notifications */}
          <section className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔔</span>
              <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            </div>
            {loadingNotifs && (
              <p className="text-sm text-slate-400">Loading notifications...</p>
            )}
            {notifError && (
              <p className="text-sm text-red-500">Error: {notifError}</p>
            )}
            {notifications.length === 0 && !loadingNotifs && (
              <div className="bg-lavender-50 rounded-2xl p-4 text-center">
                <span className="text-2xl mb-2 block">📭</span>
                <p className="text-slate-500 text-sm">No notifications yet</p>
              </div>
            )}
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="bg-lavender-50 rounded-2xl p-4 border border-lavender-200"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{n.body}</p>
                    </div>
                    <span className="text-xs text-slate-400">{n.createdAtFriendly}</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={markingNotifId === n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className="text-xs font-medium rounded-full px-3 py-1 bg-theme-primary/10 text-theme-primary hover:bg-theme-primary/20 transition-all disabled:opacity-60"
                    >
                      {markingNotifId === n.id ? "Marking..." : "Mark as read"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Recent Activity */}
          {overview && (
            <section className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📅</span>
                <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              </div>
              {overview.recentSessionDates.length === 0 ? (
                <div className="bg-sky-50 rounded-2xl p-4 text-center">
                  <span className="text-2xl mb-2 block">🌱</span>
                  <p className="text-sky-700 text-sm">No recent sessions yet. AIVO will suggest practice when your learner starts.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {overview.recentSessionDates.map((d) => (
                    <li key={d} className="flex items-center gap-2 bg-lavender-50 rounded-xl p-3">
                      <span className="text-lg">📖</span>
                      <span className="text-sm text-slate-700">{d}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

export default function LearnerOverviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50 to-lavender-100">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🌟</div>
          <p className="text-slate-600">Loading learner overview...</p>
        </div>
      </div>
    }>
      <LearnerOverviewInner />
    </Suspense>
  );
}
