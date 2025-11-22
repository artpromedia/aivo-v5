/**
 * ML Training Data Collection Service
 * 
 * Collects learner interaction data for training the PersonalizedLearningAgent's
 * TensorFlow model. Captures performance, adaptations, and outcomes for supervised learning.
 */

import { PrismaClient } from "@prisma/client";
import type { LearningContext, LearningDecision } from "@aivo/agents";

export interface TrainingDataPoint {
	id: string;
	learnerId: string;
	timestamp: Date;
	
	// Input features (LearningContext)
	features: {
		// Activity context
		activityType: string;
		difficulty: number;
		
		// Recent performance
		accuracy: number;
		avgResponseTime: number;
		hintsUsed: number;
		avgAttemptsPerQuestion: number;
		consecutiveCorrect: number;
		consecutiveIncorrect: number;
		engagementScore: number;
		
		// Session context
		sessionDuration: number;
		timeSinceBreak: number;
		focusLevel: number;
		strugglesCount: number;
		
		// Learner characteristics
		age: number;
		hasADHD: boolean;
		hasDyslexia: boolean;
		hasAutism: boolean;
		gradeLevel: number;
	};
	
	// Labels (actual decision made)
	labels: {
		action: string; // "continue" | "adjust_difficulty" | "take_break" | "provide_help" | "change_activity"
		difficultyAdjustment?: number; // -2 to +2
		confidence: number;
	};
	
	// Outcome (how well did the decision work?)
	outcome?: {
		nextAccuracy: number; // Accuracy in next 5 questions
		nextEngagement: number; // Engagement in next 5 minutes
		sessionCompleted: boolean;
		totalSessionTime: number;
	};
}

export class TrainingDataCollector {
	private prisma: PrismaClient;
	private pendingDataPoints: Map<string, TrainingDataPoint> = new Map();

	constructor() {
		this.prisma = new PrismaClient();
	}

	/**
	 * Record a decision made by the agent
	 */
	recordDecision(
		learnerId: string,
		context: LearningContext,
		decision: LearningDecision,
		learnerProfile: {
			age: number;
			gradeLevel: number;
			diagnoses: { adhd: boolean; dyslexia: boolean; autism: boolean };
		}
	): string {
		const dataPointId = `${learnerId}-${Date.now()}`;

		const dataPoint: TrainingDataPoint = {
			id: dataPointId,
			learnerId,
			timestamp: new Date(),
			features: {
				// Activity
				activityType: context.currentActivity?.type || "unknown",
				difficulty: context.currentActivity?.difficulty || 5,
				
				// Performance
				accuracy: context.recentPerformance.accuracy,
				avgResponseTime: this.average(context.recentPerformance.responseTime),
				hintsUsed: context.recentPerformance.hintsUsed,
				avgAttemptsPerQuestion: this.average(context.recentPerformance.attemptsPerQuestion),
				consecutiveCorrect: context.recentPerformance.consecutiveCorrect,
				consecutiveIncorrect: context.recentPerformance.consecutiveIncorrect,
				engagementScore: context.recentPerformance.engagementScore,
				
				// Session
				sessionDuration: context.sessionDuration,
				timeSinceBreak: context.sessionDuration - context.lastBreakTime,
				focusLevel: context.focusLevel,
				strugglesCount: context.strugglesDetected.length,
				
				// Learner
				age: learnerProfile.age,
				hasADHD: learnerProfile.diagnoses.adhd,
				hasDyslexia: learnerProfile.diagnoses.dyslexia,
				hasAutism: learnerProfile.diagnoses.autism,
				gradeLevel: learnerProfile.gradeLevel
			},
			labels: {
				action: decision.action,
				difficultyAdjustment: decision.details.newDifficulty
					? decision.details.newDifficulty - context.currentActivity.difficulty
					: undefined,
				confidence: decision.confidence
			}
		};

		// Store in memory temporarily
		this.pendingDataPoints.set(dataPointId, dataPoint);

		return dataPointId;
	}

	/**
	 * Update with outcome data after observing results
	 */
	async recordOutcome(
		dataPointId: string,
		outcome: {
			nextAccuracy: number;
			nextEngagement: number;
			sessionCompleted: boolean;
			totalSessionTime: number;
		}
	): Promise<void> {
		const dataPoint = this.pendingDataPoints.get(dataPointId);
		if (!dataPoint) {
			console.warn(`Data point ${dataPointId} not found`);
			return;
		}

		dataPoint.outcome = outcome;

		// Save to database
		await this.saveToDatabase(dataPoint);

		// Remove from pending
		this.pendingDataPoints.delete(dataPointId);
	}

	/**
	 * Save training data to database
	 */
	private async saveToDatabase(dataPoint: TrainingDataPoint): Promise<void> {
		try {
			await this.prisma.$executeRaw`
				INSERT INTO "MLTrainingData" (id, "learnerId", timestamp, features, labels, outcome, "createdAt")
				VALUES (
					${dataPoint.id},
					${dataPoint.learnerId},
					${dataPoint.timestamp},
					${JSON.stringify(dataPoint.features)}::jsonb,
					${JSON.stringify(dataPoint.labels)}::jsonb,
					${dataPoint.outcome ? JSON.stringify(dataPoint.outcome) : null}::jsonb,
					${new Date()}
				)
			`;
		} catch (error) {
			console.error("Error saving training data:", error);
			// Fallback: log to file
			console.log("Training data:", JSON.stringify(dataPoint));
		}
	}

	/**
	 * Export training data for model training
	 */
	async exportTrainingData(options?: {
		startDate?: Date;
		endDate?: Date;
		minDataPoints?: number;
	}): Promise<TrainingDataPoint[]> {
		const { startDate, endDate, minDataPoints = 100 } = options || {};

		// Query from database
		const result = await this.prisma.$queryRaw<any[]>`
			SELECT *
			FROM "MLTrainingData"
			WHERE 
				outcome IS NOT NULL
				${startDate ? this.prisma.$queryRaw`AND timestamp >= ${startDate}` : this.prisma.$queryRaw``}
				${endDate ? this.prisma.$queryRaw`AND timestamp <= ${endDate}` : this.prisma.$queryRaw``}
			ORDER BY timestamp DESC
		`;

		if (result.length < minDataPoints) {
			console.warn(`Only ${result.length} data points available (minimum: ${minDataPoints})`);
		}

		return result.map(row => ({
			id: row.id,
			learnerId: row.learner_id,
			timestamp: row.timestamp,
			features: row.features,
			labels: row.labels,
			outcome: row.outcome
		}));
	}

	/**
	 * Get training statistics
	 */
	async getTrainingStats(): Promise<{
		totalDataPoints: number;
		dataPointsWithOutcome: number;
		uniqueLearners: number;
		actionDistribution: Record<string, number>;
		avgAccuracyByAction: Record<string, number>;
	}> {
		const result = await this.prisma.$queryRaw<any[]>`
			SELECT 
				COUNT(*) as total_data_points,
				COUNT(outcome) as data_points_with_outcome,
				COUNT(DISTINCT "learnerId") as unique_learners,
				labels->>'action' as action,
				AVG((outcome->>'nextAccuracy')::float) as avg_next_accuracy
			FROM "MLTrainingData"
			GROUP BY labels->>'action'
		`;

		const actionDistribution: Record<string, number> = {};
		const avgAccuracyByAction: Record<string, number> = {};
		let totalDataPoints = 0;
		let dataPointsWithOutcome = 0;
		let uniqueLearners = 0;

		result.forEach(row => {
			totalDataPoints = parseInt(row.total_data_points);
			dataPointsWithOutcome = parseInt(row.data_points_with_outcome);
			uniqueLearners = parseInt(row.unique_learners);
			actionDistribution[row.action] = parseInt(row.total_data_points);
			avgAccuracyByAction[row.action] = parseFloat(row.avg_next_accuracy) || 0;
		});

		return {
			totalDataPoints,
			dataPointsWithOutcome,
			uniqueLearners,
			actionDistribution,
			avgAccuracyByAction
		};
	}

	/**
	 * Helper: calculate average
	 */
	private average(arr: number[]): number {
		if (arr.length === 0) return 0;
		return arr.reduce((a, b) => a + b, 0) / arr.length;
	}

	/**
	 * Cleanup
	 */
	async shutdown(): Promise<void> {
		// Save any pending data points
		const pendingPromises = Array.from(this.pendingDataPoints.values()).map(
			dataPoint => this.saveToDatabase(dataPoint)
		);
		
		await Promise.all(pendingPromises);
		await this.prisma.$disconnect();
	}
}

// Singleton instance
let collector: TrainingDataCollector | null = null;

export function getTrainingDataCollector(): TrainingDataCollector {
	if (!collector) {
		collector = new TrainingDataCollector();
	}
	return collector;
}
