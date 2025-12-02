/**
 * AIVO Unified Design System - Themes TypeScript Export
 * 
 * TypeScript exports for theme utilities and types
 * 
 * @module themes/index
 */

// Import tokens for internal use
import {
  learnerPalette,
  adminPalette,
  marketingPalette,
  k5GradeColors,
  middleGradeColors,
  highGradeColors,
} from '../tokens';

// Re-export all tokens for programmatic access
export * from '../tokens';

// ============================================
// Theme Application Helpers
// ============================================

export type AppType = 'learner' | 'admin' | 'marketing';
export type GradeBand = 'k5' | 'middle' | 'high';

/**
 * Get the appropriate theme CSS import for an app
 */
export function getThemeImportPath(appType: AppType): string {
  const paths: Record<AppType, string> = {
    learner: '@aivo/ui/themes/learner.css',
    admin: '@aivo/ui/themes/admin.css',
    marketing: '@aivo/ui/themes/marketing.css',
  };
  return paths[appType];
}

/**
 * Get the appropriate grade theme CSS import
 */
export function getGradeThemeImportPath(grade: GradeBand): string {
  const paths: Record<GradeBand, string> = {
    k5: '@aivo/ui/themes/grades/k5.css',
    middle: '@aivo/ui/themes/grades/middle.css',
    high: '@aivo/ui/themes/grades/high.css',
  };
  return paths[grade];
}

/**
 * Get data attributes for theme application
 */
export function getThemeDataAttributes(
  appType: AppType,
  gradeBand?: GradeBand
): Record<string, string> {
  const attrs: Record<string, string> = {
    'data-theme': appType,
    'data-app': getAppName(appType),
  };
  
  if (gradeBand) {
    attrs['data-grade'] = gradeBand;
    attrs['data-grade-band'] = gradeBand;
  }
  
  return attrs;
}

function getAppName(appType: AppType): string {
  const names: Record<AppType, string> = {
    learner: 'learner-web',
    admin: 'admin-web',
    marketing: 'marketing',
  };
  return names[appType];
}

/**
 * Get color palette for an app type
 */
export function getAppPalette(appType: AppType) {
  switch (appType) {
    case 'learner':
      return learnerPalette;
    case 'admin':
      return adminPalette;
    case 'marketing':
      return marketingPalette;
    default:
      return learnerPalette;
  }
}

/**
 * Get color palette for a grade band
 */
export function getGradePalette(gradeBand: GradeBand) {
  switch (gradeBand) {
    case 'k5':
      return k5GradeColors;
    case 'middle':
      return middleGradeColors;
    case 'high':
      return highGradeColors;
    default:
      return middleGradeColors;
  }
}
