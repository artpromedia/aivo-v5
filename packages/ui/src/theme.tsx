import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { GradeBand } from "@aivo/types";

// Import enterprise theming system
import {
  type GradeTheme,
  type GradeBandKey,
  type TailwindClassTokens,
  type ThemeContextValue,
  getTheme,
  applyThemeToDocument,
  prefersReducedMotion,
  prefersHighContrast,
  k5TailwindClasses,
  middleSchoolTailwindClasses,
  highSchoolTailwindClasses,
} from "./theme/index";

// Re-export the new enterprise ThemeProvider
export {
  ThemeProvider,
  useTheme,
  useCurrentTheme,
  useAccessibility,
  useGradeBand,
  useTailwindTheme,
  useReducedMotion,
  useHighContrast,
  ThemeErrorBoundary,
  ThemeInitScript,
  getThemeInitScript,
} from "./providers/ThemeProvider";

export type {
  ThemeProviderProps,
  ThemeContextValue as EnterpriseThemeContextValue,
  AccessibilitySettings,
  LearnerProfile,
  FontSizePreference,
  ColorSchemePreference,
} from "./providers/ThemeProvider";

// Legacy ThemeTokens type for backward compatibility
type ThemeTokens = {
  background: string;
  card: string;
  accent: string;
  text: string;
  gradient: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  info: string;
  surface: string;
  textMuted: string;
};

// Map grade band to Tailwind class tokens
const tailwindClassesByGrade: Record<GradeBandKey, TailwindClassTokens> = {
  k_5: k5TailwindClasses,
  '6_8': middleSchoolTailwindClasses,
  '9_12': highSchoolTailwindClasses,
};

// Convert to legacy ThemeTokens for backward compatibility
function themeToLegacyTokens(gradeBand: GradeBandKey): ThemeTokens {
  const classes = tailwindClassesByGrade[gradeBand];
  return {
    background: classes.background,
    card: classes.card,
    accent: classes.accent,
    text: classes.text,
    gradient: classes.gradient,
    primary: classes.primary,
    secondary: classes.secondary,
    success: classes.success,
    warning: classes.warning,
    info: classes.info,
    surface: classes.surface,
    textMuted: classes.textMuted,
  };
}

// Legacy context for backward compatibility
const LegacyThemeContext = createContext<ThemeTokens>(themeToLegacyTokens("k_5"));

// Enterprise theme context
const EnterpriseThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Legacy ThemeProviderByGrade - maintained for backward compatibility
 */
export const ThemeProviderByGrade: React.FC<{ gradeBand: GradeBand; children: React.ReactNode }> = ({
  gradeBand,
  children
}) => {
  const legacyTokens = useMemo(() => themeToLegacyTokens(gradeBand as GradeBandKey), [gradeBand]);
  return <LegacyThemeContext.Provider value={legacyTokens}>{children}</LegacyThemeContext.Provider>;
};

/**
 * Legacy hook for backward compatibility
 */
export function useAivoTheme(): ThemeTokens {
  return useContext(LegacyThemeContext);
}

/**
 * Enterprise Theme Provider with full theming support
 */
export const EnterpriseThemeProvider: React.FC<{
  initialGradeBand?: GradeBandKey;
  children: React.ReactNode;
}> = ({ initialGradeBand = 'k_5', children }) => {
  const [gradeBand, setGradeBand] = useState<GradeBandKey>(initialGradeBand);
  const [isHighContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const theme = useMemo(() => getTheme(gradeBand, isHighContrast), [gradeBand, isHighContrast]);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
    setHighContrast(prefersHighContrast());

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');

    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    const handleContrastChange = (e: MediaQueryListEvent) => setHighContrast(e.matches);

    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({ theme, gradeBand, setGradeBand, isHighContrast, setHighContrast, reducedMotion }),
    [theme, gradeBand, isHighContrast, reducedMotion]
  );

  const legacyTokens = useMemo(() => themeToLegacyTokens(gradeBand), [gradeBand]);

  return (
    <EnterpriseThemeContext.Provider value={contextValue}>
      <LegacyThemeContext.Provider value={legacyTokens}>
        {children}
      </LegacyThemeContext.Provider>
    </EnterpriseThemeContext.Provider>
  );
};

/**
 * Hook for accessing enterprise theme
 */
export function useEnterpriseTheme(): ThemeContextValue {
  const context = useContext(EnterpriseThemeContext);
  if (!context) {
    throw new Error('useEnterpriseTheme must be used within EnterpriseThemeProvider');
  }
  return context;
}

/**
 * Hook for getting current GradeTheme object
 */
export function useGradeTheme(): GradeTheme {
  const { theme } = useEnterpriseTheme();
  return theme;
}

/**
 * Hook for getting Tailwind class tokens
 */
export function useTailwindClasses(): TailwindClassTokens {
  const { gradeBand } = useEnterpriseTheme();
  return tailwindClassesByGrade[gradeBand];
}

// Re-export theme module
export * from "./theme/index";

// Export color tokens for direct use
export const aivoColors = {
  // Legacy primary
  primary: "#7C3AED",
  primaryLight: "#A78BFA",
  primaryDark: "#6D28D9",
  mint: "#6EE7B7",
  mintDark: "#059669",
  sunshine: "#FCD34D",
  sunshineDark: "#D97706",
  sky: "#7DD3FC",
  skyDark: "#0284C7",
  coral: "#FF7B5C",
  coralDark: "#E53E3E",
  lavender: "#FAF5FF",
  surface: "#F8FAFC",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  // K-5 Elementary
  k5: { primary: "#FF8A80", secondary: "#FFE082", accent: "#A5D6A7", background: "#FFF8E7", text: "#3E2723" },
  // 6-8 Middle School
  middleSchool: { primary: "#26A69A", secondary: "#B39DDB", accent: "#4FC3F7", background: "#F5F5F5", text: "#37474F" },
  // 9-12 High School
  highSchool: { primary: "#3F51B5", secondary: "#78909C", accent: "#00BCD4", background: "#FFFFFF", text: "#212121" },
};

export const aivoGradients = {
  primary: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
  background: "linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 50%, #F8FAFC 100%)",
  lavender: "linear-gradient(180deg, #FAF5FF 0%, #F3E8FF 100%)",
  k5: "linear-gradient(135deg, #FF8A80 0%, #FFAB91 100%)",
  middleSchool: "linear-gradient(135deg, #26A69A 0%, #4DB6AC 100%)",
  highSchool: "linear-gradient(135deg, #3F51B5 0%, #5C6BC0 100%)",
};
