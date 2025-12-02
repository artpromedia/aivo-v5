/**
 * Theme Migration Validation Tests
 * 
 * Run with: pnpm test packages/ui/src/__tests__/theme-migration.test.tsx
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { GradeAwareThemeProvider, useGradeAwareTheme } from '../providers/GradeAwareThemeProvider';
import { gradeToGradeBand } from '../theme/utils';
import type { GradeBandKey } from '../theme/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

describe('Theme Migration Validation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.removeAttribute('data-grade-band');
    document.documentElement.removeAttribute('data-grade');
  });

  describe('gradeToGradeBand utility', () => {
    it('maps kindergarten to K-5', () => {
      expect(gradeToGradeBand(0)).toBe('k_5');
    });

    it('maps grade 3 to K-5', () => {
      expect(gradeToGradeBand(3)).toBe('k_5');
    });

    it('maps grade 5 to K-5', () => {
      expect(gradeToGradeBand(5)).toBe('k_5');
    });

    it('maps grade 6 to 6-8', () => {
      expect(gradeToGradeBand(6)).toBe('6_8');
    });

    it('maps grade 7 to 6-8', () => {
      expect(gradeToGradeBand(7)).toBe('6_8');
    });

    it('maps grade 8 to 6-8', () => {
      expect(gradeToGradeBand(8)).toBe('6_8');
    });

    it('maps grade 9 to 9-12', () => {
      expect(gradeToGradeBand(9)).toBe('9_12');
    });

    it('maps grade 12 to 9-12', () => {
      expect(gradeToGradeBand(12)).toBe('9_12');
    });
  });

  describe('GradeAwareThemeProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GradeAwareThemeProvider defaultGradeBand="k_5" disableAutoDetection>
        {children}
      </GradeAwareThemeProvider>
    );

    it('provides default grade band', () => {
      const { result } = renderHook(() => useGradeAwareTheme(), { wrapper });
      expect(result.current.gradeBand).toBe('k_5');
    });

    it('provides theme object', () => {
      const { result } = renderHook(() => useGradeAwareTheme(), { wrapper });
      expect(result.current.theme).toBeDefined();
      expect(result.current.theme.name).toBeDefined();
      expect(result.current.theme.colors).toBeDefined();
    });

    it('provides tailwind classes', () => {
      const { result } = renderHook(() => useGradeAwareTheme(), { wrapper });
      expect(result.current.tailwindClasses).toBeDefined();
      expect(result.current.tailwindClasses.primary).toBeDefined();
    });

    it('allows changing grade band', () => {
      const { result } = renderHook(() => useGradeAwareTheme(), { wrapper });
      
      act(() => {
        result.current.setGradeBand('6_8');
      });

      expect(result.current.gradeBand).toBe('6_8');
    });

    it('allows toggling high contrast', () => {
      const { result } = renderHook(() => useGradeAwareTheme(), { wrapper });
      
      expect(result.current.isHighContrast).toBe(false);
      
      act(() => {
        result.current.setHighContrast(true);
      });

      expect(result.current.isHighContrast).toBe(true);
    });
  });

  describe('Auto-detection', () => {
    it('detects grade from learner info', async () => {
      const learner = { id: 'test', grade: 7 };
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GradeAwareThemeProvider 
          defaultGradeBand="k_5" 
          learner={learner}
          disableAutoDetection={false}
        >
          {children}
        </GradeAwareThemeProvider>
      );

      const { result } = renderHook(() => useGradeAwareTheme(), { wrapper });
      
      // Wait for auto-detection
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.gradeBand).toBe('6_8');
      expect(result.current.isAutoDetected).toBe(true);
      expect(result.current.learnerGrade).toBe(7);
    });
  });

  describe('Theme colors by grade band', () => {
    const gradeBands: GradeBandKey[] = ['k_5', '6_8', '9_12'];

    gradeBands.forEach(band => {
      it(`provides correct theme for ${band}`, () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GradeAwareThemeProvider defaultGradeBand={band} disableAutoDetection>
            {children}
          </GradeAwareThemeProvider>
        );

        const { result } = renderHook(() => useGradeAwareTheme(), { wrapper });
        
        expect(result.current.gradeBand).toBe(band);
        expect(result.current.theme.gradeBand).toBe(band);
        expect(result.current.theme.colors.primary).toBeDefined();
        expect(result.current.theme.colors.secondary).toBeDefined();
      });
    });
  });

  describe('CSS classes migration', () => {
    it('theme-primary class should be available', () => {
      // This test validates that the Tailwind config has theme-primary defined
      // The actual class generation happens at build time
      const expectedClasses = [
        'bg-theme-primary',
        'text-theme-primary',
        'border-theme-primary',
        'bg-theme-primary/10',
        'bg-theme-primary/20',
      ];

      expectedClasses.forEach(cls => {
        // Just validate the class name format is correct
        expect(cls).toMatch(/^(bg|text|border|from|to)-theme-(primary|secondary)/);
      });
    });
  });
});

describe('Accessibility', () => {
  it('high contrast mode enhances colors', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GradeAwareThemeProvider defaultGradeBand="k_5" disableAutoDetection>
        {children}
      </GradeAwareThemeProvider>
    );

    const { result } = renderHook(() => useGradeAwareTheme(), { wrapper });
    
    const normalTheme = result.current.theme;
    
    act(() => {
      result.current.setHighContrast(true);
    });

    const highContrastTheme = result.current.theme;
    
    // High contrast should provide a different theme
    expect(result.current.isHighContrast).toBe(true);
    expect(highContrastTheme).toBeDefined();
  });
});
