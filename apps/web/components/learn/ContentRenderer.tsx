'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { ActivityResult, LessonActivity, PerformanceMetrics } from '@/lib/curriculum/adaptive-engine';

interface ContentRendererProps {
  activity: LessonActivity;
  adaptiveMode?: boolean;
  onComplete: (result: ActivityResult) => void;
}

export function ContentRenderer({ activity, adaptiveMode = true, onComplete }: ContentRendererProps) {
  const [notes, setNotes] = useState('');
  const [confidence, setConfidence] = useState(80);
  const [questionsCount, setQuestionsCount] = useState(3);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    setNotes('');
    setConfidence(80);
    setQuestionsCount(3);
  }, [activity.id]);

  const handleComplete = () => {
  const durationMs = Date.now() - startRef.current;
    const timePerQuestion = questionsCount > 0 ? durationMs / questionsCount : durationMs;

    onComplete({
      activityId: activity.id,
      accuracy: confidence / 100,
      timePerQuestion,
      durationMs,
      responses: { notes, questionsCount }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -32 }} className="rounded-3xl bg-white p-8 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-purple-400">Adaptive sequence #{activity.sequence}</p>
          <h2 className="text-3xl font-semibold text-slate-900">{activity.title}</h2>
          <p className="text-sm text-slate-500">{activity.description}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-700">
          Level {activity.difficulty} · {activity.estimatedMinutes} min · {activity.modality}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Learning actions</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
              {activity.resources.map((resource) => (
                <li key={`${resource.type}-${resource.label}`}>{resource.description ?? resource.label}</li>
              ))}
              {!activity.resources.length && <li>Follow the guided prompt calmly and narrate your thinking.</li>}
            </ul>
          </section>

          {activity.scaffolds.length > 0 && (
            <section className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Scaffolds</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-emerald-900">
                {activity.scaffolds.map((scaffold) => (
                  <li key={scaffold}>{scaffold}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-100 p-4 shadow-sm">
            <label className="text-sm font-semibold text-slate-700" htmlFor="notes">
              Reflect or show work
            </label>
            <textarea
              id="notes"
              rows={5}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-purple-500 focus:outline-none"
              placeholder="Explain how you solved it, sketch ideas, or note any stuck points"
            />
          </section>

          <section className="rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</p>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={confidence}
                  onChange={(event) => setConfidence(Number(event.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-slate-600">Feeling {confidence}% sure</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Questions tackled</p>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={questionsCount}
                  onChange={(event) => setQuestionsCount(Number(event.target.value) || 1)}
                  className="w-24 rounded-2xl border border-slate-200 p-2 text-center text-sm"
                />
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={handleComplete}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 py-3 text-center text-base font-semibold text-white shadow-lg"
          >
            {adaptiveMode ? 'Submit & adapt' : 'Mark complete'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface PerformanceIndicatorProps {
  metrics: PerformanceMetrics;
}

export function PerformanceIndicator({ metrics }: PerformanceIndicatorProps) {
  const bands = [
    { label: 'Accuracy', value: `${Math.round(metrics.accuracy * 100)}%`, accent: 'text-emerald-600' },
    { label: 'Avg. time', value: `${Math.round(metrics.timePerQuestion / 1000)}s`, accent: 'text-blue-600' },
    { label: 'Streak', value: `${metrics.consecutiveCorrect} ✓ / ${metrics.consecutiveIncorrect} ✕`, accent: 'text-purple-600' }
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Performance pulse</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {bands.map((band) => (
          <div key={band.label} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-xs text-slate-500">{band.label}</p>
            <p className={`text-2xl font-semibold ${band.accent}`}>{band.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
