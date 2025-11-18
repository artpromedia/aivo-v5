import React, { createContext, useContext } from "react";
import type { GradeBand } from "@aivo/types";

type ThemeTokens = {
  background: string;
  card: string;
  accent: string;
  text: string;
  gradient: string;
};

const themes: Record<GradeBand, ThemeTokens> = {
  k_5: {
    background: "bg-gradient-to-b from-coral to-salmon",
    card: "bg-white/90",
    accent: "text-coral",
    text: "text-slate-900",
    gradient: "from-coral to-ai-gradient-end"
  },
  "6_8": {
    background: "bg-slate-950",
    card: "bg-slate-900/90",
    accent: "text-salmon",
    text: "text-slate-50",
    gradient: "from-salmon to-ai-gradient-end"
  },
  "9_12": {
    background: "bg-slate-950",
    card: "bg-slate-900/90",
    accent: "text-ai-gradient-end",
    text: "text-slate-50",
    gradient: "from-ai-gradient-start to-ai-gradient-end"
  }
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
