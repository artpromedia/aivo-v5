"use client";

import { useEffect, useState } from "react";
import { AivoApiClient } from "@aivo/api-client";
import type { DifficultyChangeProposal } from "@aivo/types";

const client = new AivoApiClient("http://localhost:4000");

export default function DifficultyReviewPage() {
  const [proposals, setProposals] = useState<DifficultyChangeProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const learnerId = "demo-learner"; // TODO: derive from route or selection

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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-3xl rounded-2xl bg-slate-900/80 p-6 shadow-soft-coral">
        <h1 className="text-xl font-semibold mb-4">Difficulty Change Requests</h1>
        {loading && <p className="text-sm text-slate-400 mb-2">Loading…</p>}
        {proposals.length === 0 && !loading && (
          <p className="text-sm text-slate-400">
            There are no difficulty change proposals for this learner yet.
          </p>
        )}
        <ul className="space-y-3">
          {proposals.map((p) => (
            <li
              key={p.id}
              className="rounded-xl bg-slate-800/70 p-4 border border-slate-700 flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold">
                    {p.subject.toUpperCase()} • {p.direction === "harder" ? "Increase" : "Decrease"}{" "}
                    difficulty
                  </p>
                  <p className="text-xs text-slate-300">
                    From grade {p.fromAssessedGradeLevel} to {p.toAssessedGradeLevel}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold rounded-pill px-2 py-1 ${
                    p.status === "pending"
                      ? "bg-amber-500/20 text-amber-300"
                      : p.status === "approved"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {p.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Reason: <span className="italic">{p.rationale}</span>
              </p>
              {p.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <button
                    disabled={actionId === p.id}
                    onClick={() => handleDecision(p.id, true)}
                    className="flex-1 rounded-pill bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-60"
                  >
                    {actionId === p.id ? "Approving…" : "Approve"}
                  </button>
                  <button
                    disabled={actionId === p.id}
                    onClick={() => handleDecision(p.id, false)}
                    className="flex-1 rounded-pill bg-red-500 px-3 py-1.5 text-xs font-semibold text-slate-50 disabled:opacity-60"
                  >
                    {actionId === p.id ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
