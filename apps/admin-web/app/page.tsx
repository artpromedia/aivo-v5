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
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{role === "district_admin" ? "🏢" : "🌐"}</span>
                <h1 className="text-2xl font-bold text-slate-900">
                  {role === "district_admin" ? "District Admin" : "Platform Admin"} Console
                </h1>
              </div>
              {role === "district_admin" && myTenant && (
                <p className="text-slate-600">Managing <span className="font-semibold text-theme-primary">{myTenant.name}</span></p>
              )}
              {role === "platform_admin" && (
                <p className="text-slate-600">
                  Managing <span className="font-semibold text-theme-primary">{tenants.length}</span> organization{tenants.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            
            {/* Role Toggle */}
            <div className="inline-flex rounded-full bg-theme-background-elevated p-1">
              <button
                className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all ${
                  role === "district_admin"
                    ? "bg-theme-primary text-theme-primary-contrast shadow-lg"
                    : "text-slate-600 hover:text-theme-primary"
                }`}
                onClick={() => setRole("district_admin")}
              >
                🏢 District
              </button>
              <button
                className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all ${
                  role === "platform_admin"
                    ? "bg-theme-primary text-theme-primary-contrast shadow-lg"
                    : "text-slate-600 hover:text-theme-primary"
                }`}
                onClick={() => setRole("platform_admin")}
              >
                🌐 Platform
              </button>
            </div>
          </div>
        </header>

        {loading && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="animate-spin text-4xl mb-3">🌟</div>
            <p className="text-slate-500">Loading admin data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-600 font-medium">Error loading data</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {role === "district_admin" ? (
              <div className="space-y-6">
                <p className="text-slate-600 bg-white rounded-2xl p-4 shadow-md">
                  Manage your district&apos;s learners, teachers, content, and view progress analytics.
                </p>
                
                <section className="grid gap-4 md:grid-cols-2">
                  <QuickLink
                    title="Tenant Overview"
                    description="View configuration, limits, and activity for your district."
                    href="/tenant"
                    icon="🏢"
                    color="violet"
                  />
                  <QuickLink
                    title="Analytics"
                    description="District-wide mastery trends and intervention insights."
                    href="/analytics"
                    icon="📊"
                    color="sky"
                  />
                  <QuickLink
                    title="Content Library"
                    description="Browse and manage curriculum-aligned content."
                    href="/content"
                    icon="📚"
                    color="mint"
                  />
                  <QuickLink
                    title="Governance"
                    description="Review audit logs and policy compliance."
                    href="/governance"
                    icon="🔒"
                    color="sunshine"
                  />
                </section>
                
                {myTenant && (
                  <section className="bg-white rounded-3xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">🏫</span>
                      <h3 className="text-lg font-semibold text-slate-900">Your District</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <InfoCard label="Name" value={myTenant.name} icon="🏷️" />
                      <InfoCard label="Type" value={myTenant.type.replace(/_/g, " ")} icon="📋" />
                      <InfoCard label="Region" value={myTenant.region} icon="🌍" />
                      <InfoCard 
                        label="Status" 
                        value={myTenant.isActive ? "Active" : "Inactive"} 
                        icon={myTenant.isActive ? "✅" : "⏸️"}
                        valueColor={myTenant.isActive ? "text-emerald-600" : "text-slate-400"}
                      />
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-slate-600 bg-white rounded-2xl p-4 shadow-md">
                  Oversee all tenants, configure global policies, and monitor platform health.
                </p>
                
                {/* Stats */}
                <section className="grid gap-4 md:grid-cols-3">
                  <StatCard label="Total Tenants" value={tenants.length} icon="🏢" color="violet" />
                  <StatCard label="Active" value={activeTenants} icon="✅" color="mint" />
                  <StatCard label="Inactive" value={tenants.length - activeTenants} icon="⏸️" color="slate" />
                </section>
                
                <section className="grid gap-4 md:grid-cols-2">
                  <QuickLink
                    title="All Tenants"
                    description="View and manage every organization on the platform."
                    href="/tenants"
                    icon="🏢"
                    color="violet"
                  />
                  <QuickLink
                    title="Global Analytics"
                    description="Platform-wide usage and performance metrics."
                    href="/analytics"
                    icon="📊"
                    color="sky"
                  />
                  <QuickLink
                    title="Content Governance"
                    description="Review and approve curriculum content submissions."
                    href="/content"
                    icon="📚"
                    color="mint"
                  />
                  <QuickLink
                    title="Platform Governance"
                    description="Audit logs, policy enforcement, and compliance reports."
                    href="/governance"
                    icon="🔒"
                    color="sunshine"
                  />
                </section>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="text-center text-slate-400 text-sm py-4">
          <p>AIVO Admin Console • Built with 💜 for neurodiverse learners</p>
        </footer>
      </div>
    </main>
  );
}

const colorClasses = {
  violet: {
    bg: "bg-theme-background-elevated",
    icon: "bg-theme-primary/10 text-theme-primary",
  },
  sky: {
    bg: "bg-theme-info/5",
    icon: "bg-theme-info/10 text-theme-info",
  },
  mint: {
    bg: "bg-theme-success/5",
    icon: "bg-theme-success/10 text-theme-success",
  },
  sunshine: {
    bg: "bg-theme-warning/5",
    icon: "bg-theme-warning/10 text-theme-warning-dark",
  },
  slate: {
    bg: "bg-slate-50",
    icon: "bg-slate-100 text-slate-600",
  }
};

function QuickLink({
  title,
  description,
  href,
  icon,
  color
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: keyof typeof colorClasses;
}) {
  const colors = colorClasses[color];
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-3xl bg-white shadow-lg p-6 hover:shadow-xl transition-all border border-transparent hover:border-theme-primary/20"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${colors.icon}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      <span className="text-theme-primary-light text-xl">→</span>
    </Link>
  );
}

function StatCard({ 
  label, 
  value, 
  icon,
  color 
}: { 
  label: string; 
  value: number;
  icon: string;
  color: keyof typeof colorClasses;
}) {
  const colors = colorClasses[color];
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${colors.icon}`}>
          {icon}
        </span>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  icon,
  valueColor = "text-slate-900"
}: {
  label: string;
  value: string;
  icon: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-lavender-50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}
