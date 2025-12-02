'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LearnerPreferences, SensoryProfile } from './types';

interface SensorySettingsProps {
  preferences: LearnerPreferences | null;
  onUpdate: (preferences: LearnerPreferences | null) => void;
  onSave: (preferences: LearnerPreferences) => Promise<void> | void;
  onPreview?: (preferences: LearnerPreferences) => void;
}

const THEMES = ['calm', 'warm', 'cool', 'high-contrast', 'dark', 'pastel'];

export function SensorySettings({ preferences, onUpdate, onSave, onPreview }: SensorySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<LearnerPreferences | null>(preferences);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  const handleUpdate = (next: Partial<LearnerPreferences>) => {
    if (!draft) return;
    const updated = { ...draft, ...next } as LearnerPreferences;
    setDraft(updated);
    onUpdate(updated);
    onPreview?.(updated);
  };

  const handleSensoryUpdate = (next: Partial<SensoryProfile>) => {
    if (!draft) return;
    const updated = { ...draft, sensory: { ...draft.sensory, ...next } };
    setDraft(updated);
    onUpdate(updated);
    onPreview?.(updated);
  };

  const handleSave = async () => {
    if (!draft) return;
    setIsSaving(true);
    await onSave(draft);
    setIsSaving(false);
    setIsOpen(false);
  };

  const previewThemeClass = useMemo(() => draft?.theme ?? 'theme-calm', [draft?.theme]);

  return (
    <>
      <button
        type="button"
        onClick={() => preferences && setIsOpen(true)}
        disabled={!preferences}
  className="fixed bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-theme-primary text-white shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-theme-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Adjust sensory settings"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {isOpen && draft && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Sensory toolkit</p>
                <h2 className="text-2xl font-semibold text-gray-900">My comfort settings</h2>
              </div>
              <div className={`h-10 w-10 rounded-full border ${previewThemeClass}`} aria-hidden />
            </div>

            <div className="mt-6 space-y-6">
              <section>
                <label className="mb-2 block text-sm font-medium text-gray-700">Color theme</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {THEMES.map((theme) => {
                    const value = `theme-${theme}`;
                    const isActive = draft.theme === value;
                    return (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => handleUpdate({ theme: value })}
                        className={`rounded-2xl border-2 p-3 text-left transition ${isActive ? 'border-theme-primary bg-theme-primary/10' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className={`h-10 rounded-xl theme-preview-${theme}`} />
                        <span className="mt-2 block text-xs font-medium capitalize text-gray-700">{theme}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <label className="mb-2 block text-sm font-medium text-gray-700">Font size</label>
                <input
                  type="range"
                  min={14}
                  max={24}
                  value={draft.sensory.fontSize}
                  onChange={(event) => handleSensoryUpdate({ fontSize: Number(event.target.value) })}
                  className="w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Small</span>
                  <span>Calm</span>
                  <span>Large</span>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <ToggleCard
                  label="Reduce animations"
                  description="Great for sensory-sensitive days"
                  checked={draft.sensory.reduceMotion}
                  onChange={(checked) => handleSensoryUpdate({ reduceMotion: checked })}
                />
                <ToggleCard
                  label="Enable gentle sounds"
                  description="Use chimes for milestones"
                  checked={draft.sensory.soundEnabled}
                  onChange={(checked) => handleSensoryUpdate({ soundEnabled: checked })}
                />
              </section>

              {draft.sensory.soundEnabled && (
                <section>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Sound volume</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={draft.sensory.soundVolume}
                    onChange={(event) => handleSensoryUpdate({ soundVolume: Number(event.target.value) })}
                    className="w-full"
                  />
                </section>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 rounded-2xl bg-theme-primary px-4 py-3 text-center font-semibold text-white shadow-lg transition hover:bg-theme-primary/90 focus:outline-none focus:ring-4 focus:ring-theme-primary/20 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save comfort settings'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleCard({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${checked ? 'border-theme-primary/40 bg-theme-primary/10' : 'border-gray-200 hover:border-gray-300'}`}
    >
      <span className={`mt-1 h-5 w-5 rounded-full border-2 ${checked ? 'border-theme-primary bg-theme-primary' : 'border-gray-300'}`} />
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </button>
  );
}
