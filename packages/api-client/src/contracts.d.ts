import type { BaselineAssessment, BaselineResultSummary, DifficultyChangeProposal, Learner, LearnerBrainProfile, SubjectCode, Region, LessonPlan, BrainDomain } from "@aivo/types";
export interface MeResponse {
    userId: string;
    tenantId: string;
    roles: string[];
    learner?: {
        id: string;
        displayName: string;
        subjects: string[];
        region?: Region;
    };
}
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
export interface GenerateLessonPlanRequest {
    learnerId: string;
    subject: SubjectCode;
    region: Region;
    domain?: BrainDomain;
}
export interface GenerateLessonPlanResponse {
    plan: LessonPlan;
}
