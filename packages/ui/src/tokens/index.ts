/**
 * AIVO Unified Design System - Token Exports
 * 
 * Central export for all design tokens
 * 
 * @module tokens
 */

// Colors
export {
  brandColors,
  learnerPalette,
  adminPalette,
  marketingPalette,
  semanticColors,
  k5GradeColors,
  middleGradeColors,
  highGradeColors,
  neutralColors,
  darkModeColors,
} from './colors';

export type {
  BrandColors,
  SemanticColors,
  NeutralColors,
  GradeColors,
  AppPalette,
} from './colors';

// Spacing
export {
  spacing,
  spacingTokens,
  buttonSpacing,
  cardSpacing,
  inputSpacing,
  containerSpacing,
  stackSpacing,
  sectionSpacing,
  gridGap,
  touchTargets,
} from './spacing';

export type {
  Spacing,
  SpacingTokens,
  TouchTargets,
} from './spacing';

// Typography
export {
  fontFamilies,
  fontSizes,
  lineHeights,
  fontWeights,
  letterSpacing,
  typographyPresets,
  k5Typography,
  middleTypography,
  highTypography,
  accessibilityTypography,
} from './typography';

export type {
  FontFamily,
  FontSize,
  LineHeight,
  FontWeight,
  LetterSpacing,
  TypographyPreset,
} from './typography';

// Effects
export {
  shadows,
  coloredShadows,
  borderRadius,
  gradeRadius,
  borderWidths,
  focusRings,
  transitions,
  reducedMotionTransitions,
  animations,
  blur,
  opacity,
} from './effects';

export type {
  Shadow,
  BorderRadius,
  Transition,
  Animation,
} from './effects';

// ============================================
// Utility Functions
// ============================================

/**
 * Get color value with optional opacity
 */
export function colorWithOpacity(color: string, opacity: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Handle rgb colors
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
  }
  
  return color;
}

/**
 * Get spacing value in pixels
 */
export function spacingToPx(value: string): number {
  if (value === '0') return 0;
  if (value.endsWith('rem')) {
    return parseFloat(value) * 16;
  }
  if (value.endsWith('px')) {
    return parseFloat(value);
  }
  return 0;
}

/**
 * Create CSS variables from tokens
 */
export function tokensToCSSVariables(
  tokens: Record<string, string>,
  prefix: string = ''
): Record<string, string> {
  const variables: Record<string, string> = {};
  
  Object.entries(tokens).forEach(([key, value]) => {
    const varName = prefix ? `--${prefix}-${key}` : `--${key}`;
    variables[varName] = value;
  });
  
  return variables;
}
