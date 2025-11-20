"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const roles = [
  { value: "PARENT", label: "Parent / Guardian" },
  { value: "TEACHER", label: "Teacher" }
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: roles[0].value,
    phone: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Unable to create account");
      return;
    }

    setSuccess("Account created! Redirecting to login…");
    setTimeout(() => router.push("/login"), 1500);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl space-y-4 rounded-2xl bg-slate-900/80 p-8 shadow-soft-coral"
      >
        <div>
          <p className="text-sm uppercase tracking-wide text-coral">Caregiver onboarding</p>
          <h1 className="text-3xl font-semibold">Create your AIVO account</h1>
          <p className="text-sm text-slate-300">
            Verified parents and teachers can invite learners, reset credentials, and track progress.
          </p>
        </div>
        {error && <p className="rounded border border-red-500/60 bg-red-500/10 p-3 text-sm">{error}</p>}
        {success && <p className="rounded border border-emerald-500/60 bg-emerald-500/10 p-3 text-sm">{success}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            First name
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              required
            />
          </label>
          <label className="text-sm font-semibold">
            Last name
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              required
            />
          </label>
        </div>
        <label className="text-sm font-semibold">
          Work email
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Role
            <select
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Phone (optional)
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </label>
        </div>
        <label className="text-sm font-semibold">
          Password
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
            type="password"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
          />
          <span className="mt-1 block text-xs text-slate-400">
            Use at least 10 characters with mixed case, a number, and a symbol.
          </span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-coral px-4 py-3 font-semibold text-slate-950 transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </main>
  );
}
