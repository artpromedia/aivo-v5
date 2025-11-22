/**
 * Model Evaluator
 * 
 * Compares ML model predictions against GPT-4 decisions to validate
 * model performance and identify areas for improvement.
 */

import type { LearningContext, LearningDecision } from "../PersonalizedLearningAgent";
import type { TrainingDataPoint } from "./TrainingDataCollector";
import { ModelTrainer } from "./ModelTrainer";
import * as tf from "@tensorflow/tfjs-node";
import type { PrismaClient } from "@prisma/client";

export interface EvaluationMetrics {
	accuracy: number;
	precision: Record<string, number>;
	recall: Record<string, number>;
	f1Score: Record<string, number>;
	confusionMatrix: number[][];
	actionDistribution: {
		model: Record<string, number>;
		gpt4: Record<string, number>;
	};
	confidenceCalibration: {
		bins: number[];
		accuracy: number[];
		confidence: number[];
	};
	outcomeMetrics: {
		avgAccuracyByAction: {
			model: Record<string, number>;
			gpt4: Record<string, number>;
		};
		avgEngagementByAction: {
			model: Record<string, number>;
			gpt4: Record<string, number>;
		};
	};
}

export interface ComparisonResult {
	mlDecision: LearningDecision;
	gpt4Decision: LearningDecision;
	match: boolean;
	mlConfidence: number;
	context: LearningContext;
	timestamp: Date;
}

export class ModelEvaluator {
	private prisma: PrismaClient;
	private modelTrainer: ModelTrainer;
	private comparisons: ComparisonResult[] = [];

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
		this.modelTrainer = new ModelTrainer();
	}

	/**
	 * Evaluate model against test data
	 */
	async evaluateModel(
		model: tf.LayersModel,
		testData: TrainingDataPoint[]
	): Promise<EvaluationMetrics> {
		console.log(`Evaluating model on ${testData.length} test samples...`);

		// Prepare predictions
		const predictions: { predicted: string; actual: string; confidence: number }[] = [];
		const actionSet = new Set<string>();

		for (const dataPoint of testData) {
			if (!dataPoint.outcome) continue;

			const features = {
				difficulty: dataPoint.features.difficulty,
				accuracy: dataPoint.features.accuracy,
				avgResponseTime: dataPoint.features.avgResponseTime,
				hintsUsed: dataPoint.features.hintsUsed,
				avgAttemptsPerQuestion: dataPoint.features.avgAttemptsPerQuestion,
				consecutiveCorrect: dataPoint.features.consecutiveCorrect,
				consecutiveIncorrect: dataPoint.features.consecutiveIncorrect,
				engagementScore: dataPoint.features.engagementScore,
				sessionDuration: dataPoint.features.sessionDuration,
				timeSinceBreak: dataPoint.features.timeSinceBreak,
				focusLevel: dataPoint.features.focusLevel,
				strugglesCount: dataPoint.features.strugglesCount,
				age: dataPoint.features.age,
				hasADHD: dataPoint.features.hasADHD,
				hasDyslexia: dataPoint.features.hasDyslexia,
				hasAutism: dataPoint.features.hasAutism,
				gradeLevel: dataPoint.features.gradeLevel
			};

			const prediction = this.modelTrainer.predict(model, features);
			predictions.push({
				predicted: prediction.action,
				actual: dataPoint.labels.action,
				confidence: prediction.confidence
			});

			actionSet.add(prediction.action);
			actionSet.add(dataPoint.labels.action);
		}

		const actions = Array.from(actionSet);
		const actionToIndex = Object.fromEntries(actions.map((a, i) => [a, i]));

		// Calculate confusion matrix
		const confusionMatrix = Array(actions.length)
			.fill(0)
			.map(() => Array(actions.length).fill(0));

		predictions.forEach(({ predicted, actual }) => {
			const predIdx = actionToIndex[predicted];
			const actualIdx = actionToIndex[actual];
			confusionMatrix[actualIdx][predIdx]++;
		});

		// Calculate precision, recall, F1 for each action
		const precision: Record<string, number> = {};
		const recall: Record<string, number> = {};
		const f1Score: Record<string, number> = {};

		actions.forEach((action, idx) => {
			const truePositive = confusionMatrix[idx][idx];
			const falsePositive = confusionMatrix.reduce(
				(sum, row, i) => (i !== idx ? sum + row[idx] : sum),
				0
			);
			const falseNegative = confusionMatrix[idx].reduce(
				(sum, val, i) => (i !== idx ? sum + val : sum),
				0
			);

			precision[action] =
				truePositive + falsePositive > 0 ? truePositive / (truePositive + falsePositive) : 0;
			recall[action] =
				truePositive + falseNegative > 0 ? truePositive / (truePositive + falseNegative) : 0;
			f1Score[action] =
				precision[action] + recall[action] > 0
					? (2 * precision[action] * recall[action]) / (precision[action] + recall[action])
					: 0;
		});

		// Calculate overall accuracy
		const correct = predictions.filter(p => p.predicted === p.actual).length;
		const accuracy = correct / predictions.length;

		// Calculate action distribution
		const modelDist: Record<string, number> = {};
		const actualDist: Record<string, number> = {};
		predictions.forEach(p => {
			modelDist[p.predicted] = (modelDist[p.predicted] || 0) + 1;
			actualDist[p.actual] = (actualDist[p.actual] || 0) + 1;
		});

		// Confidence calibration
		const { bins, accuracy: binAccuracy, confidence: binConfidence } = this.calculateCalibration(
			predictions
		);

		// Outcome metrics (from training data)
		const outcomeMetrics = this.calculateOutcomeMetrics(testData);

		return {
			accuracy,
			precision,
			recall,
			f1Score,
			confusionMatrix,
			actionDistribution: {
				model: modelDist,
				gpt4: actualDist
			},
			confidenceCalibration: {
				bins,
				accuracy: binAccuracy,
				confidence: binConfidence
			},
			outcomeMetrics
		};
	}

	/**
	 * Calculate confidence calibration
	 */
	private calculateCalibration(
		predictions: { predicted: string; actual: string; confidence: number }[]
	): { bins: number[]; accuracy: number[]; confidence: number[] } {
		const numBins = 10;
		const bins = Array.from({ length: numBins }, (_, i) => i / numBins);
		const binCounts = Array(numBins).fill(0);
		const binCorrect = Array(numBins).fill(0);
		const binConfidence = Array(numBins).fill(0);

		predictions.forEach(p => {
			const binIdx = Math.min(Math.floor(p.confidence * numBins), numBins - 1);
			binCounts[binIdx]++;
			binConfidence[binIdx] += p.confidence;
			if (p.predicted === p.actual) {
				binCorrect[binIdx]++;
			}
		});

		const binAccuracy = binCounts.map((count, i) => (count > 0 ? binCorrect[i] / count : 0));
		const avgConfidence = binCounts.map((count, i) =>
			count > 0 ? binConfidence[i] / count : 0
		);

		return {
			bins,
			accuracy: binAccuracy,
			confidence: avgConfidence
		};
	}

	/**
	 * Calculate outcome metrics from training data
	 */
	private calculateOutcomeMetrics(data: TrainingDataPoint[]): EvaluationMetrics["outcomeMetrics"] {
		const modelMetrics: Record<string, { accuracy: number[]; engagement: number[] }> = {};
		const gpt4Metrics: Record<string, { accuracy: number[]; engagement: number[] }> = {};

		data.forEach(point => {
			if (!point.outcome) return;

			const action = point.labels.action;
			const isModelPrediction = point.labels.confidence > 0.75; // Assume high confidence = model

			const metrics = isModelPrediction ? modelMetrics : gpt4Metrics;
			if (!metrics[action]) {
				metrics[action] = { accuracy: [], engagement: [] };
			}

			metrics[action].accuracy.push(point.outcome.nextAccuracy);
			metrics[action].engagement.push(point.outcome.nextEngagement);
		});

		const avgAccuracyByAction = {
			model: Object.fromEntries(
				Object.entries(modelMetrics).map(([action, m]) => [
					action,
					m.accuracy.reduce((a, b) => a + b, 0) / m.accuracy.length
				])
			),
			gpt4: Object.fromEntries(
				Object.entries(gpt4Metrics).map(([action, m]) => [
					action,
					m.accuracy.reduce((a, b) => a + b, 0) / m.accuracy.length
				])
			)
		};

		const avgEngagementByAction = {
			model: Object.fromEntries(
				Object.entries(modelMetrics).map(([action, m]) => [
					action,
					m.engagement.reduce((a, b) => a + b, 0) / m.engagement.length
				])
			),
			gpt4: Object.fromEntries(
				Object.entries(gpt4Metrics).map(([action, m]) => [
					action,
					m.engagement.reduce((a, b) => a + b, 0) / m.engagement.length
				])
			)
		};

		return {
			avgAccuracyByAction,
			avgEngagementByAction
		};
	}

	/**
	 * Record comparison between ML and GPT-4 decisions
	 */
	recordComparison(
		mlDecision: LearningDecision,
		gpt4Decision: LearningDecision,
		context: LearningContext
	): void {
		this.comparisons.push({
			mlDecision,
			gpt4Decision,
			match: mlDecision.action === gpt4Decision.action,
			mlConfidence: mlDecision.confidence,
			context,
			timestamp: new Date()
		});
	}

	/**
	 * Generate evaluation report
	 */
	generateReport(metrics: EvaluationMetrics): string {
		const report: string[] = [];

		report.push("=== Model Evaluation Report ===\n");
		report.push(`Overall Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%\n`);

		report.push("\n=== Per-Action Metrics ===");
		Object.keys(metrics.precision).forEach(action => {
			report.push(`\n${action}:`);
			report.push(`  Precision: ${(metrics.precision[action] * 100).toFixed(2)}%`);
			report.push(`  Recall: ${(metrics.recall[action] * 100).toFixed(2)}%`);
			report.push(`  F1 Score: ${(metrics.f1Score[action] * 100).toFixed(2)}%`);
		});

		report.push("\n\n=== Action Distribution ===");
		report.push("\nModel:");
		Object.entries(metrics.actionDistribution.model).forEach(([action, count]) => {
			report.push(`  ${action}: ${count}`);
		});
		report.push("\nGPT-4:");
		Object.entries(metrics.actionDistribution.gpt4).forEach(([action, count]) => {
			report.push(`  ${action}: ${count}`);
		});

		report.push("\n\n=== Confidence Calibration ===");
		metrics.confidenceCalibration.bins.forEach((bin, i) => {
			report.push(
				`Confidence ${(bin * 100).toFixed(0)}-${((bin + 0.1) * 100).toFixed(0)}%: Accuracy ${(metrics.confidenceCalibration.accuracy[i] * 100).toFixed(2)}%`
			);
		});

		report.push("\n\n=== Outcome Comparison ===");
		report.push("\nAverage Accuracy by Action:");
		report.push("  Model:");
		Object.entries(metrics.outcomeMetrics.avgAccuracyByAction.model).forEach(([action, acc]) => {
			report.push(`    ${action}: ${(acc * 100).toFixed(2)}%`);
		});
		report.push("  GPT-4:");
		Object.entries(metrics.outcomeMetrics.avgAccuracyByAction.gpt4).forEach(([action, acc]) => {
			report.push(`    ${action}: ${(acc * 100).toFixed(2)}%`);
		});

		report.push("\nAverage Engagement by Action:");
		report.push("  Model:");
		Object.entries(metrics.outcomeMetrics.avgEngagementByAction.model).forEach(
			([action, eng]) => {
				report.push(`    ${action}: ${(eng * 100).toFixed(2)}%`);
			}
		);
		report.push("  GPT-4:");
		Object.entries(metrics.outcomeMetrics.avgEngagementByAction.gpt4).forEach(
			([action, eng]) => {
				report.push(`    ${action}: ${(eng * 100).toFixed(2)}%`);
			}
		);

		return report.join("\n");
	}

	/**
	 * Export comparison data
	 */
	exportComparisons(): ComparisonResult[] {
		return this.comparisons;
	}

	/**
	 * Get agreement rate between model and GPT-4
	 */
	getAgreementRate(): number {
		if (this.comparisons.length === 0) return 0;
		const matches = this.comparisons.filter(c => c.match).length;
		return matches / this.comparisons.length;
	}

	/**
	 * Save evaluation results to database
	 */
	async saveEvaluationResults(
		metrics: EvaluationMetrics,
		modelVersion: string
	): Promise<void> {
		try {
			await this.prisma.$executeRaw`
				INSERT INTO "MLEvaluationResults" (
					id,
					model_version,
					accuracy,
					metrics,
					created_at
				)
				VALUES (
					gen_random_uuid(),
					${modelVersion},
					${metrics.accuracy},
					${JSON.stringify(metrics)}::jsonb,
					NOW()
				)
			`;
			console.log("Evaluation results saved to database");
		} catch (error) {
			console.error("Failed to save evaluation results:", error);
		}
	}
}
