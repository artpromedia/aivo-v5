"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AivoApiClient } from "@aivo/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const DEMO_TENANT_ID = "tenant-1";

const client = new AivoApiClient(API_BASE_URL, async () => null);

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    tenantId: string;
    learnersCount: number;
    avgMinutesPracticed: number;
    avgMasteryScore: number;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    client
      .getTenantAnalytics(DEMO_TENANT_ID)
      .then((res) => setData(res))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
      {/* Back Navigation */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-theme-primary hover:text-theme-primary-dark font-medium mb-6"
      >
        <span className="text-lg">←</span> Back to Console
      </Link>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-theme-primary-light to-theme-primary rounded-2xl flex items-center justify-center text-3xl">
              📊
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Program Health</h1>
              <p className="text-slate-500 mt-1">
                Quick snapshot of how AIVO is being used across your organization
              </p>
            </div>
          </div>
        </header>

        {loading && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="animate-spin text-4xl mb-3">🌟</div>
            <p className="text-slate-500">Loading analytics...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Main Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-12 h-12 bg-theme-primary/10 rounded-xl flex items-center justify-center text-2xl">👧</span>
                </div>
                <p className="text-4xl font-bold text-slate-900">{data.learnersCount}</p>
                <p className="text-slate-500 mt-1">Active Learners</p>
              </div>
              
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center text-2xl">⏱️</span>
                </div>
                <p className="text-4xl font-bold text-slate-900">{data.avgMinutesPracticed.toFixed(1)}</p>
                <p className="text-slate-500 mt-1">Avg Minutes Practiced</p>
              </div>
              
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">🎯</span>
                </div>
                <p className="text-4xl font-bold text-emerald-600">{(data.avgMasteryScore * 100).toFixed(0)}%</p>
                <p className="text-slate-500 mt-1">Avg Mastery Score</p>
              </div>
            </div>

            {/* Insights Card */}
            <section className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💡</span>
                <h2 className="text-lg font-semibold text-slate-900">Insights</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-lavender-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📈</span>
                    <span className="font-medium text-slate-900">Growth Opportunity</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Consider increasing practice time goals to boost mastery scores. Learners with 20+ minutes daily show 15% higher mastery.
                  </p>
                </div>
                <div className="bg-mint-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🌟</span>
                    <span className="font-medium text-slate-900">Celebration</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Your learners are making great progress! The average mastery score indicates strong engagement with the curriculum.
                  </p>
                </div>
              </div>
            </section>

            {/* Coming Soon */}
            <section className="bg-gradient-to-r from-theme-primary to-theme-primary-dark rounded-3xl p-6 text-theme-primary-contrast text-center">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="font-semibold mb-1">More Analytics Coming Soon</h3>
              <p className="text-theme-primary-contrast/80 text-sm">
                Subject breakdowns, intervention tracking, and trend analysis are on the way!
              </p>
            </section>
          </>
        )}

        {!loading && !error && !data && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <span className="text-5xl mb-4 block">📊</span>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Data Yet</h3>
            <p className="text-slate-500">
              Once learners start practicing, you&apos;ll see a summary here
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm py-4">
          💜 Data-driven insights for better learning outcomes
        </div>
      </div>
    </main>
  );
}
