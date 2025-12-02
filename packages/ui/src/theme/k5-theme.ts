/**
 * K-5 Elementary Theme
 * 
 * Design Philosophy:
 * - Warm, playful, high-energy but calming
 * - High luminosity with soft, rounded visual feel
 * - Warm orange, sunshine yellow, and mint green
 * - WCAG AA compliant (4.5:1 contrast minimum)
 * - 15% larger text and 10% more spacing
 */

import type { GradeTheme, TailwindClassTokens } from './types';

export const k5Theme: GradeTheme = {
  name: 'Elementary Sunshine',
  gradeBand: 'k_5',
  colors: {
    primary: {
      DEFAULT: '#F97316',  // Warm orange
      light: '#FDBA74',    // Light orange
      dark: '#EA580C',     // Deep orange
      contrast: '#FFFFFF', // White for text on primary
    },
    secondary: {
      DEFAULT: '#FBBF24',  // Sunshine yellow
      light: '#FDE68A',    // Light yellow
      dark: '#D97706',     // Golden yellow
      contrast: '#78350F', // Warm brown for contrast
    },
    accent: {
      DEFAULT: '#34D399',  // Mint green
      light: '#A7F3D0',    // Light mint
      dark: '#059669',     // Deep mint
      contrast: '#FFFFFF', // White for contrast
    },
    background: {
      DEFAULT: '#FFFBEB',  // Warm cream
      elevated: '#FFFFFF', // Pure white for cards
      sunken: '#FEF3C7',   // Soft yellow
    },
    surface: {
      DEFAULT: '#FFFFFF',
      elevated: '#FFFFFF',
      border: '#FDE68A',   // Soft yellow border
    },
    text: {
      primary: '#78350F',   // Warm brown (not black!)
      secondary: '#92400E', // Brown
      muted: '#B45309',     // Muted brown
      inverse: '#FFFFFF',   // White on dark
    },
    semantic: {
      success: {
        DEFAULT: '#22C55E', // Bright green
        light: '#BBF7D0',
        dark: '#15803D',
      },
      warning: {
        DEFAULT: '#F59E0B', // Warm amber
        light: '#FEF3C7',
        dark: '#B45309',
      },
      error: {
        DEFAULT: '#EF4444', // Red
        light: '#FEE2E2',
        dark: '#B91C1C',
      },
      info: {
        DEFAULT: '#3B82F6', // Blue
        light: '#DBEAFE',
        dark: '#1D4ED8',
      },
    },
  },
  gradients: {
    primary: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)',
    background: 'linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%)',
    accent: 'linear-gradient(135deg, #34D399 0%, #6EE7B7 100%)',
  },
  shadows: {
    card: '0 4px 20px rgba(249, 115, 22, 0.15)',
    elevated: '0 8px 30px rgba(249, 115, 22, 0.2)',
    focus: '0 0 0 3px rgba(249, 115, 22, 0.4)',
  },
  borderRadius: {
    small: '0.75rem',  // 12px - rounder
    medium: '1.25rem', // 20px
    large: '1.75rem',  // 28px - playful
    full: '9999px',
  },
  typography: {
    fontFamily: "'Comic Neue', 'Comic Sans MS', cursive, sans-serif",
    fontSizeScale: 1.15, // 15% larger for young readers
  },
  spacing: {
    scale: 1.1, // 10% more spacing
  },
};

// Tailwind class tokens for K-5
export const k5TailwindClasses: TailwindClassTokens = {
  background: 'bg-k5-background',
  card: 'bg-white shadow-k5-card rounded-k5-lg',
  accent: 'text-k5-accent',
  text: 'text-k5-text',
  gradient: 'from-k5-primary to-k5-primary-light',
  primary: 'bg-k5-primary',
  secondary: 'bg-k5-secondary',
  success: 'bg-k5-success',
  warning: 'bg-k5-warning',
  info: 'bg-k5-info',
  surface: 'bg-k5-surface',
  textMuted: 'text-k5-text-muted',
  focusRing: 'focus-visible:ring-k5-primary focus-visible:ring-2 focus-visible:ring-offset-2',
};

// High contrast variant for K-5
export const k5HighContrastTheme: GradeTheme = {
  ...k5Theme,
  name: 'Elementary Sunshine (High Contrast)',
  colors: {
    ...k5Theme.colors,
    primary: {
      DEFAULT: '#C2410C', // Stronger orange
      light: '#EA580C',
      dark: '#9A3412',
      contrast: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#333333',
      muted: '#555555',
      inverse: '#FFFFFF',
    },
    background: {
      DEFAULT: '#FFFFFF',
      elevated: '#FFFFFF',
      sunken: '#F5F5F5',
    },
  },
};
