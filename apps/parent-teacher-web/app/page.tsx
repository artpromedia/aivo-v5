"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AivoApiClient } from "@aivo/api-client";

type RoleView = "parent" | "teacher";

const client = new AivoApiClient(
  typeof window === "undefined" ? "http://localhost:4000" : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000",
);

export default function ParentTeacherPage() {
  const [role, setRole] = useState<RoleView>("parent");
  const [learnerLabel, setLearnerLabel] = useState<string>("Loading learner…");

  useEffect(() => {
    let cancelled = false;

    const loadMe = async () => {
      try {
        const me = await client.me();
        if (cancelled) return;

        if (me.learner) {
          setLearnerLabel(`${me.learner.displayName} (${me.learner.id})`);
        } else {
          // Fallback to a simple user label derived from the auth token payload
          setLearnerLabel(me.userId);
        }
      } catch (err) {
        if (!cancelled) {
          setLearnerLabel("Alex (demo-learner)");
        }
      }
    };

    loadMe();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-3xl rounded-2xl bg-slate-900/80 p-6 shadow-soft-coral space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold">
              {role === "parent" ? "Parent Dashboard" : "Teacher Dashboard"}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Viewing learner: <span className="font-semibold">{learnerLabel}</span>
            </p>
          </div>
          <div
            className="inline-flex rounded-pill bg-slate-800 p-1"
            role="tablist"
            aria-label="Select dashboard role"
          >
            <button
              role="tab"
              aria-selected={role === "parent"}
              className={`px-3 py-1 text-xs font-semibold rounded-pill transition ${
                role === "parent" ? "bg-coral text-white" : "text-slate-400 hover:text-slate-100"
              }`}
              onClick={() => setRole("parent")}
            >
              Parent
            </button>
            <button
              role="tab"
              aria-selected={role === "teacher"}
              className={`px-3 py-1 text-xs font-semibold rounded-pill transition ${
                role === "teacher" ? "bg-coral text-white" : "text-slate-400 hover:text-slate-100"
              }`}
              onClick={() => setRole("teacher")}
            >
              Teacher
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {role === "parent" ? (
            <p className="text-sm text-slate-200">
              As a parent, you can view your child&apos;s progress, approve difficulty increases,
              and adjust accommodations.
            </p>
          ) : (
            <p className="text-sm text-slate-200">
              As a teacher, you can monitor your learners, assign scaffolds, and coordinate with
              parents and admins.
            </p>
          )}

          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-slate-950/70 border border-slate-800 p-4">
            <div>
              <p className="text-xs font-semibold text-slate-200">Learner overview</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Jump into a calm summary of {learnerLabel}&apos;s levels, baseline, and any pending
                difficulty approvals.
              </p>
            </div>
            <Link
              href={{
                pathname: "/learner",
                query: { learnerId: learnerLabel.match(/\((.+)\)$/)?.[1] ?? undefined },
              }}
              className="inline-flex items-center justify-center rounded-pill bg-coral px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/80"
            >
              Open learner overview
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
