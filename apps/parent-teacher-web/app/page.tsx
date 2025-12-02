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
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{role === "parent" ? "👨‍👩‍👧" : "👩‍🏫"}</span>
                <h1 className="text-2xl font-bold text-slate-900">
                  {role === "parent" ? "Parent Dashboard" : "Teacher Dashboard"}
                </h1>
              </div>
              <p className="text-slate-600 max-w-lg">
                {role === "parent"
                  ? "View your child's progress, approve difficulty changes, and stay connected with their learning journey."
                  : "Monitor learner progress, assign scaffolds, and coordinate with parents and administrators."}
              </p>
              {!loading && (
                <div className="mt-3 inline-flex items-center gap-2 bg-lavender-100 text-theme-primary px-3 py-1.5 rounded-full text-sm">
                  <span>👧</span>
                  <span className="font-medium">{learnerLabel}</span>
                </div>
              )}
            </div>
            
            {/* Role Toggle */}
            <div
              className="inline-flex rounded-full bg-lavender-100 p-1"
              role="tablist"
              aria-label="Select dashboard role"
            >
              <button
                role="tab"
                aria-selected={role === "parent"}
                className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all ${
                  role === "parent" 
                    ? "bg-theme-primary text-white shadow-lg" 
                    : "text-slate-600 hover:text-theme-primary"
                }`}
                onClick={() => setRole("parent")}
              >
                🏠 Parent
              </button>
              <button
                role="tab"
                aria-selected={role === "teacher"}
                className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all ${
                  role === "teacher" 
                    ? "bg-theme-primary text-white shadow-lg" 
                    : "text-slate-600 hover:text-theme-primary"
                }`}
                onClick={() => setRole("teacher")}
              >
                📚 Teacher
              </button>
            </div>
          </div>
        </header>

        {/* Quick Actions Grid */}
        <section className="grid gap-4 md:grid-cols-2">
          <QuickActionCard
            title="Learner Overview"
            description={`View ${learnerLabel}'s subject levels, baseline summary, and recent session activity.`}
            href={learnerId ? `/learner?learnerId=${learnerId}` : "/learner"}
            buttonLabel="Open Overview"
            icon="📊"
            color="violet"
            disabled={loading}
          />
          <QuickActionCard
            title="Difficulty Approvals"
            description="Review and approve any pending requests to adjust learning difficulty."
            href={learnerId ? `/difficulty?learnerId=${learnerId}` : "/difficulty"}
            buttonLabel="Review Approvals"
            icon="✅"
            color="mint"
            disabled={loading}
          />
          <QuickActionCard
            title="Progress Reports"
            description="Coming soon: View detailed mastery trends and intervention insights."
            href="#"
            buttonLabel="Coming Soon"
            icon="📈"
            color="sky"
            disabled
          />
          <QuickActionCard
            title="Communication"
            description="Coming soon: Message teachers, admins, or request support."
            href="#"
            buttonLabel="Coming Soon"
            icon="💬"
            color="sunshine"
            disabled
          />
        </section>

        {/* Teacher Tools Section */}
        {role === "teacher" && (
          <section className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🛠️</span>
              <h2 className="text-lg font-semibold text-slate-900">Teacher Tools</h2>
            </div>
            <p className="text-slate-600 text-sm">
              Additional features for classroom management, IEP coordination, and parent communication will be available in future iterations.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-lavender-100 text-theme-primary rounded-full text-xs font-medium">
                📋 IEP Tracking
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                👥 Class Overview
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-mint-100 text-emerald-700 rounded-full text-xs font-medium">
                📧 Parent Messages
              </span>
            </div>
          </section>
        )}

        {/* Encouragement Banner */}
        <div className="bg-gradient-to-r from-theme-primary to-theme-primary rounded-3xl p-6 text-white text-center">
          <div className="text-3xl mb-2">🌟</div>
          <p className="font-medium">
            Thank you for supporting your learner&apos;s journey!
          </p>
          <p className="text-white/80 text-sm mt-1">
            Together, we&apos;re making learning joyful and accessible.
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center text-slate-400 text-sm py-4">
          <p>AIVO Parent & Teacher Dashboard • Built with 💜 for neurodiverse learners</p>
        </footer>
      </div>
    </main>
  );
}

const colorClasses = {
  violet: {
    bg: "bg-lavender-100",
    icon: "bg-theme-primary/10 text-theme-primary",
    button: "bg-theme-primary hover:bg-theme-primary"
  },
  mint: {
    bg: "bg-mint-50",
    icon: "bg-emerald-100 text-emerald-600",
    button: "bg-emerald-500 hover:bg-emerald-600"
  },
  sky: {
    bg: "bg-sky-50",
    icon: "bg-sky-100 text-sky-600",
    button: "bg-sky-500 hover:bg-sky-600"
  },
  sunshine: {
    bg: "bg-sunshine-50",
    icon: "bg-amber-100 text-amber-600",
    button: "bg-amber-500 hover:bg-amber-600"
  }
};

function QuickActionCard({
  title,
  description,
  href,
  buttonLabel,
  icon,
  color,
  disabled
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  icon: string;
  color: keyof typeof colorClasses;
  disabled?: boolean;
}) {
  const colors = colorClasses[color];
  
  return (
    <div className={`rounded-3xl bg-white shadow-lg p-6 transition-all hover:shadow-xl ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${colors.icon}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>
      {disabled ? (
        <button
          disabled
          className="mt-4 w-full py-3 rounded-2xl bg-slate-200 text-slate-400 font-medium cursor-not-allowed"
        >
          {buttonLabel}
        </button>
      ) : (
        <Link
          href={href}
          className={`mt-4 block w-full py-3 rounded-2xl text-white font-medium text-center transition-all shadow-lg ${colors.button}`}
        >
          {buttonLabel} →
        </Link>
      )}
    </div>
  );
}
