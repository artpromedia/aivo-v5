"use client";

import { useEffect, useState } from "react";
import { AivoApiClient } from "@aivo/api-client";
import { ThemeProviderByGrade } from "@aivo/ui";
import type { GradeBand } from "@aivo/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const client = new AivoApiClient(API_BASE_URL);

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [gradeBand, setGradeBand] = useState<GradeBand>("6_8");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadGradeBand() {
      try {
        const meRes = await client.me();
        if (!meRes.learner) {
          if (active) setLoading(false);
          return;
        }
        const learnerRes = await client.getLearner(meRes.learner.id);
        if (!learnerRes.brainProfile) {
          if (active) setLoading(false);
          return;
        }
        if (active) {
          setGradeBand(learnerRes.brainProfile.gradeBand);
          setLoading(false);
        }
      } catch (e) {
        // On error, use default middle-school theme
        if (active) setLoading(false);
      }
    }

    void loadGradeBand();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          Loading your learner theme…
        </div>
      </div>
    );
  }

  return <ThemeProviderByGrade gradeBand={gradeBand}>{children}</ThemeProviderByGrade>;
}
