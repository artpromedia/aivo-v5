'use client'

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ClassOverview } from "@/components/teacher/ClassOverview";
import { StudentGrid } from "@/components/teacher/StudentGrid";
import { AssignmentManager } from "@/components/teacher/AssignmentManager";
import { AIRecommendations as TeacherAIRecommendations } from "@/components/teacher/AIRecommendations";
import type { ApprovalRequest, DashboardStreamEvent, TeacherDashboardData } from "@/lib/types/dashboard";
import { useDashboardStream } from "@/lib/dashboard/use-dashboard-stream";

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const [dashboard, setDashboard] = useState<TeacherDashboardData | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalsLoading, setApprovalsLoading] = useState(true);

  const refreshDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboards/teacher");
      if (!response.ok) {
        throw new Error("Unable to load teacher dashboard");
      }
      const data = (await response.json()) as { dashboard?: TeacherDashboardData };
      setDashboard(data.dashboard ?? null);
    } catch (error) {
      console.error(error);
      setDashboard(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshApprovals = useCallback(async () => {
    setApprovalsLoading(true);
    try {
      const response = await fetch("/api/approvals");
      if (!response.ok) {
        throw new Error("Unable to load approvals");
      }
      const data = (await response.json()) as { approvals?: ApprovalRequest[] };
      setApprovals(data.approvals ?? []);
    } catch (error) {
      console.error(error);
      setApprovals([]);
    } finally {
      setApprovalsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([refreshDashboard(), refreshApprovals()]);
  }, [refreshApprovals, refreshDashboard]);

  const handleStream = useCallback((event: DashboardStreamEvent) => {
    if (event.type === "teacher-update") {
      setDashboard(event.dashboard ?? null);
    }
    if (event.type === "approvals-update") {
      setApprovals(event.approvals ?? []);
      setApprovalsLoading(false);
    }
  }, []);

  useDashboardStream("teacher", handleStream);

  const handleApproval = useCallback(
    async (approval: ApprovalRequest, status: "APPROVED" | "DECLINED") => {
      try {
        const response = await fetch("/api/approval/difficulty-change", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: approval.id, decision: status })
        });
        if (!response.ok) {
          throw new Error("Unable to update approval");
        }
        await refreshApprovals();
      } catch (error) {
        console.error(error);
      }
    },
    [refreshApprovals]
  );

  if (!dashboard && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="rounded-full border border-dashed border-slate-300 px-5 py-3 text-sm text-slate-500">
          Loading teacher insights...
        </p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-slate-600">No data yet. AI will begin collecting signals once learners join your class.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950/5">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-wide text-cyan-600">
            {session?.user?.name || session?.user?.email || "Teacher"}
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Teacher Command Center</h1>
          <p className="text-slate-500">Manage classes, approvals, and AI insights</p>
        </header>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview">Class Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ClassOverview
              dashboard={dashboard}
              approvals={approvals}
              approvalsLoading={approvalsLoading}
              onApprove={(approval) => handleApproval(approval, "APPROVED")}
              onReject={(approval) => handleApproval(approval, "DECLINED")}
            />
          </TabsContent>

          <TabsContent value="students">
            <StudentGrid students={dashboard.students} />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentManager assignments={dashboard.assignments} />
          </TabsContent>

          <TabsContent value="recommendations">
            <TeacherAIRecommendations recommendations={dashboard.recommendations} students={dashboard.students} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
