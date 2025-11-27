/**
 * Environment Settings Panel Component
 * Friendly controls for workspace and environment settings
 */

"use client";

import { useState, useRef, useEffect } from "react";
import type { EnvironmentSettings, WhiteNoiseType } from "@aivo/api-client/src/sensory-contracts";

interface EnvironmentSettingsPanelProps {
  settings: EnvironmentSettings;
  onUpdate: (settings: Partial<EnvironmentSettings>) => void;
}

// Sound URLs (using free ambient sounds)
const WHITE_NOISE_URLS: Record<Exclude<WhiteNoiseType, "none">, string> = {
  rain: "https://cdn.pixabay.com/audio/2022/05/13/audio_257112181b.mp3",
  ocean: "https://cdn.pixabay.com/audio/2021/09/06/audio_8b9a2f7c49.mp3",
  forest: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3",
  pink: "", // Would need actual pink noise audio
  brown: "", // Would need actual brown noise audio
};

export function EnvironmentSettingsPanel({ settings, onUpdate }: EnvironmentSettingsPanelProps) {
  const [playingPreview, setPlayingPreview] = useState<WhiteNoiseType | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = (type: WhiteNoiseType) => {
    if (type === "none" || !WHITE_NOISE_URLS[type]) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (playingPreview === type) {
      setPlayingPreview(null);
      return;
    }

    const audio = new Audio(WHITE_NOISE_URLS[type]);
    audio.loop = true;
    audio.volume = 0.3;
    audio.play();
    audioRef.current = audio;
    setPlayingPreview(type);
  };

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Stop audio when white noise is set to none
  useEffect(() => {
    if (settings.whiteNoise === "none" && audioRef.current) {
      audioRef.current.pause();
      setPlayingPreview(null);
    }
  }, [settings.whiteNoise]);

  const WHITE_NOISE_OPTIONS: { type: WhiteNoiseType; label: string; icon: string; description: string }[] = [
    { type: "none", label: "Quiet", icon: "🔇", description: "No background sounds" },
    { type: "rain", label: "Rain", icon: "🌧️", description: "Gentle rainfall" },
    { type: "ocean", label: "Ocean", icon: "🌊", description: "Calm waves" },
    { type: "forest", label: "Forest", icon: "🌲", description: "Birds and nature" },
    { type: "pink", label: "Pink Noise", icon: "💗", description: "Soothing static" },
    { type: "brown", label: "Brown Noise", icon: "🟤", description: "Deep rumble" },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">🌿 Your Space</h2>
        <p className="text-slate-600">Make your learning space calm and focused</p>
      </div>

      {/* Distraction-Free Mode */}
      <SettingSection title="Focus Space" icon="🎯" description="Remove distractions">
        <div className="space-y-3">
          <ToggleSetting
            label="Hide Extra Stuff"
            icon="✨"
            description="Show only what you need"
            checked={settings.minimizeDistractions}
            onChange={(checked) => onUpdate({ minimizeDistractions: checked })}
          />
          <ToggleSetting
            label="Full Screen"
            icon="📺"
            description="Use the whole screen"
            checked={settings.fullScreenMode}
            onChange={(checked) => onUpdate({ fullScreenMode: checked })}
          />
        </div>
      </SettingSection>

      {/* Notifications */}
      <SettingSection title="Messages" icon="💬" description="Control what pops up">
        <div className="space-y-3">
          <ToggleSetting
            label="Hide Chat"
            icon="💭"
            description="No chat messages while working"
            checked={settings.hideChat}
            onChange={(checked) => onUpdate({ hideChat: checked })}
          />
          <ToggleSetting
            label="Hide Notifications"
            icon="🔕"
            description="No badges or alerts"
            checked={settings.hideNotifications}
            onChange={(checked) => onUpdate({ hideNotifications: checked })}
          />
        </div>
      </SettingSection>

      {/* White Noise / Background Sounds */}
      <SettingSection title="Background Sounds" icon="🎵" description="Calming sounds to help you focus">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {WHITE_NOISE_OPTIONS.map((option) => (
            <button
              key={option.type}
              onClick={() => onUpdate({ whiteNoise: option.type })}
              className={`
                relative p-4 rounded-xl border-2 transition-all text-center
                ${settings.whiteNoise === option.type
                  ? "border-primary-500 bg-primary-50"
                  : "border-slate-200 bg-white hover:border-primary-200"
                }
              `}
            >
              <span className="block text-3xl mb-2">{option.icon}</span>
              <span className="block font-medium text-slate-800">{option.label}</span>
              <span className="text-xs text-slate-500">{option.description}</span>

              {/* Preview button */}
              {option.type !== "none" && WHITE_NOISE_URLS[option.type] && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSound(option.type);
                  }}
                  className={`
                    absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center
                    transition-colors text-sm
                    ${playingPreview === option.type
                      ? "bg-primary-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }
                  `}
                >
                  {playingPreview === option.type ? "⏹" : "▶"}
                </button>
              )}
            </button>
          ))}
        </div>

        {/* Currently playing indicator */}
        {playingPreview && (
          <div className="mt-4 p-4 bg-primary-50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎧</span>
              <span className="text-primary-700">
                Previewing: {WHITE_NOISE_OPTIONS.find(o => o.type === playingPreview)?.label}
              </span>
            </div>
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                }
                setPlayingPreview(null);
              }}
              className="px-3 py-1 bg-primary-500 text-white rounded-lg text-sm font-medium"
            >
              Stop
            </button>
          </div>
        )}

        {/* Volume info */}
        {settings.whiteNoise !== "none" && (
          <p className="text-sm text-slate-500 text-center mt-2">
            💡 Background sounds play automatically when you start learning
          </p>
        )}
      </SettingSection>

      {/* Environment preview */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <h4 className="font-medium text-slate-800 mb-4 text-center">👀 Preview Your Space</h4>
        
        <div
          className={`
            relative overflow-hidden rounded-xl border-2 border-slate-200 h-48
            transition-all
            ${settings.minimizeDistractions ? "bg-slate-100" : "bg-white"}
          `}
        >
          {/* Simulated interface */}
          <div className="absolute inset-0 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-24 bg-primary-200 rounded" />
              {!settings.minimizeDistractions && (
                <div className="flex gap-2">
                  {!settings.hideNotifications && (
                    <div className="h-6 w-6 bg-coral-200 rounded-full" />
                  )}
                  {!settings.hideChat && (
                    <div className="h-6 w-6 bg-sky-200 rounded-full" />
                  )}
                </div>
              )}
            </div>

            {/* Content area */}
            <div className="h-20 bg-slate-200 rounded-lg mb-4" />

            {/* Footer */}
            {!settings.minimizeDistractions && (
              <div className="flex gap-2">
                <div className="h-4 w-16 bg-slate-200 rounded" />
                <div className="h-4 w-16 bg-slate-200 rounded" />
              </div>
            )}
          </div>

          {/* Full screen indicator */}
          {settings.fullScreenMode && (
            <div className="absolute inset-0 border-4 border-primary-500 rounded-xl pointer-events-none" />
          )}

          {/* White noise indicator */}
          {settings.whiteNoise !== "none" && (
            <div className="absolute bottom-2 right-2 bg-white/90 rounded-full px-3 py-1 flex items-center gap-1 text-xs">
              <span>{WHITE_NOISE_OPTIONS.find(o => o.type === settings.whiteNoise)?.icon}</span>
              <span className="text-slate-600">Playing</span>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          This shows how your learning space will look
        </p>
      </div>

      {/* Tips */}
      <div className="bg-mint-50 rounded-2xl p-5 border border-mint/20">
        <h4 className="font-medium text-mint-dark mb-2 flex items-center gap-2">
          <span>💡</span> Environment Tips
        </h4>
        <ul className="text-sm text-mint-dark space-y-1">
          <li>• Background sounds can help block out distracting noises</li>
          <li>• Try different sounds to find what helps you focus best</li>
          <li>• Full screen mode is great for tests and focused work</li>
          <li>• You can always change these settings during a session</li>
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

export default EnvironmentSettingsPanel;
