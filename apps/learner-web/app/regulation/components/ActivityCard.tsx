"use client";

/**
 * ActivityCard Component
 * Displays a regulation activity with calming design
 */

import { motion } from "framer-motion";
import type { RegulationActivity } from "@aivo/api-client/src/regulation-contracts";

interface ActivityCardProps {
  activity: RegulationActivity;
  reason?: string;
  featured?: boolean;
  onStart: () => void;
}

// Helper to get duration from activity (types have different duration properties)
function getActivityDuration(activity: RegulationActivity): number {
  if ('totalDuration' in activity) {
    return activity.totalDuration;
  }
  if ('duration' in activity && activity.duration !== null) {
    return activity.duration;
  }
  return 120; // default 2 minutes
}

// Helper to get difficulty from activity
function getActivityDifficulty(activity: RegulationActivity): string | undefined {
  if ('difficulty' in activity) {
    return activity.difficulty;
  }
  if ('intensity' in activity) {
    return activity.intensity;
  }
  return undefined;
}

const TYPE_STYLES = {
  BREATHING: {
    bg: "bg-lavender-50",
    border: "border-lavender-200",
    icon: "🌬️",
    buttonBg: "bg-primary-500 hover:bg-primary-600",
  },
  MOVEMENT: {
    bg: "bg-mint/10",
    border: "border-mint/30",
    icon: "🏃",
    buttonBg: "bg-mint-dark hover:bg-mint-dark/90",
  },
  GROUNDING: {
    bg: "bg-sky/10",
    border: "border-sky/30",
    icon: "🌿",
    buttonBg: "bg-sky-dark hover:bg-sky-dark/90",
  },
  SENSORY: {
    bg: "bg-sunshine/10",
    border: "border-sunshine/30",
    icon: "🎵",
    buttonBg: "bg-sunshine-dark hover:bg-sunshine-dark/90",
  },
};

export function ActivityCard({ activity, reason, featured, onStart }: ActivityCardProps) {
  const style = TYPE_STYLES[activity.type] || TYPE_STYLES.BREATHING;

  // Respect reduce-motion preference
  const prefersReducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  const CardWrapper = prefersReducedMotion ? "div" : motion.div;
  const cardProps = prefersReducedMotion
    ? {}
    : {
        whileHover: { scale: 1.02, y: -2 },
        whileTap: { scale: 0.98 },
      };

  if (featured) {
    return (
      <CardWrapper
        {...cardProps}
        className={`
          ${style.bg} ${style.border} border-2
          rounded-2xl p-6 cursor-pointer transition-shadow hover:shadow-card
        `}
        onClick={onStart}
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-soft text-2xl">
            {style.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              {activity.name}
            </h3>
            <p className="text-sm text-slate-600 mb-2">
              {activity.description}
            </p>
            {reason && (
              <p className="text-xs text-primary-600 font-medium">
                ✨ {reason}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-slate-500">
                ⏱️ {Math.floor(getActivityDuration(activity) / 60)} min
              </span>
              {getActivityDifficulty(activity) && (
                <span className="text-xs text-slate-500 capitalize">
                  📊 {getActivityDifficulty(activity)}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          className={`
            w-full mt-4 py-3 rounded-xl text-white font-medium
            ${style.buttonBg} transition-colors shadow-soft
          `}
        >
          Start Activity 🚀
        </button>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper
      {...cardProps}
      className={`
        ${style.bg} ${style.border} border
        rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-soft
      `}
      onClick={onStart}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{style.icon}</span>
        <h4 className="font-medium text-slate-800 text-sm">{activity.name}</h4>
      </div>
      <p className="text-xs text-slate-600 mb-3 line-clamp-2">
        {activity.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          ⏱️ {Math.floor(getActivityDuration(activity) / 60)} min
        </span>
        <span className="text-xs text-primary-500 font-medium">
          Start →
        </span>
      </div>
    </CardWrapper>
  );
}
