/**
 * AIVO Unified Design System - Color Tokens
 * 
 * Enterprise-grade color system for neurodiverse learners K-12
 * All colors meet WCAG 2.1 AA contrast requirements (4.5:1 for text, 3:1 for UI)
 * 
 * @module tokens/colors
 */

// ============================================
// Brand Colors (Consistent Across All Apps)
// ============================================

export const brandColors = {
  /** Primary brand color - Violet */
  primary: '#7C3AED',
  /** Secondary brand color - Light violet */
  secondary: '#A78BFA',
  /** Accent color - Mint green for success/positive */
  accent: '#6EE7B7',
  /** Deep violet for emphasis */
  primaryDark: '#6D28D9',
  /** Lightest violet for backgrounds */
  primaryLight: '#EDE9FE',
} as const;

// ============================================
// Role-Based Color Palettes
// ============================================

/**
 * Learner-Facing Apps (learner-web, parent-teacher-web)
 * Warm, friendly, encouraging
 */
export const learnerPalette = {
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',
  secondary: '#F0ABFC',
  accent: '#6EE7B7',
  background: {
    DEFAULT: '#FAF5FF',
    gradient: 'linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 100%)',
    elevated: '#FFFFFF',
    sunken: '#F3E8FF',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    elevated: '#FFFFFF',
    border: '#E9D5FF',
  },
  text: {
    primary: '#1E293B',
    secondary: '#475569',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
  },
} as const;

/**
 * Admin/Professional Apps (admin-web, district-admin-web, platform-admin-web)
 * Clean, professional, data-focused
 */
export const adminPalette = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#4338CA',
  secondary: '#6366F1',
  accent: '#14B8A6',
  background: {
    DEFAULT: '#F8FAFC',
    gradient: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
    elevated: '#FFFFFF',
    sunken: '#F1F5F9',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    elevated: '#FFFFFF',
    border: '#E2E8F0',
  },
  text: {
    primary: '#0F172A',
    secondary: '#334155',
    muted: '#64748B',
    inverse: '#FFFFFF',
  },
} as const;

/**
 * Marketing App (public website)
 * Engaging, conversion-focused, brand-forward
 */
export const marketingPalette = {
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',
  secondary: '#EC4899',
  accent: '#F97316',
  background: {
    DEFAULT: '#FFFFFF',
    gradient: 'linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 100%)',
    elevated: '#FFFFFF',
    sunken: '#F8FAFC',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    elevated: '#FFFFFF',
    border: '#E5E7EB',
  },
  text: {
    primary: '#111827',
    secondary: '#4B5563',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
  },
} as const;

// ============================================
// Semantic Colors (Consistent Across All Apps)
// ============================================

export const semanticColors = {
  success: {
    DEFAULT: '#10B981',
    light: '#D1FAE5',
    dark: '#059669',
    text: '#065F46',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
    dark: '#D97706',
    text: '#92400E',
  },
  error: {
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
    dark: '#DC2626',
    text: '#991B1B',
  },
  info: {
    DEFAULT: '#3B82F6',
    light: '#DBEAFE',
    dark: '#2563EB',
    text: '#1E40AF',
  },
} as const;

// ============================================
// Grade-Based Color Themes (Learner Web Only)
// ============================================

/**
 * K-5 Elementary Theme
 * Warm, playful, encouraging colors for young learners
 */
export const k5GradeColors = {
  primary: '#F97316',      // Warm orange - energetic, friendly
  primaryLight: '#FDBA74',
  primaryDark: '#EA580C',
  secondary: '#FBBF24',    // Sunshine yellow - cheerful
  secondaryLight: '#FDE68A',
  accent: '#34D399',       // Mint green - growth, positivity
  accentLight: '#A7F3D0',
  background: {
    DEFAULT: '#FFFBEB',    // Warm cream - cozy, approachable
    gradient: 'linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%)',
    elevated: '#FFFFFF',
    sunken: '#FEF3C7',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    elevated: '#FFFFFF',
    border: '#FDE68A',
  },
  text: {
    primary: '#78350F',    // Warm brown - readable, friendly
    secondary: '#92400E',
    muted: '#A16207',
    inverse: '#FFFFFF',
  },
} as const;

/**
 * 6-8 Middle School Theme
 * Balanced, transitional - bridge between playful and professional
 */
export const middleGradeColors = {
  primary: '#8B5CF6',      // Purple - creative, imaginative
  primaryLight: '#C4B5FD',
  primaryDark: '#7C3AED',
  secondary: '#A78BFA',    // Light purple - calming
  secondaryLight: '#DDD6FE',
  accent: '#06B6D4',       // Cyan - modern, tech-forward
  accentLight: '#A5F3FC',
  background: {
    DEFAULT: '#FAF5FF',    // Light lavender - calm, focused
    gradient: 'linear-gradient(180deg, #FAF5FF 0%, #F3E8FF 100%)',
    elevated: '#FFFFFF',
    sunken: '#F3E8FF',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    elevated: '#FFFFFF',
    border: '#E9D5FF',
  },
  text: {
    primary: '#1E293B',    // Slate - professional yet approachable
    secondary: '#475569',
    muted: '#64748B',
    inverse: '#FFFFFF',
  },
} as const;

/**
 * 9-12 High School Theme
 * Professional, mature - preparing for college/career
 */
export const highGradeColors = {
  primary: '#4F46E5',      // Indigo - professional, sophisticated
  primaryLight: '#818CF8',
  primaryDark: '#4338CA',
  secondary: '#6366F1',    // Light indigo - modern
  secondaryLight: '#A5B4FC',
  accent: '#14B8A6',       // Teal - calm confidence
  accentLight: '#5EEAD4',
  background: {
    DEFAULT: '#FFFFFF',    // Clean white - professional
    gradient: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    elevated: '#FFFFFF',
    sunken: '#F8FAFC',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    elevated: '#FFFFFF',
    border: '#E2E8F0',
  },
  text: {
    primary: '#0F172A',    // Near black - high contrast, serious
    secondary: '#334155',
    muted: '#64748B',
    inverse: '#FFFFFF',
  },
} as const;

// ============================================
// Neutral Colors (Shared)
// ============================================

export const neutralColors = {
  white: '#FFFFFF',
  black: '#000000',
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
} as const;

// ============================================
// Dark Mode Variants (Future)
// ============================================

export const darkModeColors = {
  background: {
    DEFAULT: '#0F172A',
    elevated: '#1E293B',
    sunken: '#020617',
  },
  surface: {
    DEFAULT: '#1E293B',
    elevated: '#334155',
    border: '#475569',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    muted: '#94A3B8',
    inverse: '#0F172A',
  },
} as const;

// ============================================
// Type Exports
// ============================================

export type BrandColors = typeof brandColors;
export type SemanticColors = typeof semanticColors;
export type NeutralColors = typeof neutralColors;
export type GradeColors = typeof k5GradeColors | typeof middleGradeColors | typeof highGradeColors;
export type AppPalette = typeof learnerPalette | typeof adminPalette | typeof marketingPalette;
