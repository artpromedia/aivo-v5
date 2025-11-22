import { getContentEffectivenessTracker } from "@/lib/analytics/content-effectiveness";
import { accommodationManager } from "@/lib/accommodations/accommodation-manager";
import { ContentAdapter, type AdaptationRequest, type AdaptationResult } from "@/lib/curriculum/content-adapter";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { AccommodationType, ContentInteractionType, ContentVersionSource, ContentVersionStatus } from "@prisma/client";

export interface StandardFilter {
  search?: string;
  jurisdiction?: string;
  subject?: string;
  gradeBand?: string;
  limit?: number;
}

export interface ContentShellInput {
  moduleId: string;
  title: string;
  summary?: string;
  contentType: Prisma.CurriculumContentCreateInput["contentType"];
  difficultyLevel?: number;
  createdById?: string;
  standardIds?: string[];
  aiTags?: string[];
}

export interface VersionInput {
  contentId: string;
  payload?: Prisma.InputJsonValue;
  prompt?: string;
  diffSummary?: string;
  source?: ContentVersionSource;
  status?: ContentVersionStatus;
  createdById?: string;
  adaptationContext?: Prisma.InputJsonValue;
  aiConfidence?: number;
}

export interface AdaptationParams {
  contentId: string;
  request: AdaptationRequest;
  createdById?: string;
}

export interface PublishParams {
  contentId: string;
  versionId: string;
  actorId?: string;
}

export interface InteractionInput {
  contentId: string;
  versionId?: string;
  learnerId?: string;
  userId?: string;
  interactionType: ContentInteractionType;
  modality?: string;
  durationSeconds?: number;
  feedbackRating?: number;
  feedbackComment?: string;
  masteryEvidence?: Prisma.JsonValue | Record<string, unknown> | null;
  metadata?: Prisma.JsonValue | Record<string, unknown> | null;
}

export interface ContentOverviewOptions {
  contentId: string;
  includeVersions?: boolean;
  includeStandards?: boolean;
  includeEffectiveness?: boolean;
}

export class CurriculumManager {
  private effectivenessTracker = getContentEffectivenessTracker();

  constructor(private readonly adapter = new ContentAdapter()) {}

  async listStandards(filter: StandardFilter) {
    return prisma.learningStandard.findMany({
      where: {
        jurisdiction: filter.jurisdiction,
        subject: filter.subject,
        gradeBand: filter.gradeBand,
        isActive: true,
        ...(filter.search
          ? {
              OR: [
                { code: { contains: filter.search, mode: "insensitive" } },
                { description: { contains: filter.search, mode: "insensitive" } }
              ]
            }
          : undefined)
      },
      orderBy: [{ gradeBand: "asc" }, { code: "asc" }],
      take: filter.limit ?? 100
    });
  }

  async alignContentWithStandards(contentId: string, standardIds: string[]) {
    await prisma.curriculumContent.update({
      where: { id: contentId },
      data: {
        standards: {
          set: [],
          connect: standardIds.map((id) => ({ id }))
        }
      }
    });
  }

  async createContentShell(input: ContentShellInput) {
    const content = await prisma.curriculumContent.create({
      data: {
        moduleId: input.moduleId,
        title: input.title,
        summary: input.summary,
        contentType: input.contentType,
        difficultyLevel: input.difficultyLevel,
  status: "ACTIVE",
        createdById: input.createdById,
        aiTags: input.aiTags ?? [],
        standards: input.standardIds ? { connect: input.standardIds.map((id) => ({ id })) } : undefined
      },
      include: { standards: true }
    });

    await this.ensureInitialVersion(content.id, input.createdById);
    return content;
  }

  async createVersion(input: VersionInput) {
    const nextNumber = await this.nextVersionNumber(input.contentId);
    return prisma.contentVersion.create({
      data: {
        contentId: input.contentId,
        versionNumber: nextNumber,
        source: input.source ?? "AUTHOR",
        status: input.status ?? "DRAFT",
    prompt: input.prompt,
    diffSummary: input.diffSummary,
    payload: toJsonValue(input.payload ?? null),
        createdById: input.createdById,
        adaptationContext: input.adaptationContext ? toJsonValue(input.adaptationContext) : undefined,
        aiConfidence: input.aiConfidence
      }
    });
  }

  async requestAdaptation(params: AdaptationParams) {
    const content = await prisma.curriculumContent.findUnique({
      where: { id: params.contentId },
      include: {
        primaryStandard: true,
        module: { select: { subject: true, unit: { select: { gradeBand: true } } } }
      }
    });

    if (!content) {
      throw new Error("Content not found");
    }

    const learnerId = params.request.learner?.id;
    const accommodations: AccommodationType[] = learnerId
      ? await accommodationManager.getActiveAccommodations(learnerId)
      : [];

    const adaptation: AdaptationResult = await this.adapter.adapt({
      baseContent: params.request.baseContent,
      instructions: params.request.instructions ?? content.summary ?? undefined,
      objective: params.request.objective ?? `Support ${content.contentType.toLowerCase()} learning`,
      learner: params.request.learner,
      audience: params.request.audience ?? { modality: "TEXT", scaffolding: "LIGHT" },
      vocabularyHints: params.request.vocabularyHints,
      examplesToGround: params.request.examplesToGround
    });

    const adaptationEnvelope: AdaptedContentEnvelope = {
      text: adaptation.content,
      summary: adaptation.summary,
      highlights: adaptation.highlights,
      modality: adaptation.modality,
      metadata: {
        ...(adaptation.metadata ?? {}),
        accommodationsApplied: accommodations
      }
    };

    const adjustedEnvelope = accommodations.length
      ? accommodationManager.applyAccommodations(adaptationEnvelope, accommodations)
      : adaptationEnvelope;

    const finalPayload = {
      content: adjustedEnvelope.text,
      summary: adjustedEnvelope.summary,
      highlights: adjustedEnvelope.highlights,
      modality: adjustedEnvelope.modality,
      metadata: adjustedEnvelope.metadata,
      accommodationsApplied: accommodations,
      assistiveFeatures: this.extractAssistiveFeatures(adjustedEnvelope)
    };

    const version = await this.createVersion({
      contentId: params.contentId,
      payload: toJsonValue(finalPayload),
      source: "AI",
      status: "DRAFT",
      createdById: params.createdById,
      adaptationContext: toJsonValue(params.request),
      aiConfidence: adaptation.confidence,
      diffSummary: `AI adaptation (${adaptation.modality})`
    });

    const adaptationWithAccommodations: AdaptationResult = {
      ...adaptation,
      content: finalPayload.content,
      metadata: {
        ...(adaptation.metadata ?? {}),
        accommodationsApplied: accommodations,
        assistiveFeatures: finalPayload.assistiveFeatures
      }
    };

    return { version, adaptation: adaptationWithAccommodations, accommodationsApplied: accommodations };
  }

  async publishVersion(params: PublishParams) {
    await prisma.$transaction([
      prisma.contentVersion.updateMany({
        where: { contentId: params.contentId, status: "ACTIVE" },
        data: { status: "ARCHIVED" }
      }),
      prisma.contentVersion.update({
        where: { id: params.versionId },
        data: { status: "ACTIVE", publishedAt: new Date(), reviewedById: params.actorId }
      })
    ]);
  }

  async logInteraction(input: InteractionInput) {
    const interaction = await prisma.contentInteraction.create({
      data: {
        ...input,
        masteryEvidence: input.masteryEvidence != null ? toJsonValue(input.masteryEvidence) : undefined,
        metadata: input.metadata != null ? toJsonValue(input.metadata) : undefined
      }
    });

    void this.effectivenessTracker.recordInteraction(interaction);
    return interaction;
  }

  async getContentOverview(options: ContentOverviewOptions) {
    return prisma.curriculumContent.findUnique({
      where: { id: options.contentId },
      include: {
        standards: options.includeStandards,
        versions: options.includeVersions ? { orderBy: { versionNumber: "desc" }, take: 10 } : false,
        effectiveness: options.includeEffectiveness
          ? { orderBy: { date: "desc" }, take: 30 }
          : false
      }
    });
  }

  private async ensureInitialVersion(contentId: string, createdById?: string) {
    const existing = await prisma.contentVersion.count({ where: { contentId } });
    if (existing > 0) return;

    await prisma.contentVersion.create({
      data: {
        contentId,
        versionNumber: 1,
        source: "AUTHOR",
        status: "ACTIVE",
  payload: toJsonValue({ content: "", summary: "Initial shell" }),
        createdById
      }
    });
  }

  private async nextVersionNumber(contentId: string) {
    const latest = await prisma.contentVersion.findFirst({
      where: { contentId },
      orderBy: { versionNumber: "desc" }
    });
    return (latest?.versionNumber ?? 0) + 1;
  }

  private extractAssistiveFeatures(payload: Record<string, unknown>) {
    return {
      audioNarration: payload["audioNarration"] ?? null,
      fontSize: payload["fontSize"] ?? null,
      lineHeight: payload["lineHeight"] ?? null,
      contrastMode: payload["contrastMode"] ?? null,
      layout: payload["layout"] ?? null,
      breakFrequency: payload["breakFrequency"] ?? null,
      breakReminders: payload["breakReminders"] ?? null,
      chunks: payload["chunks"] ?? null,
      displayMode: payload["displayMode"] ?? null,
      workedExamples: payload["workedExamples"] ?? null
    };
  }
}

export const curriculumManager = new CurriculumManager();

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === undefined || value === null) {
    return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
  }
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

type AdaptedContentEnvelope = {
  text: string;
  summary: string;
  highlights: string[];
  modality: AdaptationResult["modality"];
  metadata: Record<string, unknown>;
} & Record<string, unknown>;
