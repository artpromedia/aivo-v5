"use client";

/**
 * BreathingExercise Component
 * Animated breathing circle with visual guidance for calming exercises
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RegulationActivity } from "@aivo/api-client/src/regulation-contracts";

interface BreathingExerciseProps {
  activity: RegulationActivity;
  onComplete: (moodAfter: number, durationSeconds: number) => void;
  onBack: () => void;
}

type BreathPhase = "inhale" | "hold" | "exhale" | "rest";

// Breathing patterns for different exercises
const BREATHING_PATTERNS: Record<string, { inhale: number; hold: number; exhale: number; rest: number }> = {
  "4-7-8 Breathing": { inhale: 4, hold: 7, exhale: 8, rest: 0 },
  "Box Breathing": { inhale: 4, hold: 4, exhale: 4, rest: 4 },
  "Bubble Breathing": { inhale: 3, hold: 1, exhale: 5, rest: 1 },
  default: { inhale: 4, hold: 4, exhale: 4, rest: 2 },
};

const PHASE_INSTRUCTIONS: Record<BreathPhase, string> = {
  inhale: "Breathe in slowly...",
  hold: "Hold gently...",
  exhale: "Breathe out slowly...",
  rest: "Rest...",
};

const PHASE_COLORS: Record<BreathPhase, string> = {
  inhale: "from-lavender-400 to-primary-400",
  hold: "from-primary-400 to-sky",
  exhale: "from-sky to-mint",
  rest: "from-mint to-lavender-300",
};

export function BreathingExercise({ activity, onComplete, onBack }: BreathingExerciseProps) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [countdown, setCountdown] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pattern = BREATHING_PATTERNS[activity.name] || BREATHING_PATTERNS.default;
  // Get duration from activity (use totalDuration for breathing activities)
  const activityDuration = 'totalDuration' in activity ? activity.totalDuration : 120;
  const targetCycles = Math.ceil(activityDuration / (pattern.inhale + pattern.hold + pattern.exhale + pattern.rest));

  // Respect reduce-motion preference
  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  const getCircleScale = useCallback(() => {
    if (!isActive) return 1;
    switch (phase) {
      case "inhale": return 1.5;
      case "hold": return 1.5;
      case "exhale": return 1;
      case "rest": return 1;
      default: return 1;
    }
  }, [isActive, phase]);

  // Main breathing timer
  useEffect(() => {
    if (!isActive) return;

    const phases: BreathPhase[] = ["inhale", "hold", "exhale", "rest"];
    const durations = [pattern.inhale, pattern.hold, pattern.exhale, pattern.rest];
    let phaseIndex = 0;
    let timeInPhase = 0;

    const tick = () => {
      timeInPhase++;
      setCountdown(durations[phaseIndex] - timeInPhase);
      setElapsedSeconds((prev) => prev + 1);

      if (timeInPhase >= durations[phaseIndex]) {
        timeInPhase = 0;
        phaseIndex++;

        // Skip phases with 0 duration
        while (phaseIndex < phases.length && durations[phaseIndex] === 0) {
          phaseIndex++;
        }

        if (phaseIndex >= phases.length) {
          phaseIndex = 0;
          setCycleCount((prev) => {
            const newCount = prev + 1;
            if (newCount >= targetCycles) {
              setIsActive(false);
              setShowMoodCheck(true);
            }
            return newCount;
          });
        }

        setPhase(phases[phaseIndex]);
        setCountdown(durations[phaseIndex]);
      }
    };

    setCountdown(durations[0]);
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, pattern, targetCycles]);

  const startExercise = () => {
    setIsActive(true);
    setPhase("inhale");
    setCycleCount(0);
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();
  };

  const pauseExercise = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const finishEarly = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setShowMoodCheck(true);
  };

  const handleMoodSubmit = (mood: number) => {
    onComplete(mood, elapsedSeconds);
  };

  // Mood check screen
  if (showMoodCheck) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 shadow-card"
        >
          <span className="text-5xl mb-4 block">🌟</span>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Great job!
          </h2>
          <p className="text-slate-600 mb-6">
            You completed {cycleCount} breathing cycles in {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}
          </p>
          <p className="text-slate-700 font-medium mb-4">
            How do you feel now?
          </p>
          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => handleMoodSubmit(level)}
                className="w-14 h-14 rounded-xl bg-lavender-50 hover:bg-lavender-100 transition-colors text-2xl"
              >
                {["😢", "😟", "😐", "😊", "😄"][level - 1]}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-8 px-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 p-2 rounded-xl bg-white/80 hover:bg-white shadow-soft transition-colors"
        aria-label="Go back"
      >
        ← Back
      </button>

      {/* Header */}
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        🌬️ {activity.name}
      </h1>
      <p className="text-slate-600 mb-8">{activity.description}</p>

      {/* Breathing Circle */}
      <div className="relative w-64 h-64 mx-auto mb-8">
        {/* Background ring */}
        <div className="absolute inset-0 rounded-full border-4 border-lavender-200 opacity-50" />

        {/* Animated breathing circle */}
        <motion.div
          className={`
            absolute inset-8 rounded-full
            bg-gradient-to-br ${PHASE_COLORS[phase]}
            shadow-lg flex items-center justify-center
          `}
          animate={{
            scale: prefersReducedMotion ? 1 : getCircleScale(),
          }}
          transition={{
            duration: isActive ? (phase === "inhale" ? pattern.inhale : phase === "exhale" ? pattern.exhale : 0.5) : 0.3,
            ease: "easeInOut",
          }}
        >
          <div className="text-center text-white">
            {isActive ? (
              <>
                <p className="text-lg font-medium mb-1">{PHASE_INSTRUCTIONS[phase]}</p>
                <p className="text-4xl font-bold">{countdown}</p>
              </>
            ) : (
              <p className="text-lg font-medium">Ready</p>
            )}
          </div>
        </motion.div>

        {/* Progress indicator */}
        {isActive && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-soft">
            <span className="text-sm text-slate-600">
              Cycle {cycleCount + 1} of {targetCycles}
            </span>
          </div>
        )}
      </div>

      {/* Pattern info */}
      {!isActive && (
        <div className="bg-lavender-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-600">
            <span className="font-medium">Pattern:</span>{" "}
            Breathe in {pattern.inhale}s • Hold {pattern.hold}s • Breathe out {pattern.exhale}s
            {pattern.rest > 0 && ` • Rest ${pattern.rest}s`}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!isActive ? (
          <button
            onClick={startExercise}
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-2xl font-semibold shadow-soft-primary hover:shadow-lg transition-all"
          >
            Start Breathing 🌬️
          </button>
        ) : (
          <>
            <button
              onClick={pauseExercise}
              className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Pause
            </button>
            <button
              onClick={finishEarly}
              className="px-6 py-3 bg-mint text-mint-dark rounded-xl font-medium hover:bg-mint/80 transition-colors"
            >
              I feel better ✓
            </button>
          </>
        )}
      </div>

      {/* Elapsed time */}
      {isActive && (
        <p className="text-sm text-slate-500 mt-4">
          Time: {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}
        </p>
      )}
    </div>
  );
}
