/**
 * Homework Helper API Contracts
 * 
 * Defines request/response types for the scaffolded homework assistance feature.
 */

// Enums matching Prisma schema

export type HomeworkSessionStatus = 
  | "UNDERSTAND" 
  | "PLAN" 
  | "SOLVE" 
  | "CHECK" 
  | "COMPLETE";

export type HomeworkDifficultyMode = 
  | "SIMPLIFIED" 
  | "SCAFFOLDED" 
  | "STANDARD";

export type OcrStatus = 
  | "PENDING" 
  | "PROCESSING" 
  | "COMPLETE" 
  | "FAILED";

export type HomeworkInputType = 
  | "UPLOAD" 
  | "CAMERA" 
  | "TEXT" 
  | "DOCUMENT";

export type HomeworkHintType = 
  | "NUDGE" 
  | "EXPLANATION" 
  | "EXAMPLE" 
  | "DIRECT";

// Core types

export interface HomeworkSession {
  id: string;
  learnerId: string;
  title: string;
  subject: string | null;
  gradeLevel: number | null;
  status: HomeworkSessionStatus;
  difficultyMode: HomeworkDifficultyMode;
  parentAssistMode: boolean;
  hintsUsed: number;
  maxHintsPerStep: number;
  currentStepHints: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  files?: HomeworkFile[];
  workProducts?: HomeworkWorkProduct[];
  hints?: HomeworkHint[];
}

export interface HomeworkFile {
  id: string;
  sessionId: string;
  filename: string;
  mimeType: string;
  fileUrl: string;
  fileSize: number | null;
  ocrStatus: OcrStatus;
  extractedText: string | null;
  ocrConfidence: number | null;
  ocrMetadata: Record<string, unknown> | null;
  inputType: HomeworkInputType;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkWorkProduct {
  id: string;
  sessionId: string;
  step: HomeworkSessionStatus;
  inputType: string;
  inputData: Record<string, unknown> | null;
  outputData: Record<string, unknown>;
  isComplete: boolean;
  confidence: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkHint {
  id: string;
  sessionId: string;
  step: HomeworkSessionStatus;
  hintNumber: number;
  hintType: HomeworkHintType;
  content: string;
  wasHelpful: boolean | null;
  createdAt: string;
}

// Analysis output structure

export interface ProblemAnalysis {
  problemType: string;                    // "arithmetic", "algebra", "geometry", "word_problem", etc.
  subject: string;                        // Detected subject
  gradeLevel: number;                     // Estimated grade level
  concepts: string[];                     // Key concepts involved
  prerequisites: string[];                // Required prior knowledge
  difficulty: "easy" | "medium" | "hard"; // Estimated difficulty
  extractedProblem: string;               // Cleaned problem text
  visualElements?: string[];              // Described images/diagrams
}

export interface SolutionPlan {
  steps: PlanStep[];
  estimatedTime: number;                  // Minutes
  suggestedApproach: string;
  alternativeApproaches?: string[];
}

export interface PlanStep {
  stepNumber: number;
  description: string;
  skill: string;
  estimatedDifficulty: "easy" | "medium" | "hard";
}

export interface SolutionStep {
  stepNumber: number;
  instruction: string;
  hint?: string;
  example?: string;
  expectedOutcome: string;
  checkPoint: string;                     // Question to verify understanding
}

export interface VerificationResult {
  isCorrect: boolean;
  confidence: number;
  feedback: string;
  explanation: string;
  commonMistakes?: string[];
  nextSteps?: string[];
}

// Request/Response types

export interface CreateHomeworkSessionRequest {
  learnerId: string;
  title: string;
  subject?: string;
  gradeLevel?: number;
  difficultyMode?: HomeworkDifficultyMode;
  parentAssistMode?: boolean;
}

export interface CreateHomeworkSessionResponse {
  session: HomeworkSession;
}

export interface UpdateHomeworkSessionRequest {
  status?: HomeworkSessionStatus;
  difficultyMode?: HomeworkDifficultyMode;
  parentAssistMode?: boolean;
  problemAnalysis?: ProblemAnalysis;
  solutionPlan?: SolutionPlan;
  finalAnswer?: Record<string, unknown>;
  verificationResult?: VerificationResult;
}

export interface UpdateHomeworkSessionResponse {
  session: HomeworkSession;
}

export interface GetHomeworkSessionResponse {
  session: HomeworkSession;
}

export interface ListHomeworkSessionsRequest {
  learnerId: string;
  status?: HomeworkSessionStatus;
  limit?: number;
  offset?: number;
}

export interface ListHomeworkSessionsResponse {
  sessions: HomeworkSession[];
  total: number;
}

export interface UploadHomeworkFileRequest {
  sessionId: string;
  file: File | Blob;
  filename: string;
  inputType: HomeworkInputType;
}

export interface UploadHomeworkFileResponse {
  file: HomeworkFile;
  analysis?: ProblemAnalysis;            // Returned if OCR is complete and analysis successful
}

export interface SubmitTextInputRequest {
  sessionId: string;
  text: string;
}

export interface SubmitTextInputResponse {
  file: HomeworkFile;                    // Virtual file created for text input
  analysis: ProblemAnalysis;
}

export interface ProgressStepRequest {
  sessionId: string;
  currentStep: HomeworkSessionStatus;
  inputData?: Record<string, unknown>;   // Learner's work for current step
}

export interface ProgressStepResponse {
  session: HomeworkSession;
  workProduct: HomeworkWorkProduct;
  nextStepGuidance?: SolutionPlan | SolutionStep[] | VerificationResult;
}

export interface RequestHintRequest {
  sessionId: string;
  step: HomeworkSessionStatus;
  hintType?: HomeworkHintType;
  context?: string;                      // What the learner is stuck on
}

export interface RequestHintResponse {
  hint: HomeworkHint;
  hintsRemaining: number;
  suggestions?: string[];                // Related concepts to review
}

export interface MarkHintHelpfulRequest {
  hintId: string;
  wasHelpful: boolean;
}

export interface MarkHintHelpfulResponse {
  hint: HomeworkHint;
}

export interface GetWorkProductsResponse {
  workProducts: HomeworkWorkProduct[];
}

export interface CheckSolutionRequest {
  sessionId: string;
  solution: string | Record<string, unknown>;
  showWork?: string;                     // Learner's work/steps
}

export interface CheckSolutionResponse {
  verification: VerificationResult;
  workProduct: HomeworkWorkProduct;
  session: HomeworkSession;
}

// Parent assist mode types

export interface ParentProgressView {
  session: Omit<HomeworkSession, "workProducts">;
  currentStep: HomeworkSessionStatus;
  progress: {
    stepsCompleted: number;
    totalSteps: number;
    hintsUsed: number;
    timeSpent: number;                   // Minutes
  };
  // Answers/solutions are hidden in parent assist mode
  conceptsCovered: string[];
  strugglingWith?: string[];
}

export interface GetParentProgressResponse {
  progress: ParentProgressView;
}

// Error types

export interface HomeworkError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type HomeworkErrorCode = 
  | "SESSION_NOT_FOUND"
  | "SESSION_ALREADY_COMPLETE"
  | "MAX_HINTS_REACHED"
  | "OCR_FAILED"
  | "INVALID_STEP_TRANSITION"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "ANALYSIS_FAILED";
