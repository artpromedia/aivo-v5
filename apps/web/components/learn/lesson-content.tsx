"use client";

import { motion } from "framer-motion";

import type { LessonEntity } from "@/lib/types/lesson";

interface LessonContentProps {
  lesson: LessonEntity | null;
  isPaused: boolean;
  onInteraction?: () => void;
}

export function LessonContent({ lesson, isPaused, onInteraction }: LessonContentProps) {
  if (!lesson) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-8 text-center text-slate-500">
        Loading personalized lesson…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{lesson.subject}</p>
            <h2 className="text-3xl font-semibold text-slate-900">{lesson.currentTopic}</h2>
            <p className="mt-2 text-slate-600">{lesson.summary}</p>
          </div>
          <button
            type="button"
            onClick={onInteraction}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            I&apos;m following
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {lesson.segments.map((segment, index) => (
          <motion.button
            key={segment.id}
            type="button"
            onClick={onInteraction}
            whileHover={!isPaused ? { scale: 1.02 } : undefined}
            className={`rounded-3xl border p-5 text-left transition ${
              segment.status === "COMPLETE"
                ? "border-emerald-200 bg-emerald-50"
                : segment.status === "IN_PROGRESS"
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-slate-200 bg-white"
            } ${isPaused ? "opacity-60" : ""}`}
          >
            <p className="text-sm text-slate-500">Step {index + 1}</p>
            <h3 className="text-lg font-semibold text-slate-900">{segment.title}</h3>
            <p className="text-sm text-slate-600">{segment.content}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
