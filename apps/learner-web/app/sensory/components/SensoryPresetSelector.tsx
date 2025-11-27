/**
 * Sensory Preset Selector Component
 * Displays preset options in a friendly, visual grid format
 */

"use client";

import { motion } from "framer-motion";
import type { SensoryPreset, PresetId } from "@aivo/api-client/src/sensory-contracts";

interface SensoryPresetSelectorProps {
  presets: SensoryPreset[];
  currentPresetId: string | null;
  onSelectPreset: (presetId: PresetId) => void;
}

export function SensoryPresetSelector({
  presets,
  currentPresetId,
  onSelectPreset,
}: SensoryPresetSelectorProps) {
  // Group presets by category
  const groupedPresets = presets.reduce(
    (acc, preset) => {
      if (!acc[preset.category]) {
        acc[preset.category] = [];
      }
      acc[preset.category].push(preset);
      return acc;
    },
    {} as Record<string, SensoryPreset[]>
  );

  const categoryLabels: Record<string, { label: string; icon: string }> = {
    neurodiversity: { label: "For Different Minds", icon: "🌈" },
    sensory: { label: "For Your Senses", icon: "✨" },
    motor: { label: "For Movement", icon: "🎮" },
    cognitive: { label: "For Focus", icon: "🎯" },
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Pick a Preset</h2>
        <p className="text-slate-600">
          Choose a setting that sounds like you, or customize your own below!
        </p>
      </div>

      {Object.entries(groupedPresets).map(([category, categoryPresets]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <span>{categoryLabels[category]?.icon || "📦"}</span>
            {categoryLabels[category]?.label || category}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isSelected={currentPresetId === preset.id}
                onSelect={() => onSelectPreset(preset.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* No preset / Custom option */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={() => onSelectPreset("custom")}
          className={`
            w-full p-6 rounded-2xl border-2 border-dashed transition-all text-left
            ${
              currentPresetId === "custom" || currentPresetId === null
                ? "border-primary-400 bg-primary-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }
          `}
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">🎨</span>
            <div>
              <h4 className="font-semibold text-slate-800 mb-1">Make Your Own</h4>
              <p className="text-sm text-slate-600">
                Start fresh and customize each setting exactly how you like it
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

interface PresetCardProps {
  preset: SensoryPreset;
  isSelected: boolean;
  onSelect: () => void;
}

function PresetCard({ preset, isSelected, onSelect }: PresetCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full p-5 rounded-2xl border-2 transition-all text-left
        ${
          isSelected
            ? "border-primary-500 bg-primary-50 shadow-lg"
            : "border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50 shadow-soft"
        }
      `}
    >
      <div className="flex items-start gap-4">
        <div
          className={`
            w-14 h-14 rounded-xl flex items-center justify-center text-2xl
            ${isSelected ? "bg-primary-500 text-white" : "bg-slate-100"}
          `}
        >
          {preset.icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-800">{preset.name}</h4>
            {isSelected && (
              <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mb-3">{preset.description}</p>

          {/* Feature tags */}
          <div className="flex flex-wrap gap-1">
            {getPresetFeatures(preset).map((feature, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/**
 * Extract human-readable features from preset settings
 */
function getPresetFeatures(preset: SensoryPreset): string[] {
  const features: string[] = [];

  if (preset.settings.visual?.reduceAnimations) features.push("Calm visuals");
  if (preset.settings.visual?.highContrast) features.push("High contrast");
  if (preset.settings.visual?.fontFamily === "dyslexic") features.push("Dyslexic font");
  if (preset.settings.auditory?.textToSpeechEnabled) features.push("Read aloud");
  if (preset.settings.auditory?.noSoundEffects) features.push("Quiet mode");
  if (preset.settings.cognitive?.breakReminders) features.push("Break reminders");
  if (preset.settings.cognitive?.oneThingAtATime) features.push("Focus mode");
  if (preset.settings.motor?.largerClickTargets) features.push("Big buttons");
  if (preset.settings.motor?.keyboardOnly) features.push("Keyboard friendly");
  if (preset.settings.environment?.whiteNoise && preset.settings.environment.whiteNoise !== "none") {
    features.push("Background sounds");
  }

  return features.slice(0, 4); // Limit to 4 features
}

export default SensoryPresetSelector;
