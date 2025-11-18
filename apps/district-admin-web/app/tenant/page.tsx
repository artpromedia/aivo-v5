"use client";

import { useEffect, useState } from "react";
import { AivoApiClient } from "@aivo/api-client";
import type { District, School, Tenant, TenantConfig } from "@aivo/types";

const client = new AivoApiClient("http://localhost:4000", async () => null);

const CURRENT_TENANT_ID = "tenant-1";

type TenantWithConfig = {
  tenant: Tenant;
  config: TenantConfig;
};

export default function DistrictAdminTenantPage() {
  const [tenantInfo, setTenantInfo] = useState<TenantWithConfig | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [tenantRes, districtRes, schoolRes] = await Promise.all([
        client.getTenantConfig(CURRENT_TENANT_ID),
        client.listDistricts(CURRENT_TENANT_ID),
        client.listSchools(CURRENT_TENANT_ID)
      ]);
      setTenantInfo(tenantRes);
      setDistricts(districtRes.districts);
      setSchools(schoolRes.schools);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const totalSchools = schools.length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <section className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">District Admin – Overview</h1>
          <p className="text-sm text-slate-300">
            View your district&apos;s schools and curriculum configuration.
          </p>
        </div>

        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {error && <p className="text-sm text-red-400">Error: {error}</p>}

        {tenantInfo && (
          <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
            <h2 className="text-sm font-semibold mb-1">Tenant</h2>
            <p className="text-sm">{tenantInfo.tenant.name}</p>
            <p className="text-xs text-slate-400 mt-1">
              Region: {tenantInfo.tenant.region} • Type: {tenantInfo.tenant.type}
            </p>
            <div className="mt-3">
              <h3 className="text-xs font-semibold text-slate-300 mb-1">
                Active Curricula
              </h3>
              <ul className="space-y-1">
                {tenantInfo.config.curricula.map((c) => (
                  <li key={c.id} className="text-xs text-slate-300">
                    <span className="font-medium">{c.label}</span> – {c.region} ({c.standard})
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
            <h2 className="text-sm font-semibold mb-2">Districts</h2>
            {districts.length === 0 && (
              <p className="text-xs text-slate-400">No districts configured.</p>
            )}
            <ul className="space-y-2">
              {districts.map((d) => (
                <li key={d.id} className="text-xs text-slate-300">
                  <span className="font-medium">{d.name}</span> – {d.country}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
            <h2 className="text-sm font-semibold mb-2">
              Schools <span className="text-xs text-slate-400">({totalSchools})</span>
            </h2>
            {schools.length === 0 && (
              <p className="text-xs text-slate-400">No schools configured.</p>
            )}
            <ul className="space-y-2">
              {schools.map((s) => (
                <li key={s.id} className="text-xs text-slate-300">
                  <span className="font-medium">{s.name}</span>
                  {s.city ? <span className="text-slate-400"> – {s.city}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </section>
    </main>
  );
}
