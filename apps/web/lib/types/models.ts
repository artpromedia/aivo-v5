import type { AssessmentDomainName } from "./assessment";

export type LearningStyle = "VISUAL" | "AUDITORY" | "KINESTHETIC" | "MIXED";

export interface LearnerProfile {
  learnerId: string;
  gradeLevel: number;
  actualLevel: number;
  domainLevels: Record<AssessmentDomainName | string, number>;
  learningStyle: LearningStyle;
  diagnoses: string[];
  strengths: string[];
  challenges: string[];
}

export interface PersonalizedModelConfig {
  gradeLevel: number;
  actualLevel: number;
  domainLevels: Record<AssessmentDomainName | string, number>;
  learningStyle: LearningStyle;
  adaptationRules: Record<string, unknown>;
  recommendedLevels?: Record<string, {
    level: number;
    label: string;
    confidence: number;
  }>;
}

export interface PersonalizedModelAdapter {
  id: string;
  learnerId: string;
  systemPrompt: string;
  gradeLevel: number;
  actualLevel: number;
  configuration: PersonalizedModelConfig;
  complete(prompt: string): Promise<string>;
}

export interface LearningPerformanceSummary {
  successRate: number;
  sessionCount: number;
  learnerName?: string;
}
