'use client';

/**
 * ContrastChecker - Real-time color contrast ratio analysis
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../../utils';

// =============================================================================
// Types
// =============================================================================

interface ColorPair {
  id: string;
  name: string;
  foreground: string; // RGB string like "15 23 42"
  background: string; // RGB string like "255 255 255"
  contrastRatio: number;
  passesAA: boolean;
  passesAALarge: boolean;
  passesAAA: boolean;
  passesAAALarge: boolean;
}

interface ContrastResult {
  ratio: number;
  passesAA: boolean;      // 4.5:1 for normal text
  passesAALarge: boolean; // 3:1 for large text (18pt+)
  passesAAA: boolean;     // 7:1 for normal text
  passesAAALarge: boolean; // 4.5:1 for large text
}

// =============================================================================
// Color Utility Functions
// =============================================================================

function parseRgbString(rgb: string): [number, number, number] {
  const parts = rgb.trim().split(/\s+/).map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(fg: string, bg: string): number {
  const [fgR, fgG, fgB] = parseRgbString(fg);
  const [bgR, bgG, bgB] = parseRgbString(bg);
  
  const fgLum = getLuminance(fgR, fgG, fgB);
  const bgLum = getLuminance(bgR, bgG, bgB);
  
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function checkContrast(fg: string, bg: string): ContrastResult {
  const ratio = getContrastRatio(fg, bg);
  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAALarge: ratio >= 3,
    passesAAA: ratio >= 7,
    passesAAALarge: ratio >= 4.5,
  };
}

function suggestBetterColor(fg: string, bg: string, targetRatio: number = 4.5): string {
  const [fgR, fgG, fgB] = parseRgbString(fg);
  const [bgR, bgG, bgB] = parseRgbString(bg);
  
  const bgLum = getLuminance(bgR, bgG, bgB);
  
  // Determine if we should go lighter or darker
  const goLighter = bgLum < 0.5;
  
  // Binary search for the right adjustment
  let low = 0;
  let high = 255;
  let best = fg;
  
  for (let i = 0; i < 20; i++) {
    const mid = Math.floor((low + high) / 2);
    
    let newR, newG, newB;
    if (goLighter) {
      newR = Math.min(255, fgR + mid);
      newG = Math.min(255, fgG + mid);
      newB = Math.min(255, fgB + mid);
    } else {
      newR = Math.max(0, fgR - mid);
      newG = Math.max(0, fgG - mid);
      newB = Math.max(0, fgB - mid);
    }
    
    const testColor = `${newR} ${newG} ${newB}`;
    const ratio = getContrastRatio(testColor, bg);
    
    if (ratio >= targetRatio) {
      best = testColor;
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  
  return best;
}

// =============================================================================
// Component
// =============================================================================

export function ContrastChecker() {
  const [colorPairs, setColorPairs] = useState<ColorPair[]>([]);
  const [customFg, setCustomFg] = useState('15 23 42');
  const [customBg, setCustomBg] = useState('255 255 255');
  const [isScanning, setIsScanning] = useState(false);

  // Extract color pairs from the current page
  const scanPage = useCallback(() => {
    setIsScanning(true);
    const pairs: ColorPair[] = [];
    const processed = new Set<string>();

    // Get computed styles from key elements
    const elements = document.querySelectorAll('button, a, p, h1, h2, h3, h4, h5, h6, span, div, label');
    
    elements.forEach((el, index) => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;
      
      // Skip transparent backgrounds
      if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') return;
      
      // Parse colors
      const fgMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const bgMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      
      if (!fgMatch || !bgMatch) return;
      
      const fg = `${fgMatch[1]} ${fgMatch[2]} ${fgMatch[3]}`;
      const bg = `${bgMatch[1]} ${bgMatch[2]} ${bgMatch[3]}`;
      
      const pairKey = `${fg}|${bg}`;
      if (processed.has(pairKey)) return;
      processed.add(pairKey);
      
      const result = checkContrast(fg, bg);
      
      pairs.push({
        id: `pair-${index}`,
        name: el.tagName.toLowerCase() + (el.className ? `.${el.className.split(' ')[0]}` : ''),
        foreground: fg,
        background: bg,
        contrastRatio: result.ratio,
        passesAA: result.passesAA,
        passesAALarge: result.passesAALarge,
        passesAAA: result.passesAAA,
        passesAAALarge: result.passesAAALarge,
      });
    });

    // Sort by contrast ratio (failing first)
    pairs.sort((a, b) => a.contrastRatio - b.contrastRatio);
    
    setColorPairs(pairs.slice(0, 30)); // Limit to 30 pairs
    setIsScanning(false);
  }, []);

  // Scan on mount
  useEffect(() => {
    const timer = setTimeout(scanPage, 500);
    return () => clearTimeout(timer);
  }, [scanPage]);

  // Custom color check
  const customResult = useMemo(() => {
    return checkContrast(customFg, customBg);
  }, [customFg, customBg]);

  const suggestedColor = useMemo(() => {
    if (customResult.passesAA) return null;
    return suggestBetterColor(customFg, customBg);
  }, [customFg, customBg, customResult.passesAA]);

  // Stats
  const stats = useMemo(() => {
    const total = colorPairs.length;
    const passing = colorPairs.filter(p => p.passesAA).length;
    const failing = total - passing;
    return { total, passing, failing };
  }, [colorPairs]);

  return (
    <div className="p-4 space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-gray-800 rounded-lg text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div className="p-3 bg-green-900/30 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">{stats.passing}</div>
          <div className="text-xs text-gray-400">Passing</div>
        </div>
        <div className="p-3 bg-red-900/30 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-400">{stats.failing}</div>
          <div className="text-xs text-gray-400">Failing</div>
        </div>
      </div>

      {/* Custom Color Checker */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-300">Custom Color Check</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="custom-fg" className="block text-xs text-gray-400 mb-1">Foreground (RGB)</label>
            <input
              id="custom-fg"
              type="text"
              value={customFg}
              onChange={e => setCustomFg(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white font-mono"
              placeholder="15 23 42"
            />
          </div>
          <div>
            <label htmlFor="custom-bg" className="block text-xs text-gray-400 mb-1">Background (RGB)</label>
            <input
              id="custom-bg"
              type="text"
              value={customBg}
              onChange={e => setCustomBg(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white font-mono"
              placeholder="255 255 255"
            />
          </div>
        </div>

        {/* Preview */}
        <div
          className="p-4 rounded-lg border border-gray-700"
          style={{ backgroundColor: `rgb(${customBg})` }}
        >
          <p
            className="text-lg font-medium"
            style={{ color: `rgb(${customFg})` }}
          >
            Sample Text Preview
          </p>
          <p
            className="text-sm"
            style={{ color: `rgb(${customFg})` }}
          >
            The quick brown fox jumps over the lazy dog.
          </p>
        </div>

        {/* Result */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div>
            <div className="text-2xl font-bold text-white">
              {customResult.ratio.toFixed(2)}:1
            </div>
            <div className="text-xs text-gray-400">Contrast Ratio</div>
          </div>
          <div className="flex gap-2">
            <ContrastBadge label="AA" passed={customResult.passesAA} />
            <ContrastBadge label="AA+" passed={customResult.passesAALarge} />
            <ContrastBadge label="AAA" passed={customResult.passesAAA} />
          </div>
        </div>

        {/* Suggestion */}
        {suggestedColor && (
          <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
            <div className="text-xs text-yellow-400 mb-2">
              ⚠️ This combination fails WCAG AA. Try this color instead:
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded border border-gray-600"
                style={{ backgroundColor: `rgb(${suggestedColor})` }}
              />
              <code className="text-sm font-mono text-white">
                rgb({suggestedColor})
              </code>
              <button
                onClick={() => setCustomFg(suggestedColor)}
                className="ml-auto px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-500"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scan Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-gray-300">Page Scan Results</h4>
          <button
            onClick={scanPage}
            disabled={isScanning}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded transition-colors',
              isScanning
                ? 'bg-gray-700 text-gray-500 cursor-wait'
                : 'bg-purple-600 text-white hover:bg-purple-500'
            )}
          >
            {isScanning ? 'Scanning...' : '🔄 Rescan'}
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-auto">
          {colorPairs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No color pairs found. Click &quot;Rescan&quot; to analyze the page.
            </div>
          ) : (
            colorPairs.map(pair => (
              <ColorPairRow key={pair.id} pair={pair} />
            ))
          )}
        </div>
      </div>

      {/* WCAG Reference */}
      <div className="pt-4 border-t border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-3">WCAG Contrast Requirements</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-gray-800 rounded">
            <div className="font-medium text-white">AA Normal</div>
            <div className="text-gray-400">4.5:1 minimum</div>
          </div>
          <div className="p-2 bg-gray-800 rounded">
            <div className="font-medium text-white">AA Large</div>
            <div className="text-gray-400">3:1 minimum (18pt+)</div>
          </div>
          <div className="p-2 bg-gray-800 rounded">
            <div className="font-medium text-white">AAA Normal</div>
            <div className="text-gray-400">7:1 minimum</div>
          </div>
          <div className="p-2 bg-gray-800 rounded">
            <div className="font-medium text-white">AAA Large</div>
            <div className="text-gray-400">4.5:1 minimum (18pt+)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

function ContrastBadge({ label, passed }: { label: string; passed: boolean }) {
  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-medium rounded',
        passed
          ? 'bg-green-500/20 text-green-400'
          : 'bg-red-500/20 text-red-400'
      )}
    >
      {label}
    </span>
  );
}

function ColorPairRow({ pair }: { pair: ColorPair }) {
  const [showSuggestion, setShowSuggestion] = useState(false);
  
  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-colors',
        pair.passesAA
          ? 'border-gray-700 bg-gray-800/50'
          : 'border-red-700/50 bg-red-900/20'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Color swatches */}
        <div className="flex items-center">
          <div
            className="w-6 h-6 rounded-l border border-gray-600"
            style={{ backgroundColor: `rgb(${pair.foreground})` }}
            title={`Foreground: rgb(${pair.foreground})`}
          />
          <div
            className="w-6 h-6 rounded-r border border-l-0 border-gray-600"
            style={{ backgroundColor: `rgb(${pair.background})` }}
            title={`Background: rgb(${pair.background})`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono text-gray-400 truncate">
            {pair.name}
          </div>
        </div>

        {/* Ratio */}
        <div className="text-sm font-medium text-white">
          {pair.contrastRatio.toFixed(2)}:1
        </div>

        {/* Status */}
        <div className="flex gap-1">
          <ContrastBadge label="AA" passed={pair.passesAA} />
        </div>
      </div>

      {/* Suggestion for failing pairs */}
      {!pair.passesAA && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <button
            onClick={() => setShowSuggestion(!showSuggestion)}
            className="text-xs text-yellow-400 hover:text-yellow-300"
          >
            {showSuggestion ? '▼ Hide suggestion' : '▶ Show fix suggestion'}
          </button>
          
          {showSuggestion && (
            <div className="mt-2 text-xs">
              <span className="text-gray-400">Suggested: </span>
              <code className="text-white font-mono">
                rgb({suggestBetterColor(pair.foreground, pair.background)})
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
