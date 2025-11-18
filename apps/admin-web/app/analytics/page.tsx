"use client";

import { useEffect, useState } from "react";
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
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-4xl rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Program Health</h1>
            <p className="text-xs text-slate-300 mt-1">
              Quick snapshot of how AIVO is being used across your tenant.
            </p>
          </div>
        </header>

        {loading && <p className="text-xs text-slate-400">Loading analytics…</p>}
        {error && <p className="text-xs text-red-400">Error: {error}</p>}

        {data && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4">
              <p className="text-[11px] text-slate-400">Active learners</p>
              <p className="text-2xl font-semibold mt-1">{data.learnersCount}</p>
            </div>
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4">
              <p className="text-[11px] text-slate-400">Avg minutes practiced</p>
              <p className="text-2xl font-semibold mt-1">
                {data.avgMinutesPracticed.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4">
              <p className="text-[11px] text-slate-400">Avg mastery</p>
              <p className="text-2xl font-semibold mt-1">
                {(data.avgMasteryScore * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}

        {!loading && !error && !data && (
          <p className="text-xs text-slate-400">
            No analytics data available yet. Once learners start practicing, you&apos;ll see a summary here.
          </p>
        )}
      </section>
    </main>
  );
}
