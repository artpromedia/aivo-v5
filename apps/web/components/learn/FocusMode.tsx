'use client';

import { motion } from 'framer-motion';
import type { LearnerPreferences } from './types';

interface FocusModeProps {
  onExit: () => void;
  preferences: LearnerPreferences | null;
}

export function FocusMode({ onExit, preferences }: FocusModeProps) {
  return (
    <div className="fixed inset-0 z-30 bg-slate-950/85 text-white">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 p-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <p className="text-xs uppercase tracking-[0.5em] text-slate-300">Focus bubble</p>
          <h2 className="text-4xl font-semibold">One calm step at a time</h2>
          <p className="text-base text-slate-200">
            We dimmed everything to reduce distractions. When you&apos;re ready, exit focus mode to rejoin the schedule.
          </p>
          {preferences?.supports.chunkedText && (
            <ul className="mx-auto max-w-md text-left text-slate-200">
              <li>• Breathe in for 4 counts, out for 4 counts.</li>
              <li>• Wiggle fingers and toes to reset.</li>
              <li>• Think of one strength you used today.</li>
            </ul>
          )}
        </motion.div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-full border border-white/30 px-8 py-3 text-lg font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Exit focus mode
        </button>
      </div>
    </div>
  );
}
