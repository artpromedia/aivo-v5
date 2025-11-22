/**
 * Adaptive Level Adjustment System
 * 
 * Monitors learner performance and recommends level adjustments to parents/teachers.
 * Implements game-theory inspired adaptive difficulty based on success patterns.
 */

import type { PrismaClient } from "@prisma/client";

export interface PerformanceMetrics {
  domain: string;
  currentLevel: number;
  successRate: number;
  consecutiveSuccesses: number;
  consecutiveStruggles: number;
  averageTimePerTask: number;
  engagementScore: number;
  sessionCount: number;
  lastUpdated: Date;
}

export interface LevelAdjustmentRecommendation {
  domain: string;
  currentLevel: number;
  recommendedLevel: number;
  adjustment: number; // -1, 0, or +1
  confidence: number; // 0-1
  reason: string;
  evidence: {
    successRate: number;
    sessionsSinceLastAdjustment: number;
    performanceTrend: "improving" | "stable" | "declining";
    engagementLevel: "high" | "medium" | "low";
  };
  urgency: "immediate" | "soon" | "when_convenient";
  requiresApproval: boolean;
}

export interface LevelAdjustmentNotification {
  id: string;
  learnerId: string;
  recommendations: LevelAdjustmentRecommendation[];
  createdAt: Date;
  status: "pending" | "approved" | "rejected" | "expired";
  approvedBy?: string;
  approvedAt?: Date;
}

export class AdaptiveLevelAdjustmentEngine {
  // Thresholds for level adjustments
  private readonly LEVEL_UP_SUCCESS_THRESHOLD = 0.85; // 85% success rate
  private readonly LEVEL_UP_MIN_SESSIONS = 5; // Minimum sessions before leveling up
  private readonly LEVEL_DOWN_STRUGGLE_THRESHOLD = 0.50; // Below 50% success
  private readonly LEVEL_DOWN_MIN_SESSIONS = 3; // Faster intervention for struggles
  private readonly HIGH_ENGAGEMENT_THRESHOLD = 0.75;
  private readonly LOW_ENGAGEMENT_THRESHOLD = 0.40;

  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Analyze learner performance and generate level adjustment recommendations
   */
  async analyzeAndRecommend(learnerId: string): Promise<LevelAdjustmentRecommendation[]> {
    // Fetch learner's performance metrics per domain
    const performanceByDomain = await this.fetchPerformanceMetrics(learnerId);

    if (performanceByDomain.length === 0) {
      console.log(`No performance data available for learner ${learnerId}`);
      return [];
    }

    const recommendations: LevelAdjustmentRecommendation[] = [];

    for (const metrics of performanceByDomain) {
      const recommendation = this.evaluateDomainPerformance(metrics);
      
      if (recommendation.adjustment !== 0) {
        recommendations.push(recommendation);
      }
    }

    // If there are recommendations, create a notification
    if (recommendations.length > 0) {
      await this.createNotification(learnerId, recommendations);
    }

    return recommendations;
  }

  /**
   * Evaluate performance for a single domain and determine if adjustment needed
   */
  private evaluateDomainPerformance(metrics: PerformanceMetrics): LevelAdjustmentRecommendation {
    const {
      domain,
      currentLevel,
      successRate,
      consecutiveSuccesses,
      consecutiveStruggles,
      engagementScore,
      sessionCount
    } = metrics;

    // Determine performance trend
    const performanceTrend = this.determinePerformanceTrend(
      successRate,
      consecutiveSuccesses,
      consecutiveStruggles
    );

    // Determine engagement level
    const engagementLevel = this.determineEngagementLevel(engagementScore);

    // Default: no adjustment
    let adjustment = 0;
    let confidence = 0;
    let reason = `Current level (${currentLevel}) is appropriate`;
    let urgency: "immediate" | "soon" | "when_convenient" = "when_convenient";
    let requiresApproval = true;

    // Check for level up opportunity
    if (
      successRate >= this.LEVEL_UP_SUCCESS_THRESHOLD &&
      consecutiveSuccesses >= 3 &&
      sessionCount >= this.LEVEL_UP_MIN_SESSIONS &&
      engagementLevel !== "low"
    ) {
      adjustment = +1;
      confidence = Math.min(0.95, successRate * (engagementScore + 0.5) / 1.5);
      reason = `Consistent success (${(successRate * 100).toFixed(0)}%) with ${consecutiveSuccesses} consecutive wins. Ready for more challenge!`;
      urgency = performanceTrend === "improving" && engagementLevel === "high" ? "soon" : "when_convenient";
    }
    // Check for level down necessity
    else if (
      successRate <= this.LEVEL_DOWN_STRUGGLE_THRESHOLD &&
      consecutiveStruggles >= 2 &&
      sessionCount >= this.LEVEL_DOWN_MIN_SESSIONS
    ) {
      adjustment = -1;
      confidence = Math.min(0.90, (1 - successRate) * 0.9);
      reason = `Experiencing difficulty (${(successRate * 100).toFixed(0)}% success) with ${consecutiveStruggles} consecutive struggles. Need easier content for confidence building.`;
      urgency = consecutiveStruggles >= 4 || engagementLevel === "low" ? "immediate" : "soon";
    }
    // Check for engagement-based adjustment
    else if (engagementLevel === "low" && sessionCount >= 5) {
      // Low engagement might indicate boredom (too easy) or frustration (too hard)
      if (successRate > 0.80) {
        // Too easy → level up to re-engage
        adjustment = +1;
        confidence = 0.70;
        reason = `High success (${(successRate * 100).toFixed(0)}%) but low engagement suggests boredom. Try more challenging content.`;
        urgency = "soon";
      } else if (successRate < 0.60) {
        // Too hard → level down to reduce frustration
        adjustment = -1;
        confidence = 0.75;
        reason = `Low engagement with ${(successRate * 100).toFixed(0)}% success suggests frustration. Easier content may help.`;
        urgency = "immediate";
      }
    }

    return {
      domain,
      currentLevel,
      recommendedLevel: currentLevel + adjustment,
      adjustment,
      confidence,
      reason,
      evidence: {
        successRate,
        sessionsSinceLastAdjustment: sessionCount,
        performanceTrend,
        engagementLevel
      },
      urgency,
      requiresApproval
    };
  }

  /**
   * Determine performance trend based on recent metrics
   */
  private determinePerformanceTrend(
    successRate: number,
    consecutiveSuccesses: number,
    consecutiveStruggles: number
  ): "improving" | "stable" | "declining" {
    if (consecutiveSuccesses >= 3 && successRate > 0.70) {
      return "improving";
    } else if (consecutiveStruggles >= 3 && successRate < 0.55) {
      return "declining";
    } else {
      return "stable";
    }
  }

  /**
   * Determine engagement level from score
   */
  private determineEngagementLevel(engagementScore: number): "high" | "medium" | "low" {
    if (engagementScore >= this.HIGH_ENGAGEMENT_THRESHOLD) {
      return "high";
    } else if (engagementScore >= this.LOW_ENGAGEMENT_THRESHOLD) {
      return "medium";
    } else {
      return "low";
    }
  }

  /**
   * Fetch performance metrics for all domains
   */
  private async fetchPerformanceMetrics(learnerId: string): Promise<PerformanceMetrics[]> {
    try {
      // Get learner's progress records grouped by domain
      const progress = await this.prisma.progress.findMany({
        where: {
          learnerId,
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: {
          date: "desc"
        }
      });

      if (progress.length === 0) {
        return [];
      }

      // Group by domain
      const domainGroups = new Map<string, any[]>();
      for (const record of progress) {
        const domain = record.domain || "GENERAL";
        if (!domainGroups.has(domain)) {
          domainGroups.set(domain, []);
        }
        domainGroups.get(domain)!.push(record);
      }

      // Calculate metrics for each domain
      const metrics: PerformanceMetrics[] = [];
      for (const [domain, records] of domainGroups.entries()) {
        const domainMetrics = this.calculateDomainMetrics(domain, records);
        metrics.push(domainMetrics);
      }

      return metrics;
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      return [];
    }
  }

  /**
   * Calculate metrics for a specific domain
   */
  private calculateDomainMetrics(domain: string, records: any[]): PerformanceMetrics {
    const totalSessions = records.length;
    
    // Calculate success rate (using score as proxy for success)
    const scores = records
      .map(r => r.score || 0.5)
      .filter(s => s > 0);
    const avgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0.5;
    const successRate = avgScore;

    // Calculate consecutive successes/struggles
    let consecutiveSuccesses = 0;
    let consecutiveStruggles = 0;
    for (const record of records) {
      const score = record.score || 0.5;
      if (score >= 0.75) {
        consecutiveSuccesses++;
        consecutiveStruggles = 0;
      } else if (score < 0.55) {
        consecutiveStruggles++;
        consecutiveSuccesses = 0;
      } else {
        break; // Stop at first neutral result
      }
    }

    // Engagement score (based on completion and interaction metrics)
    const engagementScore = avgScore * 0.6 + 0.4; // Simplified

    // Current level from most recent record
    const currentLevel = records[0]?.level || 1;

    return {
      domain,
      currentLevel,
      successRate,
      consecutiveSuccesses,
      consecutiveStruggles,
      averageTimePerTask: 0, // TODO: Calculate from session data
      engagementScore,
      sessionCount: totalSessions,
      lastUpdated: new Date()
    };
  }

  /**
   * Create notification for parent/teacher
   */
  private async createNotification(
    learnerId: string,
    recommendations: LevelAdjustmentRecommendation[]
  ): Promise<void> {
    try {
      // TODO: Store in database (create LevelAdjustmentNotification model)
      // For now, just log
      console.log(`\n🎯 Level Adjustment Recommendations for Learner ${learnerId}:`);
      
      for (const rec of recommendations) {
        const arrow = rec.adjustment > 0 ? "⬆️ LEVEL UP" : "⬇️ LEVEL DOWN";
        console.log(`\n${arrow} ${rec.domain}`);
        console.log(`  Current Level: ${rec.currentLevel}`);
        console.log(`  Recommended: ${rec.recommendedLevel}`);
        console.log(`  Confidence: ${(rec.confidence * 100).toFixed(0)}%`);
        console.log(`  Reason: ${rec.reason}`);
        console.log(`  Urgency: ${rec.urgency}`);
        console.log(`  Evidence:`);
        console.log(`    - Success Rate: ${(rec.evidence.successRate * 100).toFixed(0)}%`);
        console.log(`    - Trend: ${rec.evidence.performanceTrend}`);
        console.log(`    - Engagement: ${rec.evidence.engagementLevel}`);
      }

      console.log(`\n⚠️  These recommendations require parent/teacher approval.\n`);

      // TODO: Send notification to parent/teacher dashboard
      // TODO: Send email/SMS if urgency is "immediate"
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  /**
   * Apply approved level adjustment
   */
  async applyLevelAdjustment(
    learnerId: string,
    domain: string,
    newLevel: number,
    approvedBy: string
  ): Promise<void> {
    try {
      // Update learner's configuration
      const model = await this.prisma.personalizedModel.findUnique({
        where: { learnerId }
      });

      if (!model) {
        throw new Error(`No model found for learner ${learnerId}`);
      }

      const config = model.configuration as any;
      if (!config.domainLevels) {
        config.domainLevels = {};
      }
      config.domainLevels[domain] = newLevel;

      await this.prisma.personalizedModel.update({
        where: { learnerId },
        data: {
          configuration: config
        }
      });

      console.log(`✅ Level adjusted for ${domain}: ${newLevel} (approved by ${approvedBy})`);

      // TODO: Log the adjustment in history
      // TODO: Notify PersonalizedLearningAgent to reload configuration
    } catch (error) {
      console.error("Error applying level adjustment:", error);
      throw error;
    }
  }
}

export default AdaptiveLevelAdjustmentEngine;
