"use client";

import { useEffect, useMemo, useState } from "react";
import { AivoApiClient } from "@aivo/api-client";
import type {
  AuditLogEntry,
  Tenant,
  TenantConfig,
  TenantLimits,
  TenantType,
  TenantUsage
} from "@aivo/types";

const client = new AivoApiClient("http://localhost:4000", async () => null);
const numberFormatter = new Intl.NumberFormat("en-US");

type TenantDetail = {
  tenant: Tenant;
  config: TenantConfig;
};

type TenantAnalyticsSummary = Awaited<ReturnType<typeof client.getTenantAnalytics>>;

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [tenantDetail, setTenantDetail] = useState<TenantDetail | null>(null);
  const [limits, setLimits] = useState<TenantLimits | null>(null);
  const [usage, setUsage] = useState<TenantUsage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [analytics, setAnalytics] = useState<TenantAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenants() {
      setLoading(true);
      setListError(null);
      try {
        const res = await client.listTenants();
        setTenants(res.tenants);
        setSelectedTenantId((prev) => prev ?? res.tenants[0]?.id ?? null);
      } catch (e) {
        setListError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void loadTenants();
  }, []);

  useEffect(() => {
    if (!selectedTenantId) {
      return;
    }

    async function loadTenantDetail(id: string) {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const [configRes, limitsRes, usageRes, auditRes, analyticsRes] = await Promise.all([
          client.getTenantConfig(id),
          client.getTenantLimits(id),
          client.listTenantUsage(id),
          client.listAuditLogs(id),
          client.getTenantAnalytics(id)
        ]);

        setTenantDetail(configRes);
        setLimits(limitsRes.limits);
        setUsage(usageRes.usage.slice(-10));
        setAuditLogs(auditRes.logs.slice(0, 6));
        setAnalytics(analyticsRes);
      } catch (e) {
        setDetailError((e as Error).message);
      } finally {
        setDetailLoading(false);
      }
    }

    void loadTenantDetail(selectedTenantId);
  }, [selectedTenantId]);

  const tenantStats = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter((t) => t.isActive).length;
    const inactive = total - active;
    const byType = tenants.reduce<Record<TenantType, number>>((acc, tenant) => {
      acc[tenant.type] = (acc[tenant.type] ?? 0) + 1;
      return acc;
    }, {} as Record<TenantType, number>);

    return { total, active, inactive, byType };
  }, [tenants]);

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) ?? null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <section className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">Platform Admin – Tenant Observatory</h1>
            <span className="text-[11px] text-slate-400">
              {tenantStats.total} organizations onboarded
            </span>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl">
            Use the governance APIs to understand which tenants consume the most AI minutes,
            whether guardrails are respected, and when policy changes last happened.
          </p>
        </header>

        {loading && <p className="text-sm text-slate-400">Loading tenants…</p>}
        {listError && <p className="text-sm text-red-400">{listError}</p>}

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Active tenants" value={tenantStats.active} helper="Enabled & live" />
          <MetricCard label="Paused" value={tenantStats.inactive} helper="Need follow-up" />
          <MetricCard
            label="Coverage"
            value={`${Object.keys(tenantStats.byType).length} types`}
            helper="district / clinic / network"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">All tenants</h2>
                <p className="text-xs text-slate-400">Click any row to inspect guardrails.</p>
              </div>
              <div className="flex gap-3 text-[11px] text-slate-400">
                {Object.entries(tenantStats.byType).map(([type, count]) => (
                  <span key={type}>
                    {type.replace(/_/g, " ")}: <span className="text-slate-200 font-semibold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400">
                    <th className="py-2">Tenant</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Region</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {tenants.map((tenant) => {
                    const isSelected = tenant.id === selectedTenantId;
                    return (
                      <tr
                        key={tenant.id}
                        className={`${isSelected ? "bg-slate-800/60" : "hover:bg-slate-900/60"} cursor-pointer`}
                        onClick={() => setSelectedTenantId(tenant.id)}
                      >
                        <td className="py-2">
                          <p className="text-slate-100 font-medium">{tenant.name}</p>
                          <p className="text-[10px] text-slate-500">{tenant.id}</p>
                        </td>
                        <td className="py-2 text-slate-300">{tenant.type.replace(/_/g, " ")}</td>
                        <td className="py-2 text-slate-300">{tenant.region}</td>
                        <td className="py-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                              tenant.isActive
                                ? "bg-emerald-500/20 text-emerald-200"
                                : "bg-slate-600/40 text-slate-200"
                            }`}
                          >
                            {tenant.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="py-2 text-slate-300">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!loading && tenants.length === 0 && !listError && (
              <p className="text-xs text-slate-400">No tenants found.</p>
            )}
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Selected tenant</h2>
              {selectedTenant && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedTenant.id}
                </span>
              )}
            </div>

            {detailLoading && <p className="text-xs text-slate-400">Loading detail…</p>}
            {detailError && <p className="text-xs text-red-400">{detailError}</p>}

            {tenantDetail && selectedTenant && !detailLoading && !detailError && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{tenantDetail.tenant.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {tenantDetail.tenant.type.replace(/_/g, " ")} • {tenantDetail.tenant.region}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Providers: {tenantDetail.config.allowedProviders.join(", ") || "default"}
                  </p>
                </div>

                {analytics && (
                  <div className="grid gap-3">
                    <UsageStat label="Learners" value={analytics.learnersCount} />
                    <UsageStat
                      label="Avg mastery"
                      value={analytics.avgMasteryScore}
                      suffix="%"
                      precision={1}
                    />
                    <UsageStat label="Avg minutes" value={analytics.avgMinutesPracticed} suffix=" min" />
                  </div>
                )}

                {limits && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-slate-300">Guardrails</h3>
                    <LimitBar
                      label="Daily LLM calls"
                      used={usage.length > 0 ? usage[usage.length - 1].llmCalls : 0}
                      limit={limits.maxDailyLlmCalls}
                    />
                    <LimitBar
                      label="Tutor turns"
                      used={usage.length > 0 ? usage[usage.length - 1].tutorTurns : 0}
                      limit={limits.maxDailyTutorTurns}
                    />
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold text-slate-300 mb-2">Usage trend</h3>
                  {usage.length === 0 ? (
                    <p className="text-xs text-slate-400">No usage captured.</p>
                  ) : (
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {usage.map((day) => (
                        <li key={day.date} className="flex justify-between">
                          <span>{day.date}</span>
                          <span>
                            {day.llmCalls} calls • {day.tutorTurns} turns • {day.safetyIncidents} incidents
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-300 mb-2">Recent audit events</h3>
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-400">No governance events.</p>
                  ) : (
                    <ul className="space-y-2 text-[11px] text-slate-300">
                      {auditLogs.map((log) => (
                        <li key={log.id}>
                          <div className="flex justify-between">
                            <span className="font-semibold">{log.type}</span>
                            <span className="text-slate-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-400">{log.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {!selectedTenant && !loading && (
              <p className="text-xs text-slate-400">Select a tenant to view detail.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: number | string; helper?: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-slate-50 mt-1">{value}</p>
      {helper && <p className="text-[11px] text-slate-500 mt-1">{helper}</p>}
    </div>
  );
}

function UsageStat({
  label,
  value,
  suffix = "",
  precision
}: {
  label: string;
  value: number;
  suffix?: string;
  precision?: number;
}) {
  const formatted =
    typeof precision === "number"
      ? Number(value).toFixed(precision)
      : numberFormatter.format(Math.round(value));
  return (
    <div>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-slate-100">
        {formatted}
        {suffix}
      </p>
    </div>
  );
}

function LimitBar({
  label,
  used,
  limit
}: {
  label: string;
  used: number;
  limit?: number;
}) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : null;
  return (
    <div>
      <p className="text-[11px] text-slate-400">
        {label} – {numberFormatter.format(used)} {limit ? `/ ${numberFormatter.format(limit)}` : "(no limit)"}
      </p>
      <div className="h-2 mt-1 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${pct !== null && pct > 90 ? "bg-amber-400" : "bg-emerald-400"}`}
          style={{ width: `${pct ?? 15}%` }}
        />
      </div>
    </div>
  );
}
