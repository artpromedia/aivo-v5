"use client";

import { useEffect, useState } from "react";
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <section className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Platform Admin – Tenants</h1>
        <p className="text-sm text-slate-300 mb-4">
          These are the organizations (districts, independent schools, clinics, networks) using
          AIVO.
        </p>
        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {error && <p className="text-sm text-red-400 mb-3">Error: {error}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {tenants.map((t) => (
            <article
              key={t.id}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-soft-coral"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h2 className="text-sm font-semibold">{t.name}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Type: <span className="font-medium">{t.type}</span> • Region:{" "}
                    <span className="font-medium">{t.region}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    ID: <span className="font-mono">{t.id}</span>
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold rounded-pill px-2 py-1 ${
                    t.isActive
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-slate-600/40 text-slate-300"
                  }`}
                >
                  {t.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </article>
          ))}
        </div>
        {!loading && tenants.length === 0 && !error && (
          <p className="mt-4 text-xs text-slate-400">No tenants found.</p>
        )}
      </section>
    </main>
  );
}
