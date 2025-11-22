"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AivoApiClient } from "@aivo/api-client";
import { useAivoTheme } from "@aivo/ui";
import type { SubjectCode, SubjectLevel } from "@aivo/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const client = new AivoApiClient(API_BASE_URL);

type LearnerOverview = {
  displayName: string;
  currentGrade: number;
  focusSubject?: SubjectLevel;
};

function gradeLabel(grade?: number) {
  if (!grade) return "grade";
  const suffix = grade % 10 === 1 && grade !== 11
    ? "st"
    : grade % 10 === 2 && grade !== 12
    ? "nd"
    : grade % 10 === 3 && grade !== 13
    ? "rd"
    : "th";
  return `${grade}${suffix} grade`;
}

const SUBJECT_LABELS: Record<string, string> = {
  math: "Math",
  ela: "English Language Arts",
  reading: "Reading",
  writing: "Writing",
  science: "Science",
  social_studies: "Social Studies",
  sel: "Social-Emotional Learning",
  speech: "Speech",
  other: "Learning"
};

function subjectLabel(subject?: SubjectCode) {
  if (!subject) return "learning";
  return SUBJECT_LABELS[subject] ?? subject.toUpperCase();
}

type LearnerHomeProps = {
  overview: LearnerOverview | null;
  loading: boolean;
  error: string | null;
};

function LearnerHome({ overview, loading, error }: LearnerHomeProps) {
  const theme = useAivoTheme();

  const badgeText = useMemo(() => {
    if (overview?.focusSubject) {
      const assessed = gradeLabel(overview.focusSubject.assessedGradeLevel);
      return `${gradeLabel(overview.currentGrade)} • ${subjectLabel(overview.focusSubject.subject)} at ${assessed} level`;
    }
    if (overview) {
      return gradeLabel(overview.currentGrade);
    }
    return "Preparing your learner profile";
  }, [overview]);

  const heroCopy = useMemo(() => {
    if (loading) return "Checking your learner profile…";
    if (error) return `We couldn’t load your learner details (${error}).`;
    if (!overview) {
      return "We’ll guide you through a gentle setup experience to personalize today’s calm session.";
    }
    if (overview.focusSubject) {
      return `We’ll practice ${subjectLabel(overview.focusSubject.subject)} with calm scaffolding at your comfort level.`;
    }
    return `We’ll craft a calm plan tailored to ${gradeLabel(overview.currentGrade)}.`;
  }, [overview, loading, error]);

  const firstName = overview?.displayName?.split(" ")[0] ?? "AIVO learner";

  return (
    <main className={`flex min-h-screen flex-col items-center justify-center p-6 ${theme.background}`}>
      <section
        className={`max-w-xl w-full rounded-2xl shadow-soft-coral ${theme.card} p-6`}
        aria-label="Learner dashboard"
      >
        <div
          className={`inline-flex items-center gap-2 rounded-pill px-3 py-1 text-xs font-semibold bg-gradient-to-r ${theme.gradient} text-white`}
        >
          <span>{badgeText}</span>
        </div>
        <h1 className={`mt-4 text-2xl font-bold ${theme.accent}`}>
          {loading ? "Welcome back" : `Welcome back, ${firstName}`}
        </h1>
        <p className={`mt-2 text-sm ${theme.text}`}>
          {heroCopy}
        </p>
        {error && (
          <p className="mt-3 text-xs text-red-300" role="alert">
            Need help? Refresh or check the API gateway running on port 4000.
          </p>
        )}
        <Link
          href="/session"
          aria-disabled={loading || !!error}
          className={`mt-6 inline-flex w-full items-center justify-center rounded-pill px-4 py-3 text-sm font-semibold text-white shadow-soft-coral transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-coral ${
            loading || error ? "bg-coral/50 cursor-not-allowed" : "bg-coral hover:-translate-y-0.5 hover:shadow-lg"
          }`}
        >
          {loading ? "Preparing…" : "Start today’s calm session"}
        </Link>
      </section>
    </main>
  );
}

export default function Page() {
  const router = useRouter();
  const [overview, setOverview] = useState<LearnerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      setLoading(true);
      setError(null);
      try {
        const meRes = await client.me();
        if (!meRes.learner) {
          router.replace("/baseline");
          return;
        }
        const learnerRes = await client.getLearner(meRes.learner.id);
        if (!learnerRes.brainProfile) {
          router.replace("/baseline");
          return;
        }

        if (!active) return;

        const preferredSubject = meRes.learner.subjects?.[0] as SubjectCode | undefined;
        const subjectLevel = learnerRes.brainProfile.subjectLevels.find(
          (level) => level.subject === preferredSubject
        ) ?? learnerRes.brainProfile.subjectLevels[0];

        setOverview({
          displayName: meRes.learner.displayName,
          currentGrade: learnerRes.learner.currentGrade,
          focusSubject: subjectLevel
        });
      } catch (e) {
        if (!active) return;
        setError((e as Error).message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [router]);

  return <LearnerHome overview={overview} loading={loading} error={error} />;
}
