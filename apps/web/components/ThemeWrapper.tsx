"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { GradeAwareThemeProvider, GradeThemeInitScript } from "@aivo/ui";

interface LearnerData {
  id: string;
  grade: number;
}

/**
 * Theme wrapper that auto-detects learner grade from session
 * and applies appropriate theme (K-5, 6-8, or 9-12)
 */
export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [learner, setLearner] = useState<LearnerData | null>(null);

  // Fetch learner data when session is available
  const fetchLearner = useCallback(async (): Promise<LearnerData | null> => {
    if (!session?.user?.email) return null;
    
    try {
      // Fetch learner profile from API
      const res = await fetch("/api/learner/me");
      if (!res.ok) return null;
      
      const data = await res.json();
      return data?.learner || null;
    } catch {
      return null;
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchLearner().then(setLearner);
    }
  }, [status, fetchLearner]);

  return (
    <GradeAwareThemeProvider
      defaultGradeBand="k_5"
      learner={learner}
      disableAutoDetection={status === "loading"}
    >
      <>{children}</>
    </GradeAwareThemeProvider>
  );
}

/**
 * Script component for SSR theme initialization
 * Include in document head to prevent theme flash
 */
export { GradeThemeInitScript };
