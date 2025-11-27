"use client";

import { useEffect, useState } from "react";
import { AivoApiClient } from "@aivo/api-client";
import { ThemeProviderByGrade } from "@aivo/ui";
import type { GradeBand } from "@aivo/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const client = new AivoApiClient(API_BASE_URL);

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [gradeBand, setGradeBand] = useState<GradeBand>("k_5");
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
        // On error, use default theme
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
      <div className="min-h-screen bg-gradient-to-b from-lavender-100 to-white flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <span className="text-3xl">🌟</span>
          </div>
          <div className="text-primary-600 text-sm font-medium flex items-center gap-2 justify-center">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            Preparing your space…
          </div>
        </div>
      </div>
    );
  }

  return <ThemeProviderByGrade gradeBand={gradeBand}>{children}</ThemeProviderByGrade>;
}
