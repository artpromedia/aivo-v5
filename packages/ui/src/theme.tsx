import React, { createContext, useContext } from "react";
import type { GradeBand } from "@aivo/types";

type ThemeTokens = {
  background: string;
  card: string;
  accent: string;
  text: string;
  gradient: string;
  // New friendly theme tokens
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  info: string;
  surface: string;
  textMuted: string;
};

// Friendly light theme for all grades - neurodiversity-affirming design
const friendlyTheme: ThemeTokens = {
  background: "bg-gradient-to-b from-lavender-100 to-white",
  card: "bg-white shadow-card rounded-2xl",
  accent: "text-primary-600",
  text: "text-slate-900",
  gradient: "from-primary-500 to-primary-400",
  primary: "bg-primary-600",
  secondary: "bg-primary-100",
  success: "bg-mint",
  warning: "bg-sunshine",
  info: "bg-sky",
  surface: "bg-surface-background",
  textMuted: "text-slate-500"
};

// All grade bands now use the same friendly light theme
const themes: Record<GradeBand, ThemeTokens> = {
  k_5: friendlyTheme,
  "6_8": friendlyTheme,
  "9_12": friendlyTheme
};

const ThemeContext = createContext<ThemeTokens>(themes["k_5"]);

export const ThemeProviderByGrade: React.FC<{ gradeBand: GradeBand; children: React.ReactNode }> = ({
  gradeBand,
  children
}) => {
  return <ThemeContext.Provider value={themes[gradeBand]}>{children}</ThemeContext.Provider>;
};

export function useAivoTheme() {
  return useContext(ThemeContext);
}

// Export friendly theme tokens for direct use
export const aivoColors = {
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
  textMuted: "#94A3B8"
};

export const aivoGradients = {
  primary: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
  background: "linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 50%, #F8FAFC 100%)",
  lavender: "linear-gradient(180deg, #FAF5FF 0%, #F3E8FF 100%)"
};
