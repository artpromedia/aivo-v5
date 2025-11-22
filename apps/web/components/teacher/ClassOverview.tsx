import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { LineChart, BarChart, PieChart } from "@/components/charts";
import { MetricCard, type MetricCardProps } from "@/components/dashboard/MetricCard";
import { RecommendationList } from "@/components/teacher/RecommendationList";
import { ApprovalQueue } from "@/components/parent/ApprovalQueue";
import type { ApprovalRequest, TeacherDashboardData } from "@/lib/types/dashboard";

export type ClassOverviewProps = {
  dashboard: TeacherDashboardData;
  approvals: ApprovalRequest[];
  approvalsLoading: boolean;
  onApprove: (approval: ApprovalRequest) => void | Promise<void>;
  onReject: (approval: ApprovalRequest) => void | Promise<void>;
};

export function ClassOverview({ dashboard, approvals, approvalsLoading, onApprove, onReject }: ClassOverviewProps) {
  const metricCards: MetricCardProps[] = dashboard.metrics.map((metric) => ({
    title: metric.label,
    value: metric.value,
    trend: metric.change,
    trendDirection: metric.direction
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Mastery Momentum" subtitle="Weekly class proficiency" />
          <CardContent>
            <LineChart data={dashboard.trendline} xKey="date" yKey="score" height={320} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Domain Performance" subtitle="Where the class excels" />
          <CardContent>
            <BarChart data={dashboard.domainPerformance} xKey="domain" yKey="score" height={320} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Focus Distribution" subtitle="AI tagged session states" />
          <CardContent>
            <PieChart data={dashboard.focusDistribution} nameKey="label" valueKey="value" height={260} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="AI Recommendations" subtitle="Most impactful nudges" />
          <CardContent>
            <RecommendationList recommendations={dashboard.recommendations} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Learners Needing Support" subtitle="Prioritized by AI" />
          <CardContent>
            <AtRiskList learners={dashboard.atRiskLearners} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Approvals" subtitle="Parent-facing consent" action={<Badge label={approvals.length} loading={approvalsLoading} />} />
          <CardContent>
            <ApprovalQueue approvals={approvals} onApprove={onApprove} onReject={onReject} />
          </CardContent>
        </Card>
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

function AtRiskList({ learners }: { learners: TeacherDashboardData["atRiskLearners"]; }) {
  if (!learners?.length) {
    return <p className="text-sm text-slate-500">No active flags. Keep routines steady.</p>;
  }

  return (
    <ul className="space-y-4">
      {learners.map((learner) => (
        <li key={learner.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{learner.mastery}</p>
              <h4 className="text-base font-semibold text-slate-900">{learner.name}</h4>
              <p className="text-sm text-slate-600">Focus {learner.focusScore}% · Blocker: {learner.blocker}</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Action</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">{learner.suggestedAction}</p>
        </li>
      ))}
    </ul>
  );
}
