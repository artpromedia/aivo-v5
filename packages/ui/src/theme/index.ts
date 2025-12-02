/**
 * Theme Module Index
 * 
 * Central export for all theming functionality
 */

// Types
export type {
  GradeBandKey,
  GradeTheme,
  ColorShade,
  BackgroundColors,
  SurfaceColors,
  TextColors,
  SemanticColor,
  SemanticColors,
  ThemeColors,
  ThemeGradients,
  ThemeShadows,
  ThemeBorderRadius,
  ThemeTypography,
  ThemeSpacing,
  ThemeContextValue,
  TailwindClassTokens,
  CSSCustomProperties,
} from './types';

// K-5 Elementary Theme
export { 
  k5Theme, 
  k5HighContrastTheme,
  k5TailwindClasses,
} from './k5-theme';

// 6-8 Middle School Theme
export { 
  middleSchoolTheme, 
  middleSchoolHighContrastTheme,
  middleSchoolTailwindClasses,
} from './middle-school-theme';

// 9-12 High School Theme
export { 
  highSchoolTheme, 
  highSchoolHighContrastTheme,
  highSchoolTailwindClasses,
} from './high-school-theme';

// Utilities
export {
  themes,
  highContrastThemes,
  getTheme,
  themeToCSSProperties,
  applyThemeToDocument,
  prefersReducedMotion,
  prefersHighContrast,
  getFontSize,
  getSpacing,
  getSpacingRem,
  calculateContrastRatio,
  hexToRgb,
  meetsWCAGAA,
  gradeToGradeBand,
  getGradeBandDisplayName,
} from './utils';

// Hook for theme switching
export { useThemeSwitcher } from './useThemeSwitcher';
export type { UseThemeSwitcherOptions, UseThemeSwitcherReturn } from './useThemeSwitcher';
