import { ApprovalStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isGuardianRole } from "@/lib/roles";
import { logInfo, recordMetricPoint, traceAsync } from "@/lib/observability";
import type {
  AIInsight,
  AIRecommendation,
  ApprovalRequest as DashboardApproval,
  AtRiskLearner,
  FocusSlice,
  LearnerProgressPoint,
  LearnerSnapshot,
  TeacherAssignment,
  TeacherDashboardData,
  TeacherMetric,
  TeacherStudentSummary
} from "@/lib/types/dashboard";

const DAYS_7 = 1000 * 60 * 60 * 24 * 7;
const DAYS_14 = DAYS_7 * 2;
const DAYS_30 = 1000 * 60 * 60 * 24 * 30;

const chartDateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

type LearnerWithRelations = Prisma.LearnerGetPayload<{
  include: {
    assessments: { orderBy: { createdAt: "asc" } };
    focusData: { orderBy: { timestamp: "asc" } };
  };
}>;

type ApprovalWithLearner = Prisma.ApprovalRequestGetPayload<{
  include: { learner: { select: { firstName: true; lastName: true; guardianId: true } } };
}>;

type AssessmentResults = {
  overallLevel?: number;
  domainLevels?: Record<string, number>;
  domainSummaries?: Record<string, string>;
  strengths?: string[];
  challenges?: string[];
  recommendations?: string[];
  learningProfile?: string;
  questionLedger?: Array<Record<string, unknown>>;
};

type FocusEvent = { score: number; createdAt: Date };

type SnapshotContext = {
  snapshot: LearnerSnapshot;
  focusEvents: FocusEvent[];
  latestResults: AssessmentResults | null;
};

function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asArray<T = unknown>(value: unknown): T[] | null {
  if (!Array.isArray(value)) return null;
  return value as T[];
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatLevel(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function formatChartLabel(date: Date | null): string {
  if (!date) return "Unknown";
  return chartDateFormat.format(date);
}

function estimateMinutesFromLedger(ledger: AssessmentResults["questionLedger"]): number {
  if (!Array.isArray(ledger) || ledger.length === 0) {
    return 0;
  }
  const minutes = ledger.length * 2.5; // assume ~2.5 minutes per adaptive prompt
  return Math.round(minutes * 10) / 10;
}

function computeFocusDistribution(events: FocusEvent[]): FocusSlice[] {
  if (!events.length) {
    return [
      { label: "Calm", value: 60, color: "#22c55e" },
      { label: "Neutral", value: 30, color: "#fde047" },
      { label: "Needs Break", value: 10, color: "#fb923c" }
    ];
  }
  const buckets = {
    calm: 0,
    neutral: 0,
    needsBreak: 0
  };
  events.forEach((event) => {
    if (event.score >= 80) {
      buckets.calm += 1;
    } else if (event.score >= 55) {
      buckets.neutral += 1;
    } else {
      buckets.needsBreak += 1;
    }
  });
  const total = events.length || 1;
  return [
    { label: "Calm", value: Math.round((buckets.calm / total) * 100), color: "#22c55e" },
    { label: "Neutral", value: Math.round((buckets.neutral / total) * 100), color: "#fde047" },
    { label: "Needs Break", value: Math.round((buckets.needsBreak / total) * 100), color: "#fb923c" }
  ];
}

function buildAIInsights(results: AssessmentResults | null): AIInsight[] {
  if (!results) {
    return [
      {
        icon: "✨",
        title: "Learning profile warming up",
        description: "AI will surface insights once the next assessment is complete."
      }
    ];
  }

  const insights: AIInsight[] = [];
  const strengths = asArray<string>(results.strengths) ?? [];
  const challenges = asArray<string>(results.challenges) ?? [];
  const recommendations = asArray<string>(results.recommendations) ?? [];

  if (strengths.length) {
    insights.push({
      icon: "🧠",
      title: "Strength highlight",
      description: strengths[0],
      impact: "+confidence",
      sentiment: "positive"
    });
  }

  if (challenges.length) {
    insights.push({
      icon: "🎯",
      title: "Targeted support",
      description: challenges[0],
      action: "Schedule guided practice",
      sentiment: "warning"
    });
  }

  if (recommendations.length) {
    insights.push({
      icon: "🤖",
      title: "AI recommendation",
      description: recommendations[0],
      action: "Review upcoming lesson plan",
      sentiment: "neutral"
    });
  }

  if (!insights.length) {
    insights.push({
      icon: "✨",
      title: "Data syncing",
      description: "We are still compiling insights for this learner."
    });
  }

  return insights;
}

function buildLearnerSnapshot(learner: LearnerWithRelations): SnapshotContext {
  const completedAssessments = learner.assessments.filter((assessment) => assessment.status === "COMPLETED");
  const sortedAssessments = [...completedAssessments].sort((a, b) => {
    const aDate = a.completedAt ?? a.createdAt;
    const bDate = b.completedAt ?? b.createdAt;
    return aDate.getTime() - bDate.getTime();
  });
  const latestAssessment = sortedAssessments.at(-1) ?? null;
  const latestResults = asObject(latestAssessment?.results) as AssessmentResults | null;

  const progressData: LearnerProgressPoint[] = sortedAssessments.slice(-8).map((assessment) => {
    const score =
      numberOrNull(asObject(assessment.results)?.overallLevel) ??
      numberOrNull((asObject(assessment.results)?.domainLevels as Record<string, unknown> | undefined)?.overall);
    return {
      date: formatChartLabel(assessment.completedAt ?? assessment.createdAt),
      score: score ?? 0
    };
  });

  const domainScores = Object.entries(latestResults?.domainLevels ?? {}).map(([domain, score]) => ({
    domain,
    score: numberOrNull(score) ?? 0
  }));

  const thirtyDaysAgo = new Date(Date.now() - DAYS_30);
  const lessonsCompleted = completedAssessments.filter((assessment) => (assessment.completedAt ?? assessment.createdAt) >= thirtyDaysAgo).length;
  const totalMinutes = completedAssessments.reduce((sum, assessment) => {
    const results = asObject(assessment.results) as AssessmentResults | null;
    return sum + estimateMinutesFromLedger(results?.questionLedger);
  }, 0);

  const focusEvents: FocusEvent[] = learner.focusData
    .map((entry) => {
      const focusScore = numberOrNull(entry.focusScore);
      if (focusScore === null) return null;
      return {
        score: focusScore,
        createdAt: entry.timestamp ?? entry.createdAt
      } satisfies FocusEvent;
    })
    .filter(Boolean) as FocusEvent[];

  const averageFocus = focusEvents.length
    ? Math.round(focusEvents.reduce((sum, item) => sum + item.score, 0) / focusEvents.length)
    : 92;

  const snapshot: LearnerSnapshot = {
    id: learner.id,
    firstName: learner.firstName,
    lastName: learner.lastName,
    gradeLevel: learner.gradeLevel,
    actualLevel: formatLevel(
      numberOrNull(latestResults?.overallLevel) ?? numberOrNull(learner.actualLevel) ?? learner.gradeLevel
    ),
    avgFocusScore: averageFocus,
    lessonsCompleted,
    timeSpent: Number((totalMinutes / 60).toFixed(1)),
    progressData,
    domainScores,
    focusDistribution: computeFocusDistribution(focusEvents),
    aiInsights: buildAIInsights(latestResults)
  };

  return { snapshot, focusEvents, latestResults };
}

function mapApproval(record: ApprovalWithLearner): DashboardApproval {
  const details = asObject(record.details);
  const title = typeof details?.title === "string" ? details.title : humanizeType(record.type);
  const summary =
    typeof details?.reasoning === "string"
      ? details.reasoning
      : typeof details?.summary === "string"
        ? details.summary
        : "AI flagged a pacing adjustment.";
  const recommendedAction = typeof details?.recommendedAction === "string" ? details.recommendedAction : "Review and respond";

  return {
    id: record.id,
    learnerId: record.learnerId,
    learnerName: `${record.learner.firstName} ${record.learner.lastName}`,
    type: record.type,
    title,
    summary,
    requestedBy: record.requesterId,
    requestedAt: record.createdAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    recommendedAction,
    status: mapApprovalStatus(record.status),
    details: details ?? undefined
  };
}

function mapApprovalStatus(status: ApprovalStatus): DashboardApproval["status"] {
  switch (status) {
    case "PENDING":
      return "pending";
    case "APPROVED":
      return "approved";
    case "REJECTED":
    case "EXPIRED":
    default:
      return "rejected";
  }
}

function humanizeType(type: string) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function aggregateTrendline(snapshots: SnapshotContext[]): LearnerProgressPoint[] {
  const bucket = new Map<string, { total: number; count: number }>();
  snapshots.forEach((ctx) => {
    ctx.snapshot.progressData.forEach((point) => {
      const entry = bucket.get(point.date) ?? { total: 0, count: 0 };
      entry.total += point.score;
      entry.count += 1;
      bucket.set(point.date, entry);
    });
  });
  return Array.from(bucket.entries())
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .slice(-8)
    .map(([label, value]) => ({ date: label, score: value.count ? Math.round(value.total / value.count) : 0 }));
}

function aggregateDomainPerformance(snapshots: SnapshotContext[]): { domain: string; score: number }[] {
  const bucket = new Map<string, { total: number; count: number }>();
  snapshots.forEach((ctx) => {
    ctx.snapshot.domainScores.forEach((domainScore) => {
      const entry = bucket.get(domainScore.domain) ?? { total: 0, count: 0 };
      entry.total += domainScore.score;
      entry.count += 1;
      bucket.set(domainScore.domain, entry);
    });
  });
  return Array.from(bucket.entries()).map(([domain, value]) => ({
    domain,
    score: value.count ? Math.round(value.total / value.count) : 0
  }));
}

function aggregateFocusDistributionFromSnapshots(snapshots: SnapshotContext[]): FocusSlice[] {
  if (!snapshots.length) {
    return computeFocusDistribution([]);
  }
  const bucket = { calm: 0, neutral: 0, needsBreak: 0 };
  snapshots.forEach((ctx) => {
    ctx.snapshot.focusDistribution?.forEach((slice) => {
      if (slice.label === "Calm") bucket.calm += slice.value;
      if (slice.label === "Neutral") bucket.neutral += slice.value;
      if (slice.label === "Needs Break") bucket.needsBreak += slice.value;
    });
  });

  const total = bucket.calm + bucket.neutral + bucket.needsBreak || 1;
  return [
    { label: "Calm", value: Math.round((bucket.calm / total) * 100), color: "#22c55e" },
    { label: "Neutral", value: Math.round((bucket.neutral / total) * 100), color: "#fde047" },
    { label: "Needs Break", value: Math.round((bucket.needsBreak / total) * 100), color: "#fb923c" }
  ];
}

function buildAtRiskLearners(contexts: SnapshotContext[]): AtRiskLearner[] {
  return contexts
    .map((ctx) => ({
      id: ctx.snapshot.id,
      name: `${ctx.snapshot.firstName} ${ctx.snapshot.lastName}`,
      focusScore: ctx.snapshot.avgFocusScore,
      mastery: ctx.snapshot.domainScores[0]?.domain ?? "Overall",
      blocker: ctx.snapshot.domainScores[0]?.score < 70 ? "Mastery gap" : "Focus dips",
      suggestedAction: ctx.snapshot.aiInsights[0]?.action ?? "Review AI insight"
    }))
    .sort((a, b) => a.focusScore - b.focusScore)
    .slice(0, 3);
}

function buildRecommendations(atRiskLearners: AtRiskLearner[]): AIRecommendation[] {
  if (!atRiskLearners.length) {
    return [
      {
        id: "rec-stay-the-course",
        persona: "group",
        title: "Maintain current routines",
        rationale: "AI has not flagged urgent interventions. Keep current cadence steady.",
        expectedImpact: "Stable mastery",
        urgency: "low"
      }
    ];
  }

  return atRiskLearners.map((learner, index) => ({
    id: `rec-${learner.id}`,
    persona: "learner",
    title: `Support ${learner.name}`,
    rationale: `${learner.name} is trending at ${learner.focusScore}% focus. ${learner.blocker}.`,
    expectedImpact: "+10% focus if addressed",
    urgency: index === 0 ? "high" : index === 1 ? "medium" : "low"
  }));
}

function buildTeacherStudents(contexts: SnapshotContext[]): TeacherStudentSummary[] {
  return contexts.slice(0, 24).map((ctx) => {
    const latestScore = ctx.snapshot.progressData.at(-1)?.score ?? 0;
    const status = latestScore < 60 || ctx.snapshot.avgFocusScore < 60 ? "needs-support" : ctx.snapshot.avgFocusScore < 75 ? "watch" : "on-track";
    return {
      id: ctx.snapshot.id,
      firstName: ctx.snapshot.firstName,
      lastName: ctx.snapshot.lastName,
      gradeLevel: ctx.snapshot.gradeLevel,
      actualLevel: ctx.snapshot.actualLevel,
      focusScore: ctx.snapshot.avgFocusScore,
      overallProgress: latestScore,
      status
    } satisfies TeacherStudentSummary;
  });
}

function buildAssignments(
  learners: AtRiskLearner[],
  approvals: DashboardApproval[]
): TeacherAssignment[] {
  const learnerTasks = learners.map((learner, index) => ({
    id: `support-${learner.id}`,
    title: `Coach ${learner.name}`,
    description: learner.suggestedAction,
    dueDate: new Date(Date.now() + (index + 3) * 24 * 60 * 60 * 1000).toISOString(),
    status: "planned" as const,
    priority: (learner.focusScore < 60 ? "high" : "medium") as TeacherAssignment["priority"],
    learnerName: learner.name
  }));

  const approvalTasks = approvals.slice(0, 5).map((approval) => ({
    id: `approval-${approval.id}`,
    title: approval.title,
    description: approval.summary,
    dueDate: approval.requestedAt,
    status: (approval.status === "pending" ? "in-progress" : "completed") as TeacherAssignment["status"],
    priority: (approval.status === "pending" ? "high" : "medium") as TeacherAssignment["priority"],
    learnerName: approval.learnerName
  }));

  return [...approvalTasks, ...learnerTasks].slice(0, 12);
}

function buildTeacherMetrics(
  focusEvents: FocusEvent[],
  recentLessons: { currentWeek: number; previousWeek: number },
  approvalStats: { pending: number; resolved: number; total: number }
): TeacherMetric[] {
  const latestScores = focusEvents.slice(-10);
  const midpoint = Math.floor(latestScores.length / 2);
  const recentAvg = latestScores.length
    ? Math.round(
        latestScores.slice(midpoint).reduce((sum, event) => sum + event.score, 0) /
          Math.max(1, latestScores.slice(midpoint).length)
      )
    : 0;
  const previousAvg = latestScores.length
    ? Math.round(
        latestScores
          .slice(0, midpoint || 1)
          .reduce((sum, event) => sum + event.score, 0) /
          Math.max(1, midpoint || 1)
      )
    : 0;
  const focusDelta = recentAvg - previousAvg;

  const lessonDelta = recentLessons.currentWeek - recentLessons.previousWeek;
  const parentResponseRate = approvalStats.total
    ? Math.round((approvalStats.resolved / approvalStats.total) * 100)
    : 0;

  return [
    {
      label: "Avg Focus",
      value: `${recentAvg || 0}%`,
      change: `${focusDelta >= 0 ? "+" : ""}${focusDelta}% vs prev. window`,
      direction: focusDelta >= 0 ? "up" : "down"
    },
    {
      label: "Lessons Completed",
      value: recentLessons.currentWeek.toString(),
      change: `${lessonDelta >= 0 ? "+" : ""}${lessonDelta} WoW`,
      direction: lessonDelta >= 0 ? "up" : "down"
    },
    {
      label: "AI Interventions",
      value: approvalStats.pending.toString(),
      change: `${approvalStats.pending} awaiting guardian action`,
      direction: approvalStats.pending > 0 ? "up" : "flat"
    },
    {
      label: "Parent Responses",
      value: `${parentResponseRate}%`,
      change: `${approvalStats.resolved}/${approvalStats.total || 1} last 30d`,
      direction: parentResponseRate >= 75 ? "up" : parentResponseRate >= 50 ? "flat" : "down"
    }
  ];
}

export async function getGuardianLearners(userId: string) {
  return traceAsync(
    "dashboard.getGuardianLearners",
    async () => {
      const learners: LearnerWithRelations[] = await prisma.learner.findMany({
        where: { guardianId: userId },
        include: {
          assessments: { orderBy: { createdAt: "asc" } },
          focusData: { orderBy: { timestamp: "asc" } }
        },
        orderBy: { createdAt: "asc" }
      });
      const snapshots = learners.map((learner) => buildLearnerSnapshot(learner).snapshot);
      recordMetricPoint("dashboard.guardian.learners.count", snapshots.length, { userId });
      logInfo("Guardian dashboard snapshot hydrated", { userId }, { learnerCount: snapshots.length });
      return snapshots;
    },
    { context: { userId }, durationMetric: "dashboard.guardian.learners.duration_ms" }
  );
}

export async function getApprovalsForUser(userId: string, role: Role) {
  return traceAsync(
    "dashboard.getApprovalsForUser",
    async () => {
      const where = isGuardianRole(role)
        ? { status: "PENDING" as ApprovalStatus, learner: { guardianId: userId } }
        : { status: "PENDING" as ApprovalStatus };

      const approvals = await prisma.approvalRequest.findMany({
        where,
        include: { learner: { select: { firstName: true, lastName: true, guardianId: true } } },
        orderBy: { createdAt: "desc" },
        take: 25
      });

      const mapped = approvals.map(mapApproval);
      recordMetricPoint(
        "dashboard.approvals.pending.count",
        mapped.length,
        { userId },
        { role }
      );
      return mapped;
    },
    { context: { userId }, durationMetric: "dashboard.approvals.duration_ms", labels: { role } }
  );
}

export async function getTeacherDashboard(userId: string, role: Role): Promise<TeacherDashboardData> {
  if (role !== Role.TEACHER && role !== Role.ADMIN) {
    throw new Error("Only teachers or admins can view this dashboard");
  }

  return traceAsync(
    "dashboard.getTeacherDashboard",
    async () => {
      const learners: LearnerWithRelations[] = await prisma.learner.findMany({
        include: {
          assessments: { orderBy: { createdAt: "asc" } },
          focusData: { orderBy: { timestamp: "asc" } }
        },
        orderBy: { createdAt: "asc" },
        take: 60
      });

      const snapshotContexts = learners.map((learner) => buildLearnerSnapshot(learner));
      const allFocusEvents = snapshotContexts.flatMap((ctx) => ctx.focusEvents);

      const now = Date.now();
      const weekAgo = new Date(now - DAYS_7);
      const twoWeeksAgo = new Date(now - DAYS_14);
      const monthAgo = new Date(now - DAYS_30);

      const [currentWeekLessons, previousWeekLessons, pendingApprovalsCount, resolvedApprovals, totalApprovals] = await Promise.all([
        prisma.assessment.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.assessment.count({ where: { createdAt: { lt: weekAgo, gte: twoWeeksAgo } } }),
        prisma.approvalRequest.count({ where: { status: "PENDING" } }),
  prisma.approvalRequest.count({ where: { status: { in: ["APPROVED", "REJECTED"] }, decidedAt: { gte: monthAgo } } }),
        prisma.approvalRequest.count({ where: { createdAt: { gte: monthAgo } } })
      ]);

      const atRiskLearners = buildAtRiskLearners(snapshotContexts);
      const recommendations = buildRecommendations(atRiskLearners);
      const students = buildTeacherStudents(snapshotContexts);
      const approvals = (await getApprovalsForUser(userId, role)).slice(0, 8);
      const assignments = buildAssignments(atRiskLearners, approvals);

      const metrics = buildTeacherMetrics(
        allFocusEvents,
        { currentWeek: currentWeekLessons, previousWeek: previousWeekLessons },
        { pending: pendingApprovalsCount, resolved: resolvedApprovals, total: Math.max(totalApprovals, 1) }
      );

      recordMetricPoint("dashboard.teacher.learners.count", learners.length, { userId }, { role });
      recordMetricPoint("dashboard.teacher.approvals.pending", pendingApprovalsCount, { userId }, { role });
      logInfo("Teacher dashboard aggregated", { userId }, {
        learnerCount: learners.length,
        pendingApprovals: pendingApprovalsCount,
        focusEvents: allFocusEvents.length
      });

      return {
        metrics,
        trendline: aggregateTrendline(snapshotContexts),
        domainPerformance: aggregateDomainPerformance(snapshotContexts),
        focusDistribution: aggregateFocusDistributionFromSnapshots(snapshotContexts),
        atRiskLearners,
        recommendations,
        approvals,
        students,
        assignments
      };
    },
    { context: { userId }, durationMetric: "dashboard.teacher.duration_ms", labels: { role } }
  );
}
