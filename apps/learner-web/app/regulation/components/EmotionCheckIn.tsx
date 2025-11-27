"use client";

/**
 * EmotionCheckIn Component
 * Emoji-based emotion selector with 1-5 scale for neurodiverse learners
 */

import { useState } from "react";
import { motion } from "framer-motion";

interface EmotionCheckInProps {
  currentLevel: number;
  onCheckIn: (level: number, label?: string) => void;
  compact?: boolean;
  onExpand?: () => void;
}

const EMOTION_OPTIONS = [
  { level: 1, emoji: "😢", label: "Very Upset", color: "bg-coral-light", ring: "ring-coral" },
  { level: 2, emoji: "😟", label: "Worried", color: "bg-sunshine/30", ring: "ring-sunshine" },
  { level: 3, emoji: "😐", label: "Okay", color: "bg-slate-100", ring: "ring-slate-300" },
  { level: 4, emoji: "😊", label: "Good", color: "bg-sky/30", ring: "ring-sky" },
  { level: 5, emoji: "😄", label: "Great", color: "bg-mint/30", ring: "ring-mint" },
];

export function EmotionCheckIn({ currentLevel, onCheckIn, compact, onExpand }: EmotionCheckInProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const handleSelect = (level: number) => {
    setSelectedLevel(level);
  };

  const handleConfirm = () => {
    if (selectedLevel !== null) {
      const emotion = EMOTION_OPTIONS.find((e) => e.level === selectedLevel);
      onCheckIn(selectedLevel, emotion?.label);
      setSelectedLevel(null);
      setIsExpanded(false);
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
    onExpand?.();
  };

  // Compact view - just show current emotion
  if (compact && !isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="w-full bg-white rounded-2xl p-4 shadow-soft hover:shadow-card transition-all flex items-center justify-between"
        aria-label="Expand emotion check-in"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label={EMOTION_OPTIONS[currentLevel - 1]?.label}>
            {EMOTION_OPTIONS[currentLevel - 1]?.emoji}
          </span>
          <div>
            <p className="text-sm font-medium text-slate-700">How are you feeling?</p>
            <p className="text-xs text-slate-500">Tap to check in</p>
          </div>
        </div>
        <span className="text-primary-500 text-sm">Check in →</span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl p-6 shadow-card"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          How are you feeling right now?
        </h2>
        <p className="text-slate-500 text-sm">
          It's okay to feel any way. Let's check in together.
        </p>
      </div>

      {/* Emotion Options */}
      <div className="flex justify-center gap-3 mb-6" role="radiogroup" aria-label="Emotion level">
        {EMOTION_OPTIONS.map((emotion) => {
          const isSelected = selectedLevel === emotion.level;
          const isCurrent = currentLevel === emotion.level && selectedLevel === null;

          return (
            <motion.button
              key={emotion.level}
              onClick={() => handleSelect(emotion.level)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative w-16 h-16 rounded-2xl flex flex-col items-center justify-center
                transition-all duration-200
                ${emotion.color}
                ${isSelected ? `ring-4 ${emotion.ring} shadow-lg` : ""}
                ${isCurrent ? "ring-2 ring-slate-300" : ""}
                hover:shadow-md
              `}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${emotion.label}, level ${emotion.level}`}
            >
              <span className="text-3xl" role="img" aria-hidden="true">
                {emotion.emoji}
              </span>
              {(isSelected || isCurrent) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -bottom-6 text-xs text-slate-600 font-medium whitespace-nowrap"
                >
                  {emotion.label}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-8">
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={selectedLevel === null}
          className={`
            flex-1 py-3 px-4 rounded-xl font-medium transition-all
            ${selectedLevel !== null
              ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:shadow-lg"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }
          `}
        >
          {selectedLevel !== null ? "Log Feeling 💜" : "Select how you feel"}
        </button>
      </div>

      {/* Supportive message */}
      {selectedLevel !== null && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-slate-500 mt-4"
        >
          {selectedLevel <= 2 && "It's okay to not feel okay. We're here to help. 💙"}
          {selectedLevel === 3 && "Checking in is a great habit. You're doing well! 🌟"}
          {selectedLevel >= 4 && "Wonderful! Keep that positive energy going! ✨"}
        </motion.p>
      )}
    </motion.div>
  );
}
