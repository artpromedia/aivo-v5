"use client";

import { useState } from "react";
import { AivoApiClient } from "@aivo/api-client";
import type { SubjectCode } from "@aivo/types";
import Link from "next/link";

const client = new AivoApiClient("http://localhost:4000");

const subjects: Array<{ id: SubjectCode; label: string; emoji: string; color: string }> = [
  { id: "math", label: "Math", emoji: "🔢", color: "bg-violet-100 text-violet-700" },
  { id: "ela", label: "Reading & Writing", emoji: "📚", color: "bg-sky-100 text-sky-700" },
  { id: "science", label: "Science", emoji: "🔬", color: "bg-mint-100 text-emerald-700" },
];

export default function BaselinePage() {
  const [loading, setLoading] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectCode[]>(["math", "ela"]);
  const [step, setStep] = useState<"select" | "ready" | "started">("select");

  function toggleSubject(subjectId: SubjectCode) {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(s => s !== subjectId)
        : [...prev, subjectId]
    );
  }

  async function handleStartBaseline() {
    if (selectedSubjects.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await client.generateBaseline({
        learnerId: "demo-learner",
        subjects: selectedSubjects
      });
      setAssessmentId(res.assessment.id);
      setStep("started");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
      {/* Navigation */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium mb-6"
      >
        <span className="text-lg">←</span> Back to Dashboard
      </Link>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <span className="text-4xl">🌟</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Let&apos;s Get to Know You! 
          </h1>
          <p className="text-slate-600 max-w-md mx-auto">
            A quick check-in helps us understand where you are so we can personalize your learning journey.
          </p>
        </header>

        {step === "select" && (
          <section className="bg-white rounded-3xl shadow-xl p-8 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2 text-center">
              Choose Your Subjects 📖
            </h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              Pick which subjects you&apos;d like to explore today
            </p>

            <div className="space-y-3 mb-8">
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    selectedSubjects.includes(subject.id)
                      ? "border-violet-400 bg-lavender-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-violet-200"
                  }`}
                >
                  <span className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center ${subject.color}`}>
                    {subject.emoji}
                  </span>
                  <span className="text-lg font-medium text-slate-800">{subject.label}</span>
                  {selectedSubjects.includes(subject.id) && (
                    <span className="ml-auto text-violet-500 text-xl">✓</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("ready")}
              disabled={selectedSubjects.length === 0}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue →
            </button>

            {selectedSubjects.length === 0 && (
              <p className="text-center text-amber-600 text-sm mt-3">
                Please select at least one subject 😊
              </p>
            )}
          </section>
        )}

        {step === "ready" && (
          <section className="bg-white rounded-3xl shadow-xl p-8 mb-6 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              Ready to Begin?
            </h2>
            <p className="text-slate-600 mb-6 max-w-sm mx-auto">
              This check-in is gentle and adaptive. Take your time with each question – there&apos;s no rushing here!
            </p>

            <div className="bg-lavender-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-violet-700">
                <span className="font-medium">You selected:</span>{" "}
                {selectedSubjects.map(id => subjects.find(s => s.id === id)?.label).join(", ")}
              </p>
            </div>

            {/* Encouragement tips */}
            <div className="grid gap-3 mb-8 text-left">
              <div className="flex items-center gap-3 bg-mint-50 rounded-xl p-3">
                <span className="text-xl">💚</span>
                <span className="text-sm text-slate-700">No grades here – just learning about you!</span>
              </div>
              <div className="flex items-center gap-3 bg-sky-50 rounded-xl p-3">
                <span className="text-xl">⏱️</span>
                <span className="text-sm text-slate-700">Take breaks whenever you need them</span>
              </div>
              <div className="flex items-center gap-3 bg-sunshine-50 rounded-xl p-3">
                <span className="text-xl">🌈</span>
                <span className="text-sm text-slate-700">Questions adjust to find your best level</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("select")}
                className="flex-1 py-4 bg-slate-100 text-slate-700 font-medium rounded-2xl hover:bg-slate-200 transition-all"
              >
                ← Change Subjects
              </button>
              <button
                onClick={handleStartBaseline}
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Preparing...
                  </span>
                ) : (
                  "Let's Go! 🚀"
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">
                  Oops! Something went wrong: {error}
                </p>
              </div>
            )}
          </section>
        )}

        {step === "started" && (
          <section className="bg-white rounded-3xl shadow-xl p-8 mb-6 text-center">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              You&apos;re All Set!
            </h2>
            <p className="text-slate-600 mb-6">
              Your personalized check-in has been created. Let&apos;s see what you know!
            </p>

            {assessmentId && (
              <div className="bg-lavender-50 rounded-2xl p-4 mb-6">
                <p className="text-xs text-violet-600 font-mono">
                  Session: {assessmentId}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Link 
                href="/"
                className="flex-1 py-4 bg-slate-100 text-slate-700 font-medium rounded-2xl hover:bg-slate-200 transition-all text-center"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/session"
                className="flex-1 py-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all text-center"
              >
                Start Learning 📚
              </Link>
            </div>
          </section>
        )}

        {/* Footer note */}
        <p className="text-center text-slate-400 text-xs mt-8">
          ✨ Your learning profile helps AIVO create the perfect path for you
        </p>
      </div>
    </main>
  );
}
