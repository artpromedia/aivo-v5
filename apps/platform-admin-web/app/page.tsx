"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AivoApiClient } from "@aivo/api-client";
import type { Tenant } from "@aivo/types";

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
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <section className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-coral to-amber-300 bg-clip-text text-transparent">
              Platform Admin Console
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold bg-slate-800 text-slate-200">
              District
              <span className="inline-block w-1 h-1 rounded-full bg-emerald-400" />
              Platform
            </span>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl">
            This is a placeholder admin console. In a later iteration, add controls for tenant provisioning, permissions, and data residency policies.
          </p>
        </header>

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Loading platform overview…
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/40 p-4 text-sm text-red-200">
            <p className="font-semibold">Error loading data</p>
            <p className="text-xs text-red-300 mt-1">{error}</p>
            <p className="text-xs text-red-400 mt-2">
              Ensure the API gateway is running on port 4000 and the database is seeded with tenants.
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Total organizations"
                value={tenants.length}
                helper="Onboarded to AIVO"
                icon="🏢"
              />
              <MetricCard
                label="Active tenants"
                value={activeTenants}
                helper="Enabled & operational"
                icon="✅"
              />
              <MetricCard
                label="Paused"
                value={inactiveTenants}
                helper="Need review or support"
                icon="⏸️"
              />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <ActionCard
                title="Tenant Observatory"
                description="View all tenants, inspect usage guardrails, audit logs, and governance policies."
                href="/tenants"
                buttonLabel="Manage tenants"
                icon="🔍"
              />
              <ActionCard
                title="User Provisioning"
                description="Coming soon: Bulk create district admins, teachers, and learners with role-based access."
                href="#"
                buttonLabel="Coming soon"
                disabled
                icon="👥"
              />
              <ActionCard
                title="Data Residency"
                description="Coming soon: Configure region-specific policies for data storage and AI model routing."
                href="#"
                buttonLabel="Coming soon"
                disabled
                icon="🌍"
              />
              <ActionCard
                title="Analytics & Reporting"
                description="Coming soon: Export usage reports, mastery scores, and safety incident summaries."
                href="#"
                buttonLabel="Coming soon"
                disabled
                icon="📊"
              />
            </section>

            {tenants.length > 0 && (
              <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent tenants</h2>
                  <Link
                    href="/tenants"
                    className="text-xs text-coral hover:text-coral/80 underline underline-offset-2"
                  >
                    View all →
                  </Link>
                </div>
                <ul className="space-y-2">
                  {tenants.slice(0, 5).map((tenant) => (
                    <li
                      key={tenant.id}
                      className="flex items-center justify-between rounded-xl bg-slate-800/60 border border-slate-700 p-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-100">{tenant.name}</p>
                        <p className="text-xs text-slate-400">
                          {tenant.type.replace(/_/g, " ")} • {tenant.region}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                          tenant.isActive
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-slate-600/40 text-slate-300"
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
  icon
}: {
  label: string;
  value: number;
  helper: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold text-slate-50">{value}</p>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  buttonLabel,
  disabled,
  icon
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  disabled?: boolean;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        </div>
      </div>
      {disabled ? (
        <button
          disabled
          className="w-full rounded-pill bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed"
        >
          {buttonLabel}
        </button>
      ) : (
        <Link
          href={href}
          className="block w-full rounded-pill bg-coral px-4 py-2 text-sm font-semibold text-white text-center hover:bg-coral/90 transition"
        >
          {buttonLabel}
        </Link>
      )}
    </div>
  );
}
