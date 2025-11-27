/**
 * Visual Settings Panel Component
 * Friendly controls for visual accessibility settings
 */

"use client";

import { useState } from "react";
import type { VisualSettings, FontSize, FontFamily, LineSpacing, ColorScheme } from "@aivo/api-client/src/sensory-contracts";

interface VisualSettingsPanelProps {
  settings: VisualSettings;
  onUpdate: (settings: Partial<VisualSettings>) => void;
}

export function VisualSettingsPanel({ settings, onUpdate }: VisualSettingsPanelProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">👁️ How You See Things</h2>
        <p className="text-slate-600">Change colors, fonts, and how things move</p>
      </div>

      {/* Text Size */}
      <SettingSection title="Text Size" icon="📏" description="How big should the words be?">
        <div className="flex flex-wrap gap-3">
          {(["small", "medium", "large", "x-large"] as FontSize[]).map((size) => (
            <button
              key={size}
              onClick={() => onUpdate({ fontSize: size })}
              className={`
                flex-1 min-w-[100px] p-4 rounded-xl border-2 transition-all
                ${settings.fontSize === size
                  ? "border-primary-500 bg-primary-50"
                  : "border-slate-200 bg-white hover:border-primary-200"
                }
              `}
            >
              <span
                className={`block font-medium ${
                  size === "small" ? "text-sm" :
                  size === "medium" ? "text-base" :
                  size === "large" ? "text-lg" : "text-xl"
                }`}
              >
                {size === "small" ? "Small" :
                 size === "medium" ? "Medium" :
                 size === "large" ? "Large" : "Extra Large"}
              </span>
            </button>
          ))}
        </div>
      </SettingSection>

      {/* Font Style */}
      <SettingSection title="Letter Style" icon="🔤" description="What kind of letters are easiest to read?">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { id: "default", label: "Normal", sample: "Abc" },
              { id: "dyslexic", label: "Dyslexic Friendly", sample: "Abc" },
              { id: "sans-serif", label: "Simple", sample: "Abc" },
              { id: "serif", label: "Classic", sample: "Abc" },
            ] as const
          ).map((font) => (
            <button
              key={font.id}
              onClick={() => onUpdate({ fontFamily: font.id })}
              className={`
                p-4 rounded-xl border-2 transition-all text-left
                ${settings.fontFamily === font.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-slate-200 bg-white hover:border-primary-200"
                }
              `}
            >
              <span
                className={`block text-2xl mb-1 ${
                  font.id === "dyslexic" ? "font-[OpenDyslexic,sans-serif]" :
                  font.id === "serif" ? "font-serif" : "font-sans"
                }`}
              >
                {font.sample}
              </span>
              <span className="text-sm text-slate-600">{font.label}</span>
            </button>
          ))}
        </div>
      </SettingSection>

      {/* Line Spacing */}
      <SettingSection title="Space Between Lines" icon="📑" description="How spread out should the text be?">
        <div className="flex gap-3">
          {(
            [
              { id: "normal", label: "Normal", icon: "≡" },
              { id: "relaxed", label: "More Space", icon: "⋮" },
              { id: "loose", label: "Lots of Space", icon: "⫶" },
            ] as const
          ).map((spacing) => (
            <button
              key={spacing.id}
              onClick={() => onUpdate({ lineSpacing: spacing.id })}
              className={`
                flex-1 p-4 rounded-xl border-2 transition-all text-center
                ${settings.lineSpacing === spacing.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-slate-200 bg-white hover:border-primary-200"
                }
              `}
            >
              <span className="block text-2xl mb-1">{spacing.icon}</span>
              <span className="text-sm text-slate-600">{spacing.label}</span>
            </button>
          ))}
        </div>
      </SettingSection>

      {/* Colors */}
      <SettingSection title="Colors" icon="🎨" description="Which colors feel best?">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(
            [
              { id: "default", label: "Normal", bg: "#ffffff", text: "#1f2937" },
              { id: "warm", label: "Warm", bg: "#fffbeb", text: "#78350f" },
              { id: "cool", label: "Cool", bg: "#f0f9ff", text: "#0c4a6e" },
              { id: "muted", label: "Soft", bg: "#f9fafb", text: "#374151" },
              { id: "high-contrast", label: "High Contrast", bg: "#000000", text: "#ffffff" },
            ] as const
          ).map((color) => (
            <button
              key={color.id}
              onClick={() => onUpdate({ colorScheme: color.id })}
              className={`
                p-4 rounded-xl border-2 transition-all
                ${settings.colorScheme === color.id
                  ? "border-primary-500 ring-2 ring-primary-200"
                  : "border-slate-200 hover:border-primary-200"
                }
              `}
              style={{ backgroundColor: color.bg }}
            >
              <span
                className="block text-lg font-medium"
                style={{ color: color.text }}
              >
                {color.label}
              </span>
            </button>
          ))}
        </div>
      </SettingSection>

      {/* Dark Mode */}
      <ToggleSetting
        label="Dark Mode"
        icon="🌙"
        description="Dark background is easier on the eyes"
        checked={settings.darkMode}
        onChange={(checked) => onUpdate({ darkMode: checked })}
      />

      {/* Motion Settings */}
      <SettingSection title="Movement" icon="🎬" description="How things move on screen">
        <div className="space-y-4">
          <ToggleSetting
            label="Reduce Animations"
            description="Less bouncing and sliding"
            checked={settings.reduceAnimations}
            onChange={(checked) => onUpdate({ reduceAnimations: checked })}
          />
          <ToggleSetting
            label="Stop All Motion"
            description="Nothing moves at all"
            checked={settings.reduceMotion}
            onChange={(checked) => onUpdate({ reduceMotion: checked })}
          />
        </div>
      </SettingSection>

      {/* Other Visual Settings */}
      <SettingSection title="More Options" icon="⚙️">
        <div className="space-y-4">
          <ToggleSetting
            label="High Contrast"
            description="Stronger colors and borders"
            checked={settings.highContrast}
            onChange={(checked) => onUpdate({ highContrast: checked })}
          />
          <ToggleSetting
            label="Cleaner Screen"
            description="Hide extra decorations"
            checked={settings.reducedClutter}
            onChange={(checked) => onUpdate({ reducedClutter: checked })}
          />
        </div>
      </SettingSection>

      {/* Flashing Content */}
      <SettingSection title="Flashing Content" icon="⚡" description="What to do with blinking things">
        <div className="flex flex-wrap gap-3">
          {(
            [
              { id: "allow", label: "Allow", description: "Show normally" },
              { id: "warn", label: "Warn Me", description: "Ask first" },
              { id: "block", label: "Block", description: "Never show" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              onClick={() => onUpdate({ flashingContent: option.id })}
              className={`
                flex-1 min-w-[100px] p-4 rounded-xl border-2 transition-all text-center
                ${settings.flashingContent === option.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-slate-200 bg-white hover:border-primary-200"
                }
              `}
            >
              <span className="block font-medium text-slate-800">{option.label}</span>
              <span className="text-xs text-slate-500">{option.description}</span>
            </button>
          ))}
        </div>
      </SettingSection>
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

export default VisualSettingsPanel;
