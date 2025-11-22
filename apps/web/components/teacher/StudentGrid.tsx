'use client'

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import type { TeacherStudentSummary } from "@/lib/types/dashboard";

export function StudentGrid({ students }: { students: TeacherStudentSummary[] }) {
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudentSummary | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  if (!students?.length) {
    return <p className="text-sm text-slate-500">No enrolled learners yet.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => (
          <div
            key={student.id}
            className="cursor-pointer transition hover:shadow-lg"
            onClick={() => {
              setSelectedStudent(student);
              setShowDetails(true);
            }}
          >
            <Card>
              <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-sm text-slate-500">Grade {student.gradeLevel}</p>
                </div>
                <StatusBadge status={student.status} />
              </div>

              <div className="space-y-3 text-sm">
                <ProgressBar label="Overall Progress" value={student.overallProgress} color="bg-blue-500" />
                <div className="grid grid-cols-2 gap-2">
                  <Detail label="Learning Level" value={student.actualLevel} />
                  <Detail label="Focus Score" value={`${student.focusScore}%`} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="text-xs rounded bg-blue-100 px-3 py-1 font-semibold text-blue-700">View Progress</button>
                <button className="text-xs rounded bg-purple-100 px-3 py-1 font-semibold text-purple-700">Send Message</button>
                <Link
                  href={`/portals/teacher/learners/${student.id}/accommodations`}
                  className="text-xs rounded bg-emerald-100 px-3 py-1 font-semibold text-emerald-700"
                >
                  Accommodations
                </Link>
              </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {showDetails && selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: TeacherStudentSummary["status"] }) {
  const config: Record<TeacherStudentSummary["status"], { label: string; className: string }> = {
    "on-track": { label: "On Track", className: "bg-emerald-100 text-emerald-700" },
    watch: { label: "Watch", className: "bg-amber-100 text-amber-700" },
    "needs-support": { label: "Needs Support", className: "bg-rose-100 text-rose-700" }
  };
  const { label, className } = config[status];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function StudentDetailsModal({ student, onClose }: { student: TeacherStudentSummary; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              {student.firstName} {student.lastName}
            </h3>
            <p className="text-sm text-slate-500">Grade {student.gradeLevel} · {student.actualLevel}</p>
          </div>
          <button className="text-sm text-slate-500 hover:text-slate-900" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="space-y-4 text-sm text-slate-600">
          <p>Focus score trends indicate {student.focusScore}% attention. Consider a short mindfulness break plus tactile learning supports.</p>
          <p>Last AI insight recommends reinforcing mastery checkpoints to keep momentum.</p>
        </div>
      </div>
    </div>
  );
}
