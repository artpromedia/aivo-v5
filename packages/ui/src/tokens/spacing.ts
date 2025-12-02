/**
 * AIVO Unified Design System - Spacing Tokens
 * 
 * Consistent spacing scale across all applications
 * Based on 4px (0.25rem) base unit
 * 
 * @module tokens/spacing
 */

// ============================================
// Base Spacing Scale
// ============================================

/**
 * Core spacing values in rem
 * 1rem = 16px (browser default)
 */
export const spacing = {
  /** 0px */
  0: '0',
  /** 1px */
  px: '1px',
  /** 2px - 0.125rem */
  0.5: '0.125rem',
  /** 4px - 0.25rem */
  1: '0.25rem',
  /** 6px - 0.375rem */
  1.5: '0.375rem',
  /** 8px - 0.5rem */
  2: '0.5rem',
  /** 10px - 0.625rem */
  2.5: '0.625rem',
  /** 12px - 0.75rem */
  3: '0.75rem',
  /** 14px - 0.875rem */
  3.5: '0.875rem',
  /** 16px - 1rem */
  4: '1rem',
  /** 20px - 1.25rem */
  5: '1.25rem',
  /** 24px - 1.5rem */
  6: '1.5rem',
  /** 28px - 1.75rem */
  7: '1.75rem',
  /** 32px - 2rem */
  8: '2rem',
  /** 36px - 2.25rem */
  9: '2.25rem',
  /** 40px - 2.5rem */
  10: '2.5rem',
  /** 44px - 2.75rem */
  11: '2.75rem',
  /** 48px - 3rem */
  12: '3rem',
  /** 56px - 3.5rem */
  14: '3.5rem',
  /** 64px - 4rem */
  16: '4rem',
  /** 80px - 5rem */
  20: '5rem',
  /** 96px - 6rem */
  24: '6rem',
  /** 112px - 7rem */
  28: '7rem',
  /** 128px - 8rem */
  32: '8rem',
  /** 144px - 9rem */
  36: '9rem',
  /** 160px - 10rem */
  40: '10rem',
  /** 176px - 11rem */
  44: '11rem',
  /** 192px - 12rem */
  48: '12rem',
  /** 208px - 13rem */
  52: '13rem',
  /** 224px - 14rem */
  56: '14rem',
  /** 240px - 15rem */
  60: '15rem',
  /** 256px - 16rem */
  64: '16rem',
  /** 288px - 18rem */
  72: '18rem',
  /** 320px - 20rem */
  80: '20rem',
  /** 384px - 24rem */
  96: '24rem',
} as const;

// ============================================
// Semantic Spacing Aliases
// ============================================

/**
 * Named spacing tokens for common use cases
 */
export const spacingTokens = {
  /** Extra small: 4px */
  xs: spacing[1],
  /** Small: 8px */
  sm: spacing[2],
  /** Medium: 16px */
  md: spacing[4],
  /** Large: 24px */
  lg: spacing[6],
  /** Extra large: 32px */
  xl: spacing[8],
  /** 2X large: 48px */
  '2xl': spacing[12],
  /** 3X large: 64px */
  '3xl': spacing[16],
  /** 4X large: 96px */
  '4xl': spacing[24],
} as const;

// ============================================
// Component-Specific Spacing
// ============================================

/**
 * Button padding presets
 */
export const buttonSpacing = {
  sm: {
    paddingX: spacing[3],
    paddingY: spacing[1.5],
  },
  md: {
    paddingX: spacing[4],
    paddingY: spacing[2],
  },
  lg: {
    paddingX: spacing[6],
    paddingY: spacing[3],
  },
  xl: {
    paddingX: spacing[8],
    paddingY: spacing[4],
  },
} as const;

/**
 * Card padding presets
 */
export const cardSpacing = {
  sm: {
    padding: spacing[4],
    gap: spacing[3],
  },
  md: {
    padding: spacing[6],
    gap: spacing[4],
  },
  lg: {
    padding: spacing[8],
    gap: spacing[6],
  },
} as const;

/**
 * Input field spacing
 */
export const inputSpacing = {
  sm: {
    paddingX: spacing[3],
    paddingY: spacing[1.5],
    gap: spacing[2],
  },
  md: {
    paddingX: spacing[4],
    paddingY: spacing[2.5],
    gap: spacing[2],
  },
  lg: {
    paddingX: spacing[4],
    paddingY: spacing[3],
    gap: spacing[3],
  },
} as const;

/**
 * Page/Container spacing
 */
export const containerSpacing = {
  /** Mobile: 16px padding */
  mobile: spacing[4],
  /** Tablet: 24px padding */
  tablet: spacing[6],
  /** Desktop: 32px padding */
  desktop: spacing[8],
  /** Wide: 48px padding */
  wide: spacing[12],
} as const;

/**
 * Stack/Flow spacing (vertical rhythm)
 */
export const stackSpacing = {
  /** Tight: 8px between items */
  tight: spacing[2],
  /** Normal: 16px between items */
  normal: spacing[4],
  /** Relaxed: 24px between items */
  relaxed: spacing[6],
  /** Loose: 32px between items */
  loose: spacing[8],
} as const;

/**
 * Section spacing (page sections)
 */
export const sectionSpacing = {
  /** Small sections: 48px */
  sm: spacing[12],
  /** Medium sections: 64px */
  md: spacing[16],
  /** Large sections: 96px */
  lg: spacing[24],
  /** Hero/Feature sections: 128px */
  xl: spacing[32],
} as const;

// ============================================
// Gap/Grid Spacing
// ============================================

export const gridGap = {
  /** Minimal gap: 8px */
  xs: spacing[2],
  /** Small gap: 16px */
  sm: spacing[4],
  /** Medium gap: 24px */
  md: spacing[6],
  /** Large gap: 32px */
  lg: spacing[8],
  /** Extra large gap: 48px */
  xl: spacing[12],
} as const;

// ============================================
// Accessibility Touch Targets
// ============================================

/**
 * Minimum touch target sizes for accessibility
 * WCAG 2.1 Level AAA recommends 44x44px minimum
 */
export const touchTargets = {
  /** Minimum: 44px (WCAG AAA) */
  minimum: spacing[11],
  /** Comfortable: 48px */
  comfortable: spacing[12],
  /** Large: 56px */
  large: spacing[14],
} as const;

// ============================================
// Type Exports
// ============================================

export type Spacing = typeof spacing;
export type SpacingTokens = typeof spacingTokens;
export type TouchTargets = typeof touchTargets;
