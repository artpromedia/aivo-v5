/**
 * Cognitive Settings Panel Component
 * Friendly controls for focus, pacing, and break settings
 */

"use client";

import { useState, useEffect } from "react";
import type { CognitiveSettings } from "@aivo/api-client/src/sensory-contracts";

interface CognitiveSettingsPanelProps {
  settings: CognitiveSettings;
  onUpdate: (settings: Partial<CognitiveSettings>) => void;
}

export function CognitiveSettingsPanel({ settings, onUpdate }: CognitiveSettingsPanelProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">🧠 How You Focus</h2>
        <p className="text-slate-600">Control pacing, breaks, and how much you see at once</p>
      </div>

      {/* Focus Mode */}
      <SettingSection title="Focus Mode" icon="🎯" description="See one thing at a time">
        <div className="space-y-3">
          <ToggleSetting
            label="One Thing at a Time"
            icon="1️⃣"
            description="Show fewer items on screen"
            checked={settings.oneThingAtATime}
            onChange={(checked) => onUpdate({ oneThingAtATime: checked })}
          />
          <ToggleSetting
            label="No Pop-ups"
            icon="🚫"
            description="Stop surprise messages"
            checked={settings.noPopups}
            onChange={(checked) => onUpdate({ noPopups: checked })}
          />
          <ToggleSetting
            label="No Autoplay"
            icon="⏸️"
            description="Videos and sounds wait for you"
            checked={settings.noAutoplay}
            onChange={(checked) => onUpdate({ noAutoplay: checked })}
          />
        </div>
      </SettingSection>

      {/* Limit Choices */}
      <SettingSection title="Choices" icon="🔢" description="How many options to show at once">
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: null, label: "All", description: "Show everything" },
            { value: 2, label: "2", description: "Very few" },
            { value: 3, label: "3", description: "A few" },
            { value: 4, label: "4", description: "Some" },
          ].map((option) => (
            <button
              key={option.label}
              onClick={() => onUpdate({ limitChoices: option.value })}
              className={`
                p-4 rounded-xl border-2 transition-all text-center
                ${settings.limitChoices === option.value
                  ? "border-primary-500 bg-primary-50"
                  : "border-slate-200 bg-white hover:border-primary-200"
                }
              `}
            >
              <span className="block text-2xl font-bold text-slate-700">{option.label}</span>
              <span className="text-xs text-slate-500">{option.description}</span>
            </button>
          ))}
        </div>
      </SettingSection>

      {/* Instructions */}
      <ToggleSetting
        label="Simpler Instructions"
        icon="📝"
        description="Use easier words and shorter sentences"
        checked={settings.simplifyInstructions}
        onChange={(checked) => onUpdate({ simplifyInstructions: checked })}
      />

      {/* Progress */}
      <ToggleSetting
        label="Show Progress"
        icon="📊"
        description="See how far along you are"
        checked={settings.showProgressIndicator}
        onChange={(checked) => onUpdate({ showProgressIndicator: checked })}
      />

      {/* Time Settings */}
      <SettingSection title="Time" icon="⏰" description="Get more time when you need it">
        <div className="space-y-4">
          <ToggleSetting
            label="Extended Time"
            icon="⏳"
            description="More time for activities and questions"
            checked={settings.extendedTime}
            onChange={(checked) => onUpdate({ extendedTime: checked })}
          />

          {settings.extendedTime && (
            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-700">How much extra time?</span>
                <span className="text-primary-600 font-bold">{settings.timeMultiplier}x</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">Normal</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.5"
                  value={settings.timeMultiplier}
                  onChange={(e) => onUpdate({ timeMultiplier: parseFloat(e.target.value) })}
                  className="flex-1 h-3 rounded-full appearance-none bg-slate-200 accent-primary-500"
                />
                <span className="text-sm text-slate-500">3x longer</span>
              </div>
              <div className="grid grid-cols-5 text-xs text-center text-slate-400">
                <span>1x</span>
                <span>1.5x</span>
                <span>2x</span>
                <span>2.5x</span>
                <span>3x</span>
              </div>
            </div>
          )}
        </div>
      </SettingSection>

      {/* Break Reminders */}
      <SettingSection title="Breaks" icon="☕" description="Get reminded to rest">
        <div className="space-y-4">
          <ToggleSetting
            label="Break Reminders"
            icon="🔔"
            description="Get a gentle reminder to take breaks"
            checked={settings.breakReminders}
            onChange={(checked) => onUpdate({ breakReminders: checked })}
          />

          {settings.breakReminders && (
            <div className="p-4 bg-mint-50 rounded-xl space-y-3 border border-mint/20">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-700">How often?</span>
                <span className="text-mint-dark font-bold">Every {settings.breakFrequency} min</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => onUpdate({ breakFrequency: minutes })}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-center
                      ${settings.breakFrequency === minutes
                        ? "border-mint bg-mint/10"
                        : "border-slate-200 bg-white hover:border-mint/50"
                      }
                    `}
                  >
                    <span className="block font-medium text-slate-700">{minutes}</span>
                    <span className="text-xs text-slate-500">min</span>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-3 pt-2 border-t border-mint/20">
                <span className="text-2xl">🌟</span>
                <p className="text-sm text-mint-dark">
                  Taking breaks helps your brain learn better!
                </p>
              </div>
            </div>
          )}
        </div>
      </SettingSection>

      {/* Break Preview */}
      {settings.breakReminders && (
        <BreakPreview breakFrequency={settings.breakFrequency} />
      )}

      {/* Tips */}
      <div className="bg-lavender-50 rounded-2xl p-5 border border-lavender-100">
        <h4 className="font-medium text-lavender-dark mb-2 flex items-center gap-2">
          <span>💡</span> Focus Tips
        </h4>
        <ul className="text-sm text-lavender-800 space-y-1">
          <li>• Start with short sessions and build up</li>
          <li>• It's okay to take breaks whenever you need</li>
          <li>• Try the Environment tab for calming background sounds</li>
          <li>• Celebrate your progress, no matter how small!</li>
        </ul>
      </div>
    </div>
  );
}

// =============================================================================
// Break Preview Component
// =============================================================================

function BreakPreview({ breakFrequency }: { breakFrequency: number }) {
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    if (!showDemo) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setShowDemo(false);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showDemo]);

  return (
    <div className="bg-sky-50 rounded-2xl p-5 border border-sky-100 text-center">
      <h4 className="font-medium text-sky-800 mb-3">👀 What a break reminder looks like</h4>
      
      {showDemo ? (
        <div className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
          <span className="text-4xl mb-2 block">☕</span>
          <p className="font-bold text-slate-800 mb-1">Time for a break!</p>
          <p className="text-sm text-slate-600 mb-3">
            You've been working for {breakFrequency} minutes
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowDemo(false)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium"
            >
              Take a break
            </button>
            <button
              onClick={() => setShowDemo(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600"
            >
              5 more minutes
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-3">Demo ends in {secondsLeft}s</p>
        </div>
      ) : (
        <button
          onClick={() => setShowDemo(true)}
          className="px-6 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
        >
          Show Me
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

interface SettingSectionProps {
  title: string;
  icon?: string;
  description?: string;
  children: React.ReactNode;
}

function SettingSection({ title, icon, description, children }: SettingSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </h3>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

interface ToggleSettingProps {
  label: string;
  icon?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({ label, icon, description, checked, onChange }: ToggleSettingProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`
        w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left
        ${checked
          ? "border-primary-500 bg-primary-50"
          : "border-slate-200 bg-white hover:border-primary-200"
        }
      `}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-xl">{icon}</span>}
        <div>
          <span className="block font-medium text-slate-800">{label}</span>
          {description && <span className="text-sm text-slate-500">{description}</span>}
        </div>
      </div>
      <div
        className={`
          w-12 h-7 rounded-full p-1 transition-colors
          ${checked ? "bg-primary-500" : "bg-slate-300"}
        `}
      >
        <div
          className={`
            w-5 h-5 rounded-full bg-white shadow transition-transform
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </div>
    </button>
  );
}

export default CognitiveSettingsPanel;
