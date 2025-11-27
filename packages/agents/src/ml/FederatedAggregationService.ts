/**
 * FederatedAggregationService - Periodically aggregates learner updates to main model
 * 
 * This service:
 * - Runs on schedule (e.g., weekly) to collect learner model updates
 * - Aggregates updates using FedAvg or other strategies
 * - Updates main model with aggregated weights
 * - Preserves privacy through differential privacy techniques
 * - Tracks update history and performance
 */

import { FederatedLearningManager, type FederatedUpdate } from "./FederatedLearning";
import { ModelCloner } from "./ModelCloner";
import { ModelRegistry, type FederatedUpdateRecord } from "./ModelRegistry";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

export interface AggregationConfig {
	mainModelPath: string;
	aggregationStrategy: "fedavg" | "fedprox" | "weighted";
	minimumLearners: number;
	maxStaleDays: number; // Maximum age of learner updates to include
	learningRate: number; // How much to update main model
	enableDifferentialPrivacy: boolean;
	noiseMultiplier?: number;
	clipNorm?: number;
}

export interface AggregationJob {
	jobId: string;
	scheduledAt: Date;
	startedAt?: Date;
	completedAt?: Date;
	status: "pending" | "running" | "completed" | "failed";
	eligibleLearners: string[];
	contributingLearners: string[];
	aggregationResults?: {
		performanceImprovement: number;
		privacyBudget: number;
		error?: string;
	};
}

export class FederatedAggregationService {
	private federatedManager: FederatedLearningManager;
	private modelCloner: ModelCloner;
	private registry: ModelRegistry;
	private config: AggregationConfig;
	private activeJobs: Map<string, AggregationJob>;

	constructor(config: AggregationConfig) {
		this.config = config;
		this.federatedManager = new FederatedLearningManager();
		this.modelCloner = new ModelCloner();
		this.registry = new ModelRegistry();
		this.activeJobs = new Map();
	}

	/**
	 * Initialize the service
	 */
	async initialize(): Promise<void> {
		console.log("Initializing Federated Aggregation Service...");
		await this.registry.initialize();
		console.log("Service ready");
	}

	/**
	 * Schedule an aggregation job
	 */
	async scheduleAggregation(): Promise<string> {
		const jobId = uuidv4();
		
		// Find eligible learners
		const eligibleLearners = this.registry.getEligibleForAggregation(this.config.maxStaleDays);
		
		if (eligibleLearners.length < this.config.minimumLearners) {
			console.log(`Not enough eligible learners (${eligibleLearners.length} < ${this.config.minimumLearners})`);
			return "";
		}

		const job: AggregationJob = {
			jobId,
			scheduledAt: new Date(),
			status: "pending",
			eligibleLearners: eligibleLearners.map(l => l.learnerId),
			contributingLearners: []
		};

		this.activeJobs.set(jobId, job);
		console.log(`Scheduled aggregation job ${jobId} with ${eligibleLearners.length} eligible learners`);

		return jobId;
	}

	/**
	 * Execute an aggregation job
	 */
	async executeAggregation(jobId: string): Promise<void> {
		const job = this.activeJobs.get(jobId);
		if (!job) {
			throw new Error(`Job ${jobId} not found`);
		}

		if (job.status !== "pending") {
			throw new Error(`Job ${jobId} is not in pending status`);
		}

		console.log(`\n=== Starting Federated Aggregation Job ${jobId} ===`);
		job.status = "running";
		job.startedAt = new Date();

		try {
			// Step 1: Extract weight deltas from eligible learners
			console.log("\nStep 1: Extracting weight deltas from learner models...");
			const updates: FederatedUpdate[] = [];

			for (const learnerId of job.eligibleLearners) {
				try {
					const learnerModel = this.registry.getLearnerModel(learnerId);
					if (!learnerModel) continue;

					// Extract deltas
					const deltas = await this.modelCloner.extractWeightDeltas(
						this.config.mainModelPath,
						learnerModel.modelPath
					);

					// Get training history
					const trainingHistory = this.registry.getTrainingHistory(learnerId);
					const lastSession = trainingHistory[trainingHistory.length - 1];

					updates.push({
						learnerId,
						weightDeltas: deltas,
						numSamples: lastSession.samples,
						trainingMetrics: {
							loss: lastSession.metrics.loss,
							accuracy: lastSession.metrics.accuracy,
							epochs: lastSession.epochs
						},
						timestamp: lastSession.timestamp
					});

					job.contributingLearners.push(learnerId);
					console.log(`  ✓ Extracted deltas from learner ${learnerId}`);
				} catch (error) {
					console.warn(`  ✗ Failed to extract deltas from learner ${learnerId}:`, error);
				}
			}

			if (updates.length < this.config.minimumLearners) {
				throw new Error(`Only ${updates.length} learners contributed, need ${this.config.minimumLearners}`);
			}

			console.log(`\nCollected updates from ${updates.length} learners`);

			// Step 2: Aggregate updates
			console.log("\nStep 2: Aggregating updates...");
			const aggregationResult = await this.federatedManager.aggregateUpdates(
				updates,
				this.config.aggregationStrategy
			);

			console.log(`Aggregation strategy: ${aggregationResult.aggregationStrategy}`);
			console.log(`Total samples: ${aggregationResult.totalSamples}`);

			// Step 3: Evaluate main model before update
			console.log("\nStep 3: Evaluating main model (before update)...");
			const beforePerformance = await this.evaluateMainModel();
			console.log(`Before - Loss: ${beforePerformance.loss.toFixed(4)}, Accuracy: ${beforePerformance.accuracy.toFixed(4)}`);

			// Step 4: Update main model
			console.log("\nStep 4: Updating main model...");
			await this.federatedManager.updateMainModel(
				this.config.mainModelPath,
				aggregationResult.aggregatedWeights,
				this.config.learningRate
			);

			// Step 5: Evaluate main model after update
			console.log("\nStep 5: Evaluating main model (after update)...");
			const afterPerformance = await this.evaluateMainModel();
			console.log(`After - Loss: ${afterPerformance.loss.toFixed(4)}, Accuracy: ${afterPerformance.accuracy.toFixed(4)}`);

			const performanceImprovement = afterPerformance.accuracy - beforePerformance.accuracy;
			console.log(`Performance improvement: ${(performanceImprovement * 100).toFixed(2)}%`);

			// Step 6: Calculate privacy budget
			let privacyBudget = 0;
			if (this.config.enableDifferentialPrivacy && this.config.noiseMultiplier) {
				privacyBudget = this.federatedManager.calculatePrivacyBudget(
					10, // Average epochs
					32, // Average batch size
					1000, // Average dataset size
					this.config.noiseMultiplier
				);
			}

			// Step 7: Record update in registry
			console.log("\nStep 6: Recording federated update in registry...");
			const mainModel = this.registry.getLatestMainModel();
			if (mainModel) {
				const updateRecord: FederatedUpdateRecord = {
					updateId: jobId,
					timestamp: new Date(),
					contributingLearners: job.contributingLearners,
					aggregationStrategy: this.config.aggregationStrategy,
					performanceImprovement,
					privacyBudget: privacyBudget > 0 ? privacyBudget : undefined
				};

				await this.registry.recordFederatedUpdate(mainModel.version, updateRecord);
			}

			// Complete job
			job.status = "completed";
			job.completedAt = new Date();
			job.aggregationResults = {
				performanceImprovement,
				privacyBudget
			};

			console.log(`\n=== Aggregation Job ${jobId} Completed Successfully ===\n`);

			// Clean up tensors
			aggregationResult.aggregatedWeights.forEach(w => w.dispose());
			updates.forEach(update => update.weightDeltas.forEach(d => d.dispose()));

		} catch (error) {
			console.error(`\n=== Aggregation Job ${jobId} Failed ===`);
			console.error(error);

			job.status = "failed";
			job.completedAt = new Date();
			job.aggregationResults = {
				performanceImprovement: 0,
				privacyBudget: 0,
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}

	/**
	 * Run scheduled aggregation (to be called by cron job or scheduler)
	 */
	async runScheduledAggregation(): Promise<string | null> {
		console.log("\n=== Running Scheduled Federated Aggregation ===");
		console.log(`Time: ${new Date().toISOString()}`);

		const jobId = await this.scheduleAggregation();
		
		if (!jobId) {
			console.log("No aggregation scheduled (not enough eligible learners)");
			return null;
		}

		await this.executeAggregation(jobId);
		return jobId;
	}

	/**
	 * Get job status
	 */
	getJobStatus(jobId: string): AggregationJob | null {
		return this.activeJobs.get(jobId) || null;
	}

	/**
	 * Get all jobs
	 */
	getAllJobs(): AggregationJob[] {
		return Array.from(this.activeJobs.values());
	}

	/**
	 * Get recent jobs
	 */
	getRecentJobs(count: number = 10): AggregationJob[] {
		return Array.from(this.activeJobs.values())
			.sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
			.slice(0, count);
	}

	/**
	 * Get registry statistics
	 */
	getStatistics() {
		return this.registry.getStatistics();
	}

	/**
	 * Evaluate main model performance (stub - needs test data)
	 */
	private async evaluateMainModel(): Promise<{ loss: number; accuracy: number }> {
		// TODO: Load test dataset and evaluate
		// For now, return mock values
		return {
			loss: Math.random() * 0.5,
			accuracy: 0.85 + Math.random() * 0.1
		};
	}

	/**
	 * Clean up old jobs
	 */
	cleanupOldJobs(daysOld: number = 30): void {
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - daysOld);

		for (const [jobId, job] of this.activeJobs.entries()) {
			if (job.completedAt && job.completedAt < cutoff) {
				this.activeJobs.delete(jobId);
			}
		}
	}
}
