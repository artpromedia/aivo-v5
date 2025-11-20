"use client";

import { useEffect, useState } from "react";
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

// TODO: derive this from /me once auth wiring is complete
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
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <section className="max-w-6xl mx-auto space-y-6">
        <header>
          <p className="text-xs uppercase tracking-wide text-slate-500">Operations</p>
          <h1 className="text-3xl font-semibold text-white">Governance dashboard</h1>
          <p className="text-sm text-slate-400">
            Monitor tenant usage, update AI guardrails, and review audit events in one calm view.
          </p>
          <p className="mt-2 text-xs font-mono text-slate-500">
            Managing policies for tenant: <span className="text-slate-200">{activeTenantId}</span>
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-700 bg-red-900/40 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {loading && <p className="text-xs text-slate-400">Loading governance data…</p>}

        <div className="grid gap-4 md:grid-cols-[1.4fr_1.4fr_1.2fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-semibold text-white">Today&apos;s usage</h2>
            {latestUsage ? (
              <ul className="mt-3 space-y-1 text-sm text-slate-200">
                <li>LLM calls: {latestUsage.llmCalls}</li>
                <li>Tutor turns: {latestUsage.tutorTurns}</li>
                <li>Sessions planned: {latestUsage.sessionsPlanned}</li>
                <li>Safety incidents: {latestUsage.safetyIncidents}</li>
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                No usage data yet. Activity appears as learners work with AIVO.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-semibold text-white">Tenant limits</h2>
            <div className="mt-3 space-y-3 text-sm">
              <label className="block">
                <span className="text-xs uppercase text-slate-400">Max daily LLM calls</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  value={maxDailyLlmCalls}
                  onChange={(event) => setMaxDailyLlmCalls(event.target.value)}
                  placeholder="unlimited"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase text-slate-400">Max daily tutor turns</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  value={maxDailyTutorTurns}
                  onChange={(event) => setMaxDailyTutorTurns(event.target.value)}
                  placeholder="unlimited"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase text-slate-400">Allowed providers</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  value={allowedProviders}
                  onChange={(event) => setAllowedProviders(event.target.value)}
                  placeholder="openai,anthropic"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase text-slate-400">Blocked providers</span>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                  value={blockedProviders}
                  onChange={(event) => setBlockedProviders(event.target.value)}
                  placeholder=""
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveLimits}
                  disabled={saving}
                  className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save limits"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-semibold text-white">Recent governance events</h2>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm text-slate-200">
              {logs.length === 0 ? (
                <p className="text-slate-400">No audit log entries yet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border-b border-slate-800 pb-2 last:border-none last:pb-0">
                    <p>{log.message}</p>
                    <p className="text-xs text-slate-500">
                      {log.type} • {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
