"use client";

import Link from "next/link";
import { ThemeProviderByGrade, useAivoTheme } from "@aivo/ui";

const mockBrainProfile = {
  learnerId: "demo",
  tenantId: "demo-tenant",
  region: "north_america",
  currentGrade: 7,
  gradeBand: "6_8" as const,
  subjectLevels: [],
  neurodiversity: { adhd: true, prefersLowStimulusUI: true },
  preferences: { prefersStepByStep: true, prefersVisual: true },
  lastUpdatedAt: new Date().toISOString()
} as const;

function LearnerHome() {
  const theme = useAivoTheme();
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center p-6 ${theme.background}`}
    >
      <section
        className={`max-w-xl w-full rounded-2xl shadow-soft-coral ${theme.card} p-6`}
        aria-label="Learner dashboard"
      >
        <div
          className={`inline-flex items-center gap-2 rounded-pill px-3 py-1 text-xs font-semibold bg-gradient-to-r ${theme.gradient} text-white`}
        >
          <span>7th Grade • Math at 5th Grade Level</span>
        </div>
        <h1 className={`mt-4 text-2xl font-bold ${theme.accent}`}>
          Welcome back, AIVO Learner
        </h1>
        <p className={`mt-2 text-sm ${theme.text}`}>
          We’ll practice 7th-grade math, gently scaffolded at your 5th-grade comfort level.
          When you feel ready, we’ll ask your parent or teacher if we can make it a bit more
          challenging.
        </p>
        <Link
          href="/session"
          className="mt-6 inline-flex w-full items-center justify-center rounded-pill bg-coral px-4 py-3 text-sm font-semibold text-white shadow-soft-coral transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-coral"
        >
          Start today&apos;s calm session
        </Link>
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <ThemeProviderByGrade gradeBand={mockBrainProfile.gradeBand}>
      <LearnerHome />
    </ThemeProviderByGrade>
  );
}
