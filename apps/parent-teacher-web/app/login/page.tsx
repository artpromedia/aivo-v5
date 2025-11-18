"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "../AuthProvider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, state } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("parent@example.com");
  const [password, setPassword] = useState("dev-password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/learner");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (state.user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <p className="text-sm">
          You are already logged in as <span className="font-semibold">{state.user.email}</span>.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 p-6">
      <section className="w-full max-w-sm rounded-2xl bg-slate-900/80 border border-slate-800 shadow-soft-coral p-5 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-xs text-slate-300 mt-1">
            Use a demo parent or teacher account to access the caregiver dashboard.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="w-full rounded-xl bg-slate-950/80 border border-slate-700 px-3 py-2 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-coral"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300" htmlFor="password">
              Password (dev)
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-xl bg-slate-950/80 border border-slate-700 px-3 py-2 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-coral"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-pill bg-coral px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
