"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewLearnerPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gradeLevel: "1",
    actualLevel: ""
  });
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setCredentials(null);
    setLoading(true);

    const payload = {
      ...form,
      actualLevel: form.actualLevel === "" ? undefined : form.actualLevel
    };

    const response = await fetch("/api/learners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Unable to create learner");
      return;
    }

    const data = await response.json();
    setCredentials({ username: data.username, password: data.password });
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <button onClick={() => router.back()} className="text-sm text-coral">
        ← Back to dashboard
      </button>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-slate-900/80 p-6 shadow-soft-coral">
        <div>
          <p className="text-sm uppercase tracking-wide text-coral">Invite learner</p>
          <h1 className="text-3xl font-semibold">Create secure learner credentials</h1>
          <p className="text-sm text-slate-300">
            We auto-generate a high-entropy password and username. Share them privately with the learner.
          </p>
        </div>
        {error && <p className="rounded border border-red-500/60 bg-red-500/10 p-3 text-sm">{error}</p>}
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
          Date of birth
          <input
            type="date"
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
            value={form.dateOfBirth}
            onChange={(e) => handleChange("dateOfBirth", e.target.value)}
            required
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Grade level
            <input
              type="number"
              min={0}
              max={12}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
              value={form.gradeLevel}
              onChange={(e) => handleChange("gradeLevel", e.target.value)}
              required
            />
          </label>
          <label className="text-sm font-semibold">
            Actual level (optional)
            <input
              type="number"
              min={0}
              max={12}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950/60 px-3 py-2"
              value={form.actualLevel}
              onChange={(e) => handleChange("actualLevel", e.target.value)}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-coral px-4 py-3 font-semibold text-slate-950 transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create learner"}
        </button>
        {credentials && (
          <div className="rounded border border-emerald-500/60 bg-emerald-500/10 p-4 text-sm">
            <p className="font-semibold">Learner credentials</p>
            <p className="text-slate-200">Username: {credentials.username}</p>
            <p className="text-slate-200">Password: {credentials.password}</p>
            <p className="text-xs text-slate-400">Copy these now—passwords are only shown once.</p>
          </div>
        )}
      </form>
    </main>
  );
}
