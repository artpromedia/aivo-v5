/**
 * Sensory Profile Page
 * A friendly interface for learners to customize their accessibility settings
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSensoryProfile } from "../hooks/useSensoryProfile";
import { SensoryPresetSelector } from "./components/SensoryPresetSelector";
import { VisualSettingsPanel } from "./components/VisualSettingsPanel";
import { AuditorySettingsPanel } from "./components/AuditorySettingsPanel";
import { MotorSettingsPanel } from "./components/MotorSettingsPanel";
import { CognitiveSettingsPanel } from "./components/CognitiveSettingsPanel";
import { EnvironmentSettingsPanel } from "./components/EnvironmentSettingsPanel";
import { SensoryPreview } from "./components/SensoryPreview";

type SettingsTab = "presets" | "visual" | "auditory" | "motor" | "cognitive" | "environment";

const TABS: { id: SettingsTab; label: string; icon: string; description: string }[] = [
  { id: "presets", label: "Quick Start", icon: "✨", description: "Choose a preset that fits you" },
  { id: "visual", label: "Seeing", icon: "👁️", description: "Colors, fonts, and animations" },
  { id: "auditory", label: "Hearing", icon: "👂", description: "Sounds and speech" },
  { id: "motor", label: "Clicking", icon: "🖱️", description: "Buttons and movements" },
  { id: "cognitive", label: "Focus", icon: "🧠", description: "Breaks and pacing" },
  { id: "environment", label: "Space", icon: "🌿", description: "Your workspace" },
];

export default function SensoryProfilePage() {
  const {
    profile,
    presets,
    isLoading,
    error,
    updateVisual,
    updateAuditory,
    updateMotor,
    updateCognitive,
    updateEnvironment,
    applyPreset,
    shouldReduceMotion,
  } = useSensoryProfile();

  const [activeTab, setActiveTab] = useState<SettingsTab>("presets");
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const motionProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: { duration: 0.2 },
      };

  // Handle saving with optimistic updates
  const handleSave = async (fn: () => Promise<void>) => {
    setIsSaving(true);
    try {
      await fn();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-mint-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-primary-200 rounded-full animate-pulse flex items-center justify-center">
            <span className="text-3xl">🎨</span>
          </div>
          <p className="text-slate-600 text-lg">Setting up your space...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-coral-50 via-white to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 bg-coral-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">😕</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h1>
          <p className="text-slate-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-mint-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span>🎨</span> My Settings
              </h1>
              <p className="text-slate-500 text-sm">Make AIVO work best for you</p>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-xl font-medium hover:bg-primary-200 transition-colors"
            >
              <span>👀</span>
              {showPreview ? "Hide Preview" : "Preview"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Saving indicator */}
        <AnimatePresence>
          {isSaving && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2"
            >
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Panel (collapsible) */}
        <AnimatePresence>
          {showPreview && profile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <SensoryPreview profile={profile} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation - Friendly large buttons for learners */}
        <nav className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex flex-col items-center p-4 rounded-2xl min-w-[100px] transition-all
                  ${
                    activeTab === tab.id
                      ? "bg-primary-500 text-white shadow-lg scale-105"
                      : "bg-white text-slate-600 hover:bg-slate-50 shadow-soft"
                  }
                `}
              >
                <span className="text-2xl mb-1">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl shadow-card p-6">
          <AnimatePresence mode="wait">
            {activeTab === "presets" && (
              <motion.div key="presets" {...motionProps}>
                <SensoryPresetSelector
                  presets={presets}
                  currentPresetId={profile?.presetId ?? null}
                  onSelectPreset={(presetId) => handleSave(() => applyPreset(presetId))}
                />
              </motion.div>
            )}

            {activeTab === "visual" && profile && (
              <motion.div key="visual" {...motionProps}>
                <VisualSettingsPanel
                  settings={profile.visual}
                  onUpdate={(settings) => handleSave(() => updateVisual(settings))}
                />
              </motion.div>
            )}

            {activeTab === "auditory" && profile && (
              <motion.div key="auditory" {...motionProps}>
                <AuditorySettingsPanel
                  settings={profile.auditory}
                  onUpdate={(settings) => handleSave(() => updateAuditory(settings))}
                />
              </motion.div>
            )}

            {activeTab === "motor" && profile && (
              <motion.div key="motor" {...motionProps}>
                <MotorSettingsPanel
                  settings={profile.motor}
                  onUpdate={(settings) => handleSave(() => updateMotor(settings))}
                />
              </motion.div>
            )}

            {activeTab === "cognitive" && profile && (
              <motion.div key="cognitive" {...motionProps}>
                <CognitiveSettingsPanel
                  settings={profile.cognitive}
                  onUpdate={(settings) => handleSave(() => updateCognitive(settings))}
                />
              </motion.div>
            )}

            {activeTab === "environment" && profile && (
              <motion.div key="environment" {...motionProps}>
                <EnvironmentSettingsPanel
                  settings={profile.environment}
                  onUpdate={(settings) => handleSave(() => updateEnvironment(settings))}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Help footer */}
        <footer className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Need help? Ask a parent, teacher, or{" "}
            <button className="text-primary-500 underline">chat with our helper</button>
          </p>
        </footer>
      </div>
    </main>
  );
}
