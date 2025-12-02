"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  GraduationCap,
  Users,
  TrendingUp,
  BarChart3,
  BookOpen,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { AivoApiClient } from "@aivo/api-client";
import type { Tenant } from "@aivo/types";
import { DashboardSkeleton } from "../components/Skeletons";

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
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-violet-500 bg-clip-text text-transparent">
              District Admin Console
            </h1>
            {tenant && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-violet-100 text-violet-700">
                {tenant.name}
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 max-w-2xl">
            Manage your district&apos;s learners, teachers, and content. View progress reports and coordinate accommodations across your organization.
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
                <p className="font-semibold text-red-800">Error loading tenant data</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  Ensure the API gateway is running on port 4000 and the database is seeded.
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && tenant && (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Active learners"
                value="–"
                helper="Students enrolled"
                icon={GraduationCap}
                iconBg="bg-violet-100"
                iconColor="text-violet-600"
              />
              <MetricCard
                label="Teachers"
                value="–"
                helper="Educators on platform"
                icon={Users}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
              />
              <MetricCard
                label="Avg mastery"
                value="–"
                helper="District-wide average"
                icon={TrendingUp}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
              />
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <ActionCard
                title="Tenant Overview"
                description="View your district's configuration, usage limits, and recent activity."
                href="/tenant"
                buttonLabel="Open tenant"
                icon={Building2}
              />
              <ActionCard
                title="Learner Management"
                description="Coming soon: Enroll learners, assign teachers, and manage IEPs and accommodations."
                href="#"
                buttonLabel="Coming soon"
                disabled
                icon={Users}
              />
              <ActionCard
                title="Progress Reports"
                description="Coming soon: District-wide analytics, mastery trends, and intervention recommendations."
                href="#"
                buttonLabel="Coming soon"
                disabled
                icon={BarChart3}
              />
              <ActionCard
                title="Content Library"
                description="Coming soon: Browse and assign curriculum-aligned content for your learners."
                href="#"
                buttonLabel="Coming soon"
                disabled
                icon={BookOpen}
              />
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">District Info</h2>
              <div className="space-y-3">
                <InfoRow label="Name" value={tenant.name} />
                <InfoRow label="Type" value={tenant.type.replace(/_/g, " ")} />
                <InfoRow label="Region" value={tenant.region} />
                <InfoRow
                  label="Status"
                  value={tenant.isActive ? "Active" : "Inactive"}
                  valueClass={tenant.isActive ? "text-emerald-600 font-medium" : "text-slate-500"}
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
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800">No tenant found</p>
                <p className="text-sm text-amber-700 mt-1">
                  Seed the database with a district tenant to see your dashboard.
                </p>
              </div>
            </div>
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
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
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
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
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
          className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400 cursor-not-allowed"
        >
          {buttonLabel}
        </button>
      ) : (
        <Link
          href={href}
          className="block w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white text-center hover:bg-violet-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
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
  valueClass = "text-slate-900 font-medium"
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
