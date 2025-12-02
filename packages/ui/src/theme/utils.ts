/**
 * Theme Utilities
 * 
 * Helper functions for:
 * - Generating CSS custom properties
 * - Converting themes to Tailwind config
 * - Accessibility helpers
 * - Theme switching
 */

import type { GradeTheme, GradeBandKey, CSSCustomProperties } from './types';
import { k5Theme, k5HighContrastTheme } from './k5-theme';
import { middleSchoolTheme, middleSchoolHighContrastTheme } from './middle-school-theme';
import { highSchoolTheme, highSchoolHighContrastTheme } from './high-school-theme';

// Theme registry
export const themes: Record<GradeBandKey, GradeTheme> = {
  k_5: k5Theme,
  '6_8': middleSchoolTheme,
  '9_12': highSchoolTheme,
};

export const highContrastThemes: Record<GradeBandKey, GradeTheme> = {
  k_5: k5HighContrastTheme,
  '6_8': middleSchoolHighContrastTheme,
  '9_12': highSchoolHighContrastTheme,
};

/**
 * Get theme by grade band and contrast preference
 */
export function getTheme(gradeBand: GradeBandKey, highContrast = false): GradeTheme {
  return highContrast ? highContrastThemes[gradeBand] : themes[gradeBand];
}

/**
 * Generate CSS custom properties from a theme
 */
export function themeToCSSProperties(theme: GradeTheme): CSSCustomProperties {
  return {
    '--theme-primary': theme.colors.primary.DEFAULT,
    '--theme-primary-light': theme.colors.primary.light,
    '--theme-primary-dark': theme.colors.primary.dark,
    '--theme-secondary': theme.colors.secondary.DEFAULT,
    '--theme-accent': theme.colors.accent.DEFAULT,
    '--theme-background': theme.colors.background.DEFAULT,
    '--theme-surface': theme.colors.surface.DEFAULT,
    '--theme-text': theme.colors.text.primary,
    '--theme-text-muted': theme.colors.text.muted,
    '--theme-success': theme.colors.semantic.success.DEFAULT,
    '--theme-warning': theme.colors.semantic.warning.DEFAULT,
    '--theme-error': theme.colors.semantic.error.DEFAULT,
    '--theme-info': theme.colors.semantic.info.DEFAULT,
    '--theme-focus-ring': theme.shadows.focus,
    '--theme-border-radius-sm': theme.borderRadius.small,
    '--theme-border-radius-md': theme.borderRadius.medium,
    '--theme-border-radius-lg': theme.borderRadius.large,
    '--theme-spacing-scale': theme.spacing?.scale?.toString() ?? '1',
    '--theme-font-size-scale': theme.typography.fontSizeScale.toString(),
    '--theme-font-family': theme.typography.fontFamily,
  };
}

/**
 * Apply theme CSS properties to document root
 */
export function applyThemeToDocument(theme: GradeTheme): void {
  if (typeof document === 'undefined') return;

  const cssProperties = themeToCSSProperties(theme);
  const root = document.documentElement;

  Object.entries(cssProperties).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Set data attribute for CSS selectors
  root.setAttribute('data-grade-band', theme.gradeBand);
  root.setAttribute('data-theme-name', theme.name);
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if high contrast is preferred
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Get appropriate font size based on grade band
 */
export function getFontSize(basePx: number, theme: GradeTheme): string {
  return `${basePx * theme.typography.fontSizeScale}px`;
}

/**
 * Get scaled spacing value based on grade band
 * K-5 gets 10% extra spacing for better touch targets
 */
export function getSpacing(basePx: number, theme: GradeTheme): string {
  const scale = theme.spacing?.scale ?? 1;
  return `${basePx * scale}px`;
}

/**
 * Get scaled rem value based on grade band
 */
export function getSpacingRem(baseRem: number, theme: GradeTheme): string {
  const scale = theme.spacing?.scale ?? 1;
  return `${baseRem * scale}rem`;
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio like 4.5 for WCAG AA compliance
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Check if a color combination meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string, 
  background: string, 
  isLargeText = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const threshold = isLargeText ? 3.0 : 4.5;
  return ratio >= threshold;
}

/**
 * Get grade band from student grade number
 */
export function gradeToGradeBand(grade: number): GradeBandKey {
  if (grade >= 0 && grade <= 5) return 'k_5';
  if (grade >= 6 && grade <= 8) return '6_8';
  return '9_12';
}

/**
 * Get display name for grade band
 */
export function getGradeBandDisplayName(gradeBand: GradeBandKey): string {
  const names: Record<GradeBandKey, string> = {
    k_5: 'Elementary (K-5)',
    '6_8': 'Middle School (6-8)',
    '9_12': 'High School (9-12)',
  };
  return names[gradeBand];
}
