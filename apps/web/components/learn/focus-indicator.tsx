"use client";

import { motion } from "framer-motion";

interface FocusIndicatorProps {
  score: number;
  isPaused?: boolean;
}

export function FocusIndicator({ score, isPaused = false }: FocusIndicatorProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 56;
  const dashOffset = circumference - (clamped / 100) * circumference;

  const statusLabel = clamped > 75 ? "Deeply Engaged" : clamped > 45 ? "Holding Focus" : "Break Recommended";
  const statusColor = clamped > 75 ? "text-green-500" : clamped > 45 ? "text-amber-500" : "text-rose-500";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft-coral backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Focus Pulse</p>
          <h2 className="text-2xl font-semibold text-slate-900">{isPaused ? "Brain break" : "Learning groove"}</h2>
          <p className={`mt-2 text-sm font-semibold ${statusColor}`}>{statusLabel}</p>
        </div>
        <div className="relative h-32 w-32">
          <svg className="h-full w-full" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="56" stroke="rgba(148,163,184,0.3)" strokeWidth="12" fill="transparent" />
            <motion.circle
              cx="70"
              cy="70"
              r="56"
              stroke={clamped > 45 ? "#8b5cf6" : "#f97316"}
              strokeWidth="12"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: dashOffset }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">{clamped}</span>
            <span className="text-xs uppercase tracking-wide text-slate-500">focus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
