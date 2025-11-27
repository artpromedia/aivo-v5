"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AivoApiClient } from "@aivo/api-client";
import { useAivoTheme } from "@aivo/ui";
import type {
  LearnerSession,
  Region,
  SessionActivity,
  SessionPlanRun,
  SubjectCode
} from "@aivo/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const client = new AivoApiClient(API_BASE_URL);
type MePayload = Awaited<ReturnType<typeof client.me>>;
type LearnerMeta = { id: string; region: Region };

export default function SessionPage() {
  const router = useRouter();
  const [session, setSession] = useState<LearnerSession | null>(null);
  const [me, setMe] = useState<MePayload | null>(null);
  const [learnerMeta, setLearnerMeta] = useState<LearnerMeta | null>(null);
  const [sessionPlan, setSessionPlan] = useState<SessionPlanRun | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBreakMessage, setShowBreakMessage] = useState(false);
  const [updatingActivityId, setUpdatingActivityId] = useState<string | null>(null);

  const getPrimarySubject = useCallback((learnerSubjects: string[] | undefined): SubjectCode => {
    const fallback: SubjectCode = "math";
    if (!learnerSubjects || learnerSubjects.length === 0) return fallback;
    const raw = learnerSubjects[0];
    const allowed: SubjectCode[] = ["math", "ela"];
    return (allowed as string[]).includes(raw) ? (raw as SubjectCode) : fallback;
  }, []);

  const ensureLearnerReady = useCallback(
    async (payload: MePayload): Promise<LearnerMeta | null> => {
      if (learnerMeta) {
        return learnerMeta;
      }
      const learnerId = payload.learner?.id;
      if (!learnerId) {
        router.replace("/baseline");
        return null;
      }
      const learnerDetails = await client.getLearner(learnerId);
      if (!learnerDetails.brainProfile) {
        router.replace("/baseline");
        return null;
      }
      const meta = { id: learnerDetails.learner.id, region: learnerDetails.learner.region as Region };
      setLearnerMeta(meta);
      return meta;
    },
    [learnerMeta, router]
  );

  const loadSessionPlan = useCallback(
    async (existingMe?: MePayload) => {
      setPlanLoading(true);
      setPlanError(null);
      try {
        const resolvedMe = existingMe ?? me ?? (await client.me());
        if (!me && !existingMe) {
          setMe(resolvedMe);
        }
        const meta = await ensureLearnerReady(resolvedMe);
        if (!meta) return;
        const subject = getPrimarySubject(resolvedMe.learner?.subjects);
        const plan = await client.planSession({
          learnerId: meta.id,
          subject,
          region: meta.region
        });
        setSessionPlan(plan.run);
      } catch (e) {
        setPlanError((e as Error).message);
      } finally {
        setPlanLoading(false);
      }
    },
    [ensureLearnerReady, getPrimarySubject, me]
  );

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const meRes = await client.me();
      setMe(meRes);
      const meta = await ensureLearnerReady(meRes);
      if (!meta) return;
      const subject = getPrimarySubject(meRes.learner?.subjects);
      const res = await client.getTodaySession(meta.id, subject);
      setSession(res.session);
      await loadSessionPlan(meRes);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [ensureLearnerReady, getPrimarySubject, loadSessionPlan]);

  async function handleStartSession() {
    setStarting(true);
    setError(null);
    try {
      const meRes = me ?? (await client.me());
      if (!me) setMe(meRes);
      const meta = await ensureLearnerReady(meRes);
      if (!meta) return;
      const subject = getPrimarySubject(meRes.learner?.subjects);
      const res = await client.startSession({
        learnerId: meta.id,
        subject
      });
      setSession(res.session);
      await loadSessionPlan(meRes);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStarting(false);
    }
  }

  async function updateActivityStatus(
    activity: SessionActivity,
    status: "in_progress" | "completed"
  ) {
    if (!session) return;
    setUpdatingActivityId(activity.id);
    setError(null);
    try {
      const res = await client.updateActivityStatus({
        sessionId: session.id,
        activityId: activity.id,
        status
      });
      setSession(res.session);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdatingActivityId(null);
    }
  }

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const theme = useAivoTheme();
  const todayLabel = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short"
  });

  const subjectLabel = (me?.learner?.subjects?.[0] ?? "math").toUpperCase();

  return (
    <main className="min-h-screen bg-gradient-to-b from-lavender-100 via-white to-slate-50 p-6">
      {/* Decorative elements */}
      <div className="fixed top-20 left-10 w-32 h-32 bg-primary-100 rounded-full opacity-40 blur-3xl" />
      <div className="fixed bottom-20 right-10 w-40 h-40 bg-mint/30 rounded-full opacity-40 blur-3xl" />
      
      <div className="max-w-2xl mx-auto relative">
        {/* Header */}
        <header className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="mb-4 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
          >
            ← Back to home
          </button>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Today's Learning 🌟</h1>
              <p className="text-sm text-slate-500">
                {todayLabel} • {subjectLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBreakMessage(true)}
              className="rounded-2xl bg-mint/20 px-4 py-2 text-sm font-medium text-mint-dark hover:bg-mint/30 transition-colors"
            >
              🧘 Take a break
            </button>
          </div>
        </header>

        {/* Break message */}
        {showBreakMessage && (
          <div className="mb-6 rounded-2xl bg-mint/10 border border-mint/30 p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌿</span>
              <div>
                <p className="text-mint-dark font-medium">It's okay to pause</p>
                <p className="text-sm text-slate-600 mt-1">
                  Take a breath, stretch, or get a drink of water. When you're ready, 
                  you can come back and continue—your session will wait for you. 💚
                </p>
                <button
                  type="button"
                  className="mt-3 text-sm font-medium text-mint-dark hover:underline"
                  onClick={() => setShowBreakMessage(false)}
                >
                  I'm ready to continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-500">Preparing today's learning plan…</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-coral-light rounded-2xl flex items-center gap-3">
            <span className="text-xl">😅</span>
            <p className="text-sm text-coral-dark">{error}</p>
          </div>
        )}

        {/* No session yet */}
        {!loading && !session && (
          <div className="bg-white rounded-3xl shadow-card p-8 text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🚀</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Ready to start?</h2>
            <p className="text-slate-600 mb-6">
              We'll create a gentle, personalized learning plan just for you today.
            </p>
            <button
              type="button"
              disabled={starting}
              onClick={handleStartSession}
              className="w-full rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4 text-base font-semibold text-white shadow-soft-primary hover:-translate-y-1 hover:shadow-lg transition-all disabled:opacity-60"
            >
              {starting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Preparing your session…
                </span>
              ) : (
                "✨ Start Learning"
              )}
            </button>
          </div>
        )}

        {/* Active session */}
        {session && (
          <div className="space-y-6">
            {/* Session info card */}
            <div className="bg-white rounded-3xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Your Session</p>
                    <p className="text-sm text-slate-500">
                      {session.plannedMinutes} minutes planned
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  session.status === 'completed' 
                    ? 'bg-mint/20 text-mint-dark' 
                    : session.status === 'active'
                    ? 'bg-sunshine/20 text-sunshine-dark'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {session.status === 'completed' ? '✅ Complete' : 
                   session.status === 'active' ? '🔄 In Progress' : '📋 Planned'}
                </span>
              </div>
            </div>

            {/* Activities list */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 px-1">Activities</h3>
              {session.activities.map((activity, index) => {
                const isCurrent = activity.status === "pending" || activity.status === "in_progress";
                const isComplete = activity.status === "completed";

                return (
                  <div
                    key={activity.id}
                    className={`bg-white rounded-2xl shadow-card p-5 transition-all ${
                      isCurrent ? 'ring-2 ring-primary-200' : ''
                    } ${isComplete ? 'opacity-75' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                        isComplete ? 'bg-mint/20' :
                        activity.status === 'in_progress' ? 'bg-sunshine/20' :
                        'bg-primary-50'
                      }`}>
                        {isComplete ? '✅' : 
                         activity.status === 'in_progress' ? '⏳' : 
                         `${index + 1}`}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-medium text-primary-600 uppercase">
                              {activity.type.replace("_", " ")}
                            </span>
                            <h4 className="font-semibold text-slate-900 mt-1">
                              {activity.title}
                            </h4>
                          </div>
                          <span className="text-xs text-slate-400">
                            ~{activity.estimatedMinutes} min
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                          {activity.instructions}
                        </p>
                        
                        {/* Action buttons */}
                        <div className="mt-4 flex gap-2">
                          {activity.status === "pending" && (
                            <button
                              type="button"
                              disabled={updatingActivityId === activity.id}
                              onClick={() => updateActivityStatus(activity, "in_progress")}
                              className="rounded-xl bg-primary-50 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-100 transition-colors disabled:opacity-60"
                            >
                              {updatingActivityId === activity.id ? "Starting…" : "▶️ Start"}
                            </button>
                          )}
                          {activity.status === "in_progress" && (
                            <button
                              type="button"
                              disabled={updatingActivityId === activity.id}
                              onClick={() => updateActivityStatus(activity, "completed")}
                              className="rounded-xl bg-mint px-4 py-2 text-sm font-semibold text-mint-dark hover:bg-mint-light transition-colors disabled:opacity-60"
                            >
                              {updatingActivityId === activity.id ? "Saving…" : "✅ Mark done"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Session plan preview */}
            {(planLoading || sessionPlan || planError) && (
              <div className="bg-lavender-100 rounded-3xl p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">📋 Session Plan</h3>
                  {sessionPlan && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await client.recordFeedback({
                              targetType: "session_plan",
                              targetId: sessionPlan.plan.id,
                              rating: 5,
                              label: "helpful_plan"
                            });
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="text-xs text-slate-500 hover:text-mint-dark"
                      >
                        👍 Helpful
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await client.recordFeedback({
                              targetType: "session_plan",
                              targetId: sessionPlan.plan.id,
                              rating: 2,
                              label: "needs_improvement"
                            });
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="text-xs text-slate-500 hover:text-coral"
                      >
                        👎 Needs work
                      </button>
                    </div>
                  )}
                </div>

                {planLoading && (
                  <p className="text-sm text-slate-500">Preparing a gentle plan…</p>
                )}
                {planError && (
                  <p className="text-sm text-coral">{planError}</p>
                )}
                {sessionPlan && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white/60 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Objective</p>
                        <p className="text-sm font-medium text-slate-800">{sessionPlan.insights.objective}</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Tone</p>
                        <p className="text-sm font-medium text-slate-800">{sessionPlan.insights.tone}</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Difficulty</p>
                        <p className="text-sm font-medium text-slate-800">{sessionPlan.insights.difficultySummary}</p>
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-2">🧘 Calming Strategies</p>
                      <div className="flex flex-wrap gap-2">
                        {sessionPlan.insights.calmingStrategies.map((strategy: string, idx: number) => (
                          <span key={`${strategy}-${idx}`} className="text-xs bg-mint/20 text-mint-dark px-2 py-1 rounded-lg">
                            {strategy}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Encouragement footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-sm text-slate-400">
            You're doing amazing! Every step counts. 🌟
          </p>
        </div>
      </div>
    </main>
  );
}
