export type AssessmentDomainName = "READING" | "MATH" | "SPEECH" | "SEL" | "SCIENCE";

export interface AssessmentDomain {
  id: string;
  name: AssessmentDomainName;
  questions: Question[];
  proficiencyLevel?: number;
  gradeEquivalent?: number;
}

export type QuestionType = "MULTIPLE_CHOICE" | "OPEN_ENDED" | "AUDIO_RESPONSE" | "VISUAL";

export interface Question {
  id: string;
  domain: AssessmentDomainName;
  content: string;
  type: QuestionType;
  difficulty: number; // 1-12 grade level
  options?: string[];
  correctAnswer?: string;
  rubric?: string;
  mediaUrl?: string;
}

export interface AssessmentSession {
  id: string;
  learnerId: string;
  domains: AssessmentDomain[];
  startTime: Date;
  endTime?: Date;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  results?: AssessmentResults;
}

export interface AssessmentResults {
  overallLevel: number;
  domainLevels: Record<AssessmentDomainName, number>;
  domainSummaries: Record<AssessmentDomainName, string>;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  learningProfile: string;
  detailedResponses: Record<string, { answer: string; isCorrect?: boolean }>;
  questionLedger: Array<{
    id: string;
    domain: AssessmentDomainName;
    difficulty: number;
    type: QuestionType;
  }>;
}

export interface QuestionValidationResult {
  isCorrect: boolean;
  updatedDifficulty: number;
  feedback?: string;
}
