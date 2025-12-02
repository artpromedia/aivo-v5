'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LearnerPreferences, ProgressSnapshot, ScheduleEntry } from './types';

interface VisualScheduleProps {
  preferences: LearnerPreferences | null;
}

export function VisualSchedule({ preferences }: VisualScheduleProps) {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);

  useEffect(() => {
    void fetchSchedule();
    void fetchProgress();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await fetch('/api/learner/schedule', { cache: 'no-store' });
      const data = (await response.json()) as { schedule: ScheduleEntry[] };
      setSchedule(data.schedule);
    } catch (error) {
      console.warn('Unable to fetch schedule', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/learner/progress', { cache: 'no-store' });
      const data = (await response.json()) as ProgressSnapshot;
      setProgress(data);
    } catch (error) {
      console.warn('Unable to fetch progress', error);
    }
  };

  const currentIndex = useMemo(() => schedule.findIndex((item) => item.status === 'in-progress'), [schedule]);

  return (
    <section className="w-full border-b border-white/40 bg-white/60 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Today&apos;s rhythm</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {schedule.map((item, index) => {
              const isCurrent = index === currentIndex;
              return (
                <div
                  key={item.id}
                  className={`min-w-[120px] rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                    isCurrent
                      ? 'border-theme-primary/40 bg-theme-primary/10 text-theme-primary'
                      : item.status === 'complete'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                  aria-current={isCurrent}
                >
                  <p className="text-lg">{item.icon}</p>
                  <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">{item.type}</p>
                  <p>{item.title}</p>
                </div>
              );
            })}
            {schedule.length === 0 && <p className="text-sm text-slate-500">Building a calm routine…</p>}
          </div>
        </div>

        {progress && (
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <ProgressRing value={progress.mastery} label="Mastery" color="text-sky-500" />
            <ProgressRing value={progress.focusScore} label="Focus" color="text-emerald-500" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Streak</p>
              <p className="text-2xl font-semibold text-slate-900">{progress.streakDays} days</p>
              {preferences?.supports.progressCelebrations && progress.badges.length > 0 && (
                <div className="mt-1 flex gap-1 text-xl" aria-label="Badges earned">
                  {progress.badges.map((badge) => (
                    <span key={badge}>{badge}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProgressRing({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg className="h-full w-full rotate-[-90deg]" role="img" aria-label={`${label} ${value}%`}>
        <circle cx="32" cy="32" r={radius} stroke="#e5e7eb" strokeWidth={6} fill="transparent" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth={6}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={color}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-semibold text-slate-900">{value}%</span>
        <span className="text-[0.6rem] uppercase tracking-wide text-slate-400">{label}</span>
      </div>
    </div>
  );
}
