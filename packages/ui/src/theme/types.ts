/**
 * Enterprise-Grade Dynamic Theming Types
 * For Neurodiverse Learners across K-12
 * 
 * All color combinations comply with WCAG 2.1 AA standards:
 * - 4.5:1 contrast ratio for normal text
 * - 3:1 contrast ratio for large text and UI components
 */

export type GradeBandKey = 'k_5' | '6_8' | '9_12';

export type ColorShade = {
  DEFAULT: string;
  light: string;
  dark: string;
  contrast: string;
};

export type BackgroundColors = {
  DEFAULT: string;
  elevated: string;
  sunken: string;
};

export type SurfaceColors = {
  DEFAULT: string;
  elevated: string;
  border: string;
};

export type TextColors = {
  primary: string;
  secondary: string;
  muted: string;
  inverse: string;
};

export type SemanticColor = {
  DEFAULT: string;
  light: string;
  dark: string;
};

export type SemanticColors = {
  success: SemanticColor;
  warning: SemanticColor;
  error: SemanticColor;
  info: SemanticColor;
};

export type ThemeColors = {
  primary: ColorShade;
  secondary: ColorShade;
  accent: ColorShade;
  background: BackgroundColors;
  surface: SurfaceColors;
  text: TextColors;
  semantic: SemanticColors;
};

export type ThemeGradients = {
  primary: string;
  background: string;
  accent: string;
};

export type ThemeShadows = {
  card: string;
  elevated: string;
  focus: string;
};

export type ThemeBorderRadius = {
  small: string;
  medium: string;
  large: string;
  full: string;
};

export type ThemeTypography = {
  fontFamily: string;
  fontSizeScale: number;
};

export type ThemeSpacing = {
  scale: number;
};

export type GradeTheme = {
  name: string;
  gradeBand: GradeBandKey;
  colors: ThemeColors;
  gradients: ThemeGradients;
  shadows: ThemeShadows;
  borderRadius: ThemeBorderRadius;
  typography: ThemeTypography;
  spacing?: ThemeSpacing; // Optional for high contrast variants that extend base
};

export type ThemeContextValue = {
  theme: GradeTheme;
  gradeBand: GradeBandKey;
  setGradeBand: (band: GradeBandKey) => void;
  isHighContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  reducedMotion: boolean;
};

// Tailwind class mappings for runtime usage
export type TailwindClassTokens = {
  background: string;
  card: string;
  accent: string;
  text: string;
  gradient: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  info: string;
  surface: string;
  textMuted: string;
  focusRing: string;
};

// CSS custom property names
export type CSSCustomProperties = {
  '--theme-primary': string;
  '--theme-primary-light': string;
  '--theme-primary-dark': string;
  '--theme-secondary': string;
  '--theme-accent': string;
  '--theme-background': string;
  '--theme-surface': string;
  '--theme-text': string;
  '--theme-text-muted': string;
  '--theme-success': string;
  '--theme-warning': string;
  '--theme-error': string;
  '--theme-info': string;
  '--theme-focus-ring': string;
  '--theme-border-radius-sm': string;
  '--theme-border-radius-md': string;
  '--theme-border-radius-lg': string;
  '--theme-spacing-scale': string;
  '--theme-font-size-scale': string;
  '--theme-font-family': string;
};
