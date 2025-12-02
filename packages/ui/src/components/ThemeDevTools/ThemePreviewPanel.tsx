'use client';

/**
 * ThemePreviewPanel - Preview and switch between grade themes
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils';

// =============================================================================
// Types
// =============================================================================

type GradeBand = 'k_5' | '6_8' | '9_12';

interface ThemeInfo {
  id: GradeBand;
  name: string;
  description: string;
  ageRange: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };
}

// =============================================================================
// Theme Definitions
// =============================================================================

const THEMES: ThemeInfo[] = [
  {
    id: 'k_5',
    name: 'Elementary (K-5)',
    description: 'Warm, playful, and engaging for young learners',
    ageRange: '5-11 years',
    colors: {
      primary: '124 58 237',    // Purple-600
      secondary: '236 72 153',   // Pink-500
      accent: '245 158 11',      // Amber-500
      background: '254 252 232', // Yellow-50
      surface: '255 255 255',    // White
    },
  },
  {
    id: '6_8',
    name: 'Middle School (6-8)',
    description: 'Balanced, modern, and growth-oriented',
    ageRange: '11-14 years',
    colors: {
      primary: '59 130 246',    // Blue-500
      secondary: '16 185 129',  // Emerald-500
      accent: '168 85 247',     // Purple-500
      background: '248 250 252', // Slate-50
      surface: '255 255 255',   // White
    },
  },
  {
    id: '9_12',
    name: 'High School (9-12)',
    description: 'Professional, sophisticated, and focused',
    ageRange: '14-18 years',
    colors: {
      primary: '15 23 42',      // Slate-900
      secondary: '71 85 105',   // Slate-500
      accent: '37 99 235',      // Blue-600
      background: '255 255 255', // White
      surface: '248 250 252',   // Slate-50
    },
  },
];

// =============================================================================
// Component
// =============================================================================

export function ThemePreviewPanel() {
  const [currentTheme, setCurrentTheme] = useState<GradeBand>('k_5');
  const [compareMode, setCompareMode] = useState(false);
  const [exportFormat, setExportFormat] = useState<'css' | 'json' | 'tailwind'>('css');

  // Detect current theme from document
  useEffect(() => {
    const detectTheme = () => {
      const html = document.documentElement;
      const gradeAttr = html.getAttribute('data-grade-band');
      if (gradeAttr && ['k_5', '6_8', '9_12'].includes(gradeAttr)) {
        setCurrentTheme(gradeAttr as GradeBand);
      }
    };

    detectTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  // Apply theme
  const applyTheme = useCallback((theme: GradeBand) => {
    document.documentElement.setAttribute('data-grade-band', theme);
    setCurrentTheme(theme);
  }, []);

  // Export theme
  const exportTheme = useCallback(() => {
    const theme = THEMES.find(t => t.id === currentTheme);
    if (!theme) return;

    let output: string;
    let filename: string;
    let mimeType: string;

    switch (exportFormat) {
      case 'css':
        output = generateCSSExport(theme);
        filename = `theme-${theme.id}.css`;
        mimeType = 'text/css';
        break;
      case 'json':
        output = generateJSONExport(theme);
        filename = `theme-${theme.id}.json`;
        mimeType = 'application/json';
        break;
      case 'tailwind':
        output = generateTailwindExport(theme);
        filename = `theme-${theme.id}.tailwind.js`;
        mimeType = 'application/javascript';
        break;
      default:
        return;
    }

    // Download file
    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentTheme, exportFormat]);

  // Copy theme to clipboard
  const copyToClipboard = useCallback(async () => {
    const theme = THEMES.find(t => t.id === currentTheme);
    if (!theme) return;

    let output: string;
    switch (exportFormat) {
      case 'css':
        output = generateCSSExport(theme);
        break;
      case 'json':
        output = generateJSONExport(theme);
        break;
      case 'tailwind':
        output = generateTailwindExport(theme);
        break;
      default:
        return;
    }

    await navigator.clipboard.writeText(output);
    // Could add a toast notification here
  }, [currentTheme, exportFormat]);

  return (
    <div className="p-4 space-y-6">
      {/* Current Theme Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-200">Current Theme</h3>
          <p className="text-xs text-gray-400">
            {THEMES.find(t => t.id === currentTheme)?.name}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={compareMode}
            onChange={e => setCompareMode(e.target.checked)}
            className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
          />
          <span className="text-gray-400">Compare mode</span>
        </label>
      </div>

      {/* Theme Cards */}
      <div className={cn(
        'grid gap-3',
        compareMode ? 'grid-cols-1' : 'grid-cols-1'
      )}>
        {THEMES.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={currentTheme === theme.id}
            onSelect={() => applyTheme(theme.id)}
            showPreview={compareMode}
          />
        ))}
      </div>

      {/* Export Section */}
      <div className="pt-4 border-t border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-3">Export Theme</h4>
        
        <div className="flex items-center gap-2 mb-3">
          {(['css', 'json', 'tailwind'] as const).map(format => (
            <button
              key={format}
              onClick={() => setExportFormat(format)}
              className={cn(
                'px-3 py-1.5 text-xs font-mono rounded',
                'transition-colors duration-150',
                exportFormat === format
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportTheme}
            className="flex-1 px-3 py-2 text-xs font-medium rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            📥 Download
          </button>
          <button
            onClick={copyToClipboard}
            className="flex-1 px-3 py-2 text-xs font-medium rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            📋 Copy
          </button>
        </div>
      </div>

      {/* Quick Preview */}
      <div className="pt-4 border-t border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-3">Quick Preview</h4>
        <ThemeQuickPreview theme={THEMES.find(t => t.id === currentTheme)!} />
      </div>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

interface ThemeCardProps {
  theme: ThemeInfo;
  isActive: boolean;
  onSelect: () => void;
  showPreview: boolean;
}

function ThemeCard({ theme, isActive, onSelect, showPreview }: ThemeCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3 cursor-pointer transition-all duration-200',
        isActive
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-medium text-white">{theme.name}</h4>
          <p className="text-xs text-gray-400">{theme.ageRange}</p>
        </div>
        {isActive && (
          <span className="px-2 py-0.5 text-[10px] font-medium bg-purple-500 text-white rounded-full">
            Active
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-3">{theme.description}</p>

      {/* Color Swatches */}
      <div className="flex gap-1.5">
        {Object.entries(theme.colors).map(([name, value]) => (
          <div key={name} className="flex flex-col items-center gap-1">
            <div
              className="w-8 h-8 rounded-md border border-gray-600 shadow-sm"
              style={{ backgroundColor: `rgb(${value})` }}
              title={`${name}: rgb(${value})`}
            />
            <span className="text-[9px] text-gray-500 capitalize">{name.slice(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Preview Area */}
      {showPreview && (
        <div
          className="mt-3 p-3 rounded-md"
          style={{ backgroundColor: `rgb(${theme.colors.background})` }}
        >
          <div
            className="text-sm font-medium mb-1"
            style={{ color: `rgb(${theme.colors.primary})` }}
          >
            Sample Heading
          </div>
          <div
            className="text-xs"
            style={{ color: 'rgb(71 85 105)' }}
          >
            This is preview text in the {theme.name} theme.
          </div>
          <div className="flex gap-2 mt-2">
            <button
              className="px-2 py-1 text-[10px] font-medium rounded"
              style={{
                backgroundColor: `rgb(${theme.colors.primary})`,
                color: theme.id === '9_12' ? 'white' : 'white',
              }}
            >
              Primary
            </button>
            <button
              className="px-2 py-1 text-[10px] font-medium rounded border"
              style={{
                borderColor: `rgb(${theme.colors.secondary})`,
                color: `rgb(${theme.colors.secondary})`,
              }}
            >
              Secondary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeQuickPreview({ theme }: { theme: ThemeInfo }) {
  return (
    <div
      className="p-4 rounded-lg border border-gray-700"
      style={{ backgroundColor: `rgb(${theme.colors.background})` }}
    >
      {/* Mock Card */}
      <div
        className="p-3 rounded-lg shadow-sm mb-3"
        style={{ backgroundColor: `rgb(${theme.colors.surface})` }}
      >
        <div
          className="text-sm font-semibold mb-1"
          style={{ color: `rgb(${theme.colors.primary})` }}
        >
          Lesson: Introduction to Fractions
        </div>
        <div className="text-xs text-gray-600 mb-2">
          Learn the basics of fractions with interactive examples.
        </div>
        <div className="flex gap-2">
          <span
            className="px-2 py-0.5 text-[10px] font-medium rounded-full"
            style={{
              backgroundColor: `rgb(${theme.colors.accent} / 0.2)`,
              color: `rgb(${theme.colors.accent})`,
            }}
          >
            Math
          </span>
          <span
            className="px-2 py-0.5 text-[10px] font-medium rounded-full"
            style={{
              backgroundColor: `rgb(${theme.colors.secondary} / 0.2)`,
              color: `rgb(${theme.colors.secondary})`,
            }}
          >
            15 min
          </span>
        </div>
      </div>

      {/* Mock Progress */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-1">
          <span style={{ color: `rgb(${theme.colors.primary})` }}>Progress</span>
          <span className="text-gray-500">65%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: '65%',
              backgroundColor: `rgb(${theme.colors.primary})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Export Generators
// =============================================================================

function generateCSSExport(theme: ThemeInfo): string {
  return `/* ${theme.name} Theme
 * Generated by Aivo Theme Dev Tools
 * Age Range: ${theme.ageRange}
 */

:root[data-grade-band="${theme.id}"] {
  /* Primary Colors */
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  
  /* Surface Colors */
  --color-background: ${theme.colors.background};
  --color-surface: ${theme.colors.surface};
  
  /* Derived Colors */
  --color-primary-light: ${theme.colors.primary} / 0.1;
  --color-primary-dark: ${theme.colors.primary};
  
  /* Typography */
  --font-scale: ${theme.id === 'k_5' ? '1.125' : theme.id === '6_8' ? '1' : '0.9375'};
  --radius-base: ${theme.id === 'k_5' ? '1rem' : theme.id === '6_8' ? '0.75rem' : '0.5rem'};
}
`;
}

function generateJSONExport(theme: ThemeInfo): string {
  return JSON.stringify({
    id: theme.id,
    name: theme.name,
    description: theme.description,
    ageRange: theme.ageRange,
    colors: theme.colors,
    meta: {
      fontScale: theme.id === 'k_5' ? 1.125 : theme.id === '6_8' ? 1 : 0.9375,
      radiusBase: theme.id === 'k_5' ? '1rem' : theme.id === '6_8' ? '0.75rem' : '0.5rem',
      generatedAt: new Date().toISOString(),
      generator: 'Aivo Theme Dev Tools',
    },
  }, null, 2);
}

function generateTailwindExport(theme: ThemeInfo): string {
  return `// ${theme.name} Theme - Tailwind Config
// Generated by Aivo Theme Dev Tools

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(${theme.colors.primary})',
          light: 'rgb(${theme.colors.primary} / 0.1)',
        },
        secondary: {
          DEFAULT: 'rgb(${theme.colors.secondary})',
        },
        accent: {
          DEFAULT: 'rgb(${theme.colors.accent})',
        },
        background: 'rgb(${theme.colors.background})',
        surface: 'rgb(${theme.colors.surface})',
      },
    },
  },
};
`;
}
