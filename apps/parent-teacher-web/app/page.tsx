"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AivoApiClient } from "@aivo/api-client";

type RoleView = "parent" | "teacher";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const client = new AivoApiClient(API_BASE_URL, async () => null);

export default function ParentTeacherPage() {
  const [role, setRole] = useState<RoleView>("parent");
  const [learnerLabel, setLearnerLabel] = useState<string>("Loading learner…");
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadMe = async () => {
      setLoading(true);
      try {
        const me = await client.me();
        if (cancelled) return;

        if (me.learner) {
          setLearnerLabel(me.learner.displayName);
          setLearnerId(me.learner.id);
        } else {
          setLearnerLabel("Demo learner");
          setLearnerId("demo-learner");
        }
      } catch (err) {
        if (!cancelled) {
          setLearnerLabel("Demo learner");
          setLearnerId("demo-learner");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadMe();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-4xl space-y-6">
        <header className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-coral to-amber-300 bg-clip-text text-transparent">
                {role === "parent" ? "Parent Dashboard" : "Teacher Dashboard"}
              </h1>
              <p className="text-sm text-slate-300 mt-2">
                {role === "parent"
                  ? "View your child's progress, approve difficulty changes, and coordinate with teachers."
                  : "Monitor learner progress, assign scaffolds, and coordinate with parents and administrators."}
              </p>
              {!loading && (
                <p className="text-xs text-slate-400 mt-2">
                  Primary learner: <span className="font-semibold text-slate-200">{learnerLabel}</span>
                </p>
              )}
            </div>
            <div
              className="inline-flex rounded-pill bg-slate-800 p-1"
              role="tablist"
              aria-label="Select dashboard role"
            >
              <button
                role="tab"
                aria-selected={role === "parent"}
                className={`px-4 py-2 text-xs font-semibold rounded-pill transition ${
                  role === "parent" ? "bg-coral text-white" : "text-slate-400 hover:text-slate-100"
                }`}
                onClick={() => setRole("parent")}
              >
                Parent
              </button>
              <button
                role="tab"
                aria-selected={role === "teacher"}
                className={`px-4 py-2 text-xs font-semibold rounded-pill transition ${
                  role === "teacher" ? "bg-coral text-white" : "text-slate-400 hover:text-slate-100"
                }`}
                onClick={() => setRole("teacher")}
              >
                Teacher
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <QuickActionCard
            title="Learner Overview"
            description={`View ${learnerLabel}'s subject levels, baseline summary, and recent session activity.`}
            href={learnerId ? `/learner?learnerId=${learnerId}` : "/learner"}
            buttonLabel="Open overview"
            icon="📊"
            disabled={loading}
          />
          <QuickActionCard
            title="Difficulty Approvals"
            description="Review and approve any pending requests to adjust learning difficulty."
            href={learnerId ? `/difficulty?learnerId=${learnerId}` : "/difficulty"}
            buttonLabel="Review approvals"
            icon="✅"
            disabled={loading}
          />
          <QuickActionCard
            title="Progress Reports"
            description="Coming soon: View detailed mastery trends and intervention insights."
            href="#"
            buttonLabel="Coming soon"
            icon="📈"
            disabled
          />
          <QuickActionCard
            title="Communication"
            description="Coming soon: Message teachers, admins, or request support."
            href="#"
            buttonLabel="Coming soon"
            icon="💬"
            disabled
          />
        </section>

        {role === "teacher" && (
          <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
            <h2 className="text-sm font-semibold">Teacher tools</h2>
            <p className="text-xs text-slate-300">
              Additional features for classroom management, IEP coordination, and parent communication will be available in future iterations.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  buttonLabel,
  icon,
  disabled
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  icon: string;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        </div>
      </div>
      {disabled ? (
        <button
          disabled
          className="w-full rounded-pill bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed"
        >
          {buttonLabel}
        </button>
      ) : (
        <Link
          href={href}
          className="block w-full rounded-pill bg-coral px-4 py-2 text-sm font-semibold text-white text-center hover:bg-coral/90 transition"
        >
          {buttonLabel}
        </Link>
      )}
    </div>
  );
}
