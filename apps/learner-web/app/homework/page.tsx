/**
 * Homework Helper Page
 * 
 * Main entry point for the scaffolded homework assistance feature.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HomeworkHelper } from "./components";
import Link from "next/link";
import type { HomeworkSession, HomeworkDifficultyMode } from "@aivo/api-client/src/homework-contracts";

interface LearnerInfo {
  id: string;
  displayName: string;
  gradeLevel: number;
}

export default function HomeworkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [learner, setLearner] = useState<LearnerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<HomeworkSession[]>([]);
  const [showNewSession, setShowNewSession] = useState(false);
  
  // Mode from query params
  const parentMode = searchParams.get("parent") === "true";
  const difficultyMode = (searchParams.get("mode") as HomeworkDifficultyMode) || "SCAFFOLDED";
  const sessionId = searchParams.get("session");

  // Fetch learner info and recent sessions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch current user/learner
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) throw new Error("Not authenticated");
        const me = await meRes.json();
        
        if (!me.learner) {
          router.replace("/");
          return;
        }

        setLearner({
          id: me.learner.id,
          displayName: me.learner.displayName,
          gradeLevel: me.learner.gradeLevel || 6
        });

        // Fetch recent homework sessions
        const sessionsRes = await fetch(
          `/api/homework/sessions?learnerId=${me.learner.id}&limit=5`
        );
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setRecentSessions(data.sessions || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleComplete = (session: HomeworkSession) => {
    // Refresh recent sessions
    setRecentSessions(prev => [session, ...prev.slice(0, 4)]);
    setShowNewSession(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-lavender-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading Homework Helper...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !learner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-lavender-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-md text-center">
          <span className="text-4xl mb-4 block">😅</span>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Oops!</h1>
          <p className="text-slate-600 mb-6">{error || "Could not load your profile"}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Show homework helper if starting new session or continuing one
  if (showNewSession || sessionId) {
    return (
      <HomeworkHelper
        learnerId={learner.id}
        learnerName={learner.displayName.split(" ")[0]}
        gradeLevel={learner.gradeLevel}
        onComplete={handleComplete}
        parentAssistMode={parentMode}
        initialDifficultyMode={difficultyMode}
      />
    );
  }

  // Main homework hub
  return (
    <div className="min-h-screen bg-gradient-to-b from-lavender-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-2xl">📚</Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Homework Helper
              </h1>
              <p className="text-sm text-slate-500">
                Hi, {learner.displayName.split(" ")[0]}! 👋
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
          >
            ← Back
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome card */}
        <div className="bg-white rounded-2xl shadow-card p-8 mb-8">
          <div className="text-center mb-6">
            <span className="text-5xl mb-4 block">📝</span>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Need help with homework?
            </h2>
            <p className="text-slate-600 max-w-md mx-auto">
              I'll guide you through it step by step. Just take a photo or type your problem!
            </p>
          </div>

          {/* Start button */}
          <button
            onClick={() => setShowNewSession(true)}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold text-lg hover:from-primary-700 hover:to-primary-600 transition-all shadow-soft-primary"
          >
            🚀 Start New Problem
          </button>

          {/* Difficulty mode selector */}
          <div className="mt-6 flex justify-center gap-2">
            <span className="text-sm text-slate-500">Mode:</span>
            {(["SIMPLIFIED", "SCAFFOLDED", "STANDARD"] as const).map((mode) => (
              <Link
                key={mode}
                href={`/homework?mode=${mode}`}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  difficultyMode === mode
                    ? "bg-primary-100 text-primary-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {mode === "SIMPLIFIED" ? "Extra Help" : mode === "SCAFFOLDED" ? "Guided" : "Independent"}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span>📋</span>
              Recent Homework
            </h3>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/homework?session=${session.id}`}
                  className="block p-4 bg-slate-50 rounded-xl hover:bg-lavender-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{session.title}</p>
                      <p className="text-sm text-slate-500">
                        {session.subject || "Math"} • {session.status === "COMPLETE" ? "✓ Completed" : `In progress (${session.status})`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                      {session.status !== "COMPLETE" && (
                        <span className="text-xs text-primary-600 font-medium">Continue →</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tips section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-mint/10 rounded-xl p-4 text-center">
            <span className="text-2xl mb-2 block">📷</span>
            <p className="text-sm font-medium text-mint-dark">Take a photo</p>
            <p className="text-xs text-slate-600 mt-1">
              Snap a picture of your homework
            </p>
          </div>
          <div className="bg-sunshine/10 rounded-xl p-4 text-center">
            <span className="text-2xl mb-2 block">💡</span>
            <p className="text-sm font-medium text-sunshine-dark">Get hints</p>
            <p className="text-xs text-slate-600 mt-1">
              Up to 3 hints per step
            </p>
          </div>
          <div className="bg-sky/10 rounded-xl p-4 text-center">
            <span className="text-2xl mb-2 block">✅</span>
            <p className="text-sm font-medium text-sky-dark">Check your work</p>
            <p className="text-xs text-slate-600 mt-1">
              Get instant feedback
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
