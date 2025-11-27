/**
 * Homework Helper Persistence Layer
 * 
 * Database operations for the scaffolded homework assistance feature.
 */

import { prisma } from "./index";
import type { 
  HomeworkSession, 
  HomeworkFile, 
  HomeworkWorkProduct, 
  HomeworkHint,
  HomeworkSessionStatus,
  HomeworkDifficultyMode,
  OcrStatus,
  HomeworkInputType,
  HomeworkHintType
} from "@prisma/client";

// ============================================================================
// Session Operations
// ============================================================================

export interface CreateHomeworkSessionParams {
  learnerId: string;
  title: string;
  subject?: string;
  gradeLevel?: number;
  difficultyMode?: HomeworkDifficultyMode;
  parentAssistMode?: boolean;
  maxHintsPerStep?: number;
}

export async function createHomeworkSession(
  params: CreateHomeworkSessionParams
): Promise<HomeworkSession> {
  return prisma.homeworkSession.create({
    data: {
      learnerId: params.learnerId,
      title: params.title,
      subject: params.subject,
      gradeLevel: params.gradeLevel,
      difficultyMode: params.difficultyMode ?? "SCAFFOLDED",
      parentAssistMode: params.parentAssistMode ?? false,
      maxHintsPerStep: params.maxHintsPerStep ?? 3,
      status: "UNDERSTAND"
    },
    include: {
      files: true,
      workProducts: true,
      hints: true
    }
  });
}

export async function getHomeworkSessionById(
  sessionId: string,
  includeRelations: boolean = true
): Promise<HomeworkSession | null> {
  return prisma.homeworkSession.findUnique({
    where: { id: sessionId },
    include: includeRelations ? {
      files: { orderBy: { createdAt: "asc" } },
      workProducts: { orderBy: { createdAt: "asc" } },
      hints: { orderBy: { createdAt: "asc" } }
    } : undefined
  });
}

export async function listHomeworkSessionsForLearner(
  learnerId: string,
  options?: {
    status?: HomeworkSessionStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{ sessions: HomeworkSession[]; total: number }> {
  const where = {
    learnerId,
    ...(options?.status && { status: options.status })
  };

  const [sessions, total] = await Promise.all([
    prisma.homeworkSession.findMany({
      where,
      include: {
        files: true,
        workProducts: true,
        hints: true
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0
    }),
    prisma.homeworkSession.count({ where })
  ]);

  return { sessions, total };
}

export async function updateHomeworkSessionStatus(
  sessionId: string,
  status: HomeworkSessionStatus,
  additionalData?: {
    currentStepHints?: number;
    completedAt?: Date;
  }
): Promise<HomeworkSession> {
  return prisma.homeworkSession.update({
    where: { id: sessionId },
    data: {
      status,
      ...(additionalData?.currentStepHints !== undefined && { 
        currentStepHints: additionalData.currentStepHints 
      }),
      ...(additionalData?.completedAt && { 
        completedAt: additionalData.completedAt 
      })
    },
    include: {
      files: true,
      workProducts: true,
      hints: true
    }
  });
}

export interface UpdateHomeworkSessionParams {
  status?: HomeworkSessionStatus;
  difficultyMode?: HomeworkDifficultyMode;
  parentAssistMode?: boolean;
  problemAnalysis?: string;
  solutionPlan?: string;
  finalAnswer?: string;
  verificationResult?: string;
  completedAt?: Date;
}

export async function updateHomeworkSession(
  sessionId: string,
  params: UpdateHomeworkSessionParams
): Promise<HomeworkSession> {
  return prisma.homeworkSession.update({
    where: { id: sessionId },
    data: {
      ...(params.status && { status: params.status }),
      ...(params.difficultyMode && { difficultyMode: params.difficultyMode }),
      ...(params.parentAssistMode !== undefined && { parentAssistMode: params.parentAssistMode }),
      ...(params.problemAnalysis && { problemAnalysis: params.problemAnalysis }),
      ...(params.solutionPlan && { solutionPlan: params.solutionPlan }),
      ...(params.finalAnswer && { finalAnswer: params.finalAnswer }),
      ...(params.verificationResult && { verificationResult: params.verificationResult }),
      ...(params.completedAt && { completedAt: params.completedAt }),
      // Reset step hints when changing steps
      ...(params.status && { currentStepHints: 0 })
    },
    include: {
      files: true,
      workProducts: true,
      hints: true
    }
  });
}

export async function updateHomeworkSessionSubject(
  sessionId: string,
  subject: string,
  gradeLevel: number
): Promise<HomeworkSession> {
  return prisma.homeworkSession.update({
    where: { id: sessionId },
    data: { subject, gradeLevel },
    include: {
      files: true,
      workProducts: true,
      hints: true
    }
  });
}

export async function incrementHomeworkHints(
  sessionId: string
): Promise<HomeworkSession> {
  return prisma.homeworkSession.update({
    where: { id: sessionId },
    data: {
      hintsUsed: { increment: 1 },
      currentStepHints: { increment: 1 }
    },
    include: {
      files: true,
      workProducts: true,
      hints: true
    }
  });
}

export async function resetCurrentStepHints(
  sessionId: string
): Promise<HomeworkSession> {
  return prisma.homeworkSession.update({
    where: { id: sessionId },
    data: { currentStepHints: 0 },
    include: {
      files: true,
      workProducts: true,
      hints: true
    }
  });
}

// ============================================================================
// File Operations
// ============================================================================

export interface CreateHomeworkFileParams {
  sessionId: string;
  filename: string;
  mimeType: string;
  fileUrl: string;
  fileSize?: number;
  inputType: HomeworkInputType;
  extractedText?: string;
  ocrStatus?: OcrStatus;
}

export async function createHomeworkFile(
  params: CreateHomeworkFileParams
): Promise<HomeworkFile> {
  return prisma.homeworkFile.create({
    data: {
      sessionId: params.sessionId,
      filename: params.filename,
      mimeType: params.mimeType,
      fileUrl: params.fileUrl,
      fileSize: params.fileSize,
      inputType: params.inputType,
      extractedText: params.extractedText,
      ocrStatus: params.ocrStatus ?? "PENDING"
    }
  });
}

export async function updateHomeworkFileOcr(
  fileId: string,
  data: {
    ocrStatus: OcrStatus;
    extractedText?: string;
    ocrConfidence?: number;
    ocrMetadata?: Record<string, unknown>;
  }
): Promise<HomeworkFile> {
  return prisma.homeworkFile.update({
    where: { id: fileId },
    data: {
      ocrStatus: data.ocrStatus,
      extractedText: data.extractedText,
      ocrConfidence: data.ocrConfidence,
      ocrMetadata: data.ocrMetadata as any
    }
  });
}

export async function getHomeworkFileById(
  fileId: string
): Promise<HomeworkFile | null> {
  return prisma.homeworkFile.findUnique({
    where: { id: fileId }
  });
}

export async function listHomeworkFilesForSession(
  sessionId: string
): Promise<HomeworkFile[]> {
  return prisma.homeworkFile.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" }
  });
}

// ============================================================================
// Work Product Operations
// ============================================================================

export interface CreateWorkProductParams {
  sessionId: string;
  step: HomeworkSessionStatus;
  inputType: string;
  inputData?: Record<string, unknown>;
  outputData: Record<string, unknown>;
  confidence?: number;
}

export async function createHomeworkWorkProduct(
  params: CreateWorkProductParams
): Promise<HomeworkWorkProduct> {
  return prisma.homeworkWorkProduct.create({
    data: {
      sessionId: params.sessionId,
      step: params.step,
      inputType: params.inputType,
      inputData: params.inputData as any,
      outputData: params.outputData as any,
      confidence: params.confidence
    }
  });
}

export async function updateWorkProductCompletion(
  workProductId: string,
  isComplete: boolean
): Promise<HomeworkWorkProduct> {
  return prisma.homeworkWorkProduct.update({
    where: { id: workProductId },
    data: { isComplete }
  });
}

export async function getWorkProductsForSession(
  sessionId: string,
  step?: HomeworkSessionStatus
): Promise<HomeworkWorkProduct[]> {
  return prisma.homeworkWorkProduct.findMany({
    where: {
      sessionId,
      ...(step && { step })
    },
    orderBy: { createdAt: "asc" }
  });
}

export async function getLatestWorkProductForStep(
  sessionId: string,
  step: HomeworkSessionStatus
): Promise<HomeworkWorkProduct | null> {
  return prisma.homeworkWorkProduct.findFirst({
    where: { sessionId, step },
    orderBy: { createdAt: "desc" }
  });
}

// ============================================================================
// Hint Operations
// ============================================================================

export interface CreateHomeworkHintParams {
  sessionId: string;
  step: HomeworkSessionStatus;
  hintNumber: number;
  hintType: HomeworkHintType;
  content: string;
}

export async function createHomeworkHint(
  params: CreateHomeworkHintParams
): Promise<HomeworkHint> {
  return prisma.homeworkHint.create({
    data: {
      sessionId: params.sessionId,
      step: params.step,
      hintNumber: params.hintNumber,
      hintType: params.hintType,
      content: params.content
    }
  });
}

export async function markHintHelpful(
  hintId: string,
  wasHelpful: boolean
): Promise<HomeworkHint> {
  return prisma.homeworkHint.update({
    where: { id: hintId },
    data: { wasHelpful }
  });
}

export async function getHintsForSessionStep(
  sessionId: string,
  step: HomeworkSessionStatus
): Promise<HomeworkHint[]> {
  return prisma.homeworkHint.findMany({
    where: { sessionId, step },
    orderBy: { hintNumber: "asc" }
  });
}

export async function countHintsForSessionStep(
  sessionId: string,
  step: HomeworkSessionStatus
): Promise<number> {
  return prisma.homeworkHint.count({
    where: { sessionId, step }
  });
}

// ============================================================================
// Combined/Analytics Operations
// ============================================================================

export interface HomeworkStats {
  totalSessions: number;
  completedSessions: number;
  averageHintsPerSession: number;
  subjectBreakdown: { subject: string; count: number }[];
  recentSessions: HomeworkSession[];
}

export async function getHomeworkStatsForLearner(
  learnerId: string,
  daysBack: number = 30
): Promise<HomeworkStats> {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const [sessions, subjectGroups] = await Promise.all([
    prisma.homeworkSession.findMany({
      where: {
        learnerId,
        createdAt: { gte: since }
      },
      include: { files: true, hints: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.homeworkSession.groupBy({
      by: ["subject"],
      where: {
        learnerId,
        subject: { not: null },
        createdAt: { gte: since }
      },
      _count: { subject: true }
    })
  ]);

  const completedSessions = sessions.filter(s => s.status === "COMPLETE");
  const totalHints = sessions.reduce((sum, s) => sum + s.hintsUsed, 0);

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    averageHintsPerSession: sessions.length > 0 
      ? totalHints / sessions.length 
      : 0,
    subjectBreakdown: subjectGroups.map(g => ({
      subject: g.subject ?? "unknown",
      count: g._count.subject
    })),
    recentSessions: sessions.slice(0, 5)
  };
}

export async function deleteHomeworkSession(
  sessionId: string
): Promise<void> {
  await prisma.homeworkSession.delete({
    where: { id: sessionId }
  });
}
