"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import type { AssessmentDomainName, Question } from "@/lib/types/assessment";
import { AudioRecorder } from "@/components/audio-recorder";

const DOMAINS: AssessmentDomainName[] = ["READING", "MATH", "SPEECH", "SEL", "SCIENCE"];
const STORAGE_KEY = "aivo-baseline-progress";

interface StoredResponse {
  answer: string;
  isCorrect?: boolean;
}

interface PersistedSnapshot {
  learnerId: string;
  currentDomainIndex: number;
  currentQuestionIndex: number;
  questions: Record<string, Question[]>;
  responses: Record<string, StoredResponse>;
  domainGrades: Record<string, number>;
  lastResults: Record<string, boolean | null>;
  updatedAt: number;
}

export default function BaselineAssessment() {
  const { data: session, status } = useSession();
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Record<string, Question[]>>({});
  const [responses, setResponses] = useState<Record<string, StoredResponse>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainGrades, setDomainGrades] = useState<Record<string, number>>({});
  const lastResultRef = useRef<Record<string, boolean | null>>({});
  const [resumeSnapshot, setResumeSnapshot] = useState<PersistedSnapshot | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const totalQuestions = DOMAINS.length * 5;
  const answeredCount = currentDomainIndex * 5 + currentQuestionIndex;
  const progress = Math.min(100, Math.round((answeredCount / totalQuestions) * 100));

  const currentDomain = DOMAINS[currentDomainIndex];
  const currentQuestion = questions[currentDomain]?.[currentQuestionIndex];

  useEffect(() => {
    if (status !== "authenticated" || hasHydrated) return;
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw || !session?.user?.id) {
      setHasHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as PersistedSnapshot;
      if (parsed.learnerId === session.user.id) {
        setResumeSnapshot(parsed);
      }
    } catch (error) {
      console.warn("Failed to parse baseline snapshot", error);
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, [status, session?.user?.id, hasHydrated]);

  useEffect(() => {
    if (status !== "authenticated" || !hasHydrated || resumeSnapshot || isRestoring) return;
    loadNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDomainIndex, currentQuestionIndex, status, hasHydrated, resumeSnapshot, isRestoring]);

  useEffect(() => {
    if (!hasHydrated || !session?.user?.id) return;
    if (typeof window === "undefined") return;
    const snapshot: PersistedSnapshot = {
      learnerId: session.user.id,
      currentDomainIndex,
      currentQuestionIndex,
      questions,
      responses,
      domainGrades,
      lastResults: lastResultRef.current,
      updatedAt: Date.now()
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [hasHydrated, session?.user?.id, currentDomainIndex, currentQuestionIndex, questions, responses, domainGrades]);

  const loadNextQuestion = async () => {
    if (status !== "authenticated") return;

    if (currentQuestionIndex >= 5) {
      if (currentDomainIndex < DOMAINS.length - 1) {
        setCurrentDomainIndex((prev) => prev + 1);
        setCurrentQuestionIndex(0);
      } else {
        await submitAssessment();
      }
      return;
    }

    const domain = DOMAINS[currentDomainIndex];
    const existing = questions[domain]?.[currentQuestionIndex];
    if (existing) return;

    try {
      setIsLoading(true);
      setError(null);

      const gradeLevel = domainGrades[domain] ?? 5;
      const previousResult = lastResultRef.current[domain] ?? undefined;

      const response = await fetch("/api/assessment/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, questionNumber: currentQuestionIndex, gradeLevel, previousResult })
      });

      if (!response.ok) {
        throw new Error("Failed to generate question");
      }

      const question: Question = await response.json();
      setQuestions((prev) => ({
        ...prev,
        [domain]: [...(prev[domain] || []), question]
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async (answer: string) => {
    if (!currentQuestion) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/assessment/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: currentQuestion.id, answer })
      });

      if (!response.ok) {
        throw new Error("Unable to validate answer");
      }

      const result = await response.json();
      lastResultRef.current[currentDomain] = result.isCorrect;

      setResponses((prev) => ({
        ...prev,
        [currentQuestion.id]: { answer, isCorrect: result.isCorrect }
      }));

      setDomainGrades((prev) => ({
        ...prev,
        [currentDomain]: result.updatedDifficulty
      }));

      setCurrentQuestionIndex((prev) => prev + 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAssessment = async () => {
    const response = await fetch("/api/assessment/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        learnerId: session?.user.id,
        questions,
        responses
      })
    });

    if (!response.ok) {
      setError("Unable to complete assessment");
      return;
    }

    const results = await response.json();
    clearPersistedProgress();
    window.location.href = `/learn/assessment/results/${results.id}`;
  };

  const clearPersistedProgress = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const handleResume = () => {
    if (!resumeSnapshot) return;
    setIsRestoring(true);
    setQuestions(resumeSnapshot.questions);
    setResponses(resumeSnapshot.responses);
    setDomainGrades(resumeSnapshot.domainGrades);
    lastResultRef.current = resumeSnapshot.lastResults ?? {};
    setCurrentDomainIndex(resumeSnapshot.currentDomainIndex);
    setCurrentQuestionIndex(resumeSnapshot.currentQuestionIndex);
    setResumeSnapshot(null);
    setTimeout(() => setIsRestoring(false), 0);
  };

  const handleRestart = () => {
    setQuestions({});
    setResponses({});
    setDomainGrades({});
    lastResultRef.current = {};
    setCurrentDomainIndex(0);
    setCurrentQuestionIndex(0);
    setResumeSnapshot(null);
    clearPersistedProgress();
  };

  if (status === "loading") {
    return <ScreenMessage>Loading your session…</ScreenMessage>;
  }

  if (!hasHydrated) {
    return <ScreenMessage>Preparing your assessment…</ScreenMessage>;
  }

  if (!session?.user) {
    return <ScreenMessage>Please log in to begin the baseline assessment.</ScreenMessage>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-theme-primary/5 to-indigo-50 p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {resumeSnapshot && (
          <ResumeBanner onResume={handleResume} onRestart={handleRestart} snapshot={resumeSnapshot} />
        )}
        <header>
          <p className="text-sm uppercase tracking-wide text-theme-primary">Adaptive Baseline</p>
          <h1 className="text-4xl font-semibold text-slate-900">Discover how you learn best</h1>
          <p className="text-slate-600">
            We will ask five questions for each domain. Breathe, take your time, and let the AI adjust to your comfort level.
          </p>
        </header>

        <div>
          <div className="mb-2 flex justify-between text-sm text-slate-600">
            <span>
              {currentDomain} — Question {Math.min(currentQuestionIndex + 1, 5)}/5
            </span>
            <span>{progress}% complete</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-200">
            <motion.div
              className="h-3 rounded-full bg-gradient-to-r from-theme-primary to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error}</p>
            <button className="mt-2 text-xs font-semibold underline" onClick={loadNextQuestion}>
              Retry loading prompt
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isLoading && !currentQuestion ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-96 items-center justify-center rounded-2xl bg-white shadow-lg"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-theme-primary" />
                <p className="text-slate-600">Preparing your next prompt…</p>
              </div>
            </motion.div>
          ) : currentQuestion ? (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="rounded-3xl bg-white p-8 shadow-xl"
            >
              <QuestionDisplay question={currentQuestion} onSubmit={handleResponse} domain={currentDomain} />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-72 items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/60"
            >
              <div className="text-center text-slate-500">
                <p>Take a breath while we fetch your next adaptive prompt.</p>
                <button onClick={loadNextQuestion} className="mt-3 text-sm font-semibold text-theme-primary">
                  Refresh prompt
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950/90 p-6 text-slate-50">
      <div className="rounded-2xl bg-slate-900/80 p-8 text-center text-lg shadow-soft-coral">{children}</div>
    </div>
  );
}

function ResumeBanner({
  snapshot,
  onResume,
  onRestart
}: {
  snapshot: PersistedSnapshot;
  onResume: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="rounded-3xl border border-theme-primary/20 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-theme-primary">Resume where you left off?</p>
          <p className="text-xs text-slate-500">
            Last saved {formatRelativeTime(snapshot.updatedAt)} • Domain {snapshot.currentDomainIndex + 1} of {DOMAINS.length}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onRestart} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            Start over
          </button>
          <button onClick={onResume} className="rounded-full bg-theme-primary px-4 py-2 text-sm font-semibold text-white">
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}

interface QuestionDisplayProps {
  question: Question;
  domain: AssessmentDomainName;
  onSubmit: (answer: string) => void;
}

function QuestionDisplay({ question, onSubmit, domain }: QuestionDisplayProps) {
  const [selected, setSelected] = useState("");
  const [audioAnswer, setAudioAnswer] = useState<string>("");

  const canSubmit = useMemo(() => {
    if (question.type === "AUDIO_RESPONSE") return Boolean(audioAnswer);
    return selected.trim().length > 0;
  }, [audioAnswer, question.type, selected]);

  const submit = () => {
    const payload = question.type === "AUDIO_RESPONSE" ? audioAnswer : selected;
    onSubmit(payload);
    setSelected("");
    setAudioAnswer("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{getDomainIcon(domain)}</span>
        <div>
          <p className="text-sm uppercase tracking-wide text-theme-primary">{domain}</p>
          <h2 className="text-2xl font-semibold text-slate-900">Adaptive difficulty G{question.difficulty}</h2>
        </div>
      </div>

      <p className="text-lg leading-relaxed text-slate-700">{question.content}</p>

      {question.mediaUrl && (
        <div className="overflow-hidden rounded-2xl bg-slate-50 p-4">
          <Image
            src={question.mediaUrl}
            alt="Visual support"
            width={800}
            height={450}
            className="max-h-64 w-full rounded-xl object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority={false}
          />
        </div>
      )}

      {question.type === "MULTIPLE_CHOICE" && question.options && (
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={option}
              onClick={() => setSelected(option)}
              className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                selected === option ? "border-theme-primary bg-theme-primary/5" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="mr-3 font-semibold">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          ))}
        </div>
      )}

      {question.type === "OPEN_ENDED" && (
        <textarea
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="w-full rounded-2xl border-2 border-slate-200 p-4 text-base shadow-inner focus:border-theme-primary focus:outline-none"
          rows={5}
          placeholder="Share your thinking…"
        />
      )}

      {question.type === "AUDIO_RESPONSE" && (
        <AudioRecorder onRecordComplete={(value) => setAudioAnswer(value)} />
      )}

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="rounded-full bg-gradient-to-r from-theme-primary to-blue-500 px-8 py-3 font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit answer
        </button>
      </div>
    </div>
  );
}

function getDomainIcon(domain: string) {
  const icons: Record<string, string> = {
    READING: "📚",
    MATH: "🔢",
    SPEECH: "💬",
    SEL: "❤️",
    SCIENCE: "🔬"
  };
  return icons[domain] ?? "🧠";
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
