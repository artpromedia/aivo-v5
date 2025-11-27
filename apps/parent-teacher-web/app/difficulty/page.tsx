"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AivoApiClient } from "@aivo/api-client";
import type { DifficultyChangeProposal } from "@aivo/types";

const client = new AivoApiClient("http://localhost:4000");

export default function DifficultyReviewPage() {
  const [proposals, setProposals] = useState<DifficultyChangeProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const learnerId = "demo-learner";

  async function loadProposals() {
    setLoading(true);
    try {
      const res = await client.listDifficultyProposals(learnerId);
      setProposals(res.proposals);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProposals();
  }, []);

  async function handleDecision(proposalId: string, approve: boolean) {
    setActionId(proposalId);
    try {
      await client.decideOnDifficultyProposal({ proposalId, approve });
      await loadProposals();
    } finally {
      setActionId(null);
    }
  }

  const pendingProposals = proposals.filter(p => p.status === "pending");
  const resolvedProposals = proposals.filter(p => p.status !== "pending");

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
      {/* Back Navigation */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium mb-6"
      >
        <span className="text-lg">←</span> Back to Dashboard
      </Link>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white rounded-3xl shadow-xl p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-violet-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            ✅
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Difficulty Change Requests</h1>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Review and approve changes to your learner&apos;s difficulty levels. Your input helps AIVO personalize the learning experience.
          </p>
        </header>

        {loading && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="animate-spin text-4xl mb-3">🌟</div>
            <p className="text-slate-500">Loading proposals...</p>
          </div>
        )}

        {/* Pending Proposals */}
        {pendingProposals.length > 0 && (
          <section className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-600 rounded-full font-bold text-sm">
                {pendingProposals.length}
              </span>
              <h2 className="text-lg font-semibold text-slate-900">Pending Approvals</h2>
            </div>
            <ul className="space-y-4">
              {pendingProposals.map((p) => (
                <li
                  key={p.id}
                  className="bg-sunshine-50 border border-amber-200 rounded-2xl p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{p.direction === "harder" ? "📈" : "📉"}</span>
                        <span className="text-lg font-bold text-slate-900">
                          {p.subject.toUpperCase()}
                        </span>
                        <span className={`text-xs font-semibold rounded-full px-3 py-1 ${
                          p.direction === "harder" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-sky-100 text-sky-700"
                        }`}>
                          {p.direction === "harder" ? "⬆️ Increase" : "⬇️ Decrease"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">
                        Change from <span className="font-semibold">Grade {p.fromAssessedGradeLevel}</span> to <span className="font-semibold">Grade {p.toAssessedGradeLevel}</span>
                      </p>
                      <p className="text-sm text-slate-500 mt-2 bg-white/50 rounded-xl p-3">
                        💬 <span className="italic">{p.rationale}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      disabled={actionId === p.id}
                      onClick={() => handleDecision(p.id, true)}
                      className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-60"
                    >
                      {actionId === p.id ? "Processing..." : "✓ Approve"}
                    </button>
                    <button
                      disabled={actionId === p.id}
                      onClick={() => handleDecision(p.id, false)}
                      className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-60"
                    >
                      {actionId === p.id ? "Processing..." : "✗ Reject"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* No Pending */}
        {!loading && pendingProposals.length === 0 && (
          <section className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">All Caught Up!</h3>
            <p className="text-slate-500">
              There are no difficulty change proposals waiting for your review.
            </p>
          </section>
        )}

        {/* Resolved Proposals */}
        {resolvedProposals.length > 0 && (
          <section className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📋</span>
              <h2 className="text-lg font-semibold text-slate-900">Previous Decisions</h2>
            </div>
            <ul className="space-y-3">
              {resolvedProposals.map((p) => (
                <li
                  key={p.id}
                  className="bg-lavender-50 border border-lavender-200 rounded-2xl p-4"
                >
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{p.direction === "harder" ? "📈" : "📉"}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {p.subject.toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-500">
                          Grade {p.fromAssessedGradeLevel} → {p.toAssessedGradeLevel}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold rounded-full px-3 py-1 ${
                        p.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm py-4">
          💜 Your decisions help AIVO create the perfect learning experience
        </div>
      </div>
    </main>
  );
}
