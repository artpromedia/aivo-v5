/**
 * ModelCloner - Clones neural network weights from main model to learner instances
 * 
 * This implements true model cloning for federated learning:
 * - Copies weights from main AIVO model to learner-specific instances
 * - Preserves model architecture while allowing independent training
 * - Supports versioning and tracking of cloned models
 */

import * as tf from "@tensorflow/tfjs-node";
import * as fs from "fs/promises";
import * as path from "path";

export interface CloneConfig {
	mainModelPath: string;
	learnerModelPath: string;
	learnerId: string;
	freezeLayers?: string[]; // Layer names to freeze during learner training
	adaptationLayers?: {
		// Additional layers to add for learner-specific adaptation
		name: string;
		units: number;
		activation: string;
	}[];
}

export interface ClonedModelInfo {
	learnerId: string;
	sourceModelVersion: string;
	clonedModelPath: string;
	cloneDate: Date;
	architecture: {
		totalLayers: number;
		frozenLayers: number;
		trainableLayers: number;
		totalParams: number;
		trainableParams: number;
	};
}

export class ModelCloner {
	/**
	 * Clone weights from main model to create learner-specific instance
	 */
	async cloneModel(config: CloneConfig): Promise<ClonedModelInfo> {
		console.log(`Cloning main model for learner: ${config.learnerId}`);

		// Load the main model
		const mainModelPath = `file://${path.resolve(config.mainModelPath)}/model.json`;
		const mainModel = await tf.loadLayersModel(mainModelPath);

		console.log(`Main model loaded with ${mainModel.layers.length} layers`);

		// Create a copy of the model architecture with same weights
		const clonedModel = await this.deepCloneModel(mainModel);

		// Freeze specified layers if requested
		if (config.freezeLayers && config.freezeLayers.length > 0) {
			this.freezeLayers(clonedModel, config.freezeLayers);
		}

		// Add adaptation layers if specified
		if (config.adaptationLayers && config.adaptationLayers.length > 0) {
			// Note: Adding layers to existing model requires rebuilding
			console.warn("Adaptation layers not yet implemented - will be added in future version");
		}

		// Load main model metadata
		const mainMetadataPath = path.join(config.mainModelPath, "metadata.json");
		let sourceVersion = "unknown";
		try {
			const metadataContent = await fs.readFile(mainMetadataPath, "utf-8");
			const metadata = JSON.parse(metadataContent);
			sourceVersion = metadata.version;
		} catch (error) {
			console.warn("Could not load main model metadata");
		}

		// Save cloned model
		const learnerModelDir = path.resolve(config.learnerModelPath);
		await fs.mkdir(learnerModelDir, { recursive: true });

		const learnerModelPath = `file://${learnerModelDir}`;
		await clonedModel.save(learnerModelPath);

		// Count parameters
		const architecture = this.analyzeArchitecture(clonedModel);

		// Save clone metadata
		const cloneMetadata = {
			learnerId: config.learnerId,
			sourceModelVersion: sourceVersion,
			sourceModelPath: config.mainModelPath,
			cloneDate: new Date().toISOString(),
			architecture,
			frozenLayers: config.freezeLayers || [],
			trainingHistory: []
		};

		await fs.writeFile(
			path.join(learnerModelDir, "clone-metadata.json"),
			JSON.stringify(cloneMetadata, null, 2)
		);

		console.log(`Cloned model saved to: ${learnerModelDir}`);
		console.log(`Total parameters: ${architecture.totalParams}`);
		console.log(`Trainable parameters: ${architecture.trainableParams}`);

		// Clean up
		mainModel.dispose();
		clonedModel.dispose();

		return {
			learnerId: config.learnerId,
			sourceModelVersion: sourceVersion,
			clonedModelPath: learnerModelDir,
			cloneDate: new Date(),
			architecture
		};
	}

	/**
	 * Deep clone a TensorFlow model (architecture + weights)
	 */
	private async deepCloneModel(sourceModel: tf.LayersModel): Promise<tf.LayersModel> {
		// Get the model configuration
		const config = sourceModel.getConfig();

		// Create new model from same config
		const clonedModel = await tf.models.modelFromJSON({
			modelTopology: config as any
		});

		// Copy weights from source to cloned model
		const sourceWeights = sourceModel.getWeights();
		const clonedWeights = sourceWeights.map(w => w.clone());
		clonedModel.setWeights(clonedWeights);

		// Clean up temporary tensors
		sourceWeights.forEach(w => w.dispose());
		// Note: clonedWeights are now owned by clonedModel

		return clonedModel;
	}

	/**
	 * Freeze specific layers to prevent training
	 */
	private freezeLayers(model: tf.LayersModel, layerNames: string[]): void {
		console.log(`Freezing ${layerNames.length} layers...`);

		for (const layer of model.layers) {
			if (layerNames.includes(layer.name)) {
				layer.trainable = false;
				console.log(`  Frozen: ${layer.name}`);
			}
		}

		// Recompile to apply changes
		const optimizer = (model as any).optimizer;
		const loss = (model as any).loss;
		const metrics = (model as any).metrics;

		if (optimizer && loss) {
			model.compile({ optimizer, loss, metrics });
		}
	}

	/**
	 * Analyze model architecture and count parameters
	 */
	private analyzeArchitecture(model: tf.LayersModel): ClonedModelInfo["architecture"] {
		let totalParams = 0;
		let trainableParams = 0;
		let frozenLayers = 0;
		let trainableLayers = 0;

		for (const layer of model.layers) {
			const layerParams = layer.countParams();
			totalParams += layerParams;

			if (layer.trainable) {
				trainableParams += layerParams;
				trainableLayers++;
			} else {
				frozenLayers++;
			}
		}

		return {
			totalLayers: model.layers.length,
			frozenLayers,
			trainableLayers,
			totalParams,
			trainableParams
		};
	}

	/**
	 * Load a cloned model for a specific learner
	 */
	async loadClonedModel(learnerModelPath: string): Promise<{
		model: tf.LayersModel;
		metadata: any;
	}> {
		const modelDir = path.resolve(learnerModelPath);
		const modelPath = `file://${modelDir}/model.json`;

		console.log(`Loading cloned model from: ${modelDir}`);
		const model = await tf.loadLayersModel(modelPath);

		// Load metadata
		const metadataPath = path.join(modelDir, "clone-metadata.json");
		let metadata = null;
		try {
			const metadataContent = await fs.readFile(metadataPath, "utf-8");
			metadata = JSON.parse(metadataContent);
			console.log(`Loaded clone for learner: ${metadata.learnerId}`);
		} catch (error) {
			console.warn("Could not load clone metadata:", error);
		}

		return { model, metadata };
	}

	/**
	 * Update cloned model with new weights (for federated learning updates)
	 */
	async updateClonedModel(
		learnerModelPath: string,
		updatedWeights: tf.Tensor[]
	): Promise<void> {
		const { model, metadata } = await this.loadClonedModel(learnerModelPath);

		// Apply updated weights
		model.setWeights(updatedWeights);

		// Save updated model
		const modelDir = path.resolve(learnerModelPath);
		const savePath = `file://${modelDir}`;
		await model.save(savePath);

		// Update metadata with training record
		if (metadata) {
			metadata.lastUpdate = new Date().toISOString();
			metadata.updateCount = (metadata.updateCount || 0) + 1;

			await fs.writeFile(
				path.join(modelDir, "clone-metadata.json"),
				JSON.stringify(metadata, null, 2)
			);
		}

		model.dispose();
		console.log(`Updated cloned model at: ${learnerModelPath}`);
	}

	/**
	 * Compare weights between main model and learner model
	 */
	async compareWeights(mainModelPath: string, learnerModelPath: string): Promise<{
		layerDifferences: Array<{
			layerName: string;
			weightDifference: number;
			similarity: number;
		}>;
		overallSimilarity: number;
	}> {
		// Load both models
		const mainModel = await tf.loadLayersModel(
			`file://${path.resolve(mainModelPath)}/model.json`
		);
		const learnerModel = await tf.loadLayersModel(
			`file://${path.resolve(learnerModelPath)}/model.json`
		);

		const mainWeights = mainModel.getWeights();
		const learnerWeights = learnerModel.getWeights();

		const layerDifferences: Array<{
			layerName: string;
			weightDifference: number;
			similarity: number;
		}> = [];

		let totalDifference = 0;

		for (let i = 0; i < mainWeights.length; i++) {
			const diff = mainWeights[i].sub(learnerWeights[i]);
			const squaredDiff = diff.square();
			const meanSquaredDiff = (await squaredDiff.mean().data())[0];
			
			const layerName = mainModel.weights[i].originalName || `layer_${i}`;
			const similarity = 1 / (1 + meanSquaredDiff); // 0 to 1 scale

			layerDifferences.push({
				layerName,
				weightDifference: meanSquaredDiff,
				similarity
			});

			totalDifference += meanSquaredDiff;

			// Clean up
			diff.dispose();
			squaredDiff.dispose();
		}

		// Calculate overall similarity
		const overallSimilarity = 1 / (1 + totalDifference / mainWeights.length);

		// Clean up
		mainModel.dispose();
		learnerModel.dispose();

		return {
			layerDifferences,
			overallSimilarity
		};
	}

	/**
	 * Extract weight deltas (difference between learner and main model)
	 * Used for federated aggregation
	 */
	async extractWeightDeltas(
		mainModelPath: string,
		learnerModelPath: string
	): Promise<tf.Tensor[]> {
		const mainModel = await tf.loadLayersModel(
			`file://${path.resolve(mainModelPath)}/model.json`
		);
		const learnerModel = await tf.loadLayersModel(
			`file://${path.resolve(learnerModelPath)}/model.json`
		);

		const mainWeights = mainModel.getWeights();
		const learnerWeights = learnerModel.getWeights();

		// Calculate deltas: learner_weights - main_weights
		const deltas = mainWeights.map((mainWeight, i) => 
			learnerWeights[i].sub(mainWeight)
		);

		// Clean up
		mainModel.dispose();
		learnerModel.dispose();

		return deltas;
	}
}
