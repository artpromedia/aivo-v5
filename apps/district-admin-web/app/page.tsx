"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AivoApiClient } from "@aivo/api-client";
import type { Tenant } from "@aivo/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const client = new AivoApiClient(API_BASE_URL, async () => null);

export default function Page() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenantSummary() {
      setLoading(true);
      setError(null);
      try {
        const res = await client.listTenants();
        // For district admin, assume first tenant is "your" district
        const myTenant = res.tenants[0];
        setTenant(myTenant ?? null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    void loadTenantSummary();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <section className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-coral to-amber-300 bg-clip-text text-transparent">
              District Admin Console
            </h1>
            {tenant && (
              <span className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold bg-slate-800 text-slate-200">
                {tenant.name}
                <span className="inline-block w-1 h-1 rounded-full bg-emerald-400" />
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 max-w-2xl">
            Manage your district's learners, teachers, and content. View progress reports and coordinate accommodations across your organization.
          </p>
        </header>

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Loading district overview…
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/40 p-4 text-sm text-red-200">
            <p className="font-semibold">Error loading tenant data</p>
            <p className="text-xs text-red-300 mt-1">{error}</p>
            <p className="text-xs text-red-400 mt-2">
              Ensure the API gateway is running on port 4000 and the database is seeded.
            </p>
          </div>
        )}

        {!loading && !error && tenant && (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Active learners"
                value="–"
                helper="Students enrolled"
                icon="🎓"
              />
              <MetricCard
                label="Teachers"
                value="–"
                helper="Educators on platform"
                icon="👨‍🏫"
              />
              <MetricCard
                label="Avg mastery"
                value="–"
                helper="District-wide average"
                icon="📈"
              />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <ActionCard
                title="Tenant Overview"
                description="View your district's configuration, usage limits, and recent activity."
                href="/tenant"
                buttonLabel="Open tenant"
                icon="🏢"
              />
              <ActionCard
                title="Learner Management"
                description="Coming soon: Enroll learners, assign teachers, and manage IEPs and accommodations."
                href="#"
                buttonLabel="Coming soon"
                disabled
                icon="👥"
              />
              <ActionCard
                title="Progress Reports"
                description="Coming soon: District-wide analytics, mastery trends, and intervention recommendations."
                href="#"
                buttonLabel="Coming soon"
                disabled
                icon="📊"
              />
              <ActionCard
                title="Content Library"
                description="Coming soon: Browse and assign curriculum-aligned content for your learners."
                href="#"
                buttonLabel="Coming soon"
                disabled
                icon="📚"
              />
            </section>

            <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
              <h2 className="text-lg font-semibold">District info</h2>
              <div className="space-y-2 text-sm">
                <InfoRow label="Name" value={tenant.name} />
                <InfoRow label="Type" value={tenant.type.replace(/_/g, " ")} />
                <InfoRow label="Region" value={tenant.region} />
                <InfoRow
                  label="Status"
                  value={tenant.isActive ? "Active" : "Inactive"}
                  valueClass={tenant.isActive ? "text-emerald-300" : "text-slate-400"}
                />
                <InfoRow
                  label="Created"
                  value={new Date(tenant.createdAt).toLocaleDateString()}
                />
              </div>
            </section>
          </>
        )}

        {!loading && !error && !tenant && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/40 p-4 text-sm text-amber-200">
            <p className="font-semibold">No tenant found</p>
            <p className="text-xs text-amber-300 mt-1">
              Seed the database with a district tenant to see your dashboard.
            </p>
          </div>
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
  value: string | number;
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
