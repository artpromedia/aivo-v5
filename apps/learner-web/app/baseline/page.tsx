"use client";

import { useState } from "react";
import { AivoApiClient } from "@aivo/api-client";

const client = new AivoApiClient("http://localhost:4000");

export default function BaselinePage() {
  const [loading, setLoading] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStartBaseline() {
    setLoading(true);
    setError(null);
    try {
      const res = await client.generateBaseline({
        learnerId: "demo-learner",
        subjects: ["math", "ela"]
      });
      setAssessmentId(res.assessment.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 p-6">
      <section className="w-full max-w-md rounded-2xl bg-slate-900/80 p-6 shadow-soft-coral">
        <h1 className="text-lg font-semibold mb-2">Start Baseline Check-in</h1>
        <p className="text-sm text-slate-200 mb-4">
          We&apos;ll gently measure where you are in each subject so we can teach at your best level.
        </p>
        <button
          disabled={loading}
          onClick={handleStartBaseline}
          className="w-full rounded-pill bg-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Preparing questions..." : "Begin"}
        </button>
        {assessmentId && (
          <p className="mt-4 text-xs text-emerald-300">
            Baseline created with id <span className="font-mono">{assessmentId}</span>
          </p>
        )}
        {error && (
          <p className="mt-4 text-xs text-red-400">
            Error: {error}
          </p>
        )}
      </section>
    </main>
  );
}
