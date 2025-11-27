"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
      {/* Back Navigation */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium mb-6"
      >
        <span className="text-lg">←</span> Back to Console
      </Link>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-violet-600 rounded-2xl flex items-center justify-center text-3xl">
              🏢
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">District Overview</h1>
              <p className="text-slate-500 mt-1">
                View your district&apos;s schools and curriculum configuration
              </p>
            </div>
          </div>
        </header>

        {loading && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="animate-spin text-4xl mb-3">🌟</div>
            <p className="text-slate-500">Loading district data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {tenantInfo && (
          <>
            {/* Tenant Info */}
            <section className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🏫</span>
                <h2 className="text-lg font-semibold text-slate-900">Tenant Information</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="bg-lavender-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Name</p>
                  <p className="font-semibold text-slate-900">{tenantInfo.tenant.name}</p>
                </div>
                <div className="bg-sky-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Region</p>
                  <p className="font-semibold text-slate-900">{tenantInfo.tenant.region}</p>
                </div>
                <div className="bg-mint-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Type</p>
                  <p className="font-semibold text-slate-900">{tenantInfo.tenant.type.replace(/_/g, " ")}</p>
                </div>
              </div>
              
              {/* Curricula */}
              <div className="border-t border-lavender-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <span>📚</span> Active Curricula
                </h3>
                <div className="grid gap-2">
                  {tenantInfo.config.curricula.map((c) => (
                    <div key={c.id} className="bg-lavender-50 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📖</span>
                        <span className="font-medium text-slate-900">{c.label}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">{c.region}</span>
                        <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">{c.standard}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Districts and Schools Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Districts */}
              <section className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🏛️</span>
                  <h2 className="text-lg font-semibold text-slate-900">Districts</h2>
                </div>
                {districts.length === 0 ? (
                  <div className="bg-lavender-50 rounded-2xl p-4 text-center">
                    <span className="text-3xl mb-2 block">📋</span>
                    <p className="text-slate-500">No districts configured yet</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {districts.map((d) => (
                      <li key={d.id} className="bg-lavender-50 rounded-xl p-3 flex items-center gap-3">
                        <span className="text-lg">🏛️</span>
                        <div>
                          <p className="font-medium text-slate-900">{d.name}</p>
                          <p className="text-xs text-slate-500">{d.country}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Schools */}
              <section className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏫</span>
                    <h2 className="text-lg font-semibold text-slate-900">Schools</h2>
                  </div>
                  <span className="text-sm bg-violet-100 text-violet-700 px-3 py-1 rounded-full font-medium">
                    {totalSchools} total
                  </span>
                </div>
                {schools.length === 0 ? (
                  <div className="bg-lavender-50 rounded-2xl p-4 text-center">
                    <span className="text-3xl mb-2 block">🏫</span>
                    <p className="text-slate-500">No schools configured yet</p>
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {schools.map((s) => (
                      <li key={s.id} className="bg-lavender-50 rounded-xl p-3 flex items-center gap-3">
                        <span className="text-lg">🏫</span>
                        <div>
                          <p className="font-medium text-slate-900">{s.name}</p>
                          {s.city && <p className="text-xs text-slate-500">{s.city}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm py-4">
          💜 Supporting neurodiverse learners across your district
        </div>
      </div>
    </main>
  );
}
