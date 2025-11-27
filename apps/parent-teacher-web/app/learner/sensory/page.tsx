/**
 * Parent/Teacher Sensory Settings Page
 * Allows parents and teachers to manage learner sensory profiles
 */

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type {
  SensoryProfile,
  SensoryPreset,
  PresetId,
  VisualSettings,
  AuditorySettings,
  MotorSettings,
  CognitiveSettings,
  EnvironmentSettings,
} from "@aivo/api-client/src/sensory-contracts";
import { SENSORY_PRESETS } from "@aivo/api-client/src/sensory-contracts";

type SettingsCategory = "overview" | "visual" | "auditory" | "motor" | "cognitive" | "environment";

interface EffectivenessData {
  overallScore: number | null;
  recommendations: string[];
}

const API_BASE = "/api/sensory";

// Loading fallback for suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Wrapper component that uses useSearchParams
export default function ParentTeacherSensoryPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SensoryPageContent />
    </Suspense>
  );
}

function SensoryPageContent() {
  const searchParams = useSearchParams();
  const learnerId = searchParams.get("learnerId");

  const [profile, setProfile] = useState<SensoryProfile | null>(null);
  const [effectiveness, setEffectiveness] = useState<EffectivenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("overview");

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    if (!learnerId) {
      setError("No learner selected");
      setLoading(false);
      return;
    }

    try {
      const [profileRes, effectivenessRes] = await Promise.all([
        fetch(`${API_BASE}/learner/${learnerId}`),
        fetch(`${API_BASE}/effectiveness?learnerId=${learnerId}`),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
      }

      if (effectivenessRes.ok) {
        const data = await effectivenessRes.json();
        setEffectiveness({
          overallScore: data.overallScore,
          recommendations: data.recommendations || [],
        });
      }
    } catch (err) {
      setError("Failed to load sensory profile");
    } finally {
      setLoading(false);
    }
  }, [learnerId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update profile
  const updateProfile = async (updates: Record<string, unknown>) => {
    if (!learnerId) return;
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/learner/${learnerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      } else {
        throw new Error("Failed to update");
      }
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Apply preset
  const applyPreset = async (presetId: PresetId) => {
    if (!learnerId) return;
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/apply-preset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, presetId }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (err) {
      setError("Failed to apply preset");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading sensory profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Unable to Load</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProfile}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Accessibility Settings
              </h1>
              <p className="text-gray-500 text-sm">
                Customize learning experience for your learner
              </p>
            </div>
            {saving && (
              <div className="flex items-center gap-2 text-indigo-600">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <nav className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Settings
              </h3>
              <ul className="space-y-1">
                {[
                  { id: "overview", label: "Overview", icon: "📊" },
                  { id: "visual", label: "Visual", icon: "👁️" },
                  { id: "auditory", label: "Auditory", icon: "👂" },
                  { id: "motor", label: "Motor", icon: "🖱️" },
                  { id: "cognitive", label: "Cognitive", icon: "🧠" },
                  { id: "environment", label: "Environment", icon: "🌿" },
                ].map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveCategory(item.id as SettingsCategory)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                        ${activeCategory === item.id
                          ? "bg-indigo-50 text-indigo-700"
                          : "hover:bg-gray-50 text-gray-700"
                        }
                      `}
                    >
                      <span>{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Quick actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Quick Presets
                </h3>
                <div className="space-y-2">
                  {SENSORY_PRESETS.slice(0, 3).map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm
                        ${profile?.presetId === preset.id
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                        }
                      `}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Effectiveness Score */}
            {activeCategory === "overview" && effectiveness && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Effectiveness Overview
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-indigo-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-indigo-600">
                      {effectiveness.overallScore ?? "—"}%
                    </div>
                    <div className="text-sm text-indigo-700">Overall Score</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {profile?.presetId ? "✓" : "—"}
                    </div>
                    <div className="text-sm text-green-700">
                      {profile?.presetId
                        ? SENSORY_PRESETS.find((p) => p.id === profile.presetId)?.name
                        : "Custom Settings"}
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-amber-600">
                      {effectiveness.recommendations.length}
                    </div>
                    <div className="text-sm text-amber-700">Recommendations</div>
                  </div>
                </div>

                {effectiveness.recommendations.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-medium text-gray-800 mb-2">💡 Suggestions</h3>
                    <ul className="space-y-2">
                      {effectiveness.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-amber-500">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Current Preset Info */}
            {activeCategory === "overview" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Choose a Preset
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SENSORY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={`
                        p-4 rounded-xl border-2 text-left transition-all
                        ${profile?.presetId === preset.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-200"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{preset.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">{preset.name}</h3>
                          <p className="text-sm text-gray-600">{preset.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {preset.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Panels */}
            {profile && activeCategory === "visual" && (
              <SettingsCard
                title="Visual Settings"
                description="Control colors, fonts, and animations"
              >
                <SettingsGrid>
                  <ToggleSetting
                    label="Reduce Animations"
                    description="Less bouncing and sliding effects"
                    checked={profile.visual.reduceAnimations}
                    onChange={(v) => updateProfile({ visual: { reduceAnimations: v } })}
                  />
                  <ToggleSetting
                    label="High Contrast"
                    description="Stronger colors and borders"
                    checked={profile.visual.highContrast}
                    onChange={(v) => updateProfile({ visual: { highContrast: v } })}
                  />
                  <ToggleSetting
                    label="Dark Mode"
                    description="Dark background theme"
                    checked={profile.visual.darkMode}
                    onChange={(v) => updateProfile({ visual: { darkMode: v } })}
                  />
                  <ToggleSetting
                    label="Reduced Clutter"
                    description="Hide decorative elements"
                    checked={profile.visual.reducedClutter}
                    onChange={(v) => updateProfile({ visual: { reducedClutter: v } })}
                  />
                </SettingsGrid>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Size
                  </label>
                  <select
                    value={profile.visual.fontSize}
                    onChange={(e) => updateProfile({ visual: { fontSize: e.target.value } })}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="x-large">Extra Large</option>
                  </select>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Style
                  </label>
                  <select
                    value={profile.visual.fontFamily}
                    onChange={(e) => updateProfile({ visual: { fontFamily: e.target.value } })}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                  >
                    <option value="default">Default</option>
                    <option value="dyslexic">Dyslexia-Friendly</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="serif">Serif</option>
                  </select>
                </div>
              </SettingsCard>
            )}

            {profile && activeCategory === "auditory" && (
              <SettingsCard
                title="Auditory Settings"
                description="Control sounds and text-to-speech"
              >
                <SettingsGrid>
                  <ToggleSetting
                    label="Mute All Sounds"
                    description="Turn off all audio"
                    checked={profile.auditory.muteAllSounds}
                    onChange={(v) => updateProfile({ auditory: { muteAllSounds: v } })}
                  />
                  <ToggleSetting
                    label="Text-to-Speech"
                    description="Read text aloud"
                    checked={profile.auditory.textToSpeechEnabled}
                    onChange={(v) => updateProfile({ auditory: { textToSpeechEnabled: v } })}
                  />
                  <ToggleSetting
                    label="No Background Music"
                    description="Disable background music"
                    checked={profile.auditory.noBackgroundMusic}
                    onChange={(v) => updateProfile({ auditory: { noBackgroundMusic: v } })}
                  />
                  <ToggleSetting
                    label="Audio Descriptions"
                    description="Describe images and videos"
                    checked={profile.auditory.audioDescriptions}
                    onChange={(v) => updateProfile({ auditory: { audioDescriptions: v } })}
                  />
                </SettingsGrid>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume: {profile.auditory.soundVolume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={profile.auditory.soundVolume}
                    onChange={(e) =>
                      updateProfile({ auditory: { soundVolume: parseInt(e.target.value) } })
                    }
                    className="w-full"
                  />
                </div>
              </SettingsCard>
            )}

            {profile && activeCategory === "motor" && (
              <SettingsCard
                title="Motor Settings"
                description="Control click targets and keyboard navigation"
              >
                <SettingsGrid>
                  <ToggleSetting
                    label="Larger Click Targets"
                    description="Bigger buttons and links"
                    checked={profile.motor.largerClickTargets}
                    onChange={(v) => updateProfile({ motor: { largerClickTargets: v } })}
                  />
                  <ToggleSetting
                    label="No Double-Click"
                    description="Single click activates"
                    checked={profile.motor.noDoubleClick}
                    onChange={(v) => updateProfile({ motor: { noDoubleClick: v } })}
                  />
                  <ToggleSetting
                    label="No Drag and Drop"
                    description="Use buttons instead"
                    checked={profile.motor.noDragAndDrop}
                    onChange={(v) => updateProfile({ motor: { noDragAndDrop: v } })}
                  />
                  <ToggleSetting
                    label="Keyboard Only"
                    description="Navigate with keyboard"
                    checked={profile.motor.keyboardOnly}
                    onChange={(v) => updateProfile({ motor: { keyboardOnly: v } })}
                  />
                </SettingsGrid>
              </SettingsCard>
            )}

            {profile && activeCategory === "cognitive" && (
              <SettingsCard
                title="Cognitive Settings"
                description="Control pacing, breaks, and focus"
              >
                <SettingsGrid>
                  <ToggleSetting
                    label="One Thing at a Time"
                    description="Show fewer items"
                    checked={profile.cognitive.oneThingAtATime}
                    onChange={(v) => updateProfile({ cognitive: { oneThingAtATime: v } })}
                  />
                  <ToggleSetting
                    label="Simpler Instructions"
                    description="Easier language"
                    checked={profile.cognitive.simplifyInstructions}
                    onChange={(v) => updateProfile({ cognitive: { simplifyInstructions: v } })}
                  />
                  <ToggleSetting
                    label="Extended Time"
                    description="More time for tasks"
                    checked={profile.cognitive.extendedTime}
                    onChange={(v) => updateProfile({ cognitive: { extendedTime: v } })}
                  />
                  <ToggleSetting
                    label="Break Reminders"
                    description="Remind to take breaks"
                    checked={profile.cognitive.breakReminders}
                    onChange={(v) => updateProfile({ cognitive: { breakReminders: v } })}
                  />
                </SettingsGrid>

                {profile.cognitive.extendedTime && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Multiplier: {profile.cognitive.timeMultiplier}x
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.5"
                      value={profile.cognitive.timeMultiplier}
                      onChange={(e) =>
                        updateProfile({ cognitive: { timeMultiplier: parseFloat(e.target.value) } })
                      }
                      className="w-full"
                    />
                  </div>
                )}

                {profile.cognitive.breakReminders && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Break Frequency: Every {profile.cognitive.breakFrequency} minutes
                    </label>
                    <select
                      value={profile.cognitive.breakFrequency}
                      onChange={(e) =>
                        updateProfile({ cognitive: { breakFrequency: parseInt(e.target.value) } })
                      }
                      className="w-full p-3 border border-gray-200 rounded-lg"
                    >
                      <option value="10">10 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="20">20 minutes</option>
                      <option value="30">30 minutes</option>
                    </select>
                  </div>
                )}
              </SettingsCard>
            )}

            {profile && activeCategory === "environment" && (
              <SettingsCard
                title="Environment Settings"
                description="Control workspace and background sounds"
              >
                <SettingsGrid>
                  <ToggleSetting
                    label="Full Screen Mode"
                    description="Use entire screen"
                    checked={profile.environment.fullScreenMode}
                    onChange={(v) => updateProfile({ environment: { fullScreenMode: v } })}
                  />
                  <ToggleSetting
                    label="Minimize Distractions"
                    description="Hide extra elements"
                    checked={profile.environment.minimizeDistractions}
                    onChange={(v) => updateProfile({ environment: { minimizeDistractions: v } })}
                  />
                  <ToggleSetting
                    label="Hide Chat"
                    description="No chat messages"
                    checked={profile.environment.hideChat}
                    onChange={(v) => updateProfile({ environment: { hideChat: v } })}
                  />
                  <ToggleSetting
                    label="Hide Notifications"
                    description="No notification badges"
                    checked={profile.environment.hideNotifications}
                    onChange={(v) => updateProfile({ environment: { hideNotifications: v } })}
                  />
                </SettingsGrid>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Sound
                  </label>
                  <select
                    value={profile.environment.whiteNoise}
                    onChange={(e) => updateProfile({ environment: { whiteNoise: e.target.value } })}
                    className="w-full p-3 border border-gray-200 rounded-lg"
                  >
                    <option value="none">None</option>
                    <option value="rain">Rain</option>
                    <option value="ocean">Ocean</option>
                    <option value="forest">Forest</option>
                    <option value="pink">Pink Noise</option>
                    <option value="brown">Brown Noise</option>
                  </select>
                </div>
              </SettingsCard>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-500 mb-6">{description}</p>
      {children}
    </div>
  );
}

function SettingsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`
        flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all
        ${checked ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-200"}
      `}
    >
      <div>
        <div className="font-medium text-gray-800">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <div
        className={`
          w-12 h-7 rounded-full p-1 transition-colors
          ${checked ? "bg-indigo-500" : "bg-gray-300"}
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
