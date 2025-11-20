"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      identifier,
      password
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl bg-slate-900/80 p-8 shadow-soft-coral"
      >
        <div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-slate-300">Sign in with your email or learner username.</p>
        </div>
        {error && <p className="rounded border border-red-500/60 bg-red-500/10 p-3 text-sm">{error}</p>}
        <label className="block text-sm font-semibold">
          Email or username
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-coral px-4 py-3 font-semibold text-slate-950 transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
