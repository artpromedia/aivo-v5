import type {
  BaselineAssessment,
  BaselineResultSummary,
  DifficultyChangeProposal,
  Learner,
  LearnerBrainProfile,
  SubjectCode,
  Region
} from "@aivo/types";

// Auth

export interface MeResponse {
  userId: string;
  tenantId: string;
  roles: string[];
}

// Learners

export interface CreateLearnerRequest {
  displayName: string;
  region: Region;
  currentGrade: number;
}

export interface CreateLearnerResponse {
  learner: Learner;
  brainProfile: LearnerBrainProfile;
}

export interface GetLearnerResponse {
  learner: Learner;
  brainProfile: LearnerBrainProfile | null;
}

// Baseline assessment

export interface GenerateBaselineRequest {
  learnerId: string;
  subjects: SubjectCode[];
}

export interface GenerateBaselineResponse {
  assessment: BaselineAssessment;
}

export interface SubmitBaselineResponsesRequest {
  assessmentId: string;
  responses: {
    itemId: string;
    answer: string;
  }[];
}

export interface SubmitBaselineResponsesResponse {
  summary: BaselineResultSummary;
  updatedBrainProfile: LearnerBrainProfile;
}

// Difficulty proposals

export interface CreateDifficultyProposalRequest {
  learnerId: string;
  subject: SubjectCode;
  toAssessedGradeLevel: number;
  rationale?: string;
}

export interface CreateDifficultyProposalResponse {
  proposal: DifficultyChangeProposal;
}

export interface DecideOnDifficultyProposalRequest {
  proposalId: string;
  approve: boolean;
  notes?: string;
}

export interface DecideOnDifficultyProposalResponse {
  proposal: DifficultyChangeProposal;
}

export interface ListDifficultyProposalsResponse {
  proposals: DifficultyChangeProposal[];
}

// Lessons / tutoring (simple starter contract)

export interface GenerateLessonPlanRequest {
  learnerId: string;
  subject: SubjectCode;
}

export interface GenerateLessonPlanResponse {
  id: string;
  subject: SubjectCode;
  title: string;
  objectives: string[];
  activities: string[];
  accessibilityNotes: string;
}
