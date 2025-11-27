"use client";

/**
 * GroundingActivity Component
 * Interactive 5-4-3-2-1 grounding exercise and body scan for anxiety relief
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RegulationActivity } from "@aivo/api-client/src/regulation-contracts";

interface GroundingActivityProps {
  activity: RegulationActivity;
  onComplete: (moodAfter: number, durationSeconds: number) => void;
  onBack: () => void;
}

// 5-4-3-2-1 Grounding steps
const GROUNDING_STEPS = [
  {
    count: 5,
    sense: "SEE",
    emoji: "👀",
    prompt: "Look around and name 5 things you can SEE",
    color: "bg-sky/20 border-sky",
    examples: ["A window", "A book", "Your hands", "A plant", "The ceiling"],
  },
  {
    count: 4,
    sense: "TOUCH",
    emoji: "✋",
    prompt: "Notice 4 things you can TOUCH or feel",
    color: "bg-mint/20 border-mint",
    examples: ["Your chair", "Your clothes", "The floor", "Your hair"],
  },
  {
    count: 3,
    sense: "HEAR",
    emoji: "👂",
    prompt: "Listen for 3 things you can HEAR",
    color: "bg-lavender-100 border-lavender-300",
    examples: ["Air conditioning", "Birds outside", "Your breathing"],
  },
  {
    count: 2,
    sense: "SMELL",
    emoji: "👃",
    prompt: "Notice 2 things you can SMELL",
    color: "bg-sunshine/20 border-sunshine",
    examples: ["Fresh air", "Your soap or shampoo"],
  },
  {
    count: 1,
    sense: "TASTE",
    emoji: "👅",
    prompt: "Notice 1 thing you can TASTE",
    color: "bg-coral-light/30 border-coral-light",
    examples: ["Water", "Mint", "Your last snack"],
  },
];

// Body scan prompts
const BODY_SCAN_STEPS = [
  { area: "Head", prompt: "Notice any tension in your forehead and jaw. Let it soften.", emoji: "🧠" },
  { area: "Shoulders", prompt: "Drop your shoulders away from your ears. Feel them relax.", emoji: "💪" },
  { area: "Arms & Hands", prompt: "Let your arms feel heavy. Unclench your hands.", emoji: "🙌" },
  { area: "Chest", prompt: "Notice your breathing. Let your chest rise and fall naturally.", emoji: "💚" },
  { area: "Stomach", prompt: "Soften your belly. Let go of any tightness.", emoji: "🌊" },
  { area: "Legs & Feet", prompt: "Feel your feet on the ground. Your legs are supported.", emoji: "🦶" },
];

type ActivityType = "5-4-3-2-1" | "body-scan" | "default";

export function GroundingActivity({ activity, onComplete, onBack }: GroundingActivityProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [itemsFound, setItemsFound] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine activity type
  const activityType: ActivityType = 
    activity.name.includes("5-4-3-2-1") ? "5-4-3-2-1" :
    activity.name.toLowerCase().includes("body scan") ? "body-scan" : "default";

  const steps = activityType === "body-scan" ? BODY_SCAN_STEPS : GROUNDING_STEPS;
  const currentStepData = activityType === "body-scan" 
    ? BODY_SCAN_STEPS[currentStep] 
    : GROUNDING_STEPS[currentStep];

  // Respect reduce-motion preference
  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  // Timer
  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const startActivity = () => {
    setIsActive(true);
    setCurrentStep(0);
    setItemsFound([]);
    setElapsedSeconds(0);
  };

  const handleItemFound = () => {
    if (activityType === "5-4-3-2-1") {
      const step = GROUNDING_STEPS[currentStep];
      if (itemsFound.length + 1 >= step.count) {
        // Move to next step
        if (currentStep + 1 >= GROUNDING_STEPS.length) {
          setIsActive(false);
          setShowMoodCheck(true);
        } else {
          setCurrentStep((prev) => prev + 1);
          setItemsFound([]);
        }
      } else {
        setItemsFound((prev) => [...prev, `Item ${prev.length + 1}`]);
      }
    }
  };

  const nextBodyScanStep = () => {
    if (currentStep + 1 >= BODY_SCAN_STEPS.length) {
      setIsActive(false);
      setShowMoodCheck(true);
    } else {
      setCurrentStep((prev) => prev + 1);
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
          <span className="text-5xl mb-4 block">🌿</span>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            You're grounded!
          </h2>
          <p className="text-slate-600 mb-6">
            You spent {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")} connecting with your senses
          </p>
          <p className="text-slate-700 font-medium mb-4">
            How present do you feel now?
          </p>
          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => handleMoodSubmit(level)}
                className="w-14 h-14 rounded-xl bg-sky/20 hover:bg-sky/30 transition-colors text-2xl"
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
        🌿 {activity.name}
      </h1>
      <p className="text-slate-600 mb-8">{activity.description}</p>

      {/* Activity Content */}
      <AnimatePresence mode="wait">
        {!isActive ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-sky/10 rounded-3xl p-8 mb-6 border-2 border-sky/30"
          >
            <span className="text-6xl block mb-4">🌿</span>
            <p className="text-lg text-slate-600 mb-4">
              {activityType === "5-4-3-2-1" 
                ? "This exercise will help you feel more present by connecting with your senses."
                : activityType === "body-scan"
                ? "This exercise will help you notice and release tension in your body."
                : "Let's get grounded and feel more present together."
              }
            </p>
            <button
              onClick={startActivity}
              className="px-8 py-4 bg-gradient-to-r from-sky-dark to-sky text-white rounded-2xl font-semibold shadow-soft hover:shadow-lg transition-all"
            >
              Begin Grounding 🌱
            </button>
          </motion.div>
        ) : activityType === "5-4-3-2-1" ? (
          // 5-4-3-2-1 Grounding
          <motion.div
            key={`step-${currentStep}`}
            initial={prefersReducedMotion ? {} : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
            className={`rounded-3xl p-8 mb-6 border-2 ${currentStepData && "color" in currentStepData ? currentStepData.color : "bg-sky/20 border-sky"}`}
          >
            <span className="text-5xl block mb-2">{currentStepData && "emoji" in currentStepData ? currentStepData.emoji : "🌿"}</span>
            <p className="text-4xl font-bold text-slate-800 mb-2">
              {currentStepData && "count" in currentStepData ? currentStepData.count : 0}
            </p>
            <p className="text-xl font-medium text-slate-700 mb-4">
              {currentStepData && "prompt" in currentStepData ? currentStepData.prompt : ""}
            </p>

            {/* Items found tracker */}
            {"count" in currentStepData && (
              <div className="flex justify-center gap-2 mb-4">
                {Array.from({ length: currentStepData.count }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      idx < itemsFound.length
                        ? "bg-sky-dark border-sky-dark"
                        : "bg-white border-slate-300"
                    }`}
                  >
                    {idx < itemsFound.length && (
                      <span className="text-white text-sm">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Examples */}
            {"examples" in currentStepData && (
              <p className="text-sm text-slate-500 mb-4">
                Examples: {currentStepData.examples.slice(0, 3).join(", ")}
              </p>
            )}

            <button
              onClick={handleItemFound}
              className="px-6 py-3 bg-white border-2 border-sky-dark text-sky-dark rounded-xl font-medium hover:bg-sky/10 transition-colors"
            >
              Found one! ✓
            </button>
          </motion.div>
        ) : (
          // Body Scan
          <motion.div
            key={`body-${currentStep}`}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
            className="bg-lavender-50 rounded-3xl p-8 mb-6 border-2 border-lavender-200"
          >
            <span className="text-5xl block mb-4">
              {currentStepData && "emoji" in currentStepData ? currentStepData.emoji : "🧘"}
            </span>
            <p className="text-2xl font-bold text-slate-800 mb-2">
              {currentStepData && "area" in currentStepData ? currentStepData.area : ""}
            </p>
            <p className="text-lg text-slate-600 mb-6">
              {currentStepData && "prompt" in currentStepData ? currentStepData.prompt : ""}
            </p>

            <button
              onClick={nextBodyScanStep}
              className="px-6 py-3 bg-lavender-300 text-slate-800 rounded-xl font-medium hover:bg-lavender-400 transition-colors"
            >
              {currentStep + 1 >= BODY_SCAN_STEPS.length ? "Complete" : "Next →"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step progress */}
      {isActive && (
        <div className="flex justify-center gap-1 mb-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full transition-colors ${
                idx < currentStep
                  ? "bg-sky-dark"
                  : idx === currentStep
                  ? "bg-sky"
                  : "bg-sky/20"
              }`}
            />
          ))}
        </div>
      )}

      {/* Controls when active */}
      {isActive && (
        <button
          onClick={finishEarly}
          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
        >
          I feel grounded now ✓
        </button>
      )}

      {/* Elapsed time */}
      {isActive && (
        <p className="text-sm text-slate-500 mt-4">
          Time: {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}
          {" • "}Step {currentStep + 1} of {steps.length}
        </p>
      )}
    </div>
  );
}
