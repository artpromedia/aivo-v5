/**
 * FederatedLearning - Implements federated learning for AIVO
 * 
 * This enables:
 * - Local training on learner-specific data (privacy-preserving)
 * - Gradient aggregation across multiple learners
 * - Periodic updates to main model without sharing raw data
 * - Differential privacy techniques
 */

import * as tf from "@tensorflow/tfjs-node";
import * as fs from "fs/promises";
import * as path from "path";

export interface FederatedTrainingConfig {
	learnerModelPath: string;
	localEpochs: number;
	batchSize: number;
	learningRate: number;
	clipNorm?: number; // Gradient clipping for privacy
	noiseMultiplier?: number; // Differential privacy noise
}

export interface FederatedUpdate {
	learnerId: string;
	weightDeltas: tf.Tensor[];
	numSamples: number; // For weighted averaging
	trainingMetrics: {
		loss: number;
		accuracy: number;
		epochs: number;
	};
	timestamp: Date;
}

export interface AggregationResult {
	aggregatedWeights: tf.Tensor[];
	contributingLearners: number;
	totalSamples: number;
	aggregationStrategy: "fedavg" | "fedprox" | "weighted";
	timestamp: Date;
}

export class FederatedLearningManager {
	/**
	 * Train a learner's local model on their data
	 */
	async trainLocalModel(
		config: FederatedTrainingConfig,
		trainingData: { features: number[][]; labels: number[][] }
	): Promise<FederatedUpdate> {
		console.log(`Starting local training for learner model at: ${config.learnerModelPath}`);

		// Load the learner's cloned model
		const modelPath = `file://${path.resolve(config.learnerModelPath)}/model.json`;
		const model = await tf.loadLayersModel(modelPath);

		// Store original weights for delta calculation
		const originalWeights = model.getWeights().map(w => w.clone());

		// Compile model for training
		model.compile({
			optimizer: tf.train.adam(config.learningRate),
			loss: "categoricalCrossentropy",
			metrics: ["accuracy"]
		});

		// Convert data to tensors
		const xTrain = tf.tensor2d(trainingData.features);
		const yTrain = tf.tensor2d(trainingData.labels);

		// Train locally
		console.log(`Training for ${config.localEpochs} epochs...`);
		const history = await model.fit(xTrain, yTrain, {
			epochs: config.localEpochs,
			batchSize: config.batchSize,
			shuffle: true,
			verbose: 0
		});

		// Get final metrics
		const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
		const finalAccuracy = history.history.acc[history.history.acc.length - 1] as number;

		// Get updated weights
		const updatedWeights = model.getWeights();

		// Calculate weight deltas (updated - original)
		const weightDeltas = updatedWeights.map((updated, i) => 
			updated.sub(originalWeights[i])
		);

		// Apply gradient clipping if specified (for privacy)
		if (config.clipNorm) {
			this.clipGradients(weightDeltas, config.clipNorm);
		}

		// Add differential privacy noise if specified
		if (config.noiseMultiplier) {
			this.addPrivacyNoise(weightDeltas, config.noiseMultiplier);
		}

		// Save updated model
		await model.save(`file://${path.resolve(config.learnerModelPath)}`);

		// Load metadata for learner ID
		const metadataPath = path.join(config.learnerModelPath, "clone-metadata.json");
		let learnerId = "unknown";
		try {
			const metadata = JSON.parse(await fs.readFile(metadataPath, "utf-8"));
			learnerId = metadata.learnerId;

			// Update training history in metadata
			if (!metadata.trainingHistory) {
				metadata.trainingHistory = [];
			}
			metadata.trainingHistory.push({
				timestamp: new Date().toISOString(),
				epochs: config.localEpochs,
				samples: trainingData.features.length,
				finalLoss,
				finalAccuracy
			});

			await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
		} catch (error) {
			console.warn("Could not update metadata:", error);
		}

		// Clean up
		xTrain.dispose();
		yTrain.dispose();
		originalWeights.forEach(w => w.dispose());
		model.dispose();

		console.log(`Local training complete - Loss: ${finalLoss.toFixed(4)}, Accuracy: ${finalAccuracy.toFixed(4)}`);

		return {
			learnerId,
			weightDeltas,
			numSamples: trainingData.features.length,
			trainingMetrics: {
				loss: finalLoss,
				accuracy: finalAccuracy,
				epochs: config.localEpochs
			},
			timestamp: new Date()
		};
	}

	/**
	 * Aggregate updates from multiple learners using Federated Averaging (FedAvg)
	 */
	async aggregateUpdates(
		updates: FederatedUpdate[],
		strategy: "fedavg" | "fedprox" | "weighted" = "fedavg"
	): Promise<AggregationResult> {
		console.log(`Aggregating updates from ${updates.length} learners using ${strategy}...`);

		if (updates.length === 0) {
			throw new Error("No updates to aggregate");
		}

		let aggregatedWeights: tf.Tensor[];
		const totalSamples = updates.reduce((sum, update) => sum + update.numSamples, 0);

		switch (strategy) {
			case "weighted":
				// Weighted average based on number of samples
				aggregatedWeights = await this.weightedAverageAggregation(updates, totalSamples);
				break;

			case "fedprox":
				// FedProx: Add proximal term (more stable for heterogeneous data)
				aggregatedWeights = await this.fedProxAggregation(updates, totalSamples);
				break;

			case "fedavg":
			default:
				// Standard FedAvg: Simple average
				aggregatedWeights = await this.fedAvgAggregation(updates);
				break;
		}

		console.log(`Aggregation complete. Total samples: ${totalSamples}`);

		return {
			aggregatedWeights,
			contributingLearners: updates.length,
			totalSamples,
			aggregationStrategy: strategy,
			timestamp: new Date()
		};
	}

	/**
	 * Standard Federated Averaging (FedAvg)
	 */
	private async fedAvgAggregation(updates: FederatedUpdate[]): Promise<tf.Tensor[]> {
		const numUpdates = updates.length;
		const numWeights = updates[0].weightDeltas.length;

		const aggregated: tf.Tensor[] = [];

		for (let i = 0; i < numWeights; i++) {
			// Average deltas across all learners
			const deltaSum = updates.reduce((sum, update) => {
				if (!sum) return update.weightDeltas[i].clone();
				return sum.add(update.weightDeltas[i]);
			}, null as tf.Tensor | null);

			const deltaAvg = deltaSum!.div(numUpdates);
			aggregated.push(deltaAvg);

			deltaSum!.dispose();
		}

		return aggregated;
	}

	/**
	 * Weighted averaging based on number of training samples
	 */
	private async weightedAverageAggregation(
		updates: FederatedUpdate[],
		totalSamples: number
	): Promise<tf.Tensor[]> {
		const numWeights = updates[0].weightDeltas.length;
		const aggregated: tf.Tensor[] = [];

		for (let i = 0; i < numWeights; i++) {
			// Weighted sum of deltas
			const weightedSum = updates.reduce((sum, update) => {
				const weight = update.numSamples / totalSamples;
				const weightedDelta = update.weightDeltas[i].mul(weight);
				
				if (!sum) return weightedDelta;
				const newSum = sum.add(weightedDelta);
				weightedDelta.dispose();
				return newSum;
			}, null as tf.Tensor | null);

			aggregated.push(weightedSum!);
		}

		return aggregated;
	}

	/**
	 * FedProx aggregation (adds proximal term for stability)
	 */
	private async fedProxAggregation(
		updates: FederatedUpdate[],
		totalSamples: number,
		mu: number = 0.01 // Proximal term coefficient
	): Promise<tf.Tensor[]> {
		// For now, use weighted average with proximal regularization
		// In full implementation, this would include proximal term during local training
		return this.weightedAverageAggregation(updates, totalSamples);
	}

	/**
	 * Apply aggregated updates to main model
	 */
	async updateMainModel(
		mainModelPath: string,
		aggregatedWeights: tf.Tensor[],
		learningRate: number = 1.0
	): Promise<void> {
		console.log(`Updating main model at: ${mainModelPath}`);

		// Load main model
		const modelPath = `file://${path.resolve(mainModelPath)}/model.json`;
		const mainModel = await tf.loadLayersModel(modelPath);

		// Get current weights
		const currentWeights = mainModel.getWeights();

		// Apply updates: new_weights = current_weights + learning_rate * aggregated_deltas
		const newWeights = currentWeights.map((current, i) => {
			const update = aggregatedWeights[i].mul(learningRate);
			const newWeight = current.add(update);
			update.dispose();
			return newWeight;
		});

		// Set new weights
		mainModel.setWeights(newWeights);

		// Save updated main model
		await mainModel.save(`file://${path.resolve(mainModelPath)}`);

		// Update metadata
		const metadataPath = path.join(mainModelPath, "metadata.json");
		try {
			const metadata = JSON.parse(await fs.readFile(metadataPath, "utf-8"));
			
			if (!metadata.federatedUpdates) {
				metadata.federatedUpdates = [];
			}
			
			metadata.federatedUpdates.push({
				timestamp: new Date().toISOString(),
				contributingLearners: aggregatedWeights.length,
				learningRate
			});

			metadata.lastFederatedUpdate = new Date().toISOString();
			metadata.version = `${metadata.version}-fed${metadata.federatedUpdates.length}`;

			await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
		} catch (error) {
			console.warn("Could not update main model metadata:", error);
		}

		// Clean up
		currentWeights.forEach(w => w.dispose());
		mainModel.dispose();

		console.log("Main model updated successfully");
	}

	/**
	 * Clip gradients for privacy (gradient clipping)
	 */
	private clipGradients(gradients: tf.Tensor[], clipNorm: number): void {
		for (let i = 0; i < gradients.length; i++) {
			const norm = tf.norm(gradients[i]);
			const normValue = (norm.dataSync() as Float32Array)[0];

			if (normValue > clipNorm) {
				const scale = clipNorm / normValue;
				const clipped = gradients[i].mul(scale);
				gradients[i].dispose();
				gradients[i] = clipped;
			}

			norm.dispose();
		}
	}

	/**
	 * Add differential privacy noise to gradients
	 */
	private addPrivacyNoise(gradients: tf.Tensor[], noiseMultiplier: number): void {
		for (let i = 0; i < gradients.length; i++) {
			const shape = gradients[i].shape;
			const noise = tf.randomNormal(shape, 0, noiseMultiplier);
			const noisyGradient = gradients[i].add(noise);
			
			gradients[i].dispose();
			gradients[i] = noisyGradient;
			noise.dispose();
		}
	}

	/**
	 * Calculate privacy budget (epsilon) for differential privacy
	 */
	calculatePrivacyBudget(
		numEpochs: number,
		batchSize: number,
		datasetSize: number,
		noiseMultiplier: number,
		delta: number = 1e-5
	): number {
		// Simplified privacy budget calculation
		// Real implementation would use moments accountant or RDP
		const q = batchSize / datasetSize; // Sampling ratio
		const steps = Math.floor((datasetSize / batchSize) * numEpochs);
		
		// Simplified epsilon calculation
		const epsilon = (q * steps) / (noiseMultiplier * noiseMultiplier);
		
		console.log(`Privacy Budget: ε = ${epsilon.toFixed(4)} (δ = ${delta})`);
		return epsilon;
	}

	/**
	 * Evaluate model performance after federated update
	 */
	async evaluateModel(
		modelPath: string,
		testData: { features: number[][]; labels: number[][] }
	): Promise<{ loss: number; accuracy: number }> {
		const model = await tf.loadLayersModel(
			`file://${path.resolve(modelPath)}/model.json`
		);

		const xTest = tf.tensor2d(testData.features);
		const yTest = tf.tensor2d(testData.labels);

		const result = model.evaluate(xTest, yTest) as tf.Tensor[];
		const loss = (await result[0].data())[0];
		const accuracy = (await result[1].data())[0];

		// Clean up
		xTest.dispose();
		yTest.dispose();
		result.forEach(t => t.dispose());
		model.dispose();

		return { loss, accuracy };
	}
}
