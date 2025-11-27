"use client";

/**
 * RegulationHistory Component
 * Shows learner's progress, patterns, and session history
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type {
  RegulationSession,
  EmotionRecord,
  RegulationStats,
} from "@aivo/api-client/src/regulation-contracts";

interface RegulationHistoryProps {
  onBack: () => void;
}

const API_BASE = "/api/regulation";

const ACTIVITY_EMOJIS: Record<string, string> = {
  BREATHING: "🌬️",
  MOVEMENT: "🏃",
  GROUNDING: "🌿",
  SENSORY: "🎵",
};

const MOOD_EMOJIS = ["😢", "😟", "😐", "😊", "😄"];

export function RegulationHistory({ onBack }: RegulationHistoryProps) {
  const [sessions, setSessions] = useState<RegulationSession[]>([]);
  const [emotions, setEmotions] = useState<EmotionRecord[]>([]);
  const [stats, setStats] = useState<RegulationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "emotions">("overview");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [sessionsRes, emotionsRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/sessions?limit=20`),
          fetch(`${API_BASE}/emotions?days=14&limit=50`),
          fetch(`${API_BASE}/stats`),
        ]);

        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setSessions(data.sessions || []);
        }
        if (emotionsRes.ok) {
          const data = await emotionsRes.json();
          setEmotions(data.emotions || []);
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchHistory();
  }, []);

  // Calculate emotion trends
  const calculateTrend = () => {
    if (emotions.length < 2) return { direction: "stable", change: 0 };
    
    const recent = emotions.slice(0, Math.min(5, emotions.length));
    const older = emotions.slice(Math.min(5, emotions.length), Math.min(10, emotions.length));
    
    if (older.length === 0) return { direction: "stable", change: 0 };
    
    const recentAvg = recent.reduce((sum, e) => sum + e.level, 0) / recent.length;
    const olderAvg = older.reduce((sum, e) => sum + e.level, 0) / older.length;
    const change = recentAvg - olderAvg;
    
    return {
      direction: change > 0.3 ? "improving" : change < -0.3 ? "declining" : "stable",
      change: Math.abs(change),
    };
  };

  const trend = calculateTrend();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-sky/20 rounded-full animate-pulse" />
        <p className="text-slate-500">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 p-2 rounded-xl bg-white/80 hover:bg-white shadow-soft transition-colors inline-flex items-center gap-2"
        aria-label="Go back"
      >
        ← Back to Hub
      </button>

      {/* Header */}
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        📊 Your Progress
      </h1>
      <p className="text-slate-600 mb-6">
        Track your regulation journey and see how far you've come!
      </p>

      {/* Stats Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-card mb-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-primary-50 rounded-xl">
              <p className="text-3xl font-bold text-primary-600">{stats.completedSessions}</p>
              <p className="text-sm text-slate-600">Sessions</p>
            </div>
            <div className="text-center p-4 bg-mint/20 rounded-xl">
              <p className="text-3xl font-bold text-mint-dark">
                {stats.emotionImprovementRate > 0 ? "+" : ""}{(stats.emotionImprovementRate * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-slate-600">Improvement Rate</p>
            </div>
            <div className="text-center p-4 bg-sky/20 rounded-xl">
              <p className="text-3xl font-bold text-sky-dark">
                {stats.mostEffectiveActivity ? ACTIVITY_EMOJIS[stats.mostEffectiveActivity] || "🌟" : "—"}
              </p>
              <p className="text-sm text-slate-600">Best Activity</p>
            </div>
            <div className="text-center p-4 bg-sunshine/20 rounded-xl">
              <p className="text-3xl font-bold text-sunshine-dark">
                {trend.direction === "improving" ? "📈" : trend.direction === "declining" ? "📉" : "➡️"}
              </p>
              <p className="text-sm text-slate-600">
                {trend.direction === "improving" ? "Improving!" : 
                 trend.direction === "declining" ? "Keep going" : "Steady"}
              </p>
            </div>
          </div>

          {/* Activity breakdown */}
          {stats.activityBreakdown && Object.keys(stats.activityBreakdown).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">Activity Breakdown</h3>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(stats.activityBreakdown).map(([type, count]) => (
                  <div
                    key={type}
                    className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-700"
                  >
                    {ACTIVITY_EMOJIS[type] || "🎯"} {type}: {count}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["overview", "sessions", "emotions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeTab === tab
                ? "bg-primary-500 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab === "overview" ? "📊 Overview" : 
             tab === "sessions" ? "🎯 Sessions" : "💚 Emotions"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Recent Mood Chart (Simple visual) */}
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Mood Pattern</h3>
            {emotions.length > 0 ? (
              <div className="flex items-end justify-between gap-2 h-32">
                {emotions.slice(0, 7).reverse().map((emotion, idx) => (
                  <div key={emotion.id} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-primary-400 to-primary-300 rounded-t-lg transition-all"
                      style={{ height: `${(emotion.level / 5) * 100}%` }}
                    />
                    <span className="text-lg mt-1">{MOOD_EMOJIS[emotion.level - 1]}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(emotion.createdAt).toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                Start checking in to see your mood patterns! 💚
              </p>
            )}
          </div>

          {/* Encouragement message */}
          <div className="bg-mint/10 rounded-2xl p-6 border-2 border-mint/30 text-center">
            <span className="text-4xl block mb-2">🌟</span>
            <p className="text-slate-700 font-medium">
              {stats && stats.completedSessions > 0
                ? `You've completed ${stats.completedSessions} regulation sessions! Keep up the amazing work!`
                : "Every check-in is a step towards understanding yourself better!"}
            </p>
          </div>
        </motion.div>
      )}

      {activeTab === "sessions" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-xl p-4 shadow-soft flex items-center gap-4"
              >
                <span className="text-2xl">
                  {ACTIVITY_EMOJIS[session.activityType] || "🎯"}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">
                    {session.activityId || session.activityType}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(session.createdAt).toLocaleDateString()} •{" "}
                    {session.durationSeconds
                      ? `${Math.floor(session.durationSeconds / 60)}:${String(session.durationSeconds % 60).padStart(2, "0")}`
                      : "In progress"}
                  </p>
                </div>
                {session.emotionLevelAfter && (
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-slate-500">
                        {session.emotionLevelBefore ? MOOD_EMOJIS[session.emotionLevelBefore - 1] : "—"}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="text-lg">
                        {MOOD_EMOJIS[session.emotionLevelAfter - 1]}
                      </span>
                    </div>
                    {session.emotionLevelBefore && session.emotionLevelAfter > session.emotionLevelBefore && (
                      <span className="text-xs text-mint-dark font-medium">
                        +{session.emotionLevelAfter - session.emotionLevelBefore}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-soft text-center">
              <span className="text-4xl block mb-2">🎯</span>
              <p className="text-slate-600">
                No sessions yet. Try an activity to get started!
              </p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === "emotions" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {emotions.length > 0 ? (
            emotions.map((emotion) => (
              <div
                key={emotion.id}
                className="bg-white rounded-xl p-4 shadow-soft flex items-center gap-4"
              >
                <span className="text-3xl">
                  {MOOD_EMOJIS[emotion.level - 1]}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">
                    {emotion.emotion || `Feeling ${emotion.level}/5`}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(emotion.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  {emotion.trigger && (
                    <p className="text-sm text-slate-600 mt-1">Trigger: {emotion.trigger}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-soft text-center">
              <span className="text-4xl block mb-2">💚</span>
              <p className="text-slate-600">
                No check-ins yet. How are you feeling right now?
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
