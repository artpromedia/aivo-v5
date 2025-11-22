import { prisma } from "@/lib/prisma";
import { Prisma, type ContentInteraction } from "@prisma/client";

interface AggregateBucket {
  contentId: string;
  versionVotes: Record<string, number>;
  versionId?: string | null;
  date: Date;
  engagementSum: number;
  masterySum: number;
  aiQualitySum: number;
  sentimentSum: number;
  sampleSize: number;
}

const FLUSH_THRESHOLD = 25;
const FLUSH_INTERVAL_MS = 30_000;

const globalForEffectiveness = globalThis as unknown as {
  contentEffectivenessTracker?: ContentEffectivenessTracker;
};

export class ContentEffectivenessTracker {
  private buffer = new Map<string, AggregateBucket>();
  private flushing = false;
  private interval: NodeJS.Timeout;

  constructor() {
    this.interval = setInterval(() => {
      void this.flush();
    }, FLUSH_INTERVAL_MS);
  }

  async recordInteraction(interaction: ContentInteraction) {
    this.addToBuffer(interaction);
    if (this.buffer.size >= FLUSH_THRESHOLD) {
      await this.flush();
    }
  }

  private addToBuffer(interaction: ContentInteraction) {
    const date = this.normalizeDate(interaction.createdAt ?? new Date());
    const key = this.getKey(interaction.contentId, date);
    const bucket = this.buffer.get(key) ?? {
      contentId: interaction.contentId,
      versionVotes: {},
      versionId: interaction.versionId,
      date,
      engagementSum: 0,
      masterySum: 0,
      aiQualitySum: 0,
      sentimentSum: 0,
      sampleSize: 0
    };

    const metrics = this.deriveMetrics(interaction);

    bucket.engagementSum += metrics.engagement;
    bucket.masterySum += metrics.masteryDelta;
    bucket.aiQualitySum += metrics.aiQuality;
    bucket.sentimentSum += metrics.sentiment;
    bucket.sampleSize += 1;

    if (interaction.versionId) {
      bucket.versionVotes[interaction.versionId] = (bucket.versionVotes[interaction.versionId] ?? 0) + 1;
    }

    this.buffer.set(key, bucket);
  }

  private deriveMetrics(interaction: ContentInteraction) {
    const duration = interaction.durationSeconds ?? 0;
    const normalizedDuration = Math.min(1, duration / 600);
    const rating = interaction.feedbackRating ? interaction.feedbackRating / 5 : 0.6;
    const engagement = Number((normalizedDuration * 0.6 + rating * 0.4).toFixed(3));

    const mastery = this.extractNumber(interaction.masteryEvidence, ["delta", "change"], 0);
    const aiQuality = this.extractNumber(interaction.metadata, ["aiQuality", "confidence"], rating);
    const sentiment = interaction.feedbackRating ? rating : this.extractNumber(interaction.metadata, ["sentiment"], 0.5);

    return {
      engagement,
      masteryDelta: Number(mastery.toFixed(3)),
      aiQuality: Number(aiQuality.toFixed(3)),
      sentiment: Number(sentiment.toFixed(3))
    };
  }

  private extractNumber(json: Prisma.JsonValue | null | undefined, keys: string[], fallback: number) {
    if (!json || typeof json !== "object") {
      return fallback;
    }
    for (const key of keys) {
      const value = (json as Record<string, unknown>)[key];
      if (typeof value === "number") {
        return value;
      }
    }
    return fallback;
  }

  private getKey(contentId: string, date: Date) {
    return `${contentId}:${date.toISOString()}`;
  }

  private normalizeDate(date: Date) {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  }

  async flush(force = false) {
    if (!force && (this.flushing || this.buffer.size === 0)) return;
    this.flushing = true;

    try {
      const entries = Array.from(this.buffer.entries());
      this.buffer.clear();

      await Promise.all(
        entries.map(([, bucket]) =>
          prisma.contentEffectiveness.upsert({
            where: { contentId_date: { contentId: bucket.contentId, date: bucket.date } },
            create: this.buildPayload(bucket),
            update: this.buildPayload(bucket)
          })
        )
      );
    } catch (error) {
      console.error("Failed to flush content effectiveness metrics", error);
    } finally {
      this.flushing = false;
    }
  }

  private buildPayload(bucket: AggregateBucket) {
    const versionId = this.selectVersion(bucket.versionVotes) ?? bucket.versionId ?? null;
    return {
      contentId: bucket.contentId,
      versionId,
      date: bucket.date,
      engagementScore: Number((bucket.engagementSum / bucket.sampleSize).toFixed(3)),
      masteryDelta: Number((bucket.masterySum / bucket.sampleSize).toFixed(3)),
      aiQualityScore: Number((bucket.aiQualitySum / bucket.sampleSize).toFixed(3)),
      educatorSentiment: Number((bucket.sentimentSum / bucket.sampleSize).toFixed(3)),
      sampleSize: bucket.sampleSize,
      metadata: Prisma.JsonNull
    } satisfies Prisma.ContentEffectivenessUpsertArgs["create"];
  }

  private selectVersion(votes: Record<string, number>) {
    return Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  stop() {
    clearInterval(this.interval);
  }
}

export function getContentEffectivenessTracker() {
  if (!globalForEffectiveness.contentEffectivenessTracker) {
    globalForEffectiveness.contentEffectivenessTracker = new ContentEffectivenessTracker();
  }
  return globalForEffectiveness.contentEffectivenessTracker;
}
