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

const SUBJECT_EMOJIS: Record<string, string> = {
  math: "🔢",
  ela: "📝",
  reading: "📖",
  writing: "✏️",
  science: "🔬",
  social_studies: "🌍",
  sel: "💚",
  speech: "🗣️",
  other: "📚"
};

function subjectLabel(subject?: SubjectCode) {
  if (!subject) return "learning";
  return SUBJECT_LABELS[subject] ?? subject.toUpperCase();
}

function subjectEmoji(subject?: SubjectCode) {
  if (!subject) return "🌟";
  return SUBJECT_EMOJIS[subject] ?? "📚";
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
    if (loading) return "Getting everything ready for you…";
    if (error) return "Hmm, we couldn't load your details. Let's try again!";
    if (!overview) {
      return "Let's set up your learning space together! 🌈";
    }
    if (overview.focusSubject) {
      return `Today we'll explore ${subjectLabel(overview.focusSubject.subject)} at your pace. No rush! ${subjectEmoji(overview.focusSubject.subject)}`;
    }
    return `Ready to learn something amazing today? Let's go! ✨`;
  }, [overview, loading, error]);

  const firstName = overview?.displayName?.split(" ")[0] ?? "Friend";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-lavender-100 via-white to-slate-50">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-24 h-24 bg-primary-100 rounded-full opacity-60 blur-2xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-mint/30 rounded-full opacity-60 blur-2xl" />
      
      <section
        className="max-w-xl w-full bg-white rounded-3xl shadow-card p-8 relative"
        aria-label="Learner dashboard"
      >
        {/* Avatar header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-400 rounded-2xl flex items-center justify-center shadow-soft-primary">
            <span className="text-white text-2xl font-bold">
              {firstName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {loading ? "Welcome back!" : `Hi, ${firstName}! 👋`}
            </h1>
            <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-medium">
              <span>📚</span>
              <span>{badgeText}</span>
            </div>
          </div>
        </div>

        {/* Hero message */}
        <div className="bg-lavender-100 rounded-2xl p-5 mb-6">
          <p className="text-slate-700 text-base leading-relaxed">
            {heroCopy}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-coral-light rounded-xl flex items-center gap-3">
            <span className="text-xl">😅</span>
            <p className="text-sm text-coral-dark">
              Don't worry! Just refresh the page or check if everything's connected.
            </p>
          </div>
        )}

        {/* Quick stats */}
        {overview && !error && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-mint/20 rounded-xl p-4 text-center">
              <span className="text-2xl">🎯</span>
              <p className="text-xs text-mint-dark font-medium mt-1">On Track</p>
            </div>
            <div className="bg-sunshine/20 rounded-xl p-4 text-center">
              <span className="text-2xl">⭐</span>
              <p className="text-xs text-sunshine-dark font-medium mt-1">Great Job</p>
            </div>
            <div className="bg-sky/20 rounded-xl p-4 text-center">
              <span className="text-2xl">🌟</span>
              <p className="text-xs text-sky-dark font-medium mt-1">Keep Going</p>
            </div>
          </div>
        )}

        {/* Start button */}
        <Link
          href="/session"
          aria-disabled={loading || !!error}
          className={`block w-full text-center rounded-2xl px-6 py-4 text-base font-semibold text-white shadow-soft-primary transition-all duration-200 ${
            loading || error 
              ? "bg-primary-300 cursor-not-allowed" 
              : "bg-gradient-to-r from-primary-600 to-primary-500 hover:-translate-y-1 hover:shadow-lg active:translate-y-0"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Preparing…
            </span>
          ) : (
            <span>🚀 Start Learning</span>
          )}
        </Link>

        {/* Friendly footer */}
        <p className="text-center text-sm text-slate-400 mt-4">
          Take your time. You've got this! 💪
        </p>
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
