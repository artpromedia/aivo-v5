/**
 * Motor Settings Panel Component
 * Friendly controls for clicking, tapping, and keyboard settings
 */

"use client";

import type { MotorSettings } from "@aivo/api-client/src/sensory-contracts";

interface MotorSettingsPanelProps {
  settings: MotorSettings;
  onUpdate: (settings: Partial<MotorSettings>) => void;
}

export function MotorSettingsPanel({ settings, onUpdate }: MotorSettingsPanelProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">🖱️ How You Click & Tap</h2>
        <p className="text-slate-600">Make buttons and controls easier to use</p>
      </div>

      {/* Button Size */}
      <SettingSection title="Button Size" icon="🔘" description="How big should clickable things be?">
        <div className="flex gap-4">
          <button
            onClick={() => onUpdate({ largerClickTargets: false, increaseSpacing: false })}
            className={`
              flex-1 p-6 rounded-xl border-2 transition-all text-center
              ${!settings.largerClickTargets
                ? "border-primary-500 bg-primary-50"
                : "border-slate-200 bg-white hover:border-primary-200"
              }
            `}
          >
            <div className="w-8 h-8 mx-auto mb-3 bg-slate-400 rounded-lg" />
            <span className="block font-medium text-slate-800">Normal Size</span>
          </button>
          <button
            onClick={() => onUpdate({ largerClickTargets: true, increaseSpacing: true })}
            className={`
              flex-1 p-6 rounded-xl border-2 transition-all text-center
              ${settings.largerClickTargets
                ? "border-primary-500 bg-primary-50"
                : "border-slate-200 bg-white hover:border-primary-200"
              }
            `}
          >
            <div className="w-14 h-14 mx-auto mb-3 bg-primary-400 rounded-xl" />
            <span className="block font-medium text-slate-800">Bigger Buttons</span>
            <span className="text-sm text-slate-500">Easier to click</span>
          </button>
        </div>
      </SettingSection>

      {/* Click Behavior */}
      <SettingSection title="Click Behavior" icon="👆" description="How clicking works">
        <div className="space-y-3">
          <ToggleSetting
            label="No Double-Clicks"
            icon="✌️"
            description="One click does the same as two"
            checked={settings.noDoubleClick}
            onChange={(checked) => onUpdate({ noDoubleClick: checked })}
          />
          <ToggleSetting
            label="No Drag and Drop"
            icon="🚫"
            description="Use buttons instead of dragging"
            checked={settings.noDragAndDrop}
            onChange={(checked) => onUpdate({ noDragAndDrop: checked })}
          />
        </div>
      </SettingSection>

      {/* Hover Delay */}
      <SettingSection title="Hover Time" icon="⏱️" description="How long before hover menus appear">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 0, label: "Instant", description: "Right away" },
              { value: 500, label: "Short", description: "Half second" },
              { value: 1000, label: "Long", description: "One second" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => onUpdate({ hoverDelay: option.value })}
                className={`
                  p-4 rounded-xl border-2 transition-all text-center
                  ${settings.hoverDelay === option.value
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
          <p className="text-sm text-slate-500 text-center">
            Longer delay gives you more time to move your mouse
          </p>
        </div>
      </SettingSection>

      {/* Keyboard Navigation */}
      <SettingSection title="Keyboard" icon="⌨️" description="Use your keyboard to navigate">
        <div className="space-y-3">
          <ToggleSetting
            label="Keyboard Only Mode"
            icon="⌨️"
            description="Use Tab and Enter instead of clicking"
            checked={settings.keyboardOnly}
            onChange={(checked) => onUpdate({ keyboardOnly: checked })}
          />
          <ToggleSetting
            label="Sticky Keys"
            icon="🔒"
            description="Press one key at a time for shortcuts"
            checked={settings.stickyKeys}
            onChange={(checked) => onUpdate({ stickyKeys: checked })}
          />
        </div>

        {settings.keyboardOnly && (
          <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <h4 className="font-medium text-primary-800 mb-2">Keyboard Tips</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-primary-700">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white rounded border">Tab</kbd>
                <span>Move to next item</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white rounded border">Enter</kbd>
                <span>Click / Select</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white rounded border">Esc</kbd>
                <span>Go back / Close</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white rounded border">↑↓</kbd>
                <span>Move in lists</span>
              </div>
            </div>
          </div>
        )}
      </SettingSection>

      {/* Touch Settings */}
      <SettingSection title="Touch Screen" icon="📱" description="For tablets and touchscreens">
        <ToggleSetting
          label="Touch Help"
          icon="👆"
          description="Easier tapping on touch screens"
          checked={settings.touchAccommodations}
          onChange={(checked) => onUpdate({ touchAccommodations: checked })}
        />
      </SettingSection>

      {/* Quick Test Area */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <h4 className="font-medium text-slate-800 mb-4 text-center">🧪 Try Your Settings</h4>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            className={`
              rounded-xl bg-primary-500 text-white font-medium transition-all hover:bg-primary-600
              ${settings.largerClickTargets ? "px-8 py-4 text-lg" : "px-4 py-2"}
            `}
          >
            Click Me!
          </button>
          <button
            className={`
              rounded-xl bg-mint text-mint-dark font-medium transition-all hover:bg-mint-light
              ${settings.largerClickTargets ? "px-8 py-4 text-lg" : "px-4 py-2"}
            `}
          >
            Or Me!
          </button>
          <button
            className={`
              rounded-xl bg-sunshine text-sunshine-dark font-medium transition-all hover:bg-sunshine/80
              ${settings.largerClickTargets ? "px-8 py-4 text-lg" : "px-4 py-2"}
            `}
          >
            Try This!
          </button>
        </div>
        <p className="text-center text-sm text-slate-500 mt-4">
          These buttons show how your settings look
        </p>
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

export default MotorSettingsPanel;
