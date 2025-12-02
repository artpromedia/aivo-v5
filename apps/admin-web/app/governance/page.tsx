"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AivoApiClient } from "@aivo/api-client";
import type {
  GetTenantLimitsResponse,
  ListTenantUsageResponse,
  ListAuditLogsResponse,
  UpdateTenantLimitsRequest
} from "@aivo/api-client/src/governance-contracts";

type TenantLimits = GetTenantLimitsResponse["limits"];
type TenantUsage = ListTenantUsageResponse["usage"][number];
type AuditLogEntry = ListAuditLogsResponse["logs"][number];

type GovernanceClient = AivoApiClient & {
  getTenantLimits(tenantId: string): Promise<GetTenantLimitsResponse>;
  updateTenantLimits(
    tenantId: string,
    body: UpdateTenantLimitsRequest
  ): Promise<unknown>;
  listAuditLogs(tenantId: string): Promise<ListAuditLogsResponse>;
  listTenantUsage(tenantId: string): Promise<ListTenantUsageResponse>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const client = new AivoApiClient(API_BASE_URL, async () => null) as GovernanceClient;

const DEMO_TENANT_ID = "tenant-1";

export default function GovernancePage() {
  const [limits, setLimits] = useState<TenantLimits | null>(null);
  const [usage, setUsage] = useState<TenantUsage[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [maxDailyLlmCalls, setMaxDailyLlmCalls] = useState("");
  const [maxDailyTutorTurns, setMaxDailyTutorTurns] = useState("");
  const [allowedProviders, setAllowedProviders] = useState("");
  const [blockedProviders, setBlockedProviders] = useState("");
  const activeTenantId = limits?.tenantId ?? DEMO_TENANT_ID;

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [limitsRes, usageRes, logsRes] = await Promise.all([
        client.getTenantLimits(DEMO_TENANT_ID),
        client.listTenantUsage(DEMO_TENANT_ID),
        client.listAuditLogs(DEMO_TENANT_ID)
      ]);
      setLimits(limitsRes.limits);
      setUsage(usageRes.usage);
      setLogs(logsRes.logs);

      setMaxDailyLlmCalls(
        limitsRes.limits.maxDailyLlmCalls != null
          ? String(limitsRes.limits.maxDailyLlmCalls)
          : ""
      );
      setMaxDailyTutorTurns(
        limitsRes.limits.maxDailyTutorTurns != null
          ? String(limitsRes.limits.maxDailyTutorTurns)
          : ""
      );
      setAllowedProviders((limitsRes.limits.allowedProviders ?? []).join(","));
      setBlockedProviders((limitsRes.limits.blockedProviders ?? []).join(","));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function handleSaveLimits() {
    setSaving(true);
    setError(null);
    try {
      const allowed = allowedProviders
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);
      const blocked = blockedProviders
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);

      await client.updateTenantLimits(DEMO_TENANT_ID, {
        maxDailyLlmCalls: maxDailyLlmCalls ? Number(maxDailyLlmCalls) : null,
        maxDailyTutorTurns: maxDailyTutorTurns ? Number(maxDailyTutorTurns) : null,
        allowedProviders: allowed.length ? allowed : null,
        blockedProviders: blocked.length ? blocked : null
      });

      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const latestUsage = usage[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
      {/* Back Navigation */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-theme-primary hover:text-theme-primary-dark font-medium mb-6"
      >
        <span className="text-lg">←</span> Back to Console
      </Link>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-theme-primary-light to-theme-primary rounded-2xl flex items-center justify-center text-3xl">
              🔒
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Governance Dashboard</h1>
              <p className="text-slate-500 mt-1">
                Monitor usage, update AI guardrails, and review audit events
              </p>
              <p className="text-xs text-theme-primary font-mono mt-2">
                Managing: {activeTenantId}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="animate-spin text-4xl mb-3">🌟</div>
            <p className="text-slate-500">Loading governance data...</p>
          </div>
        )}

        {!loading && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Today's Usage */}
            <section className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📈</span>
                <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Usage</h2>
              </div>
              {latestUsage ? (
                <div className="space-y-3">
                  <div className="bg-theme-primary/5 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 uppercase mb-1">LLM Calls</p>
                    <p className="text-2xl font-bold text-theme-primary">{latestUsage.llmCalls}</p>
                  </div>
                  <div className="bg-theme-info/5 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 uppercase mb-1">Tutor Turns</p>
                    <p className="text-2xl font-bold text-sky-600">{latestUsage.tutorTurns}</p>
                  </div>
                  <div className="bg-mint-50 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 uppercase mb-1">Sessions Planned</p>
                    <p className="text-2xl font-bold text-emerald-600">{latestUsage.sessionsPlanned}</p>
                  </div>
                  <div className={`rounded-2xl p-4 ${latestUsage.safetyIncidents > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                    <p className="text-xs text-slate-500 uppercase mb-1">Safety Incidents</p>
                    <p className={`text-2xl font-bold ${latestUsage.safetyIncidents > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {latestUsage.safetyIncidents}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-lavender-50 rounded-2xl p-4 text-center">
                  <span className="text-3xl mb-2 block">📊</span>
                  <p className="text-slate-500 text-sm">
                    No usage data yet. Activity appears as learners work with AIVO.
                  </p>
                </div>
              )}
            </section>

            {/* Tenant Limits */}
            <section className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚙️</span>
                <h2 className="text-lg font-semibold text-slate-900">Tenant Limits</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Max Daily LLM Calls
                  </label>
                  <input
                    className="w-full rounded-xl bg-theme-background-elevated border border-theme-surface-border px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-theme-primary"
                    value={maxDailyLlmCalls}
                    onChange={(e) => setMaxDailyLlmCalls(e.target.value)}
                    placeholder="unlimited"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Max Daily Tutor Turns
                  </label>
                  <input
                    className="w-full rounded-xl bg-theme-background-elevated border border-theme-surface-border px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-theme-primary"
                    value={maxDailyTutorTurns}
                    onChange={(e) => setMaxDailyTutorTurns(e.target.value)}
                    placeholder="unlimited"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Allowed Providers
                  </label>
                  <input
                    className="w-full rounded-xl bg-theme-background-elevated border border-theme-surface-border px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-theme-primary"
                    value={allowedProviders}
                    onChange={(e) => setAllowedProviders(e.target.value)}
                    placeholder="openai,anthropic"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Blocked Providers
                  </label>
                  <input
                    className="w-full rounded-xl bg-theme-background-elevated border border-theme-surface-border px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-theme-primary"
                    value={blockedProviders}
                    onChange={(e) => setBlockedProviders(e.target.value)}
                    placeholder=""
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveLimits}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-theme-primary to-theme-primary-dark text-theme-primary-contrast font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
                >
                  {saving ? "Saving..." : "💾 Save Limits"}
                </button>
              </div>
            </section>

            {/* Audit Logs */}
            <section className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📋</span>
                <h2 className="text-lg font-semibold text-slate-900">Recent Events</h2>
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-3">
                {logs.length === 0 ? (
                  <div className="bg-lavender-50 rounded-2xl p-4 text-center">
                    <span className="text-3xl mb-2 block">📝</span>
                    <p className="text-slate-500 text-sm">No audit log entries yet</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="bg-theme-background-elevated rounded-xl p-4">
                      <p className="text-sm text-slate-900">{log.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full">
                          {log.type}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm py-4">
          💜 Responsible AI governance for neurodiverse education
        </div>
      </div>
    </main>
  );
}
