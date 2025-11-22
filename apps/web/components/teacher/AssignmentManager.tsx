'use client'

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import type { TeacherAssignment } from "@/lib/types/dashboard";

export function AssignmentManager({ assignments }: { assignments: TeacherAssignment[] }) {
  const [items, setItems] = useState(assignments);

  useEffect(() => {
    setItems(assignments);
  }, [assignments]);

  if (!items.length) {
    return <p className="text-sm text-slate-500">No AI-suggested assignments right now.</p>;
  }

  const updateStatus = (id: string, status: TeacherAssignment["status"]) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  return (
    <div className="space-y-4">
      {items.map((assignment) => (
        <Card key={assignment.id}>
          <CardHeader
            title={assignment.title}
            subtitle={`${assignment.learnerName ?? "Whole class"} · Due ${new Date(assignment.dueDate).toLocaleDateString()}`}
            action={<PriorityBadge priority={assignment.priority} />}
          />
          <CardContent>
            <p className="text-sm text-slate-600">{assignment.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <button
                className={`rounded-full px-3 py-1 ${assignment.status === "planned" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
                onClick={() => updateStatus(assignment.id, "planned")}
              >
                Planned
              </button>
              <button
                className={`rounded-full px-3 py-1 ${assignment.status === "in-progress" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                onClick={() => updateStatus(assignment.id, "in-progress")}
              >
                In Progress
              </button>
              <button
                className={`rounded-full px-3 py-1 ${assignment.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                onClick={() => updateStatus(assignment.id, "completed")}
              >
                Completed
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: TeacherAssignment["priority"] }) {
  const map = {
    high: { label: "High", className: "bg-rose-100 text-rose-700" },
    medium: { label: "Medium", className: "bg-amber-100 text-amber-700" },
    low: { label: "Low", className: "bg-emerald-100 text-emerald-700" }
  } satisfies Record<TeacherAssignment["priority"], { label: string; className: string }>;

  const { label, className } = map[priority];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label} Priority</span>;
}
