/**
 * 9-12 High School Theme
 * 
 * Design Philosophy:
 * - Professional, sophisticated, mature
 * - Indigo/teal color palette for college-prep feel
 * - Sharp, clean lines with minimal border radius
 * - Higher contrast, cleaner appearance
 * - WCAG AA compliant (4.5:1 contrast minimum)
 */

import type { GradeTheme, TailwindClassTokens } from './types';

export const highSchoolTheme: GradeTheme = {
  name: 'Scholar Indigo',
  gradeBand: '9_12',
  colors: {
    primary: {
      DEFAULT: '#4F46E5',  // Indigo
      light: '#818CF8',    // Light indigo
      dark: '#4338CA',     // Deep indigo
      contrast: '#FFFFFF', // White on primary
    },
    secondary: {
      DEFAULT: '#0D9488',  // Teal
      light: '#5EEAD4',    // Light teal
      dark: '#0F766E',     // Deep teal
      contrast: '#FFFFFF',
    },
    accent: {
      DEFAULT: '#F59E0B',  // Amber
      light: '#FCD34D',    // Light amber
      dark: '#D97706',     // Deep amber
      contrast: '#78350F', // Dark brown for contrast
    },
    background: {
      DEFAULT: '#FFFFFF',  // Pure white
      elevated: '#FFFFFF',
      sunken: '#F8FAFC',   // Slate 50
    },
    surface: {
      DEFAULT: '#FFFFFF',
      elevated: '#FFFFFF',
      border: '#E2E8F0',   // Clean slate border
    },
    text: {
      primary: '#1E293B',   // Slate 800
      secondary: '#334155', // Slate 700
      muted: '#64748B',     // Slate 500
      inverse: '#FFFFFF',
    },
    semantic: {
      success: {
        DEFAULT: '#10B981', // Emerald
        light: '#A7F3D0',
        dark: '#059669',
      },
      warning: {
        DEFAULT: '#F59E0B', // Amber
        light: '#FDE68A',
        dark: '#D97706',
      },
      error: {
        DEFAULT: '#EF4444', // Red
        light: '#FCA5A5',
        dark: '#DC2626',
      },
      info: {
        DEFAULT: '#3B82F6', // Blue
        light: '#BFDBFE',
        dark: '#2563EB',
      },
    },
  },
  gradients: {
    primary: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    accent: 'linear-gradient(135deg, #4F46E5 0%, #0D9488 100%)',
  },
  shadows: {
    card: '0 2px 12px rgba(0, 0, 0, 0.06)',
    elevated: '0 4px 20px rgba(0, 0, 0, 0.08)',
    focus: '0 0 0 3px rgba(79, 70, 229, 0.4)',
  },
  borderRadius: {
    small: '0.25rem', // 4px - sharp
    medium: '0.375rem',  // 6px
    large: '0.5rem',  // 8px
    full: '9999px',
  },
  spacing: {
    scale: 1.0, // Default spacing
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
    fontSizeScale: 1.0, // Default scale
  },
};

// Tailwind class tokens for 9-12
export const highSchoolTailwindClasses: TailwindClassTokens = {
  background: 'bg-hs-background',
  card: 'bg-white shadow-hs-card rounded-hs-lg',
  accent: 'text-hs-accent',
  text: 'text-hs-text',
  gradient: 'from-hs-primary to-hs-primary-light',
  primary: 'bg-hs-primary',
  secondary: 'bg-hs-secondary',
  success: 'bg-hs-success',
  warning: 'bg-hs-warning',
  info: 'bg-hs-info',
  surface: 'bg-hs-surface',
  textMuted: 'text-hs-text-muted',
  focusRing: 'focus-visible:ring-hs-primary focus-visible:ring-2 focus-visible:ring-offset-2',
};

// High contrast variant for 9-12
export const highSchoolHighContrastTheme: GradeTheme = {
  ...highSchoolTheme,
  name: 'Scholar Indigo (High Contrast)',
  colors: {
    ...highSchoolTheme.colors,
    primary: {
      DEFAULT: '#3730A3', // Deeper indigo
      light: '#4F46E5',
      dark: '#312E81',
      contrast: '#FFFFFF',
    },
    text: {
      primary: '#000000',
      secondary: '#1A1A1A',
      muted: '#333333',
      inverse: '#FFFFFF',
    },
    background: {
      DEFAULT: '#FFFFFF',
      elevated: '#FFFFFF',
      sunken: '#F5F5F5',
    },
    surface: {
      DEFAULT: '#FFFFFF',
      elevated: '#FFFFFF',
      border: '#000000',
    },
  },
};
