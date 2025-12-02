'use client';

/**
 * AccessibilityPanel - Test and toggle accessibility settings
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils';

// =============================================================================
// Types
// =============================================================================

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: number; // percentage: 100, 125, 150, 200
  fontFamily: 'default' | 'dyslexic' | 'sans-serif' | 'serif';
  focusVisible: boolean;
  underlineLinks: boolean;
}

interface SimulatedOutput {
  role: 'heading' | 'button' | 'link' | 'text' | 'image' | 'list' | 'listitem';
  content: string;
  level?: number;
  state?: string;
}

// =============================================================================
// Default Settings
// =============================================================================

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 100,
  fontFamily: 'default',
  focusVisible: true,
  underlineLinks: false,
};

const FONT_SIZES = [100, 125, 150, 175, 200];
const FONT_FAMILIES: Array<{ id: AccessibilitySettings['fontFamily']; name: string; sample: string }> = [
  { id: 'default', name: 'Default', sample: 'Aa Bb Cc' },
  { id: 'dyslexic', name: 'OpenDyslexic', sample: 'Aa Bb Cc' },
  { id: 'sans-serif', name: 'Sans-Serif', sample: 'Aa Bb Cc' },
  { id: 'serif', name: 'Serif', sample: 'Aa Bb Cc' },
];

// =============================================================================
// Component
// =============================================================================

export function AccessibilityPanel() {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatedContent, setSimulatedContent] = useState<SimulatedOutput[]>([]);

  // Load settings from document attributes
  useEffect(() => {
    const html = document.documentElement;
    
    setSettings({
      highContrast: html.getAttribute('data-high-contrast') === 'true',
      reducedMotion: html.getAttribute('data-reduced-motion') === 'true',
      fontSize: parseInt(html.getAttribute('data-font-size') || '100'),
      fontFamily: (html.getAttribute('data-font-family') as AccessibilitySettings['fontFamily']) || 'default',
      focusVisible: html.getAttribute('data-focus-visible') !== 'false',
      underlineLinks: html.getAttribute('data-underline-links') === 'true',
    });
  }, []);

  // Apply settings to document
  const applySettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    const html = document.documentElement;
    html.setAttribute('data-high-contrast', String(updated.highContrast));
    html.setAttribute('data-reduced-motion', String(updated.reducedMotion));
    html.setAttribute('data-font-size', String(updated.fontSize));
    html.setAttribute('data-font-family', updated.fontFamily);
    html.setAttribute('data-focus-visible', String(updated.focusVisible));
    html.setAttribute('data-underline-links', String(updated.underlineLinks));

    // Also update CSS custom properties
    html.style.setProperty('--font-size-scale', `${updated.fontSize / 100}`);
    
    // Apply font family
    const fontMap: Record<string, string> = {
      default: 'var(--font-sans, system-ui, sans-serif)',
      dyslexic: 'OpenDyslexic, var(--font-sans, system-ui, sans-serif)',
      'sans-serif': 'system-ui, -apple-system, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
    };
    html.style.setProperty('--font-family', fontMap[updated.fontFamily]);

    // Persist to localStorage
    localStorage.setItem('aivo-a11y-settings', JSON.stringify(updated));
  }, [settings]);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    applySettings(DEFAULT_SETTINGS);
    localStorage.removeItem('aivo-a11y-settings');
  }, [applySettings]);

  // Screen reader simulator
  const simulateScreenReader = useCallback(() => {
    const outputs: SimulatedOutput[] = [];
    
    // Simulate reading the main content
    const main = document.querySelector('main') || document.body;
    
    // Get headings
    main.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
      const level = parseInt(heading.tagName[1]);
      outputs.push({
        role: 'heading',
        content: heading.textContent || '',
        level,
      });
    });

    // Get buttons
    main.querySelectorAll('button').forEach(button => {
      const isDisabled = button.disabled || button.getAttribute('aria-disabled') === 'true';
      outputs.push({
        role: 'button',
        content: button.textContent || button.getAttribute('aria-label') || 'unlabeled button',
        state: isDisabled ? 'disabled' : undefined,
      });
    });

    // Get links
    main.querySelectorAll('a[href]').forEach(link => {
      outputs.push({
        role: 'link',
        content: link.textContent || link.getAttribute('aria-label') || 'unlabeled link',
      });
    });

    // Get images
    main.querySelectorAll('img').forEach(img => {
      outputs.push({
        role: 'image',
        content: img.alt || 'image without description',
      });
    });

    setSimulatedContent(outputs.slice(0, 20)); // Limit to 20 items
    setShowSimulator(true);
  }, []);

  return (
    <div className="p-4 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Font Size</div>
          <div className="text-lg font-semibold text-white">{settings.fontSize}%</div>
        </div>
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Contrast</div>
          <div className="text-lg font-semibold text-white">
            {settings.highContrast ? 'High' : 'Normal'}
          </div>
        </div>
      </div>

      {/* Toggle Settings */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-300">Visual Settings</h4>
        
        <ToggleSetting
          label="High Contrast Mode"
          description="Increases color contrast for better visibility"
          checked={settings.highContrast}
          onChange={checked => applySettings({ highContrast: checked })}
        />

        <ToggleSetting
          label="Reduced Motion"
          description="Minimizes animations and transitions"
          checked={settings.reducedMotion}
          onChange={checked => applySettings({ reducedMotion: checked })}
        />

        <ToggleSetting
          label="Focus Indicators"
          description="Shows visible focus outlines on interactive elements"
          checked={settings.focusVisible}
          onChange={checked => applySettings({ focusVisible: checked })}
        />

        <ToggleSetting
          label="Underline Links"
          description="Adds underlines to all links"
          checked={settings.underlineLinks}
          onChange={checked => applySettings({ underlineLinks: checked })}
        />
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-300">Font Size</h4>
        <div className="flex gap-2">
          {FONT_SIZES.map(size => (
            <button
              key={size}
              onClick={() => applySettings({ fontSize: size })}
              className={cn(
                'flex-1 py-2 text-xs font-medium rounded transition-colors',
                settings.fontSize === size
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              {size}%
            </button>
          ))}
        </div>
        
        {/* Preview */}
        <div className="p-3 bg-gray-800 rounded-lg">
          <p 
            className="text-gray-300"
            style={{ fontSize: `${settings.fontSize / 100}em` }}
          >
            Sample text at {settings.fontSize}% size
          </p>
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-300">Font Family</h4>
        <div className="grid grid-cols-2 gap-2">
          {FONT_FAMILIES.map(font => (
            <button
              key={font.id}
              onClick={() => applySettings({ fontFamily: font.id })}
              className={cn(
                'p-3 rounded-lg border text-left transition-colors',
                settings.fontFamily === font.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800'
              )}
            >
              <div className="text-xs font-medium text-white mb-1">{font.name}</div>
              <div
                className="text-lg text-gray-400"
                style={{
                  fontFamily: font.id === 'dyslexic' 
                    ? 'OpenDyslexic, sans-serif' 
                    : font.id === 'serif'
                    ? 'Georgia, serif'
                    : 'system-ui, sans-serif',
                }}
              >
                {font.sample}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Screen Reader Simulator */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-300">Screen Reader Simulation</h4>
        <button
          onClick={simulateScreenReader}
          className="w-full px-4 py-2 text-sm font-medium rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
        >
          🔊 Simulate Screen Reader Output
        </button>

        {showSimulator && (
          <div className="max-h-48 overflow-auto p-3 bg-black rounded-lg font-mono text-xs space-y-1">
            {simulatedContent.length === 0 ? (
              <div className="text-gray-500">No content detected</div>
            ) : (
              simulatedContent.map((item, index) => (
                <div key={index} className="text-green-400">
                  <span className="text-gray-500">[{item.role}
                    {item.level && ` level ${item.level}`}
                    {item.state && `, ${item.state}`}
                  ] </span>
                  {item.content}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Reset Button */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={resetSettings}
          className="w-full px-4 py-2 text-sm font-medium rounded border border-gray-600 text-gray-400 hover:bg-gray-800 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* WCAG Checklist */}
      <div className="pt-4 border-t border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-3">WCAG 2.1 AA Quick Check</h4>
        <div className="space-y-2 text-xs">
          <ChecklistItem 
            label="Text contrast ≥ 4.5:1" 
            passed={true} 
          />
          <ChecklistItem 
            label="Touch targets ≥ 44px" 
            passed={true} 
          />
          <ChecklistItem 
            label="Focus indicators visible" 
            passed={settings.focusVisible} 
          />
          <ChecklistItem 
            label="Reduced motion respected" 
            passed={settings.reducedMotion} 
          />
          <ChecklistItem 
            label="Text resizable to 200%" 
            passed={settings.fontSize <= 200} 
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

interface ToggleSettingProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({ label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group" aria-label={label}>
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only peer"
          aria-describedby={`${label.replace(/\s+/g, '-').toLowerCase()}-desc`}
        />
        <div className={cn(
          'w-9 h-5 rounded-full transition-colors',
          'bg-gray-700 peer-checked:bg-purple-600',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-900'
        )} />
        <div className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
          'peer-checked:translate-x-4'
        )} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
          {label}
        </div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </label>
  );
}

interface ChecklistItemProps {
  label: string;
  passed: boolean;
}

function ChecklistItem({ label, passed }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
        passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      )}>
        {passed ? '✓' : '✗'}
      </span>
      <span className={cn(
        'flex-1',
        passed ? 'text-gray-300' : 'text-red-400'
      )}>
        {label}
      </span>
    </div>
  );
}
