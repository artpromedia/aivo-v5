'use client';

import React, { useState } from 'react';
import { useGradeAwareTheme } from '../../providers/GradeAwareThemeProvider';
import type { GradeBandKey } from '../../theme/types';

const GRADE_BANDS: { key: GradeBandKey; label: string; grades: string; emoji: string }[] = [
  { key: 'k_5', label: 'Elementary', grades: 'K-5', emoji: '🌈' },
  { key: '6_8', label: 'Middle School', grades: '6-8', emoji: '🚀' },
  { key: '9_12', label: 'High School', grades: '9-12', emoji: '🎓' },
];

export interface ThemeSwitcherProps {
  /** Show as compact pill or expanded panel */
  variant?: 'compact' | 'panel';
  /** Additional CSS classes */
  className?: string;
  /** Show accessibility toggles */
  showAccessibility?: boolean;
}

/**
 * Theme Switcher Component
 * 
 * Allows users to manually switch between grade-based themes
 * and toggle accessibility settings.
 */
export function ThemeSwitcher({
  variant = 'compact',
  className = '',
  showAccessibility = true,
}: ThemeSwitcherProps): JSX.Element {
  const {
    gradeBand,
    setGradeBand,
    isHighContrast,
    setHighContrast,
    isAutoDetected,
    learnerGrade,
    isLoading,
  } = useGradeAwareTheme();

  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg h-10 w-32 ${className}`} />
    );
  }

  const currentBand = GRADE_BANDS.find((b) => b.key === gradeBand) || GRADE_BANDS[0];

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-theme-primary/10 hover:bg-theme-primary/20 
                     text-theme-primary rounded-lg transition-colors text-sm font-medium"
          aria-label="Switch theme"
          aria-expanded={isOpen}
        >
          <span>{currentBand.emoji}</span>
          <span>{currentBand.grades}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Grade Theme
                </p>
                {isAutoDetected && learnerGrade !== null && (
                  <p className="text-xs text-theme-primary mt-1">
                    Auto-detected: Grade {learnerGrade}
                  </p>
                )}
              </div>

              <div className="p-2">
                {GRADE_BANDS.map((band) => (
                  <button
                    key={band.key}
                    onClick={() => {
                      setGradeBand(band.key);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      gradeBand === band.key
                        ? 'bg-theme-primary/10 text-theme-primary'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-xl">{band.emoji}</span>
                    <div>
                      <p className="font-medium text-sm">{band.label}</p>
                      <p className="text-xs text-gray-500">Grades {band.grades}</p>
                    </div>
                    {gradeBand === band.key && (
                      <svg className="w-5 h-5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {showAccessibility && (
                <div className="p-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span id="high-contrast-label" className="text-sm text-gray-700">High Contrast</span>
                    <button
                      role="switch"
                      aria-checked={isHighContrast}
                      aria-labelledby="high-contrast-label"
                      onClick={() => setHighContrast(!isHighContrast)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        isHighContrast ? 'bg-theme-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          isHighContrast ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Panel variant
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Theme Settings</h3>
      
      {isAutoDetected && learnerGrade !== null && (
        <div className="mb-3 p-2 bg-theme-primary/5 rounded-lg">
          <p className="text-xs text-theme-primary">
            ✨ Auto-detected from Grade {learnerGrade}
          </p>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {GRADE_BANDS.map((band) => (
          <button
            key={band.key}
            onClick={() => setGradeBand(band.key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
              gradeBand === band.key
                ? 'bg-theme-primary text-white shadow-md'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-2xl">{band.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold">{band.label}</p>
              <p className={`text-xs ${gradeBand === band.key ? 'text-white/80' : 'text-gray-500'}`}>
                Grades {band.grades}
              </p>
            </div>
            {gradeBand === band.key && (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ))}
      </div>

      {showAccessibility && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-3">
            Accessibility
          </p>
          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
            <div>
              <span id="panel-high-contrast-label" className="text-sm font-medium text-gray-700">High Contrast Mode</span>
              <p className="text-xs text-gray-500">Enhanced color contrast for visibility</p>
            </div>
            <button
              role="switch"
              aria-checked={isHighContrast}
              aria-labelledby="panel-high-contrast-label"
              onClick={() => setHighContrast(!isHighContrast)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                isHighContrast ? 'bg-theme-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isHighContrast ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeSwitcher;
