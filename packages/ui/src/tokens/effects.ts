/**
 * AIVO Unified Design System - Effects Tokens
 * 
 * Shadows, borders, and visual effects
 * Includes reduced motion alternatives
 * 
 * @module tokens/effects
 */

// ============================================
// Shadows
// ============================================

export const shadows = {
  /** No shadow */
  none: 'none',
  
  /** Extra small: Subtle elevation */
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  
  /** Small: Cards, buttons */
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  
  /** Medium: Dropdowns, popovers */
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  
  /** Large: Modals, floating elements */
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  
  /** Extra large: Dialogs */
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  
  /** 2X large: Major overlays */
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  /** Inner shadow */
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
} as const;

/**
 * Colored shadows for emphasis
 */
export const coloredShadows = {
  primary: '0 4px 14px 0 rgba(124, 58, 237, 0.25)',
  primaryLg: '0 10px 25px -5px rgba(124, 58, 237, 0.3)',
  success: '0 4px 14px 0 rgba(16, 185, 129, 0.25)',
  warning: '0 4px 14px 0 rgba(245, 158, 11, 0.25)',
  error: '0 4px 14px 0 rgba(239, 68, 68, 0.25)',
  info: '0 4px 14px 0 rgba(59, 130, 246, 0.25)',
} as const;

// ============================================
// Border Radius
// ============================================

export const borderRadius = {
  /** No radius */
  none: '0',
  /** Small: 4px - inputs, small buttons */
  sm: '0.25rem',
  /** Default: 6px - standard components */
  DEFAULT: '0.375rem',
  /** Medium: 8px - cards, larger elements */
  md: '0.5rem',
  /** Large: 12px - modals, large cards */
  lg: '0.75rem',
  /** Extra large: 16px - featured elements */
  xl: '1rem',
  /** 2X large: 24px - hero sections */
  '2xl': '1.5rem',
  /** 3X large: 32px - playful elements (K-5) */
  '3xl': '2rem',
  /** Full: 9999px - pills, avatars */
  full: '9999px',
} as const;

/**
 * Grade-specific border radius
 */
export const gradeRadius = {
  /** K-5: Rounder, friendlier */
  k5: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    button: '1rem',
    card: '1.5rem',
    input: '0.75rem',
  },
  /** 6-8: Balanced */
  middle: {
    sm: '0.375rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    button: '0.75rem',
    card: '1rem',
    input: '0.5rem',
  },
  /** 9-12: Professional */
  high: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    button: '0.5rem',
    card: '0.75rem',
    input: '0.375rem',
  },
} as const;

// ============================================
// Borders
// ============================================

export const borderWidths = {
  /** No border */
  0: '0px',
  /** Default: 1px */
  DEFAULT: '1px',
  /** Thick: 2px */
  2: '2px',
  /** Extra thick: 4px */
  4: '4px',
  /** Accent: 8px */
  8: '8px',
} as const;

// ============================================
// Focus Rings (Accessibility)
// ============================================

export const focusRings = {
  /** Default focus ring */
  DEFAULT: {
    outline: '2px solid transparent',
    outlineOffset: '2px',
    boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.5)',
  },
  
  /** High contrast focus ring */
  highContrast: {
    outline: '3px solid #000000',
    outlineOffset: '2px',
    boxShadow: 'none',
  },
  
  /** Inset focus (for filled buttons) */
  inset: {
    outline: 'none',
    boxShadow: 'inset 0 0 0 3px rgba(255, 255, 255, 0.5)',
  },
  
  /** Error state focus */
  error: {
    outline: '2px solid transparent',
    outlineOffset: '2px',
    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.5)',
  },
  
  /** Success state focus */
  success: {
    outline: '2px solid transparent',
    outlineOffset: '2px',
    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.5)',
  },
} as const;

// ============================================
// Transitions
// ============================================

export const transitions = {
  /** Fast: 150ms - micro-interactions */
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  
  /** Normal: 200ms - standard interactions */
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  
  /** Slow: 300ms - larger animations */
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  
  /** Slower: 500ms - major transitions */
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  
  /** Spring: bouncy feel */
  spring: '300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  
  /** Ease in: accelerating */
  easeIn: '200ms cubic-bezier(0.4, 0, 1, 1)',
  
  /** Ease out: decelerating */
  easeOut: '200ms cubic-bezier(0, 0, 0.2, 1)',
} as const;

/**
 * Reduced motion alternatives
 * Used when prefers-reduced-motion is enabled
 */
export const reducedMotionTransitions = {
  fast: '0ms',
  normal: '0ms',
  slow: '0ms',
  slower: '0ms',
  spring: '0ms',
  easeIn: '0ms',
  easeOut: '0ms',
} as const;

// ============================================
// Animation Presets
// ============================================

export const animations = {
  /** Fade in */
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: transitions.normal,
  },
  
  /** Fade out */
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: transitions.normal,
  },
  
  /** Scale up */
  scaleUp: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
    duration: transitions.normal,
  },
  
  /** Slide up */
  slideUp: {
    from: { transform: 'translateY(10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
    duration: transitions.normal,
  },
  
  /** Slide down */
  slideDown: {
    from: { transform: 'translateY(-10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
    duration: transitions.normal,
  },
  
  /** Pulse (loading states) */
  pulse: {
    keyframes: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  
  /** Spin (loading spinners) */
  spin: {
    keyframes: 'spin 1s linear infinite',
  },
  
  /** Bounce (attention) */
  bounce: {
    keyframes: 'bounce 1s infinite',
  },
} as const;

// ============================================
// Blur Effects
// ============================================

export const blur = {
  none: '0',
  sm: '4px',
  DEFAULT: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '40px',
  '3xl': '64px',
} as const;

// ============================================
// Opacity
// ============================================

export const opacity = {
  0: '0',
  5: '0.05',
  10: '0.1',
  20: '0.2',
  25: '0.25',
  30: '0.3',
  40: '0.4',
  50: '0.5',
  60: '0.6',
  70: '0.7',
  75: '0.75',
  80: '0.8',
  90: '0.9',
  95: '0.95',
  100: '1',
} as const;

// ============================================
// Type Exports
// ============================================

export type Shadow = keyof typeof shadows;
export type BorderRadius = keyof typeof borderRadius;
export type Transition = keyof typeof transitions;
export type Animation = keyof typeof animations;
