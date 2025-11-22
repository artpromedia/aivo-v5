export type TrendDirection = "up" | "down" | "flat";

export type LearnerProgressPoint = {
  date: string;
  score: number;
};

export type DomainScore = {
  domain: string;
  score: number;
};

export type FocusSlice = {
  label: string;
  value: number;
  color?: string;
};

export type AIInsight = {
  icon?: string;
  title: string;
  description: string;
  action?: string;
  impact?: string;
  sentiment?: "positive" | "warning" | "neutral";
};

export type LearnerSnapshot = {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  actualLevel: string;
  avgFocusScore: number;
  lessonsCompleted: number;
  timeSpent: number;
  progressData: LearnerProgressPoint[];
  domainScores: DomainScore[];
  focusDistribution?: FocusSlice[];
  aiInsights: AIInsight[];
};

export type ApprovalRequest = {
  id: string;
  learnerId: string;
  learnerName: string;
  type: string;
  title: string;
  summary: string;
  requestedBy: string;
  requestedAt: string;
  createdAt: string;
  recommendedAction: string;
  status: "pending" | "approved" | "rejected";
  details?: Record<string, unknown>;
};

export type TeacherStudentSummary = {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  actualLevel: string;
  focusScore: number;
  overallProgress: number;
  status: "on-track" | "watch" | "needs-support";
};

export type TeacherAssignment = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: "planned" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  learnerName?: string;
};

export type MetricSummary = {
  label: string;
  value: string;
  subtitle?: string;
  trendLabel?: string;
  trendDirection?: TrendDirection;
};

export type TeacherMetric = {
  label: string;
  value: string;
  change: string;
  direction: TrendDirection;
};

export type AtRiskLearner = {
  id: string;
  name: string;
  focusScore: number;
  mastery: string;
  blocker: string;
  suggestedAction: string;
};

export type AIRecommendation = {
  id: string;
  persona: "learner" | "group" | "family";
  title: string;
  rationale: string;
  expectedImpact: string;
  urgency: "low" | "medium" | "high";
};

export type TeacherDashboardData = {
  metrics: TeacherMetric[];
  trendline: LearnerProgressPoint[];
  domainPerformance: DomainScore[];
  focusDistribution: FocusSlice[];
  atRiskLearners: AtRiskLearner[];
  recommendations: AIRecommendation[];
  approvals: ApprovalRequest[];
  students: TeacherStudentSummary[];
  assignments: TeacherAssignment[];
};

export type DashboardStreamEvent =
  | { type: "parent-update"; learners: LearnerSnapshot[] }
  | { type: "teacher-update"; dashboard: TeacherDashboardData }
  | { type: "approvals-update"; approvals: ApprovalRequest[] };
