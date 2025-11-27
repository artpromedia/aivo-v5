/**
 * Auditory Settings Panel Component
 * Friendly controls for sound and speech settings
 */

"use client";

import { useState } from "react";
import type { AuditorySettings } from "@aivo/api-client/src/sensory-contracts";

interface AuditorySettingsPanelProps {
  settings: AuditorySettings;
  onUpdate: (settings: Partial<AuditorySettings>) => void;
}

export function AuditorySettingsPanel({ settings, onUpdate }: AuditorySettingsPanelProps) {
  const [testingTTS, setTestingTTS] = useState(false);

  const testTextToSpeech = () => {
    if ("speechSynthesis" in window) {
      setTestingTTS(true);
      const utterance = new SpeechSynthesisUtterance("Hello! This is how I sound when I read to you.");
      utterance.rate = settings.textToSpeechSpeed;
      utterance.onend = () => setTestingTTS(false);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">👂 How You Hear Things</h2>
        <p className="text-slate-600">Control sounds and have text read aloud</p>
      </div>

      {/* Master Volume / Mute */}
      <SettingSection title="Sound Volume" icon="🔊" description="How loud should sounds be?">
        {settings.muteAllSounds ? (
          <div className="text-center py-6 bg-slate-50 rounded-xl">
            <span className="text-4xl mb-2 block">🔇</span>
            <p className="text-slate-600 mb-4">All sounds are muted</p>
            <button
              onClick={() => onUpdate({ muteAllSounds: false })}
              className="px-6 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              Turn Sound On
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🔈</span>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.soundVolume}
                onChange={(e) => onUpdate({ soundVolume: parseInt(e.target.value) })}
                className="flex-1 h-3 rounded-full appearance-none bg-slate-200 accent-primary-500"
              />
              <span className="text-2xl">🔊</span>
              <span className="w-12 text-center font-medium text-slate-700">
                {settings.soundVolume}%
              </span>
            </div>
            <button
              onClick={() => onUpdate({ muteAllSounds: true })}
              className="w-full p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-coral-300 hover:bg-coral-50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔇</span>
                <div>
                  <span className="block font-medium text-slate-800">Mute Everything</span>
                  <span className="text-sm text-slate-500">Turn off all sounds</span>
                </div>
              </div>
            </button>
          </div>
        )}
      </SettingSection>

      {/* Sound Types */}
      <SettingSection title="Which Sounds?" icon="🎵" description="Pick what you want to hear">
        <div className="space-y-3">
          <ToggleSetting
            label="Background Music"
            icon="🎶"
            description="Music that plays while you work"
            checked={!settings.noBackgroundMusic}
            onChange={(checked) => onUpdate({ noBackgroundMusic: !checked })}
          />
          <ToggleSetting
            label="Sound Effects"
            icon="🎮"
            description="Beeps, clicks, and celebration sounds"
            checked={!settings.noSoundEffects}
            onChange={(checked) => onUpdate({ noSoundEffects: !checked })}
          />
        </div>
      </SettingSection>

      {/* Text-to-Speech */}
      <SettingSection title="Read Aloud" icon="🗣️" description="Have the computer read text to you">
        <div className="space-y-4">
          <ToggleSetting
            label="Read Aloud Enabled"
            description="Text on screen can be read to you"
            checked={settings.textToSpeechEnabled}
            onChange={(checked) => onUpdate({ textToSpeechEnabled: checked })}
          />

          {settings.textToSpeechEnabled && (
            <>
              {/* Speed control */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700">Reading Speed</span>
                  <span className="text-sm text-slate-500">
                    {settings.textToSpeechSpeed === 1 ? "Normal" :
                     settings.textToSpeechSpeed < 1 ? "Slower" : "Faster"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl">🐢</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.textToSpeechSpeed}
                    onChange={(e) => onUpdate({ textToSpeechSpeed: parseFloat(e.target.value) })}
                    className="flex-1 h-3 rounded-full appearance-none bg-slate-200 accent-primary-500"
                  />
                  <span className="text-xl">🐇</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Slow (0.5x)</span>
                  <span>Normal (1x)</span>
                  <span>Fast (2x)</span>
                </div>
              </div>

              {/* Test button */}
              <button
                onClick={testTextToSpeech}
                disabled={testingTTS}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2
                  ${testingTTS
                    ? "border-primary-500 bg-primary-100 cursor-wait"
                    : "border-primary-200 bg-white hover:border-primary-500 hover:bg-primary-50"
                  }
                `}
              >
                {testingTTS ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium text-primary-600">Speaking...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">🔊</span>
                    <span className="font-medium text-slate-700">Test It Out</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </SettingSection>

      {/* Audio Descriptions */}
      <ToggleSetting
        label="Describe Images"
        icon="🖼️"
        description="Hear descriptions of pictures and videos"
        checked={settings.audioDescriptions}
        onChange={(checked) => onUpdate({ audioDescriptions: checked })}
      />

      {/* Helpful tips */}
      <div className="bg-sky-50 rounded-2xl p-5 border border-sky-100">
        <h4 className="font-medium text-sky-800 mb-2 flex items-center gap-2">
          <span>💡</span> Did You Know?
        </h4>
        <ul className="text-sm text-sky-700 space-y-1">
          <li>• You can click on any text and press the speaker icon to hear it</li>
          <li>• Background sounds can help you focus - try it in the Environment tab!</li>
          <li>• If sounds surprise you, try the "Warn Me" option for flashing content</li>
        </ul>
      </div>
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

export default AuditorySettingsPanel;
