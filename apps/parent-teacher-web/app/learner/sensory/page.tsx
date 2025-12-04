/**
 * Parent/Teacher Sensory Settings Page
 * Allows parents and teachers to manage learner sensory profiles
 *
 * Theme: Unified violet/lavender enterprise design
 */

'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Eye,
  Ear,
  Mouse,
  Brain,
  Leaf,
  AlertTriangle,
  Lightbulb,
  Check,
  Settings,
  Loader2,
} from 'lucide-react';
import { showToast } from '../../../components/providers/ToastProvider';
import { CalmCornerFab } from '../../../components/sensory';
import type { SensoryProfile, PresetId } from '@aivo/api-client/src/sensory-contracts';
import { SENSORY_PRESETS } from '@aivo/api-client/src/sensory-contracts';

type SettingsCategory = 'overview' | 'visual' | 'auditory' | 'motor' | 'cognitive' | 'environment';

interface EffectivenessData {
  overallScore: number | null;
  recommendations: string[];
  categoryScores?: {
    visual: number;
    auditory: number;
    motor: number;
    cognitive: number;
    environment: number;
  };
  weeklyTrend?: number[];
  isDemo?: boolean;
}

const API_BASE = '/api/sensory';

// Generate demo effectiveness data when no real data exists
function generateDemoEffectivenessData(): EffectivenessData {
  return {
    overallScore: 78,
    recommendations: [
      "Consider enabling 'Reduce Animations' to minimize visual distractions",
      "Try the 'Focus Mode' preset for extended reading sessions",
      'Break reminders every 15 minutes may help maintain attention',
      'Text-to-speech could support reading comprehension',
    ],
    categoryScores: {
      visual: 82,
      auditory: 75,
      motor: 88,
      cognitive: 72,
      environment: 73,
    },
    weeklyTrend: [65, 68, 72, 70, 75, 78, 78],
    isDemo: true,
  };
}

// Icon map for categories
const CATEGORY_ICONS = {
  overview: BarChart3,
  visual: Eye,
  auditory: Ear,
  motor: Mouse,
  cognitive: Brain,
  environment: Leaf,
} as const;

// Loading fallback for suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
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
  const learnerId = searchParams.get('learnerId');

  const [profile, setProfile] = useState<SensoryProfile | null>(null);
  const [effectiveness, setEffectiveness] = useState<EffectivenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('overview');
  const [useDemoData, setUseDemoData] = useState(false);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    if (!learnerId) {
      setError('No learner selected');
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
        // Check if we have real data or need demo data
        if (data.overallScore !== null && data.overallScore !== undefined) {
          setEffectiveness({
            overallScore: data.overallScore,
            recommendations: data.recommendations || [],
            categoryScores: data.categoryScores,
            weeklyTrend: data.weeklyTrend,
            isDemo: false,
          });
          setUseDemoData(false);
        } else {
          // No real data - use demo data
          setEffectiveness(generateDemoEffectivenessData());
          setUseDemoData(true);
        }
      } else {
        // API failed - use demo data as fallback
        setEffectiveness(generateDemoEffectivenessData());
        setUseDemoData(true);
      }
    } catch {
      setError('Failed to load sensory profile');
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        showToast.success('Settings saved successfully');
      } else {
        throw new Error('Failed to update');
      }
    } catch {
      setError('Failed to save changes');
      showToast.error('Failed to save changes');
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learnerId, presetId }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        const presetName = SENSORY_PRESETS.find((p) => p.id === presetId)?.name || 'Preset';
        showToast.success(`${presetName} applied successfully`);
      } else {
        throw new Error('Failed to apply preset');
      }
    } catch {
      setError('Failed to apply preset');
      showToast.error('Failed to apply preset');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading sensory profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Unable to Load</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProfile}
            className="px-6 py-2 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-lavender-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Accessibility Settings</h1>
                <p className="text-gray-500 text-sm">
                  Customize learning experience for your learner
                </p>
              </div>
            </div>
            {saving && (
              <div className="flex items-center gap-2 text-violet-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-medium">Saving...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <nav className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-24">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Settings
              </h3>
              <ul className="space-y-1">
                {(
                  [
                    { id: 'overview', label: 'Overview' },
                    { id: 'visual', label: 'Visual' },
                    { id: 'auditory', label: 'Auditory' },
                    { id: 'motor', label: 'Motor' },
                    { id: 'cognitive', label: 'Cognitive' },
                    { id: 'environment', label: 'Environment' },
                  ] as const
                ).map((item) => {
                  const Icon = CATEGORY_ICONS[item.id];
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveCategory(item.id as SettingsCategory)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
                          ${
                            activeCategory === item.id
                              ? 'bg-violet-50 text-violet-700 shadow-sm'
                              : 'hover:bg-lavender-50 text-gray-700'
                          }
                        `}
                      >
                        <Icon
                          className={`w-5 h-5 ${activeCategory === item.id ? 'text-violet-600' : 'text-gray-400'}`}
                        />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Quick actions */}
              <div className="mt-6 pt-6 border-t border-lavender-200">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Quick Presets
                </h3>
                <div className="space-y-2">
                  {SENSORY_PRESETS.slice(0, 3).map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm transition-all
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
                        ${
                          profile?.presetId === preset.id
                            ? 'bg-violet-100 text-violet-700 shadow-sm'
                            : 'bg-lavender-50 hover:bg-lavender-100 text-gray-700'
                        }
                      `}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.name}</span>
                      {profile?.presetId === preset.id && (
                        <Check className="w-4 h-4 ml-auto text-violet-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Effectiveness Score */}
            {activeCategory === 'overview' && effectiveness && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Effectiveness Overview</h2>
                  {useDemoData && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      <Lightbulb className="w-3.5 h-3.5" />
                      Demo Data
                    </span>
                  )}
                </div>

                {useDemoData && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                    <strong>Note:</strong> This is sample data showing how effectiveness tracking
                    works. Real metrics will appear as your learner uses the platform with these
                    settings.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-violet-50 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-violet-600">
                      {effectiveness.overallScore ?? '—'}%
                    </div>
                    <div className="text-sm text-violet-700">Overall Score</div>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-600">
                      {profile?.presetId ? <Check className="w-8 h-8 mx-auto" /> : '—'}
                    </div>
                    <div className="text-sm text-emerald-700">
                      {profile?.presetId
                        ? SENSORY_PRESETS.find((p) => p.id === profile.presetId)?.name
                        : 'Custom Settings'}
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-amber-600">
                      {effectiveness.recommendations.length}
                    </div>
                    <div className="text-sm text-amber-700">Recommendations</div>
                  </div>
                </div>

                {/* Category Scores */}
                {effectiveness.categoryScores && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-800 mb-3">Category Scores</h3>
                    <div className="space-y-3">
                      {Object.entries(effectiveness.categoryScores).map(([category, score]) => {
                        const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                        return (
                          <div key={category} className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-gray-400" />
                            <span className="w-24 text-sm text-gray-700 capitalize">
                              {category}
                            </span>
                            <div className="flex-1 bg-lavender-100 rounded-full h-2.5">
                              <div
                                className="bg-violet-500 h-2.5 rounded-full transition-all"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className="w-12 text-sm font-medium text-gray-700 text-right">
                              {score}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Weekly Trend Mini Chart */}
                {effectiveness.weeklyTrend && (
                  <div className="mb-6 p-4 bg-lavender-50 rounded-xl">
                    <h3 className="font-medium text-gray-800 mb-3">7-Day Trend</h3>
                    <div className="flex items-end justify-between h-16 gap-1">
                      {effectiveness.weeklyTrend.map((value, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-violet-400 rounded-t transition-all"
                            style={{ height: `${(value / 100) * 64}px` }}
                          />
                          <span className="text-xs text-gray-500">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {effectiveness.recommendations.length > 0 && (
                  <div className="bg-lavender-50 rounded-2xl p-4">
                    <h3 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      Suggestions
                    </h3>
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
            {activeCategory === 'overview' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Choose a Preset</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SENSORY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={`
                        p-4 rounded-2xl border-2 text-left transition-all
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
                        ${
                          profile?.presetId === preset.id
                            ? 'border-violet-500 bg-violet-50 shadow-md'
                            : 'border-lavender-200 hover:border-violet-300 hover:bg-lavender-50'
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
            {profile && activeCategory === 'visual' && (
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
                  <label
                    htmlFor="font-size"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Font Size
                  </label>
                  <select
                    id="font-size"
                    value={profile.visual.fontSize}
                    onChange={(e) => updateProfile({ visual: { fontSize: e.target.value } })}
                    className="w-full p-3 border-2 border-lavender-200 rounded-xl bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-colors"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="x-large">Extra Large</option>
                  </select>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="font-style"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Font Style
                  </label>
                  <select
                    id="font-style"
                    value={profile.visual.fontFamily}
                    onChange={(e) => updateProfile({ visual: { fontFamily: e.target.value } })}
                    className="w-full p-3 border-2 border-lavender-200 rounded-xl bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-colors"
                  >
                    <option value="default">Default</option>
                    <option value="dyslexic">Dyslexia-Friendly</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="serif">Serif</option>
                  </select>
                </div>
              </SettingsCard>
            )}

            {profile && activeCategory === 'auditory' && (
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
                    className="w-full accent-violet-500"
                  />
                </div>
              </SettingsCard>
            )}

            {profile && activeCategory === 'motor' && (
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

            {profile && activeCategory === 'cognitive' && (
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
                      className="w-full accent-violet-500"
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
                      className="w-full p-3 border-2 border-lavender-200 rounded-xl bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-colors"
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

            {profile && activeCategory === 'environment' && (
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
                  <label
                    htmlFor="background-sound"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Background Sound
                  </label>
                  <select
                    id="background-sound"
                    value={profile.environment.whiteNoise}
                    onChange={(e) => updateProfile({ environment: { whiteNoise: e.target.value } })}
                    className="w-full p-3 border-2 border-lavender-200 rounded-xl bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-colors"
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

      {/* Calm Corner FAB */}
      <CalmCornerFab
        showPulse={
          effectiveness?.overallScore !== null &&
          effectiveness?.overallScore !== undefined &&
          effectiveness.overallScore < 50
        }
        focusScore={effectiveness?.overallScore ?? undefined}
        onNavigate={(destination) => {
          // Handle navigation to calm corner features
          showToast.info(
            `Opening ${destination === 'games' ? 'Focus Games' : destination === 'breathing' ? 'Breathing Exercise' : 'Calm Corner'}...`,
          );
          // TODO: Implement actual navigation when calm corner pages are created
        }}
      />
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
    <div className="bg-white rounded-2xl shadow-lg p-6">
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
        flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2
        ${checked ? 'border-violet-500 bg-violet-50 shadow-sm' : 'border-lavender-200 hover:border-violet-300'}
      `}
      role="switch"
      aria-checked={checked}
    >
      <div>
        <div className="font-medium text-gray-800">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <div
        className={`
          w-12 h-7 rounded-full p-1 transition-colors
          ${checked ? 'bg-violet-500' : 'bg-gray-300'}
        `}
      >
        <div
          className={`
            w-5 h-5 rounded-full bg-white shadow transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
    </button>
  );
}
