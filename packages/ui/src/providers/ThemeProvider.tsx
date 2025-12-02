/**
 * Enterprise-Grade Theme Provider
 * 
 * Provides automatic grade-based theming with:
 * - Automatic grade detection from learner profile
 * - Accessibility preference handling
 * - CSS variable application
 * - localStorage persistence
 * - SSR support
 * - Error boundaries
 * 
 * @module ThemeProvider
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

import {
  type GradeTheme,
  type GradeBandKey,
  type TailwindClassTokens,
  getTheme,
  themeToCSSProperties,
  gradeToGradeBand,
  prefersReducedMotion,
  prefersHighContrast,
  k5TailwindClasses,
  middleSchoolTailwindClasses,
  highSchoolTailwindClasses,
} from '../theme/index';

// ============================================
// Types & Interfaces
// ============================================

/**
 * Font size preference for accessibility
 */
export type FontSizePreference = 'default' | 'large' | 'x-large';

/**
 * Color scheme preference for sensory needs
 */
export type ColorSchemePreference = 'default' | 'warm' | 'cool' | 'muted';

/**
 * Accessibility settings for neurodiverse learners
 */
export interface AccessibilitySettings {
  /** Enable high contrast mode */
  highContrast: boolean;
  /** Respect reduced motion preferences */
  reducedMotion: boolean;
  /** Use dyslexia-friendly fonts */
  dyslexicFont: boolean;
  /** Font size preference */
  fontSize: FontSizePreference;
  /** Color scheme preference for sensory needs */
  colorScheme: ColorSchemePreference;
}

/**
 * Learner profile from API
 */
export interface LearnerProfile {
  id: string;
  grade: number;
  gradeLevel?: string;
  sensoryProfile?: {
    visualSensitivity?: 'low' | 'medium' | 'high';
    prefersDarkMode?: boolean;
    prefersReducedMotion?: boolean;
    prefersLargeText?: boolean;
  };
  accessibilityPreferences?: Partial<AccessibilitySettings>;
}

/**
 * Theme context value exposed to consumers
 */
export interface ThemeContextValue {
  // Current theme state
  gradeBand: GradeBandKey;
  theme: GradeTheme;
  
  // Accessibility settings
  accessibility: AccessibilitySettings;
  
  // Actions
  setGradeBand: (band: GradeBandKey) => void;
  setAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  resetAccessibility: () => void;
  
  // Computed values
  cssVariables: Record<string, string>;
  tailwindClasses: TailwindClassTokens;
  
  // Status
  isLoading: boolean;
  isHydrated: boolean;
  error: Error | null;
}

/**
 * Props for ThemeProvider component
 */
export interface ThemeProviderProps {
  children: ReactNode;
  /** Initial grade band (used before detection) */
  initialGradeBand?: GradeBandKey;
  /** Learner profile for automatic grade detection */
  learnerProfile?: LearnerProfile | null;
  /** Custom fetch function for learner profile */
  fetchLearnerProfile?: () => Promise<LearnerProfile | null>;
  /** Disable automatic grade detection */
  disableAutoDetection?: boolean;
  /** Disable localStorage persistence */
  disablePersistence?: boolean;
  /** Custom storage key for preferences */
  storageKey?: string;
  /** Callback when theme changes */
  onThemeChange?: (theme: GradeTheme) => void;
  /** Callback when accessibility settings change */
  onAccessibilityChange?: (settings: AccessibilitySettings) => void;
}

// ============================================
// Constants
// ============================================

const DEFAULT_STORAGE_KEY = 'aivo-theme-preferences';

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  dyslexicFont: false,
  fontSize: 'default',
  colorScheme: 'default',
};

const TAILWIND_CLASSES_BY_GRADE: Record<GradeBandKey, TailwindClassTokens> = {
  k_5: k5TailwindClasses,
  '6_8': middleSchoolTailwindClasses,
  '9_12': highSchoolTailwindClasses,
};

const FONT_SIZE_SCALE: Record<FontSizePreference, number> = {
  default: 1,
  large: 1.125,
  'x-large': 1.25,
};

// ============================================
// Context
// ============================================

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============================================
// Storage Helpers
// ============================================

interface StoredPreferences {
  gradeBand?: GradeBandKey;
  accessibility?: Partial<AccessibilitySettings>;
  timestamp?: number;
}

function getStoredPreferences(key: string): StoredPreferences | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as StoredPreferences;
    
    // Check if preferences are older than 30 days
    if (parsed.timestamp && Date.now() - parsed.timestamp > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

function setStoredPreferences(key: string, prefs: StoredPreferences): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify({
      ...prefs,
      timestamp: Date.now(),
    }));
  } catch {
    // Storage might be full or disabled
    console.warn('Failed to save theme preferences to localStorage');
  }
}

// ============================================
// CSS Variable Application
// ============================================

function applyThemeToDOM(
  theme: GradeTheme,
  accessibility: AccessibilitySettings
): Record<string, string> {
  const cssVars = themeToCSSProperties(theme);
  
  if (typeof document === 'undefined') {
    return cssVars as unknown as Record<string, string>;
  }
  
  const root = document.documentElement;
  
  // Apply theme CSS variables
  Object.entries(cssVars).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Apply grade band data attribute
  root.setAttribute('data-grade-band', theme.gradeBand);
  root.setAttribute('data-grade', gradeKeyToDataGrade(theme.gradeBand));
  root.setAttribute('data-theme-name', theme.name);
  
  // Apply accessibility attributes
  if (accessibility.highContrast) {
    root.setAttribute('data-contrast', 'high');
    root.classList.add('high-contrast');
  } else {
    root.removeAttribute('data-contrast');
    root.classList.remove('high-contrast');
  }
  
  if (accessibility.dyslexicFont) {
    root.setAttribute('data-font', 'dyslexic');
    root.classList.add('dyslexic-mode');
  } else {
    root.removeAttribute('data-font');
    root.classList.remove('dyslexic-mode');
  }
  
  // Apply font size scale
  const fontScale = FONT_SIZE_SCALE[accessibility.fontSize];
  root.style.setProperty('--font-size-scale', String(fontScale));
  root.style.fontSize = `${fontScale * 100}%`;
  
  // Apply color scheme
  if (accessibility.colorScheme !== 'default') {
    root.setAttribute('data-color-scheme', accessibility.colorScheme);
  } else {
    root.removeAttribute('data-color-scheme');
  }
  
  return cssVars as unknown as Record<string, string>;
}

function gradeKeyToDataGrade(key: GradeBandKey): string {
  const mapping: Record<GradeBandKey, string> = {
    k_5: 'k-5',
    '6_8': '6-8',
    '9_12': '9-12',
  };
  return mapping[key];
}

function cleanupThemeFromDOM(): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Remove all theme-related attributes
  root.removeAttribute('data-grade-band');
  root.removeAttribute('data-grade');
  root.removeAttribute('data-theme-name');
  root.removeAttribute('data-contrast');
  root.removeAttribute('data-font');
  root.removeAttribute('data-color-scheme');
  root.classList.remove('high-contrast', 'dyslexic-mode');
  
  // Remove font size override
  root.style.removeProperty('--font-size-scale');
  root.style.fontSize = '';
}

// ============================================
// System Preference Detection
// ============================================

function detectSystemPreferences(): Partial<AccessibilitySettings> {
  if (typeof window === 'undefined') {
    return {};
  }
  
  return {
    reducedMotion: prefersReducedMotion(),
    highContrast: prefersHighContrast(),
  };
}

function useSystemPreferences(
  onReducedMotionChange?: (value: boolean) => void,
  onHighContrastChange?: (value: boolean) => void
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      onReducedMotionChange?.(e.matches);
    };
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      onHighContrastChange?.(e.matches);
    };
    
    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);
    
    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, [onReducedMotionChange, onHighContrastChange]);
}

// ============================================
// ThemeProvider Component
// ============================================

export function ThemeProvider({
  children,
  initialGradeBand = 'k_5',
  learnerProfile,
  fetchLearnerProfile,
  disableAutoDetection = false,
  disablePersistence = false,
  storageKey = DEFAULT_STORAGE_KEY,
  onThemeChange,
  onAccessibilityChange,
}: ThemeProviderProps): JSX.Element {
  // State
  const [gradeBand, setGradeBandState] = useState<GradeBandKey>(initialGradeBand);
  const [accessibility, setAccessibilityState] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);
  const [isLoading, setIsLoading] = useState(!disableAutoDetection);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs for callbacks to avoid stale closures
  const onThemeChangeRef = useRef(onThemeChange);
  const onAccessibilityChangeRef = useRef(onAccessibilityChange);
  
  useEffect(() => {
    onThemeChangeRef.current = onThemeChange;
    onAccessibilityChangeRef.current = onAccessibilityChange;
  }, [onThemeChange, onAccessibilityChange]);
  
  // Compute theme based on current state
  const theme = useMemo(
    () => getTheme(gradeBand, accessibility.highContrast),
    [gradeBand, accessibility.highContrast]
  );
  
  // Compute Tailwind classes
  const tailwindClasses = useMemo(
    () => TAILWIND_CLASSES_BY_GRADE[gradeBand],
    [gradeBand]
  );
  
  // Compute and apply CSS variables
  const cssVariables = useMemo(
    () => applyThemeToDOM(theme, accessibility),
    [theme, accessibility]
  );
  
  // Actions
  const setGradeBand = useCallback((band: GradeBandKey) => {
    setGradeBandState(band);
    
    if (!disablePersistence) {
      const stored = getStoredPreferences(storageKey) || {};
      setStoredPreferences(storageKey, { ...stored, gradeBand: band });
    }
  }, [disablePersistence, storageKey]);
  
  const setAccessibility = useCallback((settings: Partial<AccessibilitySettings>) => {
    setAccessibilityState(prev => {
      const next = { ...prev, ...settings };
      
      if (!disablePersistence) {
        const stored = getStoredPreferences(storageKey) || {};
        setStoredPreferences(storageKey, { ...stored, accessibility: next });
      }
      
      return next;
    });
  }, [disablePersistence, storageKey]);
  
  const resetAccessibility = useCallback(() => {
    const systemPrefs = detectSystemPreferences();
    setAccessibilityState({ ...DEFAULT_ACCESSIBILITY, ...systemPrefs });
    
    if (!disablePersistence) {
      const stored = getStoredPreferences(storageKey) || {};
      setStoredPreferences(storageKey, { ...stored, accessibility: undefined });
    }
  }, [disablePersistence, storageKey]);
  
  // Listen for system preference changes
  useSystemPreferences(
    useCallback((reducedMotion: boolean) => {
      setAccessibilityState(prev => ({ ...prev, reducedMotion }));
    }, []),
    useCallback((highContrast: boolean) => {
      setAccessibilityState(prev => ({ ...prev, highContrast }));
    }, [])
  );
  
  // Initialize from storage and system preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load stored preferences
    if (!disablePersistence) {
      const stored = getStoredPreferences(storageKey);
      if (stored) {
        if (stored.gradeBand) {
          setGradeBandState(stored.gradeBand);
        }
        if (stored.accessibility) {
          setAccessibilityState(prev => ({ ...prev, ...stored.accessibility }));
        }
      }
    }
    
    // Apply system preferences (unless user has explicit settings)
    const systemPrefs = detectSystemPreferences();
    setAccessibilityState(prev => ({
      ...prev,
      reducedMotion: prev.reducedMotion || systemPrefs.reducedMotion || false,
      highContrast: prev.highContrast || systemPrefs.highContrast || false,
    }));
    
    setIsHydrated(true);
  }, [disablePersistence, storageKey]);
  
  // Handle learner profile detection
  useEffect(() => {
    if (disableAutoDetection) {
      setIsLoading(false);
      return;
    }
    
    async function detectGrade() {
      try {
        let profile = learnerProfile;
        
        // Fetch if not provided
        if (!profile && fetchLearnerProfile) {
          profile = await fetchLearnerProfile();
        }
        
        if (profile) {
          // Map grade to grade band
          const detectedBand = gradeToGradeBand(profile.grade);
          setGradeBandState(detectedBand);
          
          // Apply sensory profile preferences
          if (profile.sensoryProfile) {
            setAccessibilityState(prev => ({
              ...prev,
              reducedMotion: profile!.sensoryProfile?.prefersReducedMotion ?? prev.reducedMotion,
              fontSize: profile!.sensoryProfile?.prefersLargeText ? 'large' : prev.fontSize,
            }));
          }
          
          // Apply saved accessibility preferences
          if (profile.accessibilityPreferences) {
            setAccessibilityState(prev => ({
              ...prev,
              ...profile!.accessibilityPreferences,
            }));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to detect grade'));
        console.error('Failed to detect learner grade:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    detectGrade();
  }, [learnerProfile, fetchLearnerProfile, disableAutoDetection]);
  
  // Notify on theme change
  useEffect(() => {
    onThemeChangeRef.current?.(theme);
  }, [theme]);
  
  // Notify on accessibility change
  useEffect(() => {
    onAccessibilityChangeRef.current?.(accessibility);
  }, [accessibility]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupThemeFromDOM();
    };
  }, []);
  
  // Context value
  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      gradeBand,
      theme,
      accessibility,
      setGradeBand,
      setAccessibility,
      resetAccessibility,
      cssVariables,
      tailwindClasses,
      isLoading,
      isHydrated,
      error,
    }),
    [
      gradeBand,
      theme,
      accessibility,
      setGradeBand,
      setAccessibility,
      resetAccessibility,
      cssVariables,
      tailwindClasses,
      isLoading,
      isHydrated,
      error,
    ]
  );
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
      'Wrap your component tree with <ThemeProvider>.'
    );
  }
  
  return context;
}

/**
 * Hook to access only the current theme object
 */
export function useCurrentTheme(): GradeTheme {
  const { theme } = useTheme();
  return theme;
}

/**
 * Hook to access only accessibility settings
 */
export function useAccessibility(): {
  settings: AccessibilitySettings;
  setSettings: (settings: Partial<AccessibilitySettings>) => void;
  reset: () => void;
} {
  const { accessibility, setAccessibility, resetAccessibility } = useTheme();
  
  return {
    settings: accessibility,
    setSettings: setAccessibility,
    reset: resetAccessibility,
  };
}

/**
 * Hook to access grade band
 */
export function useGradeBand(): {
  gradeBand: GradeBandKey;
  setGradeBand: (band: GradeBandKey) => void;
  displayName: string;
} {
  const { gradeBand, setGradeBand } = useTheme();
  
  const displayName = useMemo(() => {
    const names: Record<GradeBandKey, string> = {
      k_5: 'Elementary (K-5)',
      '6_8': 'Middle School (6-8)',
      '9_12': 'High School (9-12)',
    };
    return names[gradeBand];
  }, [gradeBand]);
  
  return { gradeBand, setGradeBand, displayName };
}

/**
 * Hook for getting Tailwind class tokens
 */
export function useTailwindTheme(): TailwindClassTokens {
  const { tailwindClasses } = useTheme();
  return tailwindClasses;
}

/**
 * Hook for checking reduced motion preference
 */
export function useReducedMotion(): boolean {
  const { accessibility } = useTheme();
  return accessibility.reducedMotion;
}

/**
 * Hook for checking high contrast mode
 */
export function useHighContrast(): boolean {
  const { accessibility } = useTheme();
  return accessibility.highContrast;
}

// ============================================
// Error Boundary
// ============================================

interface ThemeErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ThemeErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

export class ThemeErrorBoundary extends React.Component<
  ThemeErrorBoundaryProps,
  ThemeErrorBoundaryState
> {
  constructor(props: ThemeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ThemeErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ThemeProvider error:', error, errorInfo);
    this.props.onError?.(error);
  }
  
  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback - render children without theme
      return this.props.children;
    }
    
    return this.props.children;
  }
}

// ============================================
// SSR-Safe Theme Script
// ============================================

/**
 * Generates inline script for SSR to prevent theme flash
 * Include this in your document head
 */
export function getThemeInitScript(defaultGradeBand: GradeBandKey = 'k_5'): string {
  return `
(function() {
  try {
    var stored = localStorage.getItem('${DEFAULT_STORAGE_KEY}');
    if (stored) {
      var prefs = JSON.parse(stored);
      var gradeBand = prefs.gradeBand || '${defaultGradeBand}';
      var gradeMap = { k_5: 'k-5', '6_8': '6-8', '9_12': '9-12' };
      document.documentElement.setAttribute('data-grade-band', gradeBand);
      document.documentElement.setAttribute('data-grade', gradeMap[gradeBand] || 'k-5');
      
      if (prefs.accessibility) {
        if (prefs.accessibility.highContrast) {
          document.documentElement.setAttribute('data-contrast', 'high');
          document.documentElement.classList.add('high-contrast');
        }
        if (prefs.accessibility.dyslexicFont) {
          document.documentElement.setAttribute('data-font', 'dyslexic');
          document.documentElement.classList.add('dyslexic-mode');
        }
      }
    }
    
    // Check system preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--transition-fast', '0ms');
      document.documentElement.style.setProperty('--transition-normal', '0ms');
      document.documentElement.style.setProperty('--transition-slow', '0ms');
    }
  } catch (e) {}
})();
`.trim();
}

/**
 * React component for SSR theme initialization script
 */
export function ThemeInitScript({ defaultGradeBand }: { defaultGradeBand?: GradeBandKey }): JSX.Element {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: getThemeInitScript(defaultGradeBand),
      }}
    />
  );
}

// ============================================
// Export Types
// ============================================

export type {
  GradeTheme,
  GradeBandKey,
  TailwindClassTokens,
};
