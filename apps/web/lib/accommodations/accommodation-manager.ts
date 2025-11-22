import { prisma } from "@/lib/prisma";
import type { AccommodationType, Prisma } from "@prisma/client";

export enum Accommodation {
  TEXT_TO_SPEECH = "TEXT_TO_SPEECH",
  INCREASED_FONT_SIZE = "INCREASED_FONT_SIZE",
  HIGH_CONTRAST = "HIGH_CONTRAST",
  REDUCED_VISUAL_CLUTTER = "REDUCED_VISUAL_CLUTTER",
  VISUAL_SCHEDULES = "VISUAL_SCHEDULES",
  COLOR_CODING = "COLOR_CODING",
  DYSLEXIA_FONT = "DYSLEXIA_FONT",
  CAPTIONS = "CAPTIONS",
  AUDIO_INSTRUCTIONS = "AUDIO_INSTRUCTIONS",
  SLOWED_AUDIO = "SLOWED_AUDIO",
  SPEECH_TO_TEXT = "SPEECH_TO_TEXT",
  SIMPLIFIED_CONTROLS = "SIMPLIFIED_CONTROLS",
  LARGER_CLICK_TARGETS = "LARGER_CLICK_TARGETS",
  EXTRA_TIME = "EXTRA_TIME",
  FREQUENT_BREAKS = "FREQUENT_BREAKS",
  REDUCED_CHOICES = "REDUCED_CHOICES",
  CHUNKED_CONTENT = "CHUNKED_CONTENT",
  WORKED_EXAMPLES = "WORKED_EXAMPLES",
  STEP_BY_STEP = "STEP_BY_STEP",
  ENCOURAGEMENT_PROMPTS = "ENCOURAGEMENT_PROMPTS",
  FIDGET_TOOLS = "FIDGET_TOOLS",
  CALM_DOWN_STRATEGIES = "CALM_DOWN_STRATEGIES",
  CHOICE_IN_ACTIVITIES = "CHOICE_IN_ACTIVITIES"
}

export interface EffectivenessMetrics {
  sessionId?: string;
  engagementScore?: number;
  completionRate?: number;
  accuracy?: number;
  timeOnTask?: number;
  metadata?: Record<string, unknown>;
}

export class AccommodationManager {
  private readonly diagnosisDefaults: Record<string, AccommodationType[]> = {
    ASD: [
      Accommodation.VISUAL_SCHEDULES,
      Accommodation.REDUCED_VISUAL_CLUTTER,
      Accommodation.STEP_BY_STEP,
      Accommodation.CHOICE_IN_ACTIVITIES
    ],
    ADHD: [
      Accommodation.FREQUENT_BREAKS,
      Accommodation.CHUNKED_CONTENT,
      Accommodation.FIDGET_TOOLS,
      Accommodation.REDUCED_CHOICES,
      Accommodation.ENCOURAGEMENT_PROMPTS
    ],
    DYSLEXIA: [
      Accommodation.TEXT_TO_SPEECH,
      Accommodation.INCREASED_FONT_SIZE,
      Accommodation.DYSLEXIA_FONT,
      Accommodation.COLOR_CODING,
      Accommodation.EXTRA_TIME
    ],
    DYSGRAPHIA: [
      Accommodation.SPEECH_TO_TEXT,
      Accommodation.SIMPLIFIED_CONTROLS,
      Accommodation.LARGER_CLICK_TARGETS,
      Accommodation.WORKED_EXAMPLES
    ]
  };

  async setupAccommodations(learnerId: string, diagnoses: string[]): Promise<AccommodationType[]> {
    const accommodations = new Set<AccommodationType>();
    diagnoses.forEach((diagnosis) => {
      this.getDefaultAccommodations(diagnosis).forEach((accommodation) => accommodations.add(accommodation));
    });

    const planData: {
      accommodations: AccommodationType[];
      autoEnabled: boolean;
      autoEnabledAt: Date;
      metadata: Prisma.InputJsonValue;
    } = {
      accommodations: Array.from(accommodations),
      autoEnabled: true,
      autoEnabledAt: new Date(),
      metadata: { diagnoses }
    };

    await prisma.learnerAccommodation.upsert({
      where: { learnerId },
      create: { learnerId, ...planData },
      update: { ...planData }
    });

    return planData.accommodations;
  }

  async getAccommodationPlan(learnerId: string) {
    return prisma.learnerAccommodation.findUnique({ where: { learnerId } });
  }

  async getActiveAccommodations(learnerId: string) {
    const plan = await this.getAccommodationPlan(learnerId);
    return plan?.accommodations ?? [];
  }

  private getDefaultAccommodations(diagnosis: string): AccommodationType[] {
    const key = diagnosis.trim().toUpperCase();
    return this.diagnosisDefaults[key] ?? [];
  }

  applyAccommodations<TContent extends Record<string, unknown>>(
    content: TContent,
    accommodations: AccommodationType[]
  ): TContent {
    return accommodations.reduce((acc, accommodation) => this.applyAccommodation(acc, accommodation), { ...content });
  }

  private applyAccommodation<TContent extends Record<string, unknown>>(content: TContent, accommodation: AccommodationType): TContent {
    switch (accommodation) {
      case Accommodation.TEXT_TO_SPEECH:
        return {
          ...content,
          audioNarration: true,
          audioUrl: this.generateAudioNarration(String(content["text"] ?? ""))
        } as TContent;
      case Accommodation.INCREASED_FONT_SIZE:
        return {
          ...content,
          fontSize: "text-xl",
          lineHeight: "leading-relaxed"
        } as TContent;
      case Accommodation.HIGH_CONTRAST:
        return {
          ...content,
          contrastMode: "high"
        } as TContent;
      case Accommodation.REDUCED_VISUAL_CLUTTER:
        return {
          ...content,
          layout: "minimal",
          hideDecor: true
        } as TContent;
      case Accommodation.CHUNKED_CONTENT:
        return {
          ...content,
          chunks: this.chunkContent(String(content["text"] ?? "")),
          displayMode: "chunked"
        } as TContent;
      case Accommodation.FREQUENT_BREAKS:
        return {
          ...content,
          breakFrequency: 5,
          breakReminders: true
        } as TContent;
      case Accommodation.WORKED_EXAMPLES:
        return {
          ...content,
          workedExamples: content["workedExamples"] ?? this.buildWorkedExample(String(content["text"] ?? ""))
        } as TContent;
      default:
        return content;
    }
  }

  private chunkContent(text: string) {
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce<string[][]>((chunks, line) => {
        if (!chunks.length || chunks[chunks.length - 1].join(" ").length > 280) {
          chunks.push([line]);
        } else {
          chunks[chunks.length - 1].push(line);
        }
        return chunks;
      }, [])
      .map((chunk) => chunk.join(" "));
  }

  private buildWorkedExample(text: string) {
    return [
      {
        step: "Model",
        description: text.slice(0, 160)
      }
    ];
  }

  private generateAudioNarration(text: string | undefined) {
    if (!text || !text.length) return null;
    return `https://audio.local/narration/${Buffer.from(text).toString("base64").slice(0, 16)}`;
  }

  async trackAccommodationEffectiveness(
    learnerId: string,
    accommodation: AccommodationType,
    metrics: EffectivenessMetrics
  ) {
    await prisma.accommodationEffectiveness.create({
      data: {
        learnerId,
        accommodation,
        sessionId: metrics.sessionId,
        engagementWith: metrics.engagementScore,
        completionRateWith: metrics.completionRate,
        accuracyWith: metrics.accuracy,
        timeOnTaskWith: metrics.timeOnTask,
        metadata: (metrics.metadata ?? {}) as Prisma.InputJsonValue
      }
    });

    const history = await this.getAccommodationHistory(learnerId, accommodation, 12);
    if (!history.length) return;

    const effectiveness = this.calculateEffectiveness(history);
    if (effectiveness < 0.5) {
      await this.suggestAccommodationChange(learnerId, accommodation, "remove");
    } else if (effectiveness > 0.8) {
      await this.suggestSimilarAccommodations(learnerId, accommodation);
    }
  }

  private async getAccommodationHistory(
    learnerId: string,
    accommodation: AccommodationType,
    limit = 10
  ) {
    return prisma.accommodationEffectiveness.findMany({
      where: { learnerId, accommodation },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  private calculateEffectiveness(history: { engagementWith: number | null; completionRateWith: number | null; accuracyWith: number | null }[]) {
    const totals = history.reduce(
      (acc, item) => {
        acc.engagement += item.engagementWith ?? 0;
        acc.completion += item.completionRateWith ?? 0;
        acc.accuracy += item.accuracyWith ?? 0;
        return acc;
      },
      { engagement: 0, completion: 0, accuracy: 0 }
    );
    const count = history.length || 1;
    return (totals.engagement + totals.completion + totals.accuracy) / (3 * count);
  }

  private async suggestAccommodationChange(learnerId: string, accommodation: AccommodationType, action: "remove" | "review") {
    await prisma.communicationLog.create({
      data: {
        learnerId,
        type: "INSIGHT",
        channel: "accommodations",
        payload: {
          recommendation: action,
          accommodation
        }
      }
    });
  }

  private async suggestSimilarAccommodations(learnerId: string, accommodation: AccommodationType) {
    const similar = this.getSimilarAccommodations(accommodation);
    if (!similar.length) return;

    await prisma.communicationLog.create({
      data: {
        learnerId,
        type: "INSIGHT",
        channel: "accommodations",
        payload: {
          recommendation: "add",
          accommodation,
          suggestions: similar
        }
      }
    });
  }

  private getSimilarAccommodations(accommodation: AccommodationType): AccommodationType[] {
    switch (accommodation) {
      case Accommodation.TEXT_TO_SPEECH:
        return [Accommodation.AUDIO_INSTRUCTIONS, Accommodation.CAPTIONS];
      case Accommodation.CHUNKED_CONTENT:
        return [Accommodation.WORKED_EXAMPLES, Accommodation.STEP_BY_STEP];
      case Accommodation.FREQUENT_BREAKS:
        return [Accommodation.CHOICE_IN_ACTIVITIES, Accommodation.CALM_DOWN_STRATEGIES];
      default:
        return [];
    }
  }
}

export const accommodationManager = new AccommodationManager();
