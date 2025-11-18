"use client";

import { useState } from "react";

type AdminRole = "district_admin" | "platform_admin";

export default function AdminPage() {
  const [role, setRole] = useState<AdminRole>("district_admin");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-3xl rounded-2xl bg-slate-900/80 p-6 shadow-soft-coral">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-xl font-semibold">
            {role === "district_admin" ? "District Admin" : "Platform Admin"} Console
          </h1>
          <div className="inline-flex rounded-pill bg-slate-800 p-1">
            <button
              className={`px-3 py-1 text-xs font-semibold rounded-pill transition ${
                role === "district_admin"
                  ? "bg-coral text-white"
                  : "text-slate-400 hover:text-slate-100"
              }`}
              onClick={() => setRole("district_admin")}
            >
              District
            </button>
            <button
              className={`px-3 py-1 text-xs font-semibold rounded-pill transition ${
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
        <p className="mt-6 text-sm text-slate-200">
          This is a placeholder admin console. In a later iteration, add controls for tenant
          provisioning, permissions, and data residency policies.
        </p>
      </section>
    </main>
  );
}
