'use client'

import { FormEvent, useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";

type GoalStatus = "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "MODIFIED";

interface Goal {
  id: string;
  category: string;
  goal: string;
  status: GoalStatus;
  progress: number;
  notes?: string | null;
  createdAt: string;
  targetDate: string;
}

interface GoalsResponse {
  goals: Goal[];
}

export function IEPGoalsTracker({ learnerId }: { learnerId?: string }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ category: "", goal: "", targetDate: "", notes: "" });

  const fetchGoals = useCallback(async () => {
    if (!learnerId) {
      setGoals([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/iep/goals?learnerId=${learnerId}`);
      if (!response.ok) throw new Error("Unable to load goals");
      const data = (await response.json()) as GoalsResponse;
      setGoals(data.goals);
    } catch (err) {
      console.error(err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [learnerId]);

  useEffect(() => {
    void fetchGoals();
  }, [fetchGoals]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!learnerId) return;
      setSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/iep/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            learnerId,
            category: form.category,
            goal: form.goal,
            targetDate: form.targetDate,
            notes: form.notes || undefined
          })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Unable to create goal");
        }

        await fetchGoals();
        setShowForm(false);
        setForm({ category: "", goal: "", targetDate: "", notes: "" });
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : "Unable to create goal");
      } finally {
        setSaving(false);
      }
    },
    [fetchGoals, form.category, form.goal, form.notes, form.targetDate, learnerId]
  );

  if (!learnerId) {
    return <EmptyState message="Select a learner to preview goals" />;
  }

  if (loading) {
    return <EmptyState message="Loading goals..." />;
  }

  return (
    <div className="space-y-4">
      {!goals.length && <EmptyState message="No IEP goals yet. Add one to track progress." />}
      {goals.map((goal) => (
        <article key={goal.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{goal.category}</p>
              <h4 className="text-base font-semibold text-slate-900">{goal.goal}</h4>
            </div>
            <StatusBadge status={statusTone(goal.status)} label={goal.status.replace(/_/g, " ")} />
          </header>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Progress</span>
              <span>{Math.round(goal.progress)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${goal.progress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Started: {new Date(goal.createdAt).toLocaleDateString()}</span>
              <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
            </div>
          </div>
          {goal.notes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{goal.notes}</p>}
        </article>
      ))}
      {showForm ? (
        <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
          <h4 className="text-base font-semibold text-slate-900">New goal</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-600">
              Category
              <input
                required
                type="text"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Target date
              <input
                required
                type="date"
                value={form.targetDate}
                onChange={(event) => setForm((prev) => ({ ...prev, targetDate: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block text-sm font-semibold text-slate-600">
            Goal statement
            <textarea
              required
              rows={3}
              value={form.goal}
              onChange={(event) => setForm((prev) => ({ ...prev, goal: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Describe the measurable outcome"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-600">
            Notes (optional)
            <textarea
              rows={2}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              onClick={() => {
                setShowForm(false);
                setForm({ category: "", goal: "", targetDate: "", notes: "" });
                setError(null);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save goal"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="w-full rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500"
          onClick={() => setShowForm(true)}
        >
          + Add new goal
        </button>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">{message}</div>;
}

function statusTone(status: GoalStatus) {
  if (status === "ACHIEVED") return "HEALTHY" as const;
  if (status === "IN_PROGRESS") return "INFO" as const;
  return "ALERT" as const;
}
