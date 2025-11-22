import { EventEmitter } from "events";
import type { DomainType, Progress } from "@prisma/client";
import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/prisma";

export interface ProgressMetrics {
  learnerId: string;
  domain: DomainType;
  score: number;
  timeSpent: number;
  accuracy: number;
  engagement: number;
  timestamp: Date;
}

export interface TrendSummary {
  improvement: number;
  struggling: boolean;
  daysStruggling: number;
}

interface BenchmarkMap {
  [domain: string]: number;
}

const DOMAINS: DomainType[] = ["READING", "MATH", "SPEECH", "SEL", "SCIENCE"];
const FLUSH_THRESHOLD = 32;

const globalForAnalytics = globalThis as unknown as {
  learningAnalytics?: LearningAnalytics;
};

export class LearningAnalytics extends EventEmitter {
  private redis?: Redis;
  private metricsBuffer: ProgressMetrics[] = [];
  private flushInterval: NodeJS.Timeout;
  private flushing = false;

  constructor() {
    super();

    if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN
      });
    }

    this.flushInterval = setInterval(() => {
      void this.flushMetrics();
    }, 30_000);
  }

  async trackProgress(metrics: ProgressMetrics) {
    this.metricsBuffer.push(metrics);

    if (this.metricsBuffer.length >= FLUSH_THRESHOLD) {
      await this.flushMetrics();
    }

    if (this.redis) {
      await this.redis.zadd(`progress:${metrics.learnerId}:${metrics.domain}`, {
        score: metrics.timestamp.getTime(),
        member: JSON.stringify(metrics)
      });
    }

    this.emit("progress", metrics);
    await this.checkMilestones(metrics);
  }

  async flushMetrics() {
    if (!this.metricsBuffer.length || this.flushing) return;

    this.flushing = true;
    const payload = this.metricsBuffer.splice(0, this.metricsBuffer.length);

    try {
      await prisma.progress.createMany({
        data: payload.map((metric) => ({
          learnerId: metric.learnerId,
          domain: metric.domain,
          date: metric.timestamp,
          score: metric.score,
          timeSpent: metric.timeSpent,
          level: this.estimateLevel(metric)
        })),
        skipDuplicates: true
      });
    } catch (error) {
      console.error("Failed to flush analytics metrics", error);
      this.metricsBuffer.unshift(...payload);
    } finally {
      this.flushing = false;
    }
  }

  private estimateLevel(metric: ProgressMetrics) {
    const scoreBased = metric.score / 10;
    const accuracyBoost = metric.accuracy / 20;
    const engagementBoost = metric.engagement / 25;
    return Number(Math.min(12, Math.max(0.5, scoreBased + accuracyBoost + engagementBoost)).toFixed(2));
  }

  async trackIEPGoalProgress(goalId: string, progressDelta: number) {
    await prisma.iEPGoal.update({
      where: { id: goalId },
      data: {
        progress: { increment: progressDelta },
        status: progressDelta >= 100 ? "ACHIEVED" : undefined
      }
    });
  }

  private async checkMilestones(metrics: ProgressMetrics) {
    const recentProgress = await this.getRecentProgress(metrics.learnerId, metrics.domain, 7);
    const trend = this.calculateTrend(recentProgress);

    if (trend.improvement > 20) {
      this.emit("milestone", {
        type: "SIGNIFICANT_IMPROVEMENT",
        learnerId: metrics.learnerId,
        domain: metrics.domain,
        improvement: trend.improvement
      });
    }

    if (trend.struggling && trend.daysStruggling > 3) {
      this.emit("alert", {
        type: "STRUGGLING",
        learnerId: metrics.learnerId,
        domain: metrics.domain,
        duration: trend.daysStruggling
      });
    }
  }

  async getRecentProgress(learnerId: string, domain: DomainType, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.progress.findMany({
      where: {
        learnerId,
        domain,
        date: { gte: startDate }
      },
      orderBy: { date: "asc" }
    });
  }

  calculateTrend(data: Pick<Progress, "score" | "date">[]): TrendSummary {
    if (data.length < 2) return { improvement: 0, struggling: false, daysStruggling: 0 };

    const scores = data.map((entry) => entry.score ?? 0);
    const recent = scores.slice(-7);
    const previous = scores.slice(-14, -7);

    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const previousAvg = previous.length
      ? previous.reduce((sum, score) => sum + score, 0) / previous.length
      : recentAvg;

    const improvement = previousAvg === 0 ? 0 : ((recentAvg - previousAvg) / previousAvg) * 100;
    const struggling = recentAvg < 50 && improvement < 5;

    return {
      improvement: Number(improvement.toFixed(1)),
      struggling,
      daysStruggling: struggling ? recent.filter((score) => score < 50).length : 0
    };
  }

  async generatePredictiveAnalytics(learnerId: string) {
    const allProgress = await prisma.progress.findMany({
      where: { learnerId },
      orderBy: { date: "asc" }
    });

    const predictions: Record<DomainType, unknown> = {} as Record<DomainType, unknown>;

    for (const domain of DOMAINS) {
      const domainData = allProgress.filter((progress) => progress.domain === domain);
      if (domainData.length < 5) continue;

      const regression = this.linearRegression(domainData.map((entry, index) => ({ x: index, y: entry.score ?? entry.level })));

      predictions[domain] = {
        currentLevel: domainData.at(-1)?.level ?? 0,
        predictedLevel30Days: Math.min(12, regression.predict(domainData.length + 30)),
        predictedLevel90Days: Math.min(12, regression.predict(domainData.length + 90)),
        confidence: regression.r2,
        recommendedIntervention: this.getIntervention(regression.slope)
      };
    }

    return predictions;
  }

  private linearRegression(data: { x: number; y: number }[]) {
    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);

    const denominator = n * sumX2 - sumX ** 2 || 1;
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const yMean = sumY / n;
    const ssRes = data.reduce((sum, point) => sum + (point.y - (slope * point.x + intercept)) ** 2, 0);
    const ssTot = data.reduce((sum, point) => sum + (point.y - yMean) ** 2, 0) || 1;
    const r2 = 1 - ssRes / ssTot;

    return {
      slope,
      intercept,
      r2: Number(Math.max(0, Math.min(1, r2)).toFixed(3)),
      predict: (x: number) => slope * x + intercept
    };
  }

  private getIntervention(slope: number) {
    if (slope > 0.5) return "Consider increasing difficulty";
    if (slope < -0.5) return "Additional support recommended";
    if (slope < 0.1) return "Review current approach";
    return "Continue current strategy";
  }

  async compareToBenchmarks(learnerId: string) {
    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      include: {
        diagnoses: true,
        progress: { orderBy: { date: "desc" }, take: 5 }
      }
    });

    if (!learner) return null;

    const neurotypicalBenchmark = await this.getNeurotypicalBenchmark(learner.gradeLevel);
    const diagnosisTypes = learner.diagnoses.map((diagnosis) => (diagnosis as { type?: string }).type ?? diagnosis.description ?? "GENERAL");
    const neurodiverseBenchmark = await this.getNeurodiverseBenchmark(learner.gradeLevel, diagnosisTypes);

    const currentPerformance = learner.progress.reduce<Record<string, number>>((acc, progress) => {
      acc[progress.domain] = progress.score ?? progress.level;
      return acc;
    }, {});

    return {
      current: currentPerformance,
      neurotypical: neurotypicalBenchmark,
      neurodiverse: neurodiverseBenchmark,
      comparison: this.calculateComparison(currentPerformance, neurotypicalBenchmark, neurodiverseBenchmark)
    };
  }

  private async getNeurotypicalBenchmark(gradeLevel: number): Promise<BenchmarkMap> {
    const aggregates = await prisma.progress.groupBy({
      by: ["domain"],
      _avg: { score: true },
      where: {
        learner: {
          gradeLevel,
          diagnoses: { none: {} }
        }
      }
    });

    return this.normalizeBenchmarks(aggregates);
  }

  private async getNeurodiverseBenchmark(gradeLevel: number, diagnosisTypes: string[]): Promise<BenchmarkMap> {
    if (!diagnosisTypes.length) {
      return this.getNeurotypicalBenchmark(gradeLevel);
    }

    const aggregates = await prisma.progress.groupBy({
      by: ["domain"],
      _avg: { score: true },
      where: {
        learner: {
          gradeLevel,
          diagnoses: {
            some: {}
          }
        }
      }
    });

    return this.normalizeBenchmarks(aggregates, 58);
  }

  private normalizeBenchmarks(aggregates: { domain: DomainType; _avg: { score: number | null } }[], fallback = 65) {
    return DOMAINS.reduce<Record<string, number>>((acc, domain) => {
      const aggregate = aggregates.find((item) => item.domain === domain);
      acc[domain] = Number((aggregate?._avg.score ?? fallback).toFixed(1));
      return acc;
    }, {});
  }

  private calculateComparison(current: BenchmarkMap, neurotypical: BenchmarkMap, neurodiverse: BenchmarkMap) {
    return DOMAINS.reduce<Record<string, { vsNeurotypical: string; vsNeurodiverse: string; performance: string }>>((acc, domain) => {
      const currentScore = current[domain] ?? 0;
      const ntScore = neurotypical[domain] || 1;
      const ndScore = neurodiverse[domain] || 1;

      const vsNt = ((currentScore - ntScore) / ntScore) * 100;
      const vsNd = ((currentScore - ndScore) / ndScore) * 100;

      acc[domain] = {
        vsNeurotypical: `${vsNt.toFixed(1)}%`,
        vsNeurodiverse: `${vsNd.toFixed(1)}%`,
        performance: currentScore > ndScore
          ? "ABOVE_AVERAGE"
          : currentScore < ndScore - 10
            ? "BELOW_AVERAGE"
            : "AVERAGE"
      };
      return acc;
    }, {} as Record<string, { vsNeurotypical: string; vsNeurodiverse: string; performance: string }>);
  }

  stop() {
    clearInterval(this.flushInterval);
  }
}

export function getLearningAnalytics() {
  if (!globalForAnalytics.learningAnalytics) {
    globalForAnalytics.learningAnalytics = new LearningAnalytics();
  }
  return globalForAnalytics.learningAnalytics;
}
