/**
 * Theme Switcher Hook
 * 
 * Provides easy theme switching with persistence
 */

import { useCallback, useEffect, useState } from 'react';
import type { GradeBandKey } from './types';
import { getTheme, applyThemeToDocument, gradeToGradeBand } from './utils';

const THEME_STORAGE_KEY = 'aivo-grade-band';
const HIGH_CONTRAST_STORAGE_KEY = 'aivo-high-contrast';

export interface UseThemeSwitcherOptions {
  /** Initial grade band (defaults to k_5) */
  initialGradeBand?: GradeBandKey;
  /** Whether to persist selection to localStorage */
  persist?: boolean;
  /** Student grade number (will derive grade band) */
  studentGrade?: number;
}

export interface UseThemeSwitcherReturn {
  /** Current grade band */
  gradeBand: GradeBandKey;
  /** Set the grade band */
  setGradeBand: (band: GradeBandKey) => void;
  /** Whether high contrast mode is enabled */
  isHighContrast: boolean;
  /** Toggle high contrast mode */
  toggleHighContrast: () => void;
  /** Set high contrast mode */
  setHighContrast: (enabled: boolean) => void;
  /** Current theme object */
  theme: ReturnType<typeof getTheme>;
  /** Set theme from student grade number */
  setGradeFromNumber: (grade: number) => void;
}

export function useThemeSwitcher(
  options: UseThemeSwitcherOptions = {}
): UseThemeSwitcherReturn {
  const { 
    initialGradeBand = 'k_5', 
    persist = true,
    studentGrade,
  } = options;

  // Determine initial grade band
  const getInitialGradeBand = (): GradeBandKey => {
    // If studentGrade is provided, derive from it
    if (studentGrade !== undefined) {
      return gradeToGradeBand(studentGrade);
    }
    
    // Check localStorage if persisting
    if (persist && typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && ['k_5', '6_8', '9_12'].includes(stored)) {
        return stored as GradeBandKey;
      }
    }
    
    return initialGradeBand;
  };

  const getInitialHighContrast = (): boolean => {
    if (persist && typeof window !== 'undefined') {
      const stored = localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    // Check system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-contrast: more)').matches;
    }
    return false;
  };

  const [gradeBand, setGradeBandState] = useState<GradeBandKey>(getInitialGradeBand);
  const [isHighContrast, setHighContrastState] = useState(getInitialHighContrast);

  // Get current theme
  const theme = getTheme(gradeBand, isHighContrast);

  // Apply theme to document when it changes
  useEffect(() => {
    applyThemeToDocument(theme);
    
    // Set high contrast data attribute
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute(
        'data-high-contrast', 
        isHighContrast.toString()
      );
    }
  }, [theme, isHighContrast]);

  // Persist grade band
  const setGradeBand = useCallback((band: GradeBandKey) => {
    setGradeBandState(band);
    if (persist && typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, band);
    }
  }, [persist]);

  // Persist high contrast
  const setHighContrast = useCallback((enabled: boolean) => {
    setHighContrastState(enabled);
    if (persist && typeof window !== 'undefined') {
      localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, enabled.toString());
    }
  }, [persist]);

  const toggleHighContrast = useCallback(() => {
    setHighContrast(!isHighContrast);
  }, [isHighContrast, setHighContrast]);

  const setGradeFromNumber = useCallback((grade: number) => {
    setGradeBand(gradeToGradeBand(grade));
  }, [setGradeBand]);

  return {
    gradeBand,
    setGradeBand,
    isHighContrast,
    toggleHighContrast,
    setHighContrast,
    theme,
    setGradeFromNumber,
  };
}
