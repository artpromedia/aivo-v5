/**
 * Theme Testing Utilities
 * 
 * Helpers for testing theme integration across components
 * 
 * Note: Requires @testing-library/react to be installed in your test environment
 */

import React from 'react';
import { GradeAwareThemeProvider } from '../providers/GradeAwareThemeProvider';
import type { GradeBandKey } from '../theme/types';

interface ThemeTestOptions {
  gradeBand?: GradeBandKey;
  learnerGrade?: number;
}

/**
 * Create a wrapper component for testing with theme
 */
export function createThemeWrapper(options: ThemeTestOptions = {}) {
  const {
    gradeBand = 'k_5',
    learnerGrade,
  } = options;

  const learner = learnerGrade !== undefined
    ? { id: 'test-learner', grade: learnerGrade }
    : undefined;

  return function ThemeTestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <GradeAwareThemeProvider
        defaultGradeBand={gradeBand}
        learner={learner}
        disableAutoDetection={!learner}
      >
        {children}
      </GradeAwareThemeProvider>
    );
  };
}

/**
 * Render component with theme provider for testing
 * 
 * Usage with @testing-library/react:
 * ```
 * import { render } from '@testing-library/react';
 * import { createThemeWrapper } from '@aivo/ui/testing';
 * 
 * render(<MyComponent />, { wrapper: createThemeWrapper({ gradeBand: '6_8' }) });
 * ```
 */
export function renderWithTheme(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderFn: (ui: React.ReactElement, options?: any) => any,
  ui: React.ReactElement,
  options: ThemeTestOptions = {}
) {
  return renderFn(ui, { wrapper: createThemeWrapper(options) });
}

/**
 * Get expected theme colors for a grade band
 */
export function getExpectedThemeColors(gradeBand: GradeBandKey) {
  const themes = {
    k_5: {
      primary: '#FF8A80',
      secondary: '#FFE082',
      accent: '#A5D6A7',
      background: '#FFF8E7',
    },
    '6_8': {
      primary: '#26A69A',
      secondary: '#B39DDB',
      accent: '#4FC3F7',
      background: '#F5F5F5',
    },
    '9_12': {
      primary: '#3F51B5',
      secondary: '#78909C',
      accent: '#00BCD4',
      background: '#FFFFFF',
    },
  };
  return themes[gradeBand];
}

/**
 * Assert that an element uses theme-primary class
 */
export function expectThemeClass(
  element: HTMLElement,
  expectedClass: string
) {
  const classes = element.className.split(' ');
  expect(classes).toContain(expectedClass);
}

/**
 * Get CSS variable value from document
 */
export function getCSSVariable(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/**
 * Assert data attribute on document
 */
export function expectDataAttribute(
  name: string,
  value: string
) {
  expect(document.documentElement.getAttribute(name)).toBe(value);
}

/**
 * Mock matchMedia for testing
 */
export function mockMatchMedia(options: {
  prefersReducedMotion?: boolean;
  prefersHighContrast?: boolean;
} = {}) {
  const { prefersReducedMotion = false, prefersHighContrast = false } = options;

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes('reduced-motion')
        ? prefersReducedMotion
        : query.includes('contrast')
        ? prefersHighContrast
        : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  const mockStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };

  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: mockStorage,
  });

  return mockStorage;
}

export { renderWithTheme as default };
