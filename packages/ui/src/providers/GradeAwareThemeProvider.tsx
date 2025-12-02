/**
 * Grade-Aware Theme Provider
 * 
 * Enterprise-grade theme provider that automatically detects and applies
 * themes based on learner grade level. Integrates with authentication
 * and API to fetch learner profiles.
 * 
 * Features:
 * - Automatic grade detection from learner profile
 * - Fallback to localStorage preferences
 * - SSR-safe with hydration handling
 * - Real-time theme switching
 * - Accessibility preferences integration
 * 
 * @module GradeAwareThemeProvider
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';

import {
  type GradeTheme,
  type GradeBandKey,
  type TailwindClassTokens,
  getTheme,
  gradeToGradeBand,
  prefersReducedMotion,
  prefersHighContrast,
  k5TailwindClasses,
  middleSchoolTailwindClasses,
  highSchoolTailwindClasses,
} from '../theme/index';

// ============================================
// Types
// ============================================

export interface GradeAwareThemeContextValue {
  // Theme state
  gradeBand: GradeBandKey;
  theme: GradeTheme;
  tailwindClasses: TailwindClassTokens;
  
  // Accessibility
  isHighContrast: boolean;
  reducedMotion: boolean;
  
  // Actions
  setGradeBand: (band: GradeBandKey) => void;
  setHighContrast: (enabled: boolean) => void;
  
  // Status
  isLoading: boolean;
  isAutoDetected: boolean;
  learnerGrade: number | null;
}

export interface LearnerInfo {
  id: string;
  grade: number;
  gradeLevel?: string;
}

export interface GradeAwareThemeProviderProps {
  children: ReactNode;
  /** Initial grade band before detection */
  defaultGradeBand?: GradeBandKey;
  /** Learner info if already available */
  learner?: LearnerInfo | null;
  /** Function to fetch learner info */
  fetchLearner?: () => Promise<LearnerInfo | null>;
  /** Disable auto-detection from API */
  disableAutoDetection?: boolean;
  /** Storage key for preferences */
  storageKey?: string;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = 'aivo-grade-theme';

const TAILWIND_BY_GRADE: Record<GradeBandKey, TailwindClassTokens> = {
  k_5: k5TailwindClasses,
  '6_8': middleSchoolTailwindClasses,
  '9_12': highSchoolTailwindClasses,
};

// ============================================
// Context
// ============================================

const GradeAwareThemeContext = createContext<GradeAwareThemeContextValue | null>(null);

// ============================================
// CSS Variable Application
// ============================================

function applyGradeThemeToDOM(
  theme: GradeTheme,
  highContrast: boolean,
  reducedMotion: boolean
): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Apply CSS variables for primary/secondary colors (RGB format for alpha support)
  const colors = theme.colors;
  
  // Convert hex to RGB space-separated format
  const hexToRgbSpace = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '124 58 237'; // fallback purple
    return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
  };
  
  // Set CSS variables
  root.style.setProperty('--color-primary', hexToRgbSpace(colors.primary.DEFAULT));
  root.style.setProperty('--color-primary-light', hexToRgbSpace(colors.primary.light));
  root.style.setProperty('--color-primary-dark', hexToRgbSpace(colors.primary.dark));
  root.style.setProperty('--color-secondary', hexToRgbSpace(colors.secondary.DEFAULT));
  root.style.setProperty('--color-secondary-light', hexToRgbSpace(colors.secondary.light));
  root.style.setProperty('--color-accent', hexToRgbSpace(colors.accent.DEFAULT));
  
  // Set data attributes
  root.setAttribute('data-grade-band', theme.gradeBand);
  root.setAttribute('data-grade', gradeKeyToDisplay(theme.gradeBand));
  root.setAttribute('data-theme', theme.name);
  
  // Accessibility classes
  if (highContrast) {
    root.classList.add('high-contrast');
    root.setAttribute('data-contrast', 'high');
  } else {
    root.classList.remove('high-contrast');
    root.removeAttribute('data-contrast');
  }
  
  if (reducedMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
}

function gradeKeyToDisplay(key: GradeBandKey): string {
  return { k_5: 'k-5', '6_8': '6-8', '9_12': '9-12' }[key];
}

// ============================================
// Storage Helpers
// ============================================

interface StoredPrefs {
  gradeBand?: GradeBandKey;
  highContrast?: boolean;
  timestamp?: number;
}

function loadPrefs(key: string): StoredPrefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as StoredPrefs;
    // Expire after 30 days
    if (parsed.timestamp && Date.now() - parsed.timestamp > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function savePrefs(key: string, prefs: Partial<StoredPrefs>): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadPrefs(key) || {};
    localStorage.setItem(key, JSON.stringify({
      ...existing,
      ...prefs,
      timestamp: Date.now(),
    }));
  } catch {
    console.warn('Failed to save theme preferences');
  }
}

// ============================================
// Provider Component
// ============================================

export function GradeAwareThemeProvider({
  children,
  defaultGradeBand = 'k_5',
  learner,
  fetchLearner,
  disableAutoDetection = false,
  storageKey = STORAGE_KEY,
}: GradeAwareThemeProviderProps): JSX.Element {
  // State
  const [gradeBand, setGradeBandState] = useState<GradeBandKey>(defaultGradeBand);
  const [isHighContrast, setHighContrastState] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isLoading, setIsLoading] = useState(!disableAutoDetection);
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [learnerGrade, setLearnerGrade] = useState<number | null>(null);
  
  // Compute theme
  const theme = useMemo(
    () => getTheme(gradeBand, isHighContrast),
    [gradeBand, isHighContrast]
  );
  
  const tailwindClasses = useMemo(
    () => TAILWIND_BY_GRADE[gradeBand],
    [gradeBand]
  );
  
  // Apply theme to DOM
  useEffect(() => {
    applyGradeThemeToDOM(theme, isHighContrast, reducedMotion);
  }, [theme, isHighContrast, reducedMotion]);
  
  // Actions
  const setGradeBand = useCallback((band: GradeBandKey) => {
    setGradeBandState(band);
    setIsAutoDetected(false);
    savePrefs(storageKey, { gradeBand: band });
  }, [storageKey]);
  
  const setHighContrast = useCallback((enabled: boolean) => {
    setHighContrastState(enabled);
    savePrefs(storageKey, { highContrast: enabled });
  }, [storageKey]);
  
  // Initialize from storage and system preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load stored preferences
    const stored = loadPrefs(storageKey);
    if (stored?.gradeBand) {
      setGradeBandState(stored.gradeBand);
    }
    if (stored?.highContrast !== undefined) {
      setHighContrastState(stored.highContrast);
    }
    
    // Check system preferences
    setReducedMotion(prefersReducedMotion());
    if (!stored?.highContrast) {
      setHighContrastState(prefersHighContrast());
    }
    
    // Listen for system preference changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    
    const handleMotion = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    const handleContrast = (e: MediaQueryListEvent) => {
      if (!loadPrefs(storageKey)?.highContrast) {
        setHighContrastState(e.matches);
      }
    };
    
    motionQuery.addEventListener('change', handleMotion);
    contrastQuery.addEventListener('change', handleContrast);
    
    return () => {
      motionQuery.removeEventListener('change', handleMotion);
      contrastQuery.removeEventListener('change', handleContrast);
    };
  }, [storageKey]);
  
  // Auto-detect grade from learner
  useEffect(() => {
    if (disableAutoDetection) {
      setIsLoading(false);
      return;
    }
    
    async function detectGrade() {
      try {
        let info = learner;
        
        if (!info && fetchLearner) {
          info = await fetchLearner();
        }
        
        if (info?.grade !== undefined) {
          const detected = gradeToGradeBand(info.grade);
          setGradeBandState(detected);
          setLearnerGrade(info.grade);
          setIsAutoDetected(true);
        }
      } catch (err) {
        console.warn('Failed to detect learner grade:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    detectGrade();
  }, [learner, fetchLearner, disableAutoDetection]);
  
  // Context value
  const contextValue = useMemo<GradeAwareThemeContextValue>(
    () => ({
      gradeBand,
      theme,
      tailwindClasses,
      isHighContrast,
      reducedMotion,
      setGradeBand,
      setHighContrast,
      isLoading,
      isAutoDetected,
      learnerGrade,
    }),
    [
      gradeBand,
      theme,
      tailwindClasses,
      isHighContrast,
      reducedMotion,
      setGradeBand,
      setHighContrast,
      isLoading,
      isAutoDetected,
      learnerGrade,
    ]
  );
  
  return (
    <GradeAwareThemeContext.Provider value={contextValue}>
      {children}
    </GradeAwareThemeContext.Provider>
  );
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to access grade-aware theme context
 */
export function useGradeAwareTheme(): GradeAwareThemeContextValue {
  const context = useContext(GradeAwareThemeContext);
  if (!context) {
    throw new Error(
      'useGradeAwareTheme must be used within GradeAwareThemeProvider'
    );
  }
  return context;
}

/**
 * Hook for grade band with setter
 */
export function useGradeBandWithSetter(): {
  gradeBand: GradeBandKey;
  setGradeBand: (band: GradeBandKey) => void;
  isAutoDetected: boolean;
  learnerGrade: number | null;
} {
  const { gradeBand, setGradeBand, isAutoDetected, learnerGrade } = useGradeAwareTheme();
  return { gradeBand, setGradeBand, isAutoDetected, learnerGrade };
}

/**
 * Hook for theme loading state
 */
export function useThemeLoading(): boolean {
  const { isLoading } = useGradeAwareTheme();
  return isLoading;
}

// ============================================
// SSR Script
// ============================================

/**
 * Inline script for SSR to prevent theme flash
 */
export function getGradeThemeInitScript(defaultGradeBand: GradeBandKey = 'k_5'): string {
  return `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var gradeBand = '${defaultGradeBand}';
    var highContrast = false;
    
    if (stored) {
      var prefs = JSON.parse(stored);
      gradeBand = prefs.gradeBand || gradeBand;
      highContrast = prefs.highContrast || false;
    }
    
    var gradeMap = { k_5: 'k-5', '6_8': '6-8', '9_12': '9-12' };
    document.documentElement.setAttribute('data-grade-band', gradeBand);
    document.documentElement.setAttribute('data-grade', gradeMap[gradeBand] || 'k-5');
    
    if (highContrast || window.matchMedia('(prefers-contrast: more)').matches) {
      document.documentElement.classList.add('high-contrast');
      document.documentElement.setAttribute('data-contrast', 'high');
    }
    
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduce-motion');
    }
  } catch (e) {}
})();
`.trim();
}

/**
 * React component for SSR theme initialization
 */
export function GradeThemeInitScript({ 
  defaultGradeBand = 'k_5' 
}: { 
  defaultGradeBand?: GradeBandKey 
}): JSX.Element {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: getGradeThemeInitScript(defaultGradeBand),
      }}
    />
  );
}
