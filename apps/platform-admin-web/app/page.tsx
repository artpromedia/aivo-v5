"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  PauseCircle,
  Search,
  Users,
  Globe,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { AivoApiClient } from "@aivo/api-client";
import type { Tenant } from "@aivo/types";
import { DashboardSkeleton } from "../components/Skeletons";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const client = new AivoApiClient(API_BASE_URL, async () => null);

export default function Page() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      setError(null);
      try {
        const res = await client.listTenants();
        setTenants(res.tenants);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    void loadSummary();
  }, []);

  const activeTenants = tenants.filter((t) => t.isActive).length;
  const inactiveTenants = tenants.length - activeTenants;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-violet-500 bg-clip-text text-transparent">
              Platform Admin Console
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </span>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl">
            Manage tenants, permissions, and data residency policies across the AIVO platform.
          </p>
        </header>

        {loading && <DashboardSkeleton />}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-800">Error loading data</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  Ensure the API gateway is running on port 4000 and the database is seeded with tenants.
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Total organizations"
                value={tenants.length}
                helper="Onboarded to AIVO"
                icon={Building2}
                iconBg="bg-violet-100"
                iconColor="text-violet-600"
              />
              <MetricCard
                label="Active tenants"
                value={activeTenants}
                helper="Enabled & operational"
                icon={CheckCircle2}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
              />
              <MetricCard
                label="Paused"
                value={inactiveTenants}
                helper="Need review or support"
                icon={PauseCircle}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
              />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <ActionCard
                title="Tenant Observatory"
                description="View all tenants, inspect usage guardrails, audit logs, and governance policies."
                href="/tenants"
                buttonLabel="Manage tenants"
                icon={Search}
              />
              <ActionCard
                title="User Provisioning"
                description="Coming soon: Bulk create district admins, teachers, and learners with role-based access."
                href="#"
                buttonLabel="Coming soon"
                disabled
                icon={Users}
              />
              <ActionCard
                title="Data Residency"
                description="Coming soon: Configure region-specific policies for data storage and AI model routing."
                href="#"
                buttonLabel="Coming soon"
                disabled
                icon={Globe}
              />
              <ActionCard
                title="Analytics & Reporting"
                description="Coming soon: Export usage reports, mastery scores, and safety incident summaries."
                href="#"
                buttonLabel="Coming soon"
                disabled
                icon={BarChart3}
              />
            </section>

            {tenants.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Recent Tenants</h2>
                  <Link
                    href="/tenants"
                    className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                  >
                    View all →
                  </Link>
                </div>
                <ul className="space-y-2">
                  {tenants.slice(0, 5).map((tenant) => (
                    <li
                      key={tenant.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-4 transition-all hover:border-violet-200 hover:bg-violet-50/30"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{tenant.name}</p>
                        <p className="text-sm text-slate-500">
                          {tenant.type.replace(/_/g, " ")} • {tenant.region}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          tenant.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tenant.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
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
  value: number;
  helper: string;
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
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{helper}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  buttonLabel,
  disabled,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md hover:border-violet-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>
      {disabled ? (
        <button
          disabled
          className="w-full rounded-full bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400 cursor-not-allowed"
        >
          {buttonLabel}
        </button>
      ) : (
        <Link
          href={href}
          className="block w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white text-center hover:bg-violet-700 transition-colors"
        >
          {buttonLabel}
        </Link>
      )}
    </div>
  );
}
