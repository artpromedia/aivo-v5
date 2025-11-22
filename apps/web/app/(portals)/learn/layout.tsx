'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { SensorySettings } from '@/components/learn/SensorySettings';
import { VisualSchedule } from '@/components/learn/VisualSchedule';
import { SimpleNavigation } from '@/components/learn/SimpleNavigation';
import { FocusMode } from '@/components/learn/FocusMode';
import type { LearnerPreferences } from '@/components/learn/types';

declare global {
  interface Window {
    audioEnabled?: boolean;
    soundVolume?: number;
  }
}

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<LearnerPreferences | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const applySensorySettings = useCallback((settings: LearnerPreferences['sensory']) => {
    if (!isHydrated || !settings) return;
    const root = document.documentElement;
    const safeSet = (prop: string, value?: string | number) => {
      if (value === undefined || value === null) return;
      root.style.setProperty(prop, String(value));
    };

    safeSet('--primary-color', settings.primaryColor);
    safeSet('--bg-color', settings.backgroundColor);
    safeSet('--contrast-level', settings.contrast.toString());
    safeSet('--font-size', `${settings.fontSize}px`);
    safeSet('--line-height', settings.lineHeight.toString());

    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    if (typeof window !== 'undefined') {
      window.audioEnabled = settings.soundEnabled;
      window.soundVolume = settings.soundVolume;
    }
  }, [isHydrated]);

  const loadLearnerPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/learner/preferences', { cache: 'no-store' });
      const data = (await response.json()) as LearnerPreferences;
      setPreferences(data);
      applySensorySettings(data.sensory);
    } catch (error) {
      console.warn('Unable to load learner preferences', error);
    }
  }, [applySensorySettings]);

  const handleSavePreferences = useCallback(async (next: LearnerPreferences) => {
    try {
      await fetch('/api/learner/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      });
      setPreferences(next);
      applySensorySettings(next.sensory);
    } catch (error) {
      console.warn('Unable to save preferences', error);
    }
  }, [applySensorySettings]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!session) return;
    void loadLearnerPreferences();
  }, [loadLearnerPreferences, session]);

  const themeClass = useMemo(() => {
    return [preferences?.theme ?? 'theme-calm', focusMode ? 'focus-mode' : ''].filter(Boolean).join(' ');
  }, [focusMode, preferences?.theme]);

  return (
    <div className={`min-h-screen transition-all duration-300 bg-[var(--bg-color,#f6f8fb)] ${themeClass}`}>
      {!focusMode && (
        <SimpleNavigation
          learnerName={session?.user?.name ?? 'Learner'}
          onFocusMode={() => setFocusMode(true)}
          preferences={preferences}
        />
      )}

      {!focusMode && preferences?.showSchedule && <VisualSchedule preferences={preferences} />}

      <main className={focusMode ? 'p-0' : 'p-4 md:p-6'}>{children}</main>

      {focusMode && <FocusMode onExit={() => setFocusMode(false)} preferences={preferences} />}

      {!focusMode && (
        <SensorySettings
          preferences={preferences}
          onUpdate={setPreferences}
          onSave={handleSavePreferences}
          onPreview={(next: LearnerPreferences) => applySensorySettings(next.sensory)}
        />
      )}
    </div>
  );
}
