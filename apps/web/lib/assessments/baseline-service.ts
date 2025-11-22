import { prisma } from "@/lib/prisma";
import {
  BaselineAssessmentStatusEnum,
  type BaselineAssessmentStatus,
  type BaselineDomain
} from "@/types/baseline";
import type { Prisma } from "@prisma/client";

export type SessionPlan = Record<string, unknown> | null | undefined;

export interface ComponentResultInput {
  sessionId: string;
  domain: BaselineDomain;
  component: string;
  modality: string;
  responses?: Record<string, unknown> | null;
  score?: number;
  confidence?: number;
  aiNotes?: string;
}

export interface SpeechSampleInput {
  learnerId: string;
  sessionId?: string | null;
  taskType: string;
  component?: string;
  audioFormat?: string;
  audioBase64: string;
  durationMs?: number;
  articulation?: number;
  fluency?: number;
  intelligibility?: number;
  analysis?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class BaselineAssessmentService {
  async getOrCreateSession(learnerId: string, plan?: SessionPlan) {
    const existing = await prisma.baselineAssessmentSession.findFirst({
      where: { learnerId, status: BaselineAssessmentStatusEnum.IN_PROGRESS },
      orderBy: { createdAt: "desc" }
    });

    if (existing) {
      return existing;
    }

    const planData = ensureJson(plan);

    return prisma.baselineAssessmentSession.create({
      data: {
        learnerId,
        ...(planData !== undefined ? { plan: planData } : {})
      }
    });
  }

  async updateSessionStatus(options: {
    sessionId: string;
    learnerId: string;
    status?: BaselineAssessmentStatus;
    summary?: Record<string, unknown>;
    multiModalPlan?: Record<string, unknown>;
  }) {
    const { sessionId, learnerId, status = BaselineAssessmentStatusEnum.COMPLETED, summary, multiModalPlan } = options;

    const session = await prisma.baselineAssessmentSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.learnerId !== learnerId) {
      throw new Error("Session not found");
    }

    const summaryJson = ensureJson(summary);
    const multiModalJson = ensureJson(multiModalPlan);

    return prisma.baselineAssessmentSession.update({
      where: { id: sessionId },
      data: {
        status,
        completedAt: status === BaselineAssessmentStatusEnum.COMPLETED ? new Date() : session.completedAt,
        ...(summaryJson !== undefined ? { aiSummary: summaryJson } : {}),
        ...(multiModalJson !== undefined ? { multiModalPlan: multiModalJson } : {})
      }
    });
  }

  async recordDomainResult(input: ComponentResultInput) {
    return prisma.baselineDomainResult.create({
      data: {
        sessionId: input.sessionId,
        domain: input.domain,
        component: input.component,
        modality: input.modality,
        responses: ensureJson(input.responses),
        score: input.score,
        confidence: input.confidence,
        aiNotes: input.aiNotes
      }
    });
  }

  async recordSpeechSample(input: SpeechSampleInput) {
    return prisma.speechAssessmentSample.create({
      data: {
        learnerId: input.learnerId,
        sessionId: input.sessionId ?? null,
        taskType: input.taskType,
        component: input.component,
        audioFormat: input.audioFormat ?? "audio/webm",
        audioBase64: input.audioBase64,
        durationMs: input.durationMs,
        articulation: input.articulation,
        fluency: input.fluency,
        intelligibility: input.intelligibility,
        analysis: ensureJson(input.analysis),
        metadata: ensureJson(input.metadata)
      }
    });
  }
}

export const baselineAssessmentService = new BaselineAssessmentService();

function ensureJson(value?: Record<string, unknown> | null): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
