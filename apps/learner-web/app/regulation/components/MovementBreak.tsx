"use client";

/**
 * MovementBreak Component
 * Guided movement activities with visual instructions
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RegulationActivity } from "@aivo/api-client/src/regulation-contracts";

interface MovementBreakProps {
  activity: RegulationActivity;
  onComplete: (moodAfter: number, durationSeconds: number) => void;
  onBack: () => void;
}

// Movement instructions for different activities
const MOVEMENT_SEQUENCES: Record<string, { instruction: string; duration: number; emoji: string }[]> = {
  "Stretch Break": [
    { instruction: "Stand up tall and reach your arms high above your head", duration: 10, emoji: "🙆" },
    { instruction: "Slowly bend to the right, stretching your left side", duration: 8, emoji: "↗️" },
    { instruction: "Come back to center, then bend to the left", duration: 8, emoji: "↖️" },
    { instruction: "Roll your shoulders backwards 5 times", duration: 10, emoji: "🔄" },
    { instruction: "Roll your shoulders forwards 5 times", duration: 10, emoji: "🔄" },
    { instruction: "Gently nod your head up and down", duration: 8, emoji: "↕️" },
    { instruction: "Slowly turn your head left and right", duration: 8, emoji: "↔️" },
    { instruction: "Shake out your hands and arms", duration: 8, emoji: "👋" },
    { instruction: "Take a deep breath and relax your shoulders", duration: 10, emoji: "😌" },
  ],
  "Dance Break": [
    { instruction: "Start by bouncing gently on your feet", duration: 10, emoji: "🦶" },
    { instruction: "Sway your body side to side", duration: 10, emoji: "💃" },
    { instruction: "Move your arms like you're swimming", duration: 10, emoji: "🏊" },
    { instruction: "Do a little twist with your hips", duration: 10, emoji: "🌀" },
    { instruction: "March in place, lifting your knees high", duration: 10, emoji: "🚶" },
    { instruction: "Wiggle your whole body like jelly!", duration: 10, emoji: "🍮" },
    { instruction: "Spin around slowly once or twice", duration: 10, emoji: "🌟" },
    { instruction: "Strike a fun pose and freeze!", duration: 10, emoji: "⭐" },
    { instruction: "Shake it all out and breathe", duration: 10, emoji: "😊" },
  ],
  "Yoga Moment": [
    { instruction: "Stand tall in Mountain Pose, feet together", duration: 10, emoji: "🏔️" },
    { instruction: "Raise arms overhead and reach up", duration: 10, emoji: "🙆" },
    { instruction: "Fold forward gently, reaching for your toes", duration: 15, emoji: "🙇" },
    { instruction: "Come up slowly, one vertebra at a time", duration: 10, emoji: "⬆️" },
    { instruction: "Stand on one foot like a tree (use wall if needed)", duration: 15, emoji: "🌳" },
    { instruction: "Switch to the other foot", duration: 15, emoji: "🌳" },
    { instruction: "Arms out wide like a star", duration: 10, emoji: "⭐" },
    { instruction: "Bring hands together at your heart", duration: 10, emoji: "🙏" },
    { instruction: "Take three deep breaths", duration: 15, emoji: "😌" },
  ],
  default: [
    { instruction: "Stand up and shake out your body", duration: 10, emoji: "🤸" },
    { instruction: "Reach up high to the sky", duration: 10, emoji: "☀️" },
    { instruction: "Touch your toes (or as close as you can)", duration: 10, emoji: "👣" },
    { instruction: "Twist gently from side to side", duration: 10, emoji: "🔄" },
    { instruction: "March in place", duration: 10, emoji: "🚶" },
    { instruction: "Take three deep breaths", duration: 10, emoji: "😌" },
  ],
};

export function MovementBreak({ activity, onComplete, onBack }: MovementBreakProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sequence = MOVEMENT_SEQUENCES[activity.name] || MOVEMENT_SEQUENCES.default;

  // Respect reduce-motion preference
  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setStepProgress((prev) => {
        const newProgress = prev + 1;
        if (newProgress >= sequence[currentStep].duration) {
          // Move to next step
          setCurrentStep((step) => {
            const nextStep = step + 1;
            if (nextStep >= sequence.length) {
              setIsActive(false);
              setShowMoodCheck(true);
              return step;
            }
            return nextStep;
          });
          return 0;
        }
        return newProgress;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, currentStep, sequence]);

  const startActivity = () => {
    setIsActive(true);
    setCurrentStep(0);
    setStepProgress(0);
    setElapsedSeconds(0);
  };

  const pauseActivity = () => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeActivity = () => {
    setIsActive(true);
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
          <span className="text-5xl mb-4 block">🎉</span>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Amazing moves!
          </h2>
          <p className="text-slate-600 mb-6">
            You completed {currentStep + 1} movements in {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}
          </p>
          <p className="text-slate-700 font-medium mb-4">
            How does your body feel now?
          </p>
          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => handleMoodSubmit(level)}
                className="w-14 h-14 rounded-xl bg-mint/20 hover:bg-mint/30 transition-colors text-2xl"
              >
                {["😢", "😟", "😐", "😊", "😄"][level - 1]}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const currentMove = sequence[currentStep];
  const progressPercent = (stepProgress / currentMove.duration) * 100;

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
        🏃 {activity.name}
      </h1>
      <p className="text-slate-600 mb-8">{activity.description}</p>

      {/* Current Movement Display */}
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key={currentStep}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
            className="bg-mint/10 rounded-3xl p-8 mb-6 border-2 border-mint/30"
          >
            <span className="text-6xl block mb-4">{currentMove.emoji}</span>
            <p className="text-xl font-medium text-slate-800 mb-4">
              {currentMove.instruction}
            </p>
            
            {/* Progress bar */}
            <div className="h-2 bg-mint/20 rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-mint-dark rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-slate-500">
              {currentMove.duration - stepProgress} seconds remaining
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-mint/10 rounded-3xl p-8 mb-6 border-2 border-mint/30"
          >
            <span className="text-6xl block mb-4">🏃</span>
            <p className="text-lg text-slate-600">
              Ready to move? Let's get your body energized!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step progress */}
      {isActive && (
        <div className="flex justify-center gap-1 mb-6">
          {sequence.map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full transition-colors ${
                idx < currentStep
                  ? "bg-mint-dark"
                  : idx === currentStep
                  ? "bg-mint"
                  : "bg-mint/20"
              }`}
            />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!isActive && elapsedSeconds === 0 ? (
          <button
            onClick={startActivity}
            className="px-8 py-4 bg-gradient-to-r from-mint-dark to-mint text-white rounded-2xl font-semibold shadow-soft hover:shadow-lg transition-all"
          >
            Start Moving 🚀
          </button>
        ) : !isActive ? (
          <>
            <button
              onClick={resumeActivity}
              className="px-6 py-3 bg-mint-dark text-white rounded-xl font-medium hover:bg-mint-dark/90 transition-colors"
            >
              Resume
            </button>
            <button
              onClick={finishEarly}
              className="px-6 py-3 bg-white border-2 border-mint text-mint-dark rounded-xl font-medium hover:bg-mint/10 transition-colors"
            >
              Done for now
            </button>
          </>
        ) : (
          <>
            <button
              onClick={pauseActivity}
              className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Pause
            </button>
            <button
              onClick={finishEarly}
              className="px-6 py-3 bg-mint text-mint-dark rounded-xl font-medium hover:bg-mint/80 transition-colors"
            >
              All done ✓
            </button>
          </>
        )}
      </div>

      {/* Elapsed time */}
      <p className="text-sm text-slate-500 mt-4">
        Time: {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}
        {isActive && ` • Step ${currentStep + 1} of ${sequence.length}`}
      </p>
    </div>
  );
}
