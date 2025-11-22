"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AivoApiClient } from "@aivo/api-client";
import type { Tenant } from "@aivo/types";

type AdminRole = "district_admin" | "platform_admin";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const client = new AivoApiClient(API_BASE_URL, async () => null);

export default function AdminPage() {
  const [role, setRole] = useState<AdminRole>("district_admin");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
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
    void loadData();
  }, []);

  const activeTenants = tenants.filter((t) => t.isActive).length;
  const myTenant = tenants[0] ?? null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-5xl rounded-2xl bg-slate-900/80 p-6 shadow-soft-coral space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-coral to-amber-300 bg-clip-text text-transparent">
              {role === "district_admin" ? "District Admin" : "Platform Admin"} Console
            </h1>
            {role === "district_admin" && myTenant && (
              <p className="text-xs text-slate-400 mt-1">Managing {myTenant.name}</p>
            )}
            {role === "platform_admin" && (
              <p className="text-xs text-slate-400 mt-1">
                Managing {tenants.length} organization{tenants.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="inline-flex rounded-pill bg-slate-800 p-1">
            <button
              className={`px-4 py-2 text-xs font-semibold rounded-pill transition ${
                role === "district_admin"
                  ? "bg-coral text-white"
                  : "text-slate-400 hover:text-slate-100"
              }`}
              onClick={() => setRole("district_admin")}
            >
              District
            </button>
            <button
              className={`px-4 py-2 text-xs font-semibold rounded-pill transition ${
                role === "platform_admin"
                  ? "bg-coral text-white"
                  : "text-slate-400 hover:text-slate-100"
              }`}
              onClick={() => setRole("platform_admin")}
            >
              Platform
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Loading admin data…
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/40 p-4 text-sm text-red-200">
            <p className="font-semibold">Error loading data</p>
            <p className="text-xs text-red-300 mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {role === "district_admin" ? (
              <div className="space-y-6">
                <p className="text-sm text-slate-300">
                  Manage your district's learners, teachers, content, and view progress analytics.
                </p>
                <section className="grid gap-4 md:grid-cols-2">
                  <QuickLink
                    title="Tenant Overview"
                    description="View configuration, limits, and activity for your district."
                    href="/tenant"
                    icon="🏢"
                  />
                  <QuickLink
                    title="Analytics"
                    description="District-wide mastery trends and intervention insights."
                    href="/analytics"
                    icon="📊"
                  />
                  <QuickLink
                    title="Content Library"
                    description="Browse and manage curriculum-aligned content."
                    href="/content"
                    icon="📚"
                  />
                  <QuickLink
                    title="Governance"
                    description="Review audit logs and policy compliance."
                    href="/governance"
                    icon="🔒"
                  />
                </section>
                {myTenant && (
                  <section className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 space-y-2">
                    <h3 className="text-sm font-semibold">Your district</h3>
                    <div className="text-xs text-slate-300 space-y-1">
                      <InfoRow label="Name" value={myTenant.name} />
                      <InfoRow label="Type" value={myTenant.type.replace(/_/g, " ")} />
                      <InfoRow label="Region" value={myTenant.region} />
                      <InfoRow
                        label="Status"
                        value={myTenant.isActive ? "Active" : "Inactive"}
                        valueClass={myTenant.isActive ? "text-emerald-300" : "text-slate-400"}
                      />
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-slate-300">
                  Oversee all tenants, configure global policies, and monitor platform health.
                </p>
                <section className="grid gap-4 md:grid-cols-3">
                  <StatCard label="Total tenants" value={tenants.length} />
                  <StatCard label="Active" value={activeTenants} />
                  <StatCard label="Inactive" value={tenants.length - activeTenants} />
                </section>
                <section className="grid gap-4 md:grid-cols-2">
                  <QuickLink
                    title="All Tenants"
                    description="View and manage every organization on the platform."
                    href="/tenants"
                    icon="🏢"
                  />
                  <QuickLink
                    title="Global Analytics"
                    description="Platform-wide usage and performance metrics."
                    href="/analytics"
                    icon="📊"
                  />
                  <QuickLink
                    title="Content Governance"
                    description="Review and approve curriculum content submissions."
                    href="/content"
                    icon="📚"
                  />
                  <QuickLink
                    title="Platform Governance"
                    description="Audit logs, policy enforcement, and compliance reports."
                    href="/governance"
                    icon="🔒"
                  />
                </section>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function QuickLink({
  title,
  description,
  href,
  icon
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl bg-slate-800/60 border border-slate-700 p-4 hover:bg-slate-800 hover:border-slate-600 transition"
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      </div>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClass = "text-slate-100"
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
