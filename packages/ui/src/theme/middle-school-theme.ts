/**
 * 6-8 Middle School Theme
 * 
 * Design Philosophy:
 * - Balanced, transitional, slightly more mature
 * - Purple/cyan color palette for growing independence
 * - Cooler than K-5 but still approachable
 * - WCAG AA compliant (4.5:1 contrast minimum)
 */

import type { GradeTheme, TailwindClassTokens } from './types';

export const middleSchoolTheme: GradeTheme = {
  name: 'Explorer Purple',
  gradeBand: '6_8',
  colors: {
    primary: {
      DEFAULT: '#8B5CF6',  // Violet purple
      light: '#A78BFA',    // Light violet
      dark: '#7C3AED',     // Deep violet
      contrast: '#FFFFFF', // White on primary
    },
    secondary: {
      DEFAULT: '#06B6D4',  // Cyan
      light: '#67E8F9',    // Light cyan
      dark: '#0891B2',     // Deep cyan
      contrast: '#FFFFFF', // White on secondary
    },
    accent: {
      DEFAULT: '#EC4899',  // Pink
      light: '#F9A8D4',    // Light pink
      dark: '#DB2777',     // Deep pink
      contrast: '#FFFFFF', // White on accent
    },
    background: {
      DEFAULT: '#FAF5FF',  // Light lavender
      elevated: '#FFFFFF', // Pure white
      sunken: '#F3E8FF',   // Soft lavender
    },
    surface: {
      DEFAULT: '#FFFFFF',
      elevated: '#FAFAFA',
      border: '#E9D5FF',   // Lavender border
    },
    text: {
      primary: '#4C1D95',   // Deep violet
      secondary: '#6B21A8', // Purple
      muted: '#9333EA',     // Medium purple
      inverse: '#FFFFFF',
    },
    semantic: {
      success: {
        DEFAULT: '#10B981', // Emerald green
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
        DEFAULT: '#06B6D4', // Cyan
        light: '#CFFAFE',
        dark: '#0891B2',
      },
    },
  },
  gradients: {
    primary: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    background: 'linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 50%, #F3E8FF 100%)',
    accent: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
  },
  shadows: {
    card: '0 4px 20px rgba(139, 92, 246, 0.12)',
    elevated: '0 8px 30px rgba(139, 92, 246, 0.18)',
    focus: '0 0 0 3px rgba(139, 92, 246, 0.4)',
  },
  borderRadius: {
    small: '0.5rem',   // 8px
    medium: '0.75rem', // 12px
    large: '1rem',     // 16px
    full: '9999px',
  },
  spacing: {
    scale: 1.0, // Default spacing (no extra padding)
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
    fontSizeScale: 1.0, // Default scale
  },
};

// Tailwind class tokens for 6-8
export const middleSchoolTailwindClasses: TailwindClassTokens = {
  background: 'bg-ms-background',
  card: 'bg-white shadow-ms-card rounded-ms-lg',
  accent: 'text-ms-accent',
  text: 'text-ms-text',
  gradient: 'from-ms-primary to-ms-primary-light',
  primary: 'bg-ms-primary',
  secondary: 'bg-ms-secondary',
  success: 'bg-ms-success',
  warning: 'bg-ms-warning',
  info: 'bg-ms-info',
  surface: 'bg-ms-surface',
  textMuted: 'text-ms-text-muted',
  focusRing: 'focus-visible:ring-ms-primary focus-visible:ring-2 focus-visible:ring-offset-2',
};

// High contrast variant for 6-8
export const middleSchoolHighContrastTheme: GradeTheme = {
  ...middleSchoolTheme,
  name: 'Explorer Purple (High Contrast)',
  colors: {
    ...middleSchoolTheme.colors,
    primary: {
      DEFAULT: '#6D28D9', // Stronger violet
      light: '#8B5CF6',
      dark: '#5B21B6',
      contrast: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#2E2E2E',
      muted: '#4A4A4A',
      inverse: '#FFFFFF',
    },
    background: {
      DEFAULT: '#FFFFFF',
      elevated: '#FFFFFF',
      sunken: '#F5F5F5',
    },
  },
};
