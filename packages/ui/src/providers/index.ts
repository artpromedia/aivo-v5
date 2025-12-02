/**
 * Providers Module
 * 
 * Exports all context providers for the UI package
 */

// Theme Provider (Full-featured)
export {
  ThemeProvider,
  useTheme,
  useCurrentTheme,
  useAccessibility,
  useGradeBand,
  useTailwindTheme,
  useReducedMotion,
  useHighContrast,
  ThemeErrorBoundary,
  ThemeInitScript,
  getThemeInitScript,
} from './ThemeProvider';

export type {
  ThemeProviderProps,
  ThemeContextValue,
  AccessibilitySettings,
  LearnerProfile,
  FontSizePreference,
  ColorSchemePreference,
  GradeTheme,
  GradeBandKey,
  TailwindClassTokens,
} from './ThemeProvider';

// Grade-Aware Theme Provider (Lightweight with auto-detection)
export {
  GradeAwareThemeProvider,
  useGradeAwareTheme,
  useGradeBandWithSetter,
  useThemeLoading,
  GradeThemeInitScript,
  getGradeThemeInitScript,
} from './GradeAwareThemeProvider';

export type {
  GradeAwareThemeContextValue,
  GradeAwareThemeProviderProps,
  LearnerInfo,
} from './GradeAwareThemeProvider';
