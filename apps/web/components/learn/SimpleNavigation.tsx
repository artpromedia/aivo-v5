'use client';

import { motion } from 'framer-motion';
import type { LearnerPreferences } from './types';

interface SimpleNavigationProps {
  learnerName?: string | null;
  onFocusMode: () => void;
  preferences: LearnerPreferences | null;
}

export function SimpleNavigation({ learnerName = 'Learner', onFocusMode, preferences }: SimpleNavigationProps) {
  const greeting = buildGreeting(learnerName ?? 'Learner');

  return (
    <header className="border-b border-white/60 bg-white/70 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Calm learning</p>
          <h1 className="text-2xl font-semibold text-slate-900">{greeting}</h1>
          <p className="text-sm text-slate-500">We&apos;ll keep things steady based on your comfort plan.</p>
        </div>

        <div className="flex items-center gap-3">
          {preferences?.focusReminders && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
            >
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Focus steady
            </motion.div>
          )}
          <button
            type="button"
            onClick={onFocusMode}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-primary"
          >
            Enter focus mode
          </button>
        </div>
      </div>
    </header>
  );
}

function buildGreeting(name: string): string {
  const firstName = name?.split(' ')[0] ?? 'Learner';
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${firstName}`;
  if (hour < 17) return `Good afternoon, ${firstName}`;
  return `Good evening, ${firstName}`;
}
