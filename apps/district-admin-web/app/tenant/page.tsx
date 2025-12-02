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
import {
  Users,
  TrendingUp,
  Clock,
  Building2,
  School as SchoolIcon,
  Shield,
  Activity,
  AlertTriangle,
  FileText,
  Calendar,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { DashboardSkeleton } from "../../components/Skeletons";

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
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <section className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-violet-100 text-violet-700">
              Tenant {CURRENT_TENANT_ID}
            </span>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl">
            Monitor curriculum coverage, governance guardrails, and daily usage signals across
            your district&apos;s schools. All data is sourced from the governance APIs already running
            in the platform.
          </p>
        </div>

        {loading && <DashboardSkeleton />}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">Error: {error}</p>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Learners"
            value={analytics ? numberFormatter.format(analytics.learnersCount) : "—"}
            helper="Enrolled learners"
            icon={Users}
          />
          <MetricCard
            label="Avg mastery"
            value={analytics ? `${analytics.avgMasteryScore.toFixed(1)}%` : "—"}
            helper="Rolling 30-day"
            icon={TrendingUp}
          />
          <MetricCard
            label="Daily minutes"
            value={analytics ? `${analytics.avgMinutesPracticed.toFixed(0)} min` : "—"}
            helper="Average per learner"
            icon={Clock}
          />
        </section>

        {tenantInfo && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {tenantInfo.tenant.name}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Region: {tenantInfo.tenant.region} • Type: {tenantInfo.tenant.type}
                </p>
              </div>
              <div className="flex gap-8 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">Curricula</p>
                  <p className="text-slate-600">{tenantInfo.config.curricula.length}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Providers</p>
                  <p className="text-slate-600">{tenantInfo.config.allowedProviders.join(", ") || "default"}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Active Curricula</h3>
                <ul className="space-y-2">
                  {tenantInfo.config.curricula.map((c) => (
                    <li key={c.id} className="text-sm text-slate-600 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-violet-500" />
                      <span className="font-medium text-slate-800">{c.label}</span> – {c.region} ({c.standard})
                    </li>
                  ))}
                </ul>
              </div>
              {limits && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Guardrails</h3>
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-600" />
                <h2 className="text-base font-semibold text-slate-900">Usage Pulse (7d)</h2>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Last: {usageSummary.latest?.date ?? "—"}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
            <ul className="text-sm text-slate-500 space-y-2 border-t border-slate-100 pt-4">
              {usageSummary.window.map((day) => (
                <li key={day.date} className="flex justify-between items-center">
                  <span className="text-slate-700">{day.date}</span>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                    {day.llmCalls} calls • {day.tutorTurns} turns • {day.safetyIncidents} incidents
                  </span>
                </li>
              ))}
              {usageSummary.window.length === 0 && (
                <li className="text-slate-400">No usage data recorded yet.</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-600" />
              <h2 className="text-base font-semibold text-slate-900">Role Coverage</h2>
            </div>
            {roleSummary.length === 0 ? (
              <p className="text-sm text-slate-500">No role assignments yet.</p>
            ) : (
              <ul className="space-y-3">
                {roleSummary.map(([role, count]) => (
                  <li key={role} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{role}</span>
                    <span className="bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full text-xs font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-violet-600" />
                <h2 className="text-base font-semibold text-slate-900">
                  Districts <span className="text-sm text-slate-500 font-normal">({districts.length})</span>
                </h2>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {schools.length} schools total
              </span>
            </div>
            {districts.length === 0 && (
              <p className="text-sm text-slate-500">No districts configured.</p>
            )}
            <ul className="space-y-3">
              {districts.map((d) => (
                <li key={d.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{d.name}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {d.country}
                      </p>
                    </div>
                    <span className="text-sm bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-medium">
                      {schoolsByDistrict.get(d.id) ?? 0} schools
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-violet-600" />
              <h2 className="text-base font-semibold text-slate-900">Latest Governance Activity</h2>
            </div>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-500">No audit events captured.</p>
            ) : (
              <ul className="space-y-3">
                {auditLogs.map((log) => (
                  <li key={log.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800">{log.type}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{log.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <SchoolIcon className="w-5 h-5 text-violet-600" />
            <h2 className="text-base font-semibold text-slate-900">Schools</h2>
          </div>
          {schools.length === 0 ? (
            <p className="text-sm text-slate-500">No schools configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="py-3 font-medium">School</th>
                    <th className="py-3 font-medium">City</th>
                    <th className="py-3 font-medium">District</th>
                    <th className="py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schools.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 text-slate-900 font-medium">{s.name}</td>
                      <td className="py-3 text-slate-600">{s.city ?? "—"}</td>
                      <td className="py-3 text-slate-600">
                        {districts.find((d) => d.id === s.districtId)?.name ?? "Unassigned"}
                      </td>
                      <td className="py-3 text-slate-500">
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
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md hover:border-violet-200">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-violet-600" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {helper && <p className="text-xs text-slate-500 mt-1">{helper}</p>}
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
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1">{numberFormatter.format(value)}</p>
      {typeof limitPct === "number" && (
        <p className={`text-xs mt-1 font-medium ${limitPct > 100 ? "text-amber-600" : "text-slate-500"}`}>
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
    <div className="mb-3">
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
