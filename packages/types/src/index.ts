export * from "./observability";
export * from "./governance";
export * from "./ai-providers";
export * from "./roles";
export * from "./onboarding";

export type Region =
  | "north_america"
  | "africa"
  | "europe"
  | "australia"
  | "middle_east"
  | "asia";

export type GradeBand = "k_5" | "6_8" | "9_12";

export type SubjectCode =
  | "math"
  | "ela"
  | "reading"
  | "writing"
  | "science"
  | "social_studies"
  | "sel"
  | "speech"
  | "other";

export interface SubjectLevel {
  subject: SubjectCode;
  enrolledGrade: number; // Official grade (e.g. 7)
  assessedGradeLevel: number; // Functional level (e.g. 5)
  masteryScore: number; // 0–1, current estimate
}

export type NeurodiversityProfile = {
  autismSpectrum?: boolean;
  adhd?: boolean;
  dyslexia?: boolean;
  dyscalculia?: boolean;
  sensorySensitivity?: boolean;
  prefersLowStimulusUI?: boolean;
  communicationNotes?: string; // e.g. non-speaking, AAC, etc.
  notes?: string;
};

export type LearningPreference = {
  prefersVisual?: boolean;
  prefersAudio?: boolean;
  prefersTextToSpeech?: boolean;
  prefersStepByStep?: boolean;
  prefersGamified?: boolean;
  prefersShortSessions?: boolean;
};

// Re-export Role from roles.ts - this is now the source of truth
// Legacy role type kept for backward compatibility during migration
export type LegacyRoleType =
  | "learner"
  | "parent"
  | "teacher"
  | "district_admin"
  | "platform_admin";

export interface User {
  id: string;
  tenantId: string;
  roles: Role[];
  email: string;
  name?: string;
}

export type LLMProviderName = 
  | "openai" 
  | "anthropic" 
  | "google" 
  | "meta"
  | "cohere"
  | "mistral"
  | "huggingface"
  | "groq"
  | "together"
  | "replicate"
  | "azure_openai"
  | "aws_bedrock"
  | "custom"
  | "aivo_brain";

export interface ModelDispatchConfig {
  primary: LLMProviderName;
  fallbacks: LLMProviderName[];
}

// Learner relationships

export interface Learner {
  id: string;
  tenantId: string;
  userId: string; // FK to User table if you separate identities
  displayName: string;
  currentGrade: number;
  region: Region;
  createdAt: string;
}

export interface GuardianLink {
  learnerId: string;
  guardianUserId: string; // User.id with role "parent"
  relationship: "parent" | "guardian" | "case_manager";
}

export interface TeacherLink {
  learnerId: string;
  teacherUserId: string; // User.id with role "teacher"
  subject: SubjectCode | "all";
}

// Brain profile for each learner

export interface LearnerBrainProfile {
  learnerId: string;
  tenantId: string;
  region: Region;
  currentGrade: number;
  gradeBand: GradeBand;
  subjectLevels: SubjectLevel[];
  neurodiversity: NeurodiversityProfile;
  preferences: LearningPreference;
  lastUpdatedAt: string;
}

// Baseline assessments

export type AssessmentItemType =
  | "multiple_choice"
  | "short_answer"
  | "open_ended";

export interface AssessmentItem {
  id: string;
  subject: SubjectCode;
  type: AssessmentItemType;
  stem: string;
  options?: string[];
  correctAnswer?: string;
  accessibilityNotes?: string;
  estimatedDifficulty: 1 | 2 | 3 | 4 | 5;
}

export interface BaselineAssessment {
  id: string;
  learnerId: string;
  tenantId: string;
  region: Region;
  grade: number;
  subjects: SubjectCode[];
  items: AssessmentItem[];
  createdAt: string;
  status: "draft" | "in_progress" | "completed";
}

export interface AssessmentResponse {
  itemId: string;
  answer: string;
  isCorrect?: boolean;
}

export interface BaselineResultSummary {
  subjectLevels: SubjectLevel[];
  notes?: string;
}

// Difficulty change workflow

export type DifficultyChangeDirection = "easier" | "harder";

export interface DifficultyChangeProposal {
  id: string;
  learnerId: string;
  subject: SubjectCode;
  fromAssessedGradeLevel: number;
  toAssessedGradeLevel: number;
  direction: DifficultyChangeDirection;
  rationale: string;
  createdBy: "system" | "teacher" | "parent";
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  decidedByUserId?: string;
  decidedAt?: string;
  decisionNotes?: string;
}

// --- Multi-tenant and admin types ---

export type TenantType =
  | "district"
  | "independent_school"
  | "clinic"
  | "homeschool_network";

export interface Tenant {
  id: string;
  type: TenantType;
  name: string;
  region: Region;
  createdAt: string;
  isActive: boolean;
}

export interface TenantConfig {
  tenantId: string;
  name: string;
  defaultRegion: Region;
  allowedProviders: LLMProviderName[];
  dataResidency?: string;
  // Which subject standards / curriculum sets are enabled
  curricula: CurriculumConfig[];
}

export type CurriculumStandard =
  | "us_common_core"
  | "us_state_specific"
  | "cambridge"
  | "ib"
  | "local_national"
  | "custom";

export interface CurriculumConfig {
  id: string;
  label: string;
  region: Region;
  standard: CurriculumStandard;
  subjects: SubjectCode[];
}

// Content Authoring & Curriculum Management

export interface CurriculumTopic {
  id: string;
  tenantId: string;
  subject: SubjectCode;
  grade: number;
  region: Region;
  standard: CurriculumStandard;
  code?: string; // e.g., CCSS.MATH.CONTENT.7.EE.B.3
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContentItemType =
  | "explanation"
  | "worked_example"
  | "practice_question"
  | "reflection_prompt";

export type ContentItemStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "deprecated";

export interface ContentItem {
  id: string;
  tenantId: string;
  topicId: string;
  subject: SubjectCode;
  grade: number;
  type: ContentItemType;
  title: string;
  body: string;
  // Optional structure for questions
  questionFormat?: PracticeQuestionFormat;
  options?: string[];
  correctAnswer?: string;
  accessibilityNotes?: string;
  status: ContentItemStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  // Simple AI origin hints
  aiGenerated?: boolean;
  aiModel?: string;
}

export interface District {
  id: string;
  tenantId: string;
  name: string;
  country: string;
  createdAt: string;
}

export interface School {
  id: string;
  tenantId: string;
  districtId?: string | null;
  name: string;
  city?: string;
  createdAt: string;
}

export interface RoleAssignment {
  userId: string;
  tenantId: string;
  districtId?: string | null;
  schoolId?: string | null;
  role: Role;
}

// Session & activity modeling

export type ActivityType =
  | "micro_lesson"
  | "guided_practice"
  | "calm_check_in"
  | "reflection"
  | "gameified_practice";

export type ActivityStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface SessionActivity {
  id: string;
  sessionId: string;
  learnerId: string;
  subject: SubjectCode;
  type: ActivityType;
  title: string;
  instructions: string;
  estimatedMinutes: number;
  status: ActivityStatus;
  startedAt?: string;
  completedAt?: string;
}

export type SessionStatus = "planned" | "active" | "completed" | "abandoned";

export interface LearnerSession {
  id: string;
  learnerId: string;
  tenantId: string;
  date: string; // YYYY-MM-DD
  subject: SubjectCode;
  status: SessionStatus;
  plannedMinutes: number;
  actualMinutes?: number;
  activities: SessionActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionPlanInsights {
  objective: string;
  tone: string;
  difficultySummary: string;
  calmingStrategies: string[];
  recommendedMinutes: number;
}

export interface AgentToolTrace {
  stepId: string;
  label: string;
  toolName: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  notes?: string;
  error?: string;
  savedKeys?: string[];
}

export interface SessionPlanRun {
  plan: LearnerSession;
  insights: SessionPlanInsights;
  trace: AgentToolTrace[];
}

// Progress snapshot

// --- Legacy progress snapshot (kept for backward-compat / simple UIs) ---

export interface SubjectProgressSnapshot {
  learnerId: string;
  subject: SubjectCode;
  date: string; // YYYY-MM-DD
  masteryScore: number; // 0–1, smoothed
  streakDays: number;
  totalMinutesThisWeek: number;
  notes?: string;
}

// --- Analytics & Telemetry -------------------------------------------------

export type TelemetryEventType =
  | "session_completed"
  | "baseline_completed"
  | "difficulty_proposal_created"
  | "difficulty_proposal_decided"
  | "lesson_generated";

export interface TelemetryEvent {
  id: string;
  tenantId: string;
  learnerId: string;
  type: TelemetryEventType;
  subject?: SubjectCode;
  createdAt: string;
  // Simple JSON payload for extra data (sessionId, masteryDelta, etc.)
  payload: unknown;
}

export interface SubjectProgressSnapshotPoint {
  id: string;
  learnerId: string;
  subject: SubjectCode;
  date: string; // YYYY-MM-DD
  masteryScore: number; // 0–1
  minutesPracticed: number;
  difficultyLevel: number; // interpreted as assessedGradeLevel or similar
}

export interface LearnerProgressTimeseriesPoint {
  date: string;
  masteryScore: number;
  minutesPracticed: number;
  difficultyLevel: number;
}

export interface LearnerSubjectProgressOverview {
  subject: SubjectCode;
  enrolledGrade: number;
  currentAssessedGradeLevel: number;
  timeseries: LearnerProgressTimeseriesPoint[];
}

export interface ExplainableRecommendationFactor {
  label: string;
  description: string;
  weight: number; // relative importance 0–1
}

export interface ExplainableDifficultySummary {
  subject: SubjectCode;
  currentDifficultyLevel: number;
  targetDifficultyLevel: number;
  rationale: string;
  factors: ExplainableRecommendationFactor[];
}

export interface LearnerAnalyticsOverview {
  learnerId: string;
  subjects: LearnerSubjectProgressOverview[];
  difficultySummaries: ExplainableDifficultySummary[];
}

// --- Brain domains and lesson content ---

export type BrainDomain =
  | "conceptual_understanding"
  | "procedural_fluency"
  | "strategic_reasoning"
  | "real_world_application"
  | "executive_function_support"
  | "self_regulation";

export type LessonContentType =
  | "calm_intro"
  | "worked_example"
  | "guided_practice"
  | "independent_practice"
  | "reflection_prompt"
  | "strategy_tip"
  | "sensory_break_suggestion";

export type PracticeQuestionFormat =
  | "multiple_choice"
  | "open_ended"
  | "fill_in_the_blank"
  | "step_by_step"
  | "sortable_steps";

export interface LessonBlock {
  id: string;
  order: number;
  type: LessonContentType;
  domain: BrainDomain;
  title: string;
  prompt: string;
  studentFacingText: string;
  example?: string;
  practiceQuestion?: string;
  practiceFormat?: PracticeQuestionFormat;
  accessibilityNotes?: string;
  estimatedMinutes?: number;
}

export interface LessonPlan {
  id: string;
  learnerId: string;
  tenantId: string;
  subject: SubjectCode;
  region: Region;
  domain?: BrainDomain;
  title: string;
  objective: string;
  blocks: LessonBlock[];
  createdAt: string;
}

// --- Caregiver notifications & overview ---

export type NotificationAudience = "parent" | "teacher" | "district_admin";

export type NotificationType =
  | "difficulty_proposal"
  | "baseline_completed"
  | "session_completed"
  | "message_from_teacher"
  | "message_from_parent";

export type NotificationStatus = "unread" | "read";

export interface Notification {
  id: string;
  tenantId: string;
  learnerId: string;
  // For simplicity, we store user IDs of recipients; in future, this could be group-based.
  recipientUserId: string;
  audience: NotificationAudience;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  status: NotificationStatus;
  relatedDifficultyProposalId?: string;
  relatedBaselineAssessmentId?: string;
  relatedSessionId?: string;
}

// Lightweight caregiver-facing learner overview

export interface CaregiverSubjectView {
  subject: SubjectCode;
  enrolledGrade: number;
  assessedGradeLevel: number;
  masteryScore: number;
  difficultyRecommendation?: "easier" | "maintain" | "harder";
}

export interface CaregiverLearnerOverview {
  learner: Learner;
  brainProfile: LearnerBrainProfile | null;
  subjects: CaregiverSubjectView[];
  lastBaselineSummary?: BaselineResultSummary;
  recentSessionDates: string[]; // e.g., last 5 dates a session was completed
  pendingDifficultyProposals: DifficultyChangeProposal[];
}

// Lightweight summaries for caregiver mobile dashboards

export interface NotificationSummary {
  id: string;
  title: string;
  body: string;
  createdAtFriendly: string;
}

export interface DifficultyProposalSummary {
  id: string;
  learnerName: string;
  subjectLabel: string;
  currentDifficultyLabel: string;
  proposedDifficultyLabel: string;
  createdAtFriendly: string;
}

// --- Experiments & Feedback for A/B testing & evaluation ---

export type ExperimentStatus = "draft" | "running" | "paused" | "completed";

export interface ExperimentVariant {
  id: string;
  key: string; // e.g. "prompt_v1", "prompt_v2"
  label: string;
  description?: string;
}

export interface Experiment {
  id: string;
  tenantId: string;
  key: string; // e.g. "tutor_prompt_style"
  name: string;
  description?: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentAssignment {
  learnerId: string;
  experimentId: string;
  variantKey: string;
  assignedAt: string;
}

export type FeedbackTargetType =
  | "tutor_turn"
  | "session_plan"
  | "content_item"
  | "difficulty_decision";

export type FeedbackRole = "learner" | "parent" | "teacher" | "admin";

export interface Feedback {
  id: string;
  tenantId: string;
  learnerId?: string;
  userId?: string;
  targetType: FeedbackTargetType;
  targetId: string; // e.g. TutorChatTurn.id, Session.id, ContentItem.id, DifficultyProposal.id
  role: FeedbackRole;
  rating: number; // -1, 0, 1 or 1-5 scale (first version: use 1–5)
  label?: string; // e.g. "helpful", "too_easy", "too_hard"
  comment?: string;
  experimentKey?: string;
  variantKey?: string;
  createdAt: string;
}
