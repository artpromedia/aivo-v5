export type Region = "north_america" | "africa" | "europe" | "australia" | "middle_east" | "asia";
export type GradeBand = "k_5" | "6_8" | "9_12";
export type SubjectCode = "math" | "ela" | "reading" | "writing" | "science" | "social_studies" | "sel" | "speech" | "other";
export interface SubjectLevel {
    subject: SubjectCode;
    enrolledGrade: number;
    assessedGradeLevel: number;
    masteryScore: number;
}
export type NeurodiversityProfile = {
    autismSpectrum?: boolean;
    adhd?: boolean;
    dyslexia?: boolean;
    dyscalculia?: boolean;
    sensorySensitivity?: boolean;
    prefersLowStimulusUI?: boolean;
    communicationNotes?: string;
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
export type Role = "learner" | "parent" | "teacher" | "district_admin" | "platform_admin";
export interface User {
    id: string;
    tenantId: string;
    roles: Role[];
    email: string;
    name?: string;
}
export interface TenantConfig {
    tenantId: string;
    name: string;
    defaultRegion: Region;
    allowedProviders: LLMProviderName[];
    dataResidency?: string;
}
export type LLMProviderName = "openai" | "anthropic" | "google" | "meta";
export interface ModelDispatchConfig {
    primary: LLMProviderName;
    fallbacks: LLMProviderName[];
}
export interface Learner {
    id: string;
    tenantId: string;
    userId: string;
    displayName: string;
    currentGrade: number;
    region: Region;
    createdAt: string;
}
export interface GuardianLink {
    learnerId: string;
    guardianUserId: string;
    relationship: "parent" | "guardian" | "case_manager";
}
export interface TeacherLink {
    learnerId: string;
    teacherUserId: string;
    subject: SubjectCode | "all";
}
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
export type AssessmentItemType = "multiple_choice" | "short_answer" | "open_ended";
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
