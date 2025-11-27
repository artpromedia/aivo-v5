"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "../AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-mint-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Already Signed In</h2>
          <p className="text-slate-600 mb-4">
            You&apos;re logged in as <span className="font-semibold text-violet-600">{state.user.email}</span>
          </p>
          <Link
            href="/"
            className="block w-full py-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-2xl shadow-lg transition-all"
          >
            Go to Dashboard →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50 to-lavender-100 p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-400 to-violet-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
            👨‍👩‍👧
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back!</h1>
          <p className="text-slate-600 mt-2">
            Sign in to your caregiver dashboard
          </p>
        </div>

        {/* Login Card */}
        <section className="bg-white rounded-3xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-2xl bg-lavender-50 border border-lavender-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-2xl bg-lavender-50 border border-lavender-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Signing in...
                </span>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 pt-6 border-t border-lavender-200">
            <p className="text-center text-sm text-slate-500">
              <span className="text-lg mr-1">💡</span>
              Demo mode: Use any email/password to explore
            </p>
          </div>
        </section>

        {/* Roles info */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
            <span className="text-2xl mb-2 block">🏠</span>
            <p className="text-sm font-medium text-slate-900">Parent Access</p>
            <p className="text-xs text-slate-500 mt-1">Monitor your child&apos;s progress</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
            <span className="text-2xl mb-2 block">📚</span>
            <p className="text-sm font-medium text-slate-900">Teacher Access</p>
            <p className="text-xs text-slate-500 mt-1">Manage classroom learners</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-8">
          AIVO • Built with 💜 for neurodiverse learners
        </p>
      </div>
    </main>
  );
}
