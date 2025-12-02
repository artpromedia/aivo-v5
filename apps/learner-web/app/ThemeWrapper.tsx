"use client";

import { useEffect, useState, useCallback } from "react";
import { AivoApiClient } from "@aivo/api-client";
import { GradeAwareThemeProvider } from "@aivo/ui";
import type { GradeBandKey } from "@aivo/ui";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const client = new AivoApiClient(API_BASE_URL);

interface LearnerData {
  id: string;
  grade: number;
}

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [learner, setLearner] = useState<LearnerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLearner = useCallback(async (): Promise<LearnerData | null> => {
    try {
      const meRes = await client.me();
      if (!meRes.learner) return null;
      
      const learnerRes = await client.getLearner(meRes.learner.id);
      if (!learnerRes.brainProfile) return null;
      
      // Map grade band to numeric grade for the provider
      const gradeMap: Record<string, number> = {
        k_5: 3,
        '6_8': 7,
        '9_12': 10,
      };
      
      return {
        id: meRes.learner.id,
        grade: gradeMap[learnerRes.brainProfile.gradeBand] || 3,
      };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetchLearner()
      .then((data) => {
        if (active) setLearner(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchLearner]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-lavender-100 to-white flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-theme-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <span className="text-3xl">🌟</span>
          </div>
          <div className="text-theme-primary text-sm font-medium flex items-center gap-2 justify-center">
            <div className="w-4 h-4 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
            Preparing your space…
          </div>
        </div>
      </div>
    );
  }

  return (
    <GradeAwareThemeProvider
      defaultGradeBand="k_5"
      learner={learner}
      disableAutoDetection={false}
    >
      {children}
    </GradeAwareThemeProvider>
  );
}
