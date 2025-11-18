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

export type Role =
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

export type LLMProviderName = "openai" | "anthropic" | "google" | "meta";

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

// Progress snapshot

export interface SubjectProgressSnapshot {
  learnerId: string;
  subject: SubjectCode;
  date: string; // YYYY-MM-DD
  masteryScore: number; // 0–1, smoothed
  streakDays: number;
  totalMinutesThisWeek: number;
  notes?: string;
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
