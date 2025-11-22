'use client'

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { LineChart, BarChart, PieChart } from "@/components/charts";
import { ApprovalQueue } from "@/components/parent/ApprovalQueue";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { MetricCard, type MetricCardProps } from "@/components/dashboard/MetricCard";
import type { ApprovalRequest, DashboardStreamEvent, LearnerSnapshot } from "@/lib/types/dashboard";
import { useDashboardStream } from "@/lib/dashboard/use-dashboard-stream";

export default function ParentDashboard() {
  const { data: session } = useSession();
  const [learners, setLearners] = useState<LearnerSnapshot[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>("");
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loadingLearners, setLoadingLearners] = useState(true);
  const [loadingApprovals, setLoadingApprovals] = useState(true);

  const syncLearners = useCallback((next: LearnerSnapshot[]) => {
    setLearners(next);
    setSelectedLearnerId((current) => {
      if (current && next.some((learner) => learner.id === current)) {
        return current;
      }
      return next[0]?.id ?? "";
    });
  }, []);

  const refreshLearners = useCallback(async () => {
    setLoadingLearners(true);
    try {
      const response = await fetch("/api/dashboards/parent");
      if (!response.ok) {
        throw new Error("Unable to load learners");
      }
      const data = (await response.json()) as { learners?: LearnerSnapshot[] };
      syncLearners(data.learners ?? []);
    } catch (error) {
      console.error(error);
      syncLearners([]);
    } finally {
      setLoadingLearners(false);
    }
  }, [syncLearners]);

  const refreshApprovals = useCallback(async () => {
    setLoadingApprovals(true);
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
      setLoadingApprovals(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([refreshLearners(), refreshApprovals()]);
  }, [refreshApprovals, refreshLearners]);

  const handleStream = useCallback(
    (event: DashboardStreamEvent) => {
      if (event.type === "parent-update") {
        syncLearners(event.learners ?? []);
      }
      if (event.type === "approvals-update") {
        setApprovals(event.approvals ?? []);
        setLoadingApprovals(false);
      }
    },
    [syncLearners]
  );

  useDashboardStream("parent", handleStream);

  const selectedLearner = useMemo(
    () => learners.find((learner) => learner.id === selectedLearnerId) ?? null,
    [learners, selectedLearnerId]
  );

  const metrics: MetricCardProps[] = selectedLearner
    ? [
        {
          title: "Current Level",
          value: selectedLearner.actualLevel,
          subtitle: `Grade ${selectedLearner.gradeLevel} content`,
          trend: "+0.5",
          trendDirection: "up"
        },
        {
          title: "Focus Score",
          value: `${selectedLearner.avgFocusScore}%`,
          subtitle: "This week",
          trend: "+5%",
          trendDirection: "up"
        },
        {
          title: "Lessons Completed",
          value: selectedLearner.lessonsCompleted,
          subtitle: "This month"
        },
        {
          title: "Time Spent",
          value: `${selectedLearner.timeSpent}h`,
          subtitle: "This week"
        }
      ]
    : [];

  const respondToApproval = useCallback(
    async (approvalId: string, decision: "APPROVED" | "DECLINED") => {
      const response = await fetch("/api/approval/difficulty-change", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: approvalId, decision })
      });
      if (!response.ok) {
        throw new Error("Unable to update approval");
      }
      await refreshApprovals();
    },
    [refreshApprovals]
  );

  const handleApproval = async (approval: ApprovalRequest) => {
    try {
      await respondToApproval(approval.id, "APPROVED");
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejection = async (approval: ApprovalRequest) => {
    try {
      await respondToApproval(approval.id, "DECLINED");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-wide text-coral">
            Welcome back {session?.user?.name || session?.user?.email || "caregiver"}
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-600">Monitor your child&rsquo;s learning journey</p>
        </header>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Learner</p>
            <select
              className="mt-1 w-64 rounded-xl border border-slate-200 px-4 py-2 text-base shadow-sm"
              value={selectedLearnerId}
              onChange={(event) => setSelectedLearnerId(event.target.value)}
              disabled={loadingLearners || !learners.length}
            >
              {!learners.length && <option>Loading learners...</option>}
              {learners.map((learner) => (
                <option key={learner.id} value={learner.id}>
                  {learner.firstName} {learner.lastName}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-slate-500">
            AI keeps an eye on focus, mastery, and recommendations every 30 minutes.
          </p>
        </div>

        {selectedLearner ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.title} {...metric} />
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="Learning Progress" subtitle="Weekly mastery trend" />
                <CardContent>
                  <LineChart data={selectedLearner.progressData} xKey="date" yKey="score" height={300} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Domain Performance" subtitle="Strengths across standards" />
                <CardContent>
                  <BarChart data={selectedLearner.domainScores} xKey="domain" yKey="score" height={300} />
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader title="Pending Approvals" subtitle="Review AI-generated experiences" action={<Badge label={approvals.length} loading={loadingApprovals} />} />
                <CardContent>
                  <ApprovalQueue approvals={approvals} onApprove={handleApproval} onReject={handleRejection} />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader title="Focus Balance" subtitle="Sessions tagged by AI" />
                  <CardContent>
                    <PieChart data={selectedLearner.focusDistribution ?? []} nameKey="label" valueKey="value" height={240} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader title="AI Insights" subtitle="Personalized nudges" />
                  <CardContent>
                    <AIInsights insights={selectedLearner.aiInsights} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <EmptyState loading={loadingLearners} />
        )}
      </div>
    </div>
  );
}

function Badge({ label, loading }: { label: number; loading?: boolean }) {
  return (
    <span className="rounded-full bg-slate-100 px-4 py-1 text-sm font-semibold text-slate-700">
      {loading ? "•••" : label}
    </span>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
      {loading ? "Loading personalized data..." : "Add a learner to unlock the dashboard."}
    </div>
  );
}
