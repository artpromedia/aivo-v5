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
import {
  Building2,
  PauseCircle,
  Layers,
  Users,
  TrendingUp,
  Clock,
  Shield,
  Activity,
  FileText,
  AlertTriangle,
  Search,
  ChevronRight,
} from "lucide-react";
import { DashboardSkeleton } from "../../components/Skeletons";

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
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <section className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Tenant Observatory</h1>
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {tenantStats.total} organizations onboarded
            </span>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl">
            Use the governance APIs to understand which tenants consume the most AI minutes,
            whether guardrails are respected, and when policy changes last happened.
          </p>
        </header>

        {loading && <DashboardSkeleton />}
        {listError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{listError}</p>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Active tenants" value={tenantStats.active} helper="Enabled & live" icon={Building2} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
          <MetricCard label="Paused" value={tenantStats.inactive} helper="Need follow-up" icon={PauseCircle} iconBg="bg-amber-100" iconColor="text-amber-600" />
          <MetricCard
            label="Coverage"
            value={`${Object.keys(tenantStats.byType).length} types`}
            helper="district / clinic / network"
            icon={Layers}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">All Tenants</h2>
                <p className="text-sm text-slate-500">Click any row to inspect guardrails.</p>
              </div>
              <div className="flex gap-4 text-sm">
                {Object.entries(tenantStats.byType).map(([type, count]) => (
                  <span key={type} className="text-slate-600">
                    {type.replace(/_/g, " ")}: <span className="text-slate-900 font-semibold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="py-3 font-medium">Tenant</th>
                    <th className="py-3 font-medium">Type</th>
                    <th className="py-3 font-medium">Region</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((tenant) => {
                    const isSelected = tenant.id === selectedTenantId;
                    return (
                      <tr
                        key={tenant.id}
                        className={`${isSelected ? "bg-violet-50 border-l-2 border-violet-500" : "hover:bg-slate-50"} cursor-pointer transition-colors`}
                        onClick={() => setSelectedTenantId(tenant.id)}
                      >
                        <td className="py-3">
                          <p className="text-slate-900 font-medium">{tenant.name}</p>
                          <p className="text-xs text-slate-400">{tenant.id}</p>
                        </td>
                        <td className="py-3 text-slate-600">{tenant.type.replace(/_/g, " ")}</td>
                        <td className="py-3 text-slate-600">{tenant.region}</td>
                        <td className="py-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              tenant.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {tenant.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!loading && tenants.length === 0 && !listError && (
              <p className="text-sm text-slate-500">No tenants found.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Selected Tenant</h2>
              {selectedTenant && (
                <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">
                  {selectedTenant.id}
                </span>
              )}
            </div>

            {detailLoading && <p className="text-sm text-slate-500">Loading detail…</p>}
            {detailError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{detailError}</p>
              </div>
            )}

            {tenantDetail && selectedTenant && !detailLoading && !detailError && (
              <div className="space-y-5">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-base font-semibold text-slate-900">{tenantDetail.tenant.name}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {tenantDetail.tenant.type.replace(/_/g, " ")} • {tenantDetail.tenant.region}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Providers: <span className="font-medium text-slate-700">{tenantDetail.config.allowedProviders.join(", ") || "default"}</span>
                  </p>
                </div>

                {analytics && (
                  <div className="grid gap-3">
                    <UsageStat label="Learners" value={analytics.learnersCount} icon={Users} />
                    <UsageStat
                      label="Avg mastery"
                      value={analytics.avgMasteryScore}
                      suffix="%"
                      precision={1}
                      icon={TrendingUp}
                    />
                    <UsageStat label="Avg minutes" value={analytics.avgMinutesPracticed} suffix=" min" icon={Clock} />
                  </div>
                )}

                {limits && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-violet-600" /> Guardrails
                    </h3>
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
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-violet-600" /> Usage Trend
                  </h3>
                  {usage.length === 0 ? (
                    <p className="text-sm text-slate-500">No usage captured.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {usage.map((day) => (
                        <li key={day.date} className="flex justify-between items-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <span className="text-slate-700">{day.date}</span>
                          <span className="text-xs text-slate-500">
                            {day.llmCalls} calls • {day.tutorTurns} turns • {day.safetyIncidents} incidents
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-violet-600" /> Recent Audit Events
                  </h3>
                  {auditLogs.length === 0 ? (
                    <p className="text-sm text-slate-500">No governance events.</p>
                  ) : (
                    <ul className="space-y-3 text-sm">
                      {auditLogs.map((log) => (
                        <li key={log.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold text-slate-800">{log.type}</span>
                            <span className="text-xs text-slate-400">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-600">{log.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {!selectedTenant && !loading && (
              <p className="text-sm text-slate-500">Select a tenant to view detail.</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number | string;
  helper?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md hover:border-violet-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {helper && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
    </div>
  );
}

function UsageStat({
  label,
  value,
  suffix = "",
  precision,
  icon: Icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  precision?: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const formatted =
    typeof precision === "number"
      ? Number(value).toFixed(precision)
      : numberFormatter.format(Math.round(value));
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
      {Icon && (
        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-violet-600" />
        </div>
      )}
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900">
          {formatted}
          {suffix}
        </p>
      </div>
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
      <p className="text-sm text-slate-600 mb-1">
        {label} – <span className="font-semibold text-slate-800">{numberFormatter.format(used)}</span> {limit ? `/ ${numberFormatter.format(limit)}` : "(no limit)"}
      </p>
      <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct !== null && pct > 90 ? "bg-amber-500" : "bg-violet-500"}`}
          style={{ width: `${pct ?? 15}%` }}
        />
      </div>
    </div>
  );
}
