/**
 * AIVO Unified Design System - Typography Tokens
 * 
 * Accessible, readable typography for neurodiverse learners
 * Includes dyslexia-friendly considerations
 * 
 * @module tokens/typography
 */

// ============================================
// Font Families
// ============================================

export const fontFamilies = {
  /** Primary sans-serif font for UI and body text */
  sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  
  /** Display font for headings (same as sans for consistency) */
  display: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  
  /** Monospace font for code and technical content */
  mono: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, 'Courier New', monospace",
  
  /** Dyslexia-friendly font option */
  dyslexic: "'OpenDyslexic', 'Comic Sans MS', cursive, sans-serif",
} as const;

// ============================================
// Font Sizes
// ============================================

/**
 * Font size scale in rem
 * Base size: 16px (1rem)
 */
export const fontSizes = {
  /** 12px */
  xs: '0.75rem',
  /** 14px */
  sm: '0.875rem',
  /** 16px - Base size */
  base: '1rem',
  /** 18px */
  lg: '1.125rem',
  /** 20px */
  xl: '1.25rem',
  /** 24px */
  '2xl': '1.5rem',
  /** 30px */
  '3xl': '1.875rem',
  /** 36px */
  '4xl': '2.25rem',
  /** 48px */
  '5xl': '3rem',
  /** 60px */
  '6xl': '3.75rem',
  /** 72px */
  '7xl': '4.5rem',
  /** 96px */
  '8xl': '6rem',
  /** 128px */
  '9xl': '8rem',
} as const;

// ============================================
// Line Heights
// ============================================

export const lineHeights = {
  /** Tight: 1.0 - for large display text */
  none: '1',
  /** Tight: 1.25 - for headings */
  tight: '1.25',
  /** Snug: 1.375 - for subheadings */
  snug: '1.375',
  /** Normal: 1.5 - for body text */
  normal: '1.5',
  /** Relaxed: 1.625 - for improved readability */
  relaxed: '1.625',
  /** Loose: 2 - for large blocks of text, accessibility */
  loose: '2',
} as const;

// ============================================
// Font Weights
// ============================================

export const fontWeights = {
  /** Thin: 100 */
  thin: '100',
  /** Extra Light: 200 */
  extralight: '200',
  /** Light: 300 */
  light: '300',
  /** Normal: 400 */
  normal: '400',
  /** Medium: 500 */
  medium: '500',
  /** Semibold: 600 */
  semibold: '600',
  /** Bold: 700 */
  bold: '700',
  /** Extra Bold: 800 */
  extrabold: '800',
  /** Black: 900 */
  black: '900',
} as const;

// ============================================
// Letter Spacing
// ============================================

export const letterSpacing = {
  /** Tighter: -0.05em */
  tighter: '-0.05em',
  /** Tight: -0.025em */
  tight: '-0.025em',
  /** Normal: 0 */
  normal: '0',
  /** Wide: 0.025em */
  wide: '0.025em',
  /** Wider: 0.05em */
  wider: '0.05em',
  /** Widest: 0.1em */
  widest: '0.1em',
} as const;

// ============================================
// Typography Presets
// ============================================

/**
 * Pre-configured typography styles for common use cases
 */
export const typographyPresets = {
  // Headings
  h1: {
    fontSize: fontSizes['5xl'],
    lineHeight: lineHeights.tight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontSize: fontSizes['4xl'],
    lineHeight: lineHeights.tight,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontSize: fontSizes['3xl'],
    lineHeight: lineHeights.snug,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights.snug,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.snug,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.normal,
  },
  
  // Body text
  bodyLg: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.relaxed,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.relaxed,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySm: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  
  // UI text
  label: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },
  caption: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  overline: {
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase',
  },
  
  // Buttons
  buttonSm: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.medium,
    letterSpacing: letterSpacing.wide,
  },
  buttonMd: {
    fontSize: fontSizes.base,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.wide,
  },
  buttonLg: {
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacing.wide,
  },
  
  // Code
  code: {
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
    fontWeight: fontWeights.normal,
    fontFamily: fontFamilies.mono,
  },
} as const;

// ============================================
// Grade-Specific Typography Scales
// ============================================

/**
 * K-5 Elementary: Larger, more readable text
 */
export const k5Typography = {
  fontScale: 1.1,
  headingSizes: {
    h1: '3.5rem',
    h2: '2.75rem',
    h3: '2.25rem',
    h4: '1.875rem',
  },
  bodySize: '1.125rem',
  lineHeight: lineHeights.loose,
} as const;

/**
 * 6-8 Middle School: Standard sizing
 */
export const middleTypography = {
  fontScale: 1.0,
  headingSizes: {
    h1: '3rem',
    h2: '2.25rem',
    h3: '1.875rem',
    h4: '1.5rem',
  },
  bodySize: '1rem',
  lineHeight: lineHeights.relaxed,
} as const;

/**
 * 9-12 High School: Professional sizing
 */
export const highTypography = {
  fontScale: 1.0,
  headingSizes: {
    h1: '3rem',
    h2: '2.25rem',
    h3: '1.875rem',
    h4: '1.5rem',
  },
  bodySize: '1rem',
  lineHeight: lineHeights.normal,
} as const;

// ============================================
// Accessibility Typography Options
// ============================================

export const accessibilityTypography = {
  /** Large text mode (1.25x scale) */
  large: {
    scale: 1.25,
    lineHeight: lineHeights.loose,
    letterSpacing: letterSpacing.wide,
  },
  /** Extra large text mode (1.5x scale) */
  extraLarge: {
    scale: 1.5,
    lineHeight: lineHeights.loose,
    letterSpacing: letterSpacing.wider,
  },
  /** Dyslexia-friendly mode */
  dyslexic: {
    fontFamily: fontFamilies.dyslexic,
    lineHeight: lineHeights.loose,
    letterSpacing: letterSpacing.wider,
    wordSpacing: '0.16em',
  },
} as const;

// ============================================
// Type Exports
// ============================================

export type FontFamily = keyof typeof fontFamilies;
export type FontSize = keyof typeof fontSizes;
export type LineHeight = keyof typeof lineHeights;
export type FontWeight = keyof typeof fontWeights;
export type LetterSpacing = keyof typeof letterSpacing;
export type TypographyPreset = keyof typeof typographyPresets;
