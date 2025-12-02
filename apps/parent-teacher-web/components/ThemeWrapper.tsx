"use client";

import { useEffect, useState, useCallback } from "react";
import { GradeAwareThemeProvider } from "@aivo/ui";
import { useAuth } from "../app/AuthProvider";

interface LearnerData {
  id: string;
  grade: number;
}

/**
 * Theme wrapper for parent-teacher app
 * Auto-detects grade from the primary learner being viewed
 */
export function ThemeWrapper({ 
  children,
  learnerId 
}: { 
  children: React.ReactNode;
  learnerId?: string;
}) {
  const { state } = useAuth();
  const [learner, setLearner] = useState<LearnerData | null>(null);

  const fetchLearner = useCallback(async (): Promise<LearnerData | null> => {
    if (!state.user) return null;
    
    try {
      // If specific learner ID provided, fetch that learner
      if (learnerId) {
        // Use generic fetch for learner data
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/learner/${learnerId}/overview`,
          {
            headers: state.accessToken 
              ? { Authorization: `Bearer ${state.accessToken}` }
              : {},
          }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data?.learner ? {
          id: data.learner.id,
          grade: data.learner.currentGrade || 3,
        } : null;
      }
      
      // Otherwise, return default for parent/teacher view
      return null;
    } catch {
      return null;
    }
  }, [state.user, state.accessToken, learnerId]);

  useEffect(() => {
    if (state.user) {
      fetchLearner().then(setLearner);
    }
  }, [state.user, fetchLearner]);

  return (
    <GradeAwareThemeProvider
      defaultGradeBand="k_5"
      learner={learner}
      disableAutoDetection={!state.user}
    >
      <>{children}</>
    </GradeAwareThemeProvider>
  );
}
