export type Region =
  | "north_america"
  | "africa"
  | "europe"
  | "australia"
  | "middle_east"
  | "asia";

export type GradeBand = "k_5" | "6_8" | "9_12";

export type Subject =
  | "math"
  | "reading"
  | "writing"
  | "science"
  | "social_studies"
  | "sel"
  | "speech"
  | "other";

export interface SubjectLevel {
  subject: Subject;
  enrolledGrade: number;
  assessedGradeLevel: number;
  masteryScore: number; // 0-1
}

export type NeurodiversityProfile = {
  autismSpectrum?: boolean;
  adhd?: boolean;
  dyslexia?: boolean;
  dyscalculia?: boolean;
  sensorySensitivity?: boolean;
  prefersLowStimulusUI?: boolean;
  notes?: string;
};

export type LearningPreference = {
  prefersVisual?: boolean;
  prefersAudio?: boolean;
  prefersTextToSpeech?: boolean;
  prefersStepByStep?: boolean;
  prefersGamified?: boolean;
};

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

export interface TenantConfig {
  tenantId: string;
  name: string;
  defaultRegion: Region;
  allowedProviders: LLMProviderName[];
  dataResidency?: string;
}

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
}

export type LLMProviderName = "openai" | "anthropic" | "google" | "meta";

export interface ModelDispatchConfig {
  primary: LLMProviderName;
  fallbacks: LLMProviderName[];
}
