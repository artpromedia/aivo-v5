"use client";

/**
 * Self-Regulation Hub
 * A calming space for neurodiverse learners to manage emotions and focus
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EmotionCheckIn } from "./components/EmotionCheckIn";
import { ActivityCard } from "./components/ActivityCard";
import { BreathingExercise } from "./components/BreathingExercise";
import { MovementBreak } from "./components/MovementBreak";
import { GroundingActivity } from "./components/GroundingActivity";
import { RegulationHistory } from "./components/RegulationHistory";
import type {
  RegulationActivity,
  ActivityRecommendation,
} from "@aivo/api-client/src/regulation-contracts";
import {
  BREATHING_ACTIVITIES,
  MOVEMENT_ACTIVITIES,
  GROUNDING_ACTIVITIES,
  SENSORY_ACTIVITIES,
} from "@aivo/api-client/src/regulation-contracts";

type ActivityView = "hub" | "breathing" | "movement" | "grounding" | "history";

interface RegulationStats {
  totalSessions: number;
  completedSessions: number;
  avgMoodImprovement: number;
  mostEffectiveActivity?: string;
}

const API_BASE = "/api/regulation";

export default function SelfRegulationHub() {
  const [currentView, setCurrentView] = useState<ActivityView>("hub");
  const [selectedActivity, setSelectedActivity] = useState<RegulationActivity | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<ActivityRecommendation[]>([]);
  const [stats, setStats] = useState<RegulationStats | null>(null);
  const [currentEmotionLevel, setCurrentEmotionLevel] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(false);

  // Fetch recommendations on mount
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch(`${API_BASE}/recommendations`);
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
          setStats(data.stats || null);
          setCurrentEmotionLevel(data.currentEmotionLevel || 3);
        }
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchRecommendations();
  }, []);

  // Start an activity session
  const startActivity = useCallback(async (activity: RegulationActivity) => {
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType: activity.type,
          activityName: activity.name,
          moodBefore: currentEmotionLevel,
          context: { startedFrom: "hub" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSessionId(data.session.id);
        setSelectedActivity(activity);
        
        // Navigate to appropriate view
        if (activity.type === "BREATHING") setCurrentView("breathing");
        else if (activity.type === "MOVEMENT") setCurrentView("movement");
        else if (activity.type === "GROUNDING") setCurrentView("grounding");
      }
    } catch (err) {
      console.error("Failed to start activity:", err);
    }
  }, [currentEmotionLevel]);

  // Complete an activity session
  const completeActivity = useCallback(async (moodAfter: number, durationSeconds: number) => {
    if (!currentSessionId) return;
    
    try {
      await fetch(`${API_BASE}/sessions/${currentSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodAfter, durationSeconds }),
      });
      
      setCurrentEmotionLevel(moodAfter);
      setCurrentSessionId(null);
      setSelectedActivity(null);
      setCurrentView("hub");
      setShowCheckIn(true);
    } catch (err) {
      console.error("Failed to complete activity:", err);
    }
  }, [currentSessionId]);

  // Log an emotion check-in
  const logEmotion = useCallback(async (emotionLevel: number, emotionLabel?: string) => {
    try {
      await fetch(`${API_BASE}/emotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotionLevel, emotionLabel }),
      });
      setCurrentEmotionLevel(emotionLevel);
      setShowCheckIn(false);
    } catch (err) {
      console.error("Failed to log emotion:", err);
    }
  }, []);

  // Respect reduce-motion preference
  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  const motionProps = prefersReducedMotion 
    ? {} 
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3 },
      };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-lavender-50 via-white to-mint-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-lavender-200 rounded-full animate-pulse" />
          <p className="text-slate-500">Loading your calm space...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-lavender-50 via-white to-mint-50 p-4 md:p-6">
      {/* Decorative calming background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-40 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-mint/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sky/10 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {currentView === "hub" && (
          <motion.div key="hub" {...motionProps} className="relative max-w-4xl mx-auto">
            {/* Header */}
            <header className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                🌈 Self-Regulation Hub
              </h1>
              <p className="text-slate-600 text-lg">
                Your calm corner. Take a breath. You're doing great.
              </p>
            </header>

            {/* Quick Emotion Check-in */}
            <section className="mb-8">
              <EmotionCheckIn
                currentLevel={currentEmotionLevel}
                onCheckIn={logEmotion}
                compact={!showCheckIn}
                onExpand={() => setShowCheckIn(true)}
              />
            </section>

            {/* Recommended Activities */}
            {recommendations.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <span>✨</span> Recommended for You
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.slice(0, 2).map((rec, idx) => (
                    <ActivityCard
                      key={rec.activity.id}
                      activity={rec.activity}
                      reason={rec.reason}
                      featured={idx === 0}
                      onStart={() => startActivity(rec.activity)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Activity Categories */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-700 mb-4">
                🎯 Choose an Activity
              </h2>

              {/* Breathing Exercises */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-primary-600 mb-3 flex items-center gap-2">
                  <span>🌬️</span> Breathing Exercises
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {BREATHING_ACTIVITIES.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onStart={() => startActivity(activity)}
                    />
                  ))}
                </div>
              </div>

              {/* Movement Breaks */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-mint-dark mb-3 flex items-center gap-2">
                  <span>🏃</span> Movement Breaks
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {MOVEMENT_ACTIVITIES.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onStart={() => startActivity(activity)}
                    />
                  ))}
                </div>
              </div>

              {/* Grounding Activities */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-sky-dark mb-3 flex items-center gap-2">
                  <span>🌿</span> Grounding Activities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {GROUNDING_ACTIVITIES.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onStart={() => startActivity(activity)}
                    />
                  ))}
                </div>
              </div>

              {/* Sensory Activities */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-sunshine-dark mb-3 flex items-center gap-2">
                  <span>🎵</span> Sensory Activities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SENSORY_ACTIVITIES.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onStart={() => startActivity(activity)}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Progress & History */}
            {stats && (
              <section className="mb-8">
                <button
                  onClick={() => setCurrentView("history")}
                  className="w-full bg-white rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow text-left"
                >
                  <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <span>📊</span> Your Progress
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary-600">{stats.completedSessions}</p>
                      <p className="text-sm text-slate-500">Sessions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-mint-dark">
                        +{stats.avgMoodImprovement.toFixed(1)}
                      </p>
                      <p className="text-sm text-slate-500">Avg Improvement</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-sky-dark">
                        {stats.mostEffectiveActivity || "—"}
                      </p>
                      <p className="text-sm text-slate-500">Best Activity</p>
                    </div>
                  </div>
                  <p className="text-sm text-primary-500 mt-4 text-center">
                    Tap to see full history →
                  </p>
                </button>
              </section>
            )}
          </motion.div>
        )}

        {currentView === "breathing" && selectedActivity && (
          <motion.div key="breathing" {...motionProps}>
            <BreathingExercise
              activity={selectedActivity}
              onComplete={completeActivity}
              onBack={() => {
                setCurrentView("hub");
                setSelectedActivity(null);
                setCurrentSessionId(null);
              }}
            />
          </motion.div>
        )}

        {currentView === "movement" && selectedActivity && (
          <motion.div key="movement" {...motionProps}>
            <MovementBreak
              activity={selectedActivity}
              onComplete={completeActivity}
              onBack={() => {
                setCurrentView("hub");
                setSelectedActivity(null);
                setCurrentSessionId(null);
              }}
            />
          </motion.div>
        )}

        {currentView === "grounding" && selectedActivity && (
          <motion.div key="grounding" {...motionProps}>
            <GroundingActivity
              activity={selectedActivity}
              onComplete={completeActivity}
              onBack={() => {
                setCurrentView("hub");
                setSelectedActivity(null);
                setCurrentSessionId(null);
              }}
            />
          </motion.div>
        )}

        {currentView === "history" && (
          <motion.div key="history" {...motionProps}>
            <RegulationHistory onBack={() => setCurrentView("hub")} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
