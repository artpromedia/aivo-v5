"use client";

import { useEffect, useMemo, useState } from "react";
import { AivoApiClient } from "@aivo/api-client";
import type {
  AuditLogEntry,
  District,
  Role,
  RoleAssignment,
  School,
  Tenant,
  TenantConfig,
  TenantLimits,
  TenantUsage
} from "@aivo/types";

const client = new AivoApiClient("http://localhost:4000", async () => null);

const CURRENT_TENANT_ID = "tenant-1";

type TenantWithConfig = {
  tenant: Tenant;
  config: TenantConfig;
};

type TenantAnalyticsSummary = Awaited<ReturnType<typeof client.getTenantAnalytics>>;

type UsageSummary = {
  window: TenantUsage[];
  latest?: TenantUsage;
  totals: {
    llmCalls: number;
    tutorTurns: number;
    sessionsPlanned: number;
    safetyIncidents: number;
  };
  llmLimitPct?: number;
  tutorLimitPct?: number;
};

const numberFormatter = new Intl.NumberFormat("en-US");

export default function DistrictAdminTenantPage() {
  const [tenantInfo, setTenantInfo] = useState<TenantWithConfig | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [limits, setLimits] = useState<TenantLimits | null>(null);
  const [usage, setUsage] = useState<TenantUsage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [analytics, setAnalytics] = useState<TenantAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [
        tenantRes,
        districtRes,
        schoolRes,
        limitsRes,
        usageRes,
        auditRes,
        roleRes,
        analyticsRes
      ] = await Promise.all([
        client.getTenantConfig(CURRENT_TENANT_ID),
        client.listDistricts(CURRENT_TENANT_ID),
        client.listSchools(CURRENT_TENANT_ID),
        client.getTenantLimits(CURRENT_TENANT_ID),
        client.listTenantUsage(CURRENT_TENANT_ID),
        client.listAuditLogs(CURRENT_TENANT_ID),
        client.listRoleAssignments(CURRENT_TENANT_ID),
        client.getTenantAnalytics(CURRENT_TENANT_ID)
      ]);

      setTenantInfo(tenantRes);
      setDistricts(districtRes.districts);
      setSchools(schoolRes.schools);
      setLimits(limitsRes.limits);
      setUsage(usageRes.usage);
      setAuditLogs(auditRes.logs.slice(0, 5));
      setRoleAssignments(roleRes.assignments);
      setAnalytics(analyticsRes);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const usageSummary: UsageSummary = useMemo(() => {
    if (usage.length === 0) {
      return {
        window: [],
        totals: { llmCalls: 0, tutorTurns: 0, sessionsPlanned: 0, safetyIncidents: 0 }
      };
    }

    const sorted = [...usage].sort((a, b) => a.date.localeCompare(b.date));
    const window = sorted.slice(-7);
    const totals = window.reduce(
      (acc, day) => ({
        llmCalls: acc.llmCalls + day.llmCalls,
        tutorTurns: acc.tutorTurns + day.tutorTurns,
        sessionsPlanned: acc.sessionsPlanned + day.sessionsPlanned,
        safetyIncidents: acc.safetyIncidents + day.safetyIncidents
      }),
      { llmCalls: 0, tutorTurns: 0, sessionsPlanned: 0, safetyIncidents: 0 }
    );
    const latest = sorted.length > 0 ? sorted[sorted.length - 1] : undefined;

    const llmLimitPct =
      latest && limits?.maxDailyLlmCalls
        ? Math.min(200, Math.round((latest.llmCalls / limits.maxDailyLlmCalls) * 100))
        : undefined;
    const tutorLimitPct =
      latest && limits?.maxDailyTutorTurns
        ? Math.min(200, Math.round((latest.tutorTurns / limits.maxDailyTutorTurns) * 100))
        : undefined;

    return { window, totals, latest, llmLimitPct, tutorLimitPct };
  }, [usage, limits]);

  const schoolsByDistrict = useMemo(() => {
    const map = new Map<string, number>();
    for (const school of schools) {
      const districtId = school.districtId ?? "unassigned";
      map.set(districtId, (map.get(districtId) ?? 0) + 1);
    }
    return map;
  }, [schools]);

  const roleSummary = useMemo(() => {
    const counts = roleAssignments.reduce<Record<Role, number>>((acc, assignment) => {
      acc[assignment.role] = (acc[assignment.role] ?? 0) + 1;
      return acc;
    }, {} as Record<Role, number>);

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [roleAssignments]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <section className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">District Admin – Command Center</h1>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-800 text-slate-200">
              Tenant {CURRENT_TENANT_ID}
            </span>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl">
            Monitor curriculum coverage, governance guardrails, and daily usage signals across
            your district&apos;s schools. All data is sourced from the governance APIs already running
            in the platform.
          </p>
        </div>

        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {error && <p className="text-sm text-red-400">Error: {error}</p>}

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Learners"
            value={analytics ? numberFormatter.format(analytics.learnersCount) : "—"}
            helper="Enrolled learners"
          />
          <MetricCard
            label="Avg mastery"
            value={analytics ? `${analytics.avgMasteryScore.toFixed(1)}%` : "—"}
            helper="Rolling 30-day"
          />
          <MetricCard
            label="Daily minutes"
            value={analytics ? `${analytics.avgMinutesPracticed.toFixed(0)} min` : "—"}
            helper="Average per learner"
          />
        </section>

        {tenantInfo && (
          <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  {tenantInfo.tenant.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Region: {tenantInfo.tenant.region} • Type: {tenantInfo.tenant.type}
                </p>
              </div>
              <div className="flex gap-6 text-xs text-slate-300">
                <div>
                  <p className="font-semibold">Curricula</p>
                  <p>{tenantInfo.config.curricula.length}</p>
                </div>
                <div>
                  <p className="font-semibold">Providers</p>
                  <p>{tenantInfo.config.allowedProviders.join(", ") || "default"}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-300 mb-1">Active Curricula</h3>
                <ul className="space-y-1">
                  {tenantInfo.config.curricula.map((c) => (
                    <li key={c.id} className="text-xs text-slate-300">
                      <span className="font-medium">{c.label}</span> – {c.region} ({c.standard})
                    </li>
                  ))}
                </ul>
              </div>
              {limits && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-300 mb-2">Guardrails</h3>
                  <LimitBar
                    label="Daily LLM calls"
                    used={usageSummary.latest?.llmCalls ?? 0}
                    limit={limits.maxDailyLlmCalls}
                  />
                  <LimitBar
                    label="Tutor turns"
                    used={usageSummary.latest?.tutorTurns ?? 0}
                    limit={limits.maxDailyTutorTurns}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Usage pulse (7d)</h2>
              <span className="text-[10px] text-slate-400">
                Last day: {usageSummary.latest?.date ?? "—"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <UsageStat
                label="LLM calls"
                value={usageSummary.totals.llmCalls}
                limitPct={usageSummary.llmLimitPct}
              />
              <UsageStat
                label="Tutor turns"
                value={usageSummary.totals.tutorTurns}
                limitPct={usageSummary.tutorLimitPct}
              />
              <UsageStat label="Sessions planned" value={usageSummary.totals.sessionsPlanned} />
              <UsageStat label="Safety incidents" value={usageSummary.totals.safetyIncidents} />
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1">
              {usageSummary.window.map((day) => (
                <li key={day.date} className="flex justify-between">
                  <span>{day.date}</span>
                  <span>
                    {day.llmCalls} calls • {day.tutorTurns} turns • {day.safetyIncidents} incidents
                  </span>
                </li>
              ))}
              {usageSummary.window.length === 0 && (
                <li className="text-slate-500">No usage data recorded yet.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Role coverage</h2>
            {roleSummary.length === 0 ? (
              <p className="text-xs text-slate-400">No role assignments yet.</p>
            ) : (
              <ul className="space-y-2">
                {roleSummary.map(([role, count]) => (
                  <li key={role} className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-medium">{role}</span>
                    <span>{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                Districts <span className="text-xs text-slate-400">({districts.length})</span>
              </h2>
              <span className="text-[10px] text-slate-400">
                {schools.length} schools total
              </span>
            </div>
            {districts.length === 0 && (
              <p className="text-xs text-slate-400">No districts configured.</p>
            )}
            <ul className="space-y-2">
              {districts.map((d) => (
                <li key={d.id} className="text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-[11px] text-slate-500">{d.country}</p>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {schoolsByDistrict.get(d.id) ?? 0} schools
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
            <h2 className="text-sm font-semibold mb-3">Latest governance activity</h2>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400">No audit events captured.</p>
            ) : (
              <ul className="space-y-2">
                {auditLogs.map((log) => (
                  <li key={log.id} className="text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{log.type}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{log.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
          <h2 className="text-sm font-semibold mb-2">Schools</h2>
          {schools.length === 0 ? (
            <p className="text-xs text-slate-400">No schools configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400">
                    <th className="py-2">School</th>
                    <th className="py-2">City</th>
                    <th className="py-2">District</th>
                    <th className="py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {schools.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 text-slate-200">{s.name}</td>
                      <td className="py-2 text-slate-400">{s.city ?? "—"}</td>
                      <td className="py-2 text-slate-400">
                        {districts.find((d) => d.id === s.districtId)?.name ?? "Unassigned"}
                      </td>
                      <td className="py-2 text-slate-400">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper?: string;
}) {
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
  limitPct
}: {
  label: string;
  value: number;
  limitPct?: number;
}) {
  return (
    <div>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-slate-100">{numberFormatter.format(value)}</p>
      {typeof limitPct === "number" && (
        <p className={`text-[10px] mt-0.5 ${limitPct > 100 ? "text-amber-300" : "text-slate-500"}`}>
          {limitPct}% of limit
        </p>
      )}
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
    <div className="mb-2">
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
