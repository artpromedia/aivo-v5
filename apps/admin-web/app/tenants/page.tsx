"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AivoApiClient } from "@aivo/api-client";
import type { Tenant } from "@aivo/types";

const client = new AivoApiClient("http://localhost:4000", async () => null);

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
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

  useEffect(() => {
    void load();
  }, []);

  const activeTenants = tenants.filter(t => t.isActive);
  const inactiveTenants = tenants.filter(t => !t.isActive);

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
      {/* Back Navigation */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-theme-primary hover:text-theme-primary-dark font-medium mb-6"
      >
        <span className="text-lg">←</span> Back to Console
      </Link>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-theme-primary-light to-theme-primary rounded-2xl flex items-center justify-center text-3xl">
              🌐
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Platform Tenants</h1>
              <p className="text-slate-500 mt-1">
                All organizations (districts, schools, clinics) using AIVO
              </p>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center gap-4">
            <span className="w-12 h-12 bg-theme-primary/10 rounded-xl flex items-center justify-center text-2xl">🏢</span>
            <div>
              <p className="text-2xl font-bold text-slate-900">{tenants.length}</p>
              <p className="text-sm text-slate-500">Total Tenants</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center gap-4">
            <span className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">✅</span>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{activeTenants.length}</p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center gap-4">
            <span className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">⏸️</span>
            <div>
              <p className="text-2xl font-bold text-slate-400">{inactiveTenants.length}</p>
              <p className="text-sm text-slate-500">Inactive</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="animate-spin text-4xl mb-3">🌟</div>
            <p className="text-slate-500">Loading tenants...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {/* Tenants Grid */}
        {!loading && tenants.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {tenants.map((t) => (
              <article
                key={t.id}
                className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">🏢</span>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{t.name}</h2>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-theme-primary/10 text-theme-primary px-2 py-1 rounded-full">
                          {t.type.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs bg-theme-info/10 text-theme-info px-2 py-1 rounded-full">
                          📍 {t.region}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 font-mono">
                        ID: {t.id}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold rounded-full px-3 py-1 ${
                      t.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {t.isActive ? "✓ Active" : "Inactive"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && tenants.length === 0 && !error && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <span className="text-5xl mb-4 block">📋</span>
            <p className="text-slate-500">No tenants found</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm py-4">
          💜 Empowering organizations to support neurodiverse learners
        </div>
      </div>
    </main>
  );
}
