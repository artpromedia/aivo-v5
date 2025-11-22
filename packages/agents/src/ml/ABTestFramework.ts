/**
 * A/B Testing Framework
 * 
 * Compares ML model performance against GPT-4 decisions in production.
 * Randomly assigns learners to treatment groups and tracks outcomes.
 */

import type { LearningContext, LearningDecision } from "../PersonalizedLearningAgent";
import type { PrismaClient } from "@prisma/client";

export type TreatmentGroup = "ml" | "gpt4" | "hybrid";

export interface ABTestConfig {
	name: string;
	description: string;
	startDate: Date;
	endDate?: Date;
	groups: {
		ml: number; // Percentage (0-100)
		gpt4: number;
		hybrid: number;
	};
	minSampleSize: number;
	successMetrics: string[];
}

export interface ABTestResult {
	testName: string;
	duration: number; // days
	sampleSize: {
		ml: number;
		gpt4: number;
		hybrid: number;
	};
	metrics: {
		ml: Record<string, number>;
		gpt4: Record<string, number>;
		hybrid: Record<string, number>;
	};
	statisticalSignificance: {
		mlVsGpt4: { metric: string; pValue: number; significant: boolean }[];
		mlVsHybrid: { metric: string; pValue: number; significant: boolean }[];
	};
	winner?: TreatmentGroup;
	recommendation: string;
}

export interface Participant {
	learnerId: string;
	group: TreatmentGroup;
	assignedAt: Date;
	decisions: {
		timestamp: Date;
		action: string;
		confidence: number;
		outcome?: {
			accuracy: number;
			engagement: number;
			successful: boolean;
		};
	}[];
}

export class ABTestFramework {
	private prisma: PrismaClient;
	private activeTest: ABTestConfig | null = null;
	private participants: Map<string, Participant> = new Map();

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	/**
	 * Start A/B test
	 */
	startTest(config: ABTestConfig): void {
		// Validate config
		const totalPercentage = config.groups.ml + config.groups.gpt4 + config.groups.hybrid;
		if (Math.abs(totalPercentage - 100) > 0.01) {
			throw new Error("Group percentages must sum to 100");
		}

		this.activeTest = config;
		this.participants.clear();

		console.log(`Started A/B test: ${config.name}`);
		console.log(`Groups: ML=${config.groups.ml}%, GPT-4=${config.groups.gpt4}%, Hybrid=${config.groups.hybrid}%`);
	}

	/**
	 * Stop active test
	 */
	stopTest(): ABTestResult | null {
		if (!this.activeTest) {
			console.log("No active test to stop");
			return null;
		}

		const result = this.calculateTestResults();
		this.activeTest = null;

		console.log(`Stopped A/B test: ${result.testName}`);
		return result;
	}

	/**
	 * Assign learner to treatment group
	 */
	assignLearner(learnerId: string): TreatmentGroup {
		// Check if already assigned
		if (this.participants.has(learnerId)) {
			return this.participants.get(learnerId)!.group;
		}

		if (!this.activeTest) {
			// No active test, default to hybrid
			return "hybrid";
		}

		// Random assignment based on percentages
		const rand = Math.random() * 100;
		let group: TreatmentGroup;

		if (rand < this.activeTest.groups.ml) {
			group = "ml";
		} else if (rand < this.activeTest.groups.ml + this.activeTest.groups.gpt4) {
			group = "gpt4";
		} else {
			group = "hybrid";
		}

		// Create participant
		const participant: Participant = {
			learnerId,
			group,
			assignedAt: new Date(),
			decisions: []
		};

		this.participants.set(learnerId, participant);

		console.log(`Assigned learner ${learnerId} to group: ${group}`);
		return group;
	}

	/**
	 * Record decision for participant
	 */
	recordDecision(
		learnerId: string,
		decision: LearningDecision,
		context: LearningContext
	): void {
		const participant = this.participants.get(learnerId);
		if (!participant) {
			console.warn(`Participant not found: ${learnerId}`);
			return;
		}

		participant.decisions.push({
			timestamp: new Date(),
			action: decision.action,
			confidence: decision.confidence
		});
	}

	/**
	 * Record outcome for last decision
	 */
	recordOutcome(
		learnerId: string,
		outcome: { accuracy: number; engagement: number; successful: boolean }
	): void {
		const participant = this.participants.get(learnerId);
		if (!participant || participant.decisions.length === 0) {
			console.warn(`Cannot record outcome for learner: ${learnerId}`);
			return;
		}

		const lastDecision = participant.decisions[participant.decisions.length - 1];
		lastDecision.outcome = outcome;
	}

	/**
	 * Calculate test results
	 */
	private calculateTestResults(): ABTestResult {
		if (!this.activeTest) {
			throw new Error("No active test");
		}

		// Group participants by treatment
		const groups = {
			ml: Array.from(this.participants.values()).filter(p => p.group === "ml"),
			gpt4: Array.from(this.participants.values()).filter(p => p.group === "gpt4"),
			hybrid: Array.from(this.participants.values()).filter(p => p.group === "hybrid")
		};

		// Calculate metrics for each group
		const metrics = {
			ml: this.calculateGroupMetrics(groups.ml),
			gpt4: this.calculateGroupMetrics(groups.gpt4),
			hybrid: this.calculateGroupMetrics(groups.hybrid)
		};

		// Calculate statistical significance
		const significance = {
			mlVsGpt4: this.compareGroups(groups.ml, groups.gpt4, this.activeTest.successMetrics),
			mlVsHybrid: this.compareGroups(groups.ml, groups.hybrid, this.activeTest.successMetrics)
		};

		// Determine winner
		const winner = this.determineWinner(metrics, significance);

		// Generate recommendation
		const recommendation = this.generateRecommendation(metrics, significance, winner);

		const duration = this.activeTest.endDate
			? (this.activeTest.endDate.getTime() - this.activeTest.startDate.getTime()) /
			  (1000 * 60 * 60 * 24)
			: (Date.now() - this.activeTest.startDate.getTime()) / (1000 * 60 * 60 * 24);

		return {
			testName: this.activeTest.name,
			duration,
			sampleSize: {
				ml: groups.ml.length,
				gpt4: groups.gpt4.length,
				hybrid: groups.hybrid.length
			},
			metrics,
			statisticalSignificance: significance,
			winner,
			recommendation
		};
	}

	/**
	 * Calculate metrics for a group
	 */
	private calculateGroupMetrics(participants: Participant[]): Record<string, number> {
		const decisionsWithOutcome = participants.flatMap(p =>
			p.decisions.filter(d => d.outcome)
		);

		if (decisionsWithOutcome.length === 0) {
			return {
				avgAccuracy: 0,
				avgEngagement: 0,
				successRate: 0,
				avgConfidence: 0,
				totalDecisions: 0
			};
		}

		return {
			avgAccuracy:
				decisionsWithOutcome.reduce((sum, d) => sum + (d.outcome?.accuracy || 0), 0) /
				decisionsWithOutcome.length,
			avgEngagement:
				decisionsWithOutcome.reduce((sum, d) => sum + (d.outcome?.engagement || 0), 0) /
				decisionsWithOutcome.length,
			successRate:
				decisionsWithOutcome.filter(d => d.outcome?.successful).length /
				decisionsWithOutcome.length,
			avgConfidence:
				decisionsWithOutcome.reduce((sum, d) => sum + d.confidence, 0) /
				decisionsWithOutcome.length,
			totalDecisions: decisionsWithOutcome.length
		};
	}

	/**
	 * Compare two groups statistically (simplified t-test)
	 */
	private compareGroups(
		group1: Participant[],
		group2: Participant[],
		metrics: string[]
	): { metric: string; pValue: number; significant: boolean }[] {
		return metrics.map(metric => {
			const values1 = this.extractMetricValues(group1, metric);
			const values2 = this.extractMetricValues(group2, metric);

			const pValue = this.tTest(values1, values2);
			const significant = pValue < 0.05;

			return { metric, pValue, significant };
		});
	}

	private extractMetricValues(participants: Participant[], metric: string): number[] {
		return participants.flatMap(p =>
			p.decisions
				.filter(d => d.outcome)
				.map(d => {
					switch (metric) {
						case "accuracy":
							return d.outcome!.accuracy;
						case "engagement":
							return d.outcome!.engagement;
						case "success":
							return d.outcome!.successful ? 1 : 0;
						case "confidence":
							return d.confidence;
						default:
							return 0;
					}
				})
		);
	}

	/**
	 * Simplified t-test (Welch's t-test)
	 */
	private tTest(values1: number[], values2: number[]): number {
		if (values1.length === 0 || values2.length === 0) return 1;

		const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
		const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

		const variance1 =
			values1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / values1.length;
		const variance2 =
			values2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / values2.length;

		const pooledVariance = Math.sqrt(variance1 / values1.length + variance2 / values2.length);

		if (pooledVariance === 0) return 1;

		const tStatistic = Math.abs(mean1 - mean2) / pooledVariance;

		// Simplified p-value approximation
		// For a more accurate p-value, use a proper statistical library
		const pValue = 2 * (1 - this.normalCDF(tStatistic));

		return pValue;
	}

	/**
	 * Normal cumulative distribution function approximation
	 */
	private normalCDF(x: number): number {
		const t = 1 / (1 + 0.2316419 * Math.abs(x));
		const d = 0.3989423 * Math.exp(-x * x / 2);
		const p =
			d *
			t *
			(0.3193815 +
				t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
		return x > 0 ? 1 - p : p;
	}

	/**
	 * Determine winner based on metrics and significance
	 */
	private determineWinner(
		metrics: Record<TreatmentGroup, Record<string, number>>,
		significance: ABTestResult["statisticalSignificance"]
	): TreatmentGroup | undefined {
		// Check if ML significantly outperforms GPT-4
		const mlWinsOverGpt4 = significance.mlVsGpt4.every(
			s => s.significant && metrics.ml[s.metric] > metrics.gpt4[s.metric]
		);

		// Check if ML significantly outperforms Hybrid
		const mlWinsOverHybrid = significance.mlVsHybrid.every(
			s => s.significant && metrics.ml[s.metric] > metrics.hybrid[s.metric]
		);

		if (mlWinsOverGpt4 && mlWinsOverHybrid) {
			return "ml";
		}

		// Check if Hybrid wins
		const hybridWinsOverGpt4 = significance.mlVsGpt4.every(
			s => metrics.hybrid[s.metric] > metrics.gpt4[s.metric]
		);

		const hybridWinsOverMl = significance.mlVsHybrid.every(
			s => metrics.hybrid[s.metric] > metrics.ml[s.metric]
		);

		if (hybridWinsOverGpt4 && hybridWinsOverMl) {
			return "hybrid";
		}

		// No clear winner
		return undefined;
	}

	/**
	 * Generate recommendation based on results
	 */
	private generateRecommendation(
		metrics: Record<TreatmentGroup, Record<string, number>>,
		significance: ABTestResult["statisticalSignificance"],
		winner?: TreatmentGroup
	): string {
		if (winner === "ml") {
			return "ML model significantly outperforms GPT-4 and Hybrid. Recommend deploying ML model to 100% of users.";
		}

		if (winner === "hybrid") {
			return "Hybrid approach (ML + GPT-4 fallback) performs best. Continue with current implementation.";
		}

		// Check if any significant differences exist
		const anySignificant = [
			...significance.mlVsGpt4,
			...significance.mlVsHybrid
		].some(s => s.significant);

		if (!anySignificant) {
			return "No statistically significant differences detected. Consider extending test duration or collecting more data.";
		}

		// ML shows promise but not conclusive
		if (metrics.ml.avgAccuracy > metrics.gpt4.avgAccuracy) {
			return "ML model shows promise but results not conclusive. Continue testing or adjust confidence threshold.";
		}

		return "GPT-4 currently outperforms ML model. Continue development and retrain model with more data.";
	}

	/**
	 * Generate A/B test report
	 */
	generateReport(result: ABTestResult): string {
		const report: string[] = [];

		report.push("=== A/B Test Report ===");
		report.push(`Test: ${result.testName}`);
		report.push(`Duration: ${result.duration.toFixed(1)} days\n`);

		report.push("=== Sample Sizes ===");
		report.push(`ML: ${result.sampleSize.ml} participants`);
		report.push(`GPT-4: ${result.sampleSize.gpt4} participants`);
		report.push(`Hybrid: ${result.sampleSize.hybrid} participants\n`);

		report.push("=== Metrics Comparison ===");
		const metricNames = Object.keys(result.metrics.ml);
		metricNames.forEach(metric => {
			report.push(`\n${metric}:`);
			report.push(`  ML: ${(result.metrics.ml[metric] * 100).toFixed(2)}%`);
			report.push(`  GPT-4: ${(result.metrics.gpt4[metric] * 100).toFixed(2)}%`);
			report.push(`  Hybrid: ${(result.metrics.hybrid[metric] * 100).toFixed(2)}%`);
		});

		report.push("\n\n=== Statistical Significance ===");
		report.push("\nML vs GPT-4:");
		result.statisticalSignificance.mlVsGpt4.forEach(s => {
			report.push(
				`  ${s.metric}: p=${s.pValue.toFixed(4)} ${s.significant ? "✓ Significant" : "✗ Not significant"}`
			);
		});

		report.push("\nML vs Hybrid:");
		result.statisticalSignificance.mlVsHybrid.forEach(s => {
			report.push(
				`  ${s.metric}: p=${s.pValue.toFixed(4)} ${s.significant ? "✓ Significant" : "✗ Not significant"}`
			);
		});

		if (result.winner) {
			report.push(`\n\n=== Winner: ${result.winner.toUpperCase()} ===`);
		} else {
			report.push("\n\n=== No Clear Winner ===");
		}

		report.push(`\n${result.recommendation}`);

		return report.join("\n");
	}

	/**
	 * Save test results to database
	 */
	async saveTestResults(result: ABTestResult): Promise<void> {
		try {
			await this.prisma.$executeRaw`
				INSERT INTO "MLABTestResults" (
					id,
					test_name,
					duration,
					results,
					created_at
				)
				VALUES (
					gen_random_uuid(),
					${result.testName},
					${result.duration},
					${JSON.stringify(result)}::jsonb,
					NOW()
				)
			`;
			console.log("A/B test results saved to database");
		} catch (error) {
			console.error("Failed to save A/B test results:", error);
		}
	}
}

// Singleton instance
let abTestInstance: ABTestFramework | null = null;

export function getABTestFramework(prisma: PrismaClient): ABTestFramework {
	if (!abTestInstance) {
		abTestInstance = new ABTestFramework(prisma);
	}
	return abTestInstance;
}
