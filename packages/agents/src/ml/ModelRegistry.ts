/**
 * ModelRegistry - Tracks main model versions and learner model instances
 * 
 * This provides:
 * - Version control for main AIVO model
 * - Registry of all learner-specific model instances
 * - Update history tracking for federated learning
 * - Model performance metrics
 */

import * as fs from "fs/promises";
import * as path from "path";

export interface MainModelVersion {
	version: string;
	modelPath: string;
	createdAt: Date;
	trainingMetrics: {
		accuracy: number;
		loss: number;
		epochs: number;
		samples: number;
	};
	architecture: {
		inputDim: number;
		hiddenLayers: number[];
		outputHeads: Record<string, number>;
	};
	federatedUpdates: FederatedUpdateRecord[];
}

export interface FederatedUpdateRecord {
	updateId: string;
	timestamp: Date;
	contributingLearners: string[];
	aggregationStrategy: string;
	performanceImprovement: number;
	privacyBudget?: number;
}

export interface LearnerModelInstance {
	learnerId: string;
	modelPath: string;
	sourceVersion: string;
	clonedAt: Date;
	lastTrainingSession?: Date;
	trainingHistory: TrainingSession[];
	performanceMetrics: {
		accuracy: number;
		loss: number;
		improvement: number;
	};
	status: "active" | "archived" | "training";
}

export interface TrainingSession {
	sessionId: string;
	timestamp: Date;
	epochs: number;
	samples: number;
	metrics: {
		loss: number;
		accuracy: number;
	};
	contributedToFederation: boolean;
	federatedUpdateId?: string;
}

export class ModelRegistry {
	private registryPath: string;
	private mainModelRegistry: Map<string, MainModelVersion>;
	private learnerModelRegistry: Map<string, LearnerModelInstance>;

	constructor(registryBasePath?: string) {
		this.registryPath = registryBasePath || path.join(process.cwd(), "models", "registry");
		this.mainModelRegistry = new Map();
		this.learnerModelRegistry = new Map();
	}

	/**
	 * Initialize registry (load existing data)
	 */
	async initialize(): Promise<void> {
		console.log("Initializing model registry...");

		// Ensure registry directory exists
		await fs.mkdir(this.registryPath, { recursive: true });

		// Load main model registry
		const mainRegistryPath = path.join(this.registryPath, "main-models.json");
		try {
			const data = await fs.readFile(mainRegistryPath, "utf-8");
			const records = JSON.parse(data);
			this.mainModelRegistry = new Map(Object.entries(records));
			console.log(`Loaded ${this.mainModelRegistry.size} main model versions`);
		} catch (error) {
			console.log("No existing main model registry found, creating new one");
		}

		// Load learner model registry
		const learnerRegistryPath = path.join(this.registryPath, "learner-models.json");
		try {
			const data = await fs.readFile(learnerRegistryPath, "utf-8");
			const records = JSON.parse(data);
			this.learnerModelRegistry = new Map(Object.entries(records));
			console.log(`Loaded ${this.learnerModelRegistry.size} learner model instances`);
		} catch (error) {
			console.log("No existing learner model registry found, creating new one");
		}
	}

	/**
	 * Register a new main model version
	 */
	async registerMainModel(modelVersion: MainModelVersion): Promise<void> {
		console.log(`Registering main model version: ${modelVersion.version}`);

		this.mainModelRegistry.set(modelVersion.version, {
			...modelVersion,
			federatedUpdates: modelVersion.federatedUpdates || []
		});

		await this.saveMainRegistry();
	}

	/**
	 * Register a learner model instance
	 */
	async registerLearnerModel(instance: LearnerModelInstance): Promise<void> {
		console.log(`Registering learner model: ${instance.learnerId}`);

		this.learnerModelRegistry.set(instance.learnerId, {
			...instance,
			trainingHistory: instance.trainingHistory || []
		});

		await this.saveLearnerRegistry();
	}

	/**
	 * Record a federated update to the main model
	 */
	async recordFederatedUpdate(
		mainModelVersion: string,
		update: FederatedUpdateRecord
	): Promise<void> {
		const model = this.mainModelRegistry.get(mainModelVersion);
		if (!model) {
			throw new Error(`Main model version ${mainModelVersion} not found in registry`);
		}

		model.federatedUpdates.push(update);

		// Update contributing learners' records
		for (const learnerId of update.contributingLearners) {
			const learnerModel = this.learnerModelRegistry.get(learnerId);
			if (learnerModel && learnerModel.trainingHistory.length > 0) {
				// Mark last training session as contributed
				const lastSession = learnerModel.trainingHistory[learnerModel.trainingHistory.length - 1];
				lastSession.contributedToFederation = true;
				lastSession.federatedUpdateId = update.updateId;
			}
		}

		await this.saveMainRegistry();
		await this.saveLearnerRegistry();

		console.log(`Recorded federated update ${update.updateId} with ${update.contributingLearners.length} learners`);
	}

	/**
	 * Record a training session for a learner model
	 */
	async recordTrainingSession(
		learnerId: string,
		session: TrainingSession
	): Promise<void> {
		const learnerModel = this.learnerModelRegistry.get(learnerId);
		if (!learnerModel) {
			throw new Error(`Learner model ${learnerId} not found in registry`);
		}

		learnerModel.trainingHistory.push(session);
		learnerModel.lastTrainingSession = session.timestamp;

		// Update performance metrics
		learnerModel.performanceMetrics = {
			accuracy: session.metrics.accuracy,
			loss: session.metrics.loss,
			improvement: this.calculateImprovement(learnerModel.trainingHistory)
		};

		await this.saveLearnerRegistry();

		console.log(`Recorded training session for learner ${learnerId}`);
	}

	/**
	 * Get latest main model version
	 */
	getLatestMainModel(): MainModelVersion | null {
		if (this.mainModelRegistry.size === 0) return null;

		const versions = Array.from(this.mainModelRegistry.values());
		return versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
	}

	/**
	 * Get learner model instance
	 */
	getLearnerModel(learnerId: string): LearnerModelInstance | null {
		return this.learnerModelRegistry.get(learnerId) || null;
	}

	/**
	 * Get all active learner models
	 */
	getActiveLearnerModels(): LearnerModelInstance[] {
		return Array.from(this.learnerModelRegistry.values()).filter(
			model => model.status === "active"
		);
	}

	/**
	 * Get learners eligible for federated aggregation
	 * (those with recent training that haven't contributed yet)
	 */
	getEligibleForAggregation(sinceDays: number = 7): LearnerModelInstance[] {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - sinceDays);

		return Array.from(this.learnerModelRegistry.values()).filter(model => {
			if (model.status !== "active") return false;
			if (!model.lastTrainingSession) return false;
			if (model.lastTrainingSession < cutoffDate) return false;

			// Check if last training contributed to federation
			const lastSession = model.trainingHistory[model.trainingHistory.length - 1];
			return !lastSession.contributedToFederation;
		});
	}

	/**
	 * Get main model update history
	 */
	getUpdateHistory(mainModelVersion: string): FederatedUpdateRecord[] {
		const model = this.mainModelRegistry.get(mainModelVersion);
		return model?.federatedUpdates || [];
	}

	/**
	 * Get learner training history
	 */
	getTrainingHistory(learnerId: string): TrainingSession[] {
		const learner = this.learnerModelRegistry.get(learnerId);
		return learner?.trainingHistory || [];
	}

	/**
	 * Archive a learner model
	 */
	async archiveLearnerModel(learnerId: string): Promise<void> {
		const model = this.learnerModelRegistry.get(learnerId);
		if (model) {
			model.status = "archived";
			await this.saveLearnerRegistry();
			console.log(`Archived learner model: ${learnerId}`);
		}
	}

	/**
	 * Get registry statistics
	 */
	getStatistics(): {
		totalMainVersions: number;
		totalLearnerModels: number;
		activeLearnerModels: number;
		totalFederatedUpdates: number;
		totalTrainingSessions: number;
		averagePerformance: number;
	} {
		const mainVersions = Array.from(this.mainModelRegistry.values());
		const learnerModels = Array.from(this.learnerModelRegistry.values());

		const totalFederatedUpdates = mainVersions.reduce(
			(sum, version) => sum + version.federatedUpdates.length,
			0
		);

		const totalTrainingSessions = learnerModels.reduce(
			(sum, model) => sum + model.trainingHistory.length,
			0
		);

		const activeModels = learnerModels.filter(m => m.status === "active");
		const averagePerformance = activeModels.length > 0
			? activeModels.reduce((sum, m) => sum + m.performanceMetrics.accuracy, 0) / activeModels.length
			: 0;

		return {
			totalMainVersions: this.mainModelRegistry.size,
			totalLearnerModels: this.learnerModelRegistry.size,
			activeLearnerModels: activeModels.length,
			totalFederatedUpdates,
			totalTrainingSessions,
			averagePerformance
		};
	}

	/**
	 * Export registry for backup
	 */
	async exportRegistry(exportPath: string): Promise<void> {
		const registryData = {
			mainModels: Object.fromEntries(this.mainModelRegistry),
			learnerModels: Object.fromEntries(this.learnerModelRegistry),
			exportDate: new Date().toISOString()
		};

		await fs.writeFile(
			exportPath,
			JSON.stringify(registryData, null, 2)
		);

		console.log(`Registry exported to: ${exportPath}`);
	}

	/**
	 * Calculate performance improvement over training history
	 */
	private calculateImprovement(history: TrainingSession[]): number {
		if (history.length < 2) return 0;

		const firstSession = history[0];
		const lastSession = history[history.length - 1];

		return lastSession.metrics.accuracy - firstSession.metrics.accuracy;
	}

	/**
	 * Save main model registry to disk
	 */
	private async saveMainRegistry(): Promise<void> {
		const registryPath = path.join(this.registryPath, "main-models.json");
		const data = Object.fromEntries(this.mainModelRegistry);
		await fs.writeFile(registryPath, JSON.stringify(data, null, 2));
	}

	/**
	 * Save learner model registry to disk
	 */
	private async saveLearnerRegistry(): Promise<void> {
		const registryPath = path.join(this.registryPath, "learner-models.json");
		const data = Object.fromEntries(this.learnerModelRegistry);
		await fs.writeFile(registryPath, JSON.stringify(data, null, 2));
	}
}
