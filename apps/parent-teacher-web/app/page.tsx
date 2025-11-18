"use client";

import { useState } from "react";

type RoleView = "parent" | "teacher";

export default function ParentTeacherPage() {
  const [role, setRole] = useState<RoleView>("parent");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-3xl rounded-2xl bg-slate-900/80 p-6 shadow-soft-coral">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-xl font-semibold">
            {role === "parent" ? "Parent Dashboard" : "Teacher Dashboard"}
          </h1>
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
        <div className="mt-6 space-y-4">
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
        </div>
      </section>
    </main>
  );
}
