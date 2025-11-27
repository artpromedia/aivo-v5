/**
 * MainModelTrainer - Trains the base AIVO neural network model
 * 
 * This model serves as the foundation for all learner-specific models in the
 * federated learning architecture. It's trained on general curriculum data
 * and provides baseline educational knowledge.
 * 
 * Architecture:
 * - Input: 256 features (content embeddings, subject context, difficulty level)
 * - Hidden layers: [512, 256, 128, 64] with batch normalization and dropout
 * - Output: Multiple heads for different predictions:
 *   - Content recommendation (128 categories)
 *   - Difficulty prediction (10 levels)
 *   - Learning path optimization (32 actions)
 */

import * as tf from "@tensorflow/tfjs-node";
import * as fs from "fs/promises";
import * as path from "path";

export interface MainModelConfig {
	inputDim: number;
	hiddenLayers: number[];
	outputHeads: {
		contentRecommendation: number;
		difficultyPrediction: number;
		learningPath: number;
	};
	learningRate: number;
	batchSize: number;
	epochs: number;
	validationSplit: number;
	dropoutRate: number;
}

export interface TrainingData {
	// Input features: [contentEmbedding(128), subjectContext(64), learnerContext(32), sessionContext(32)]
	features: number[][];
	// Output labels for each head
	labels: {
		contentRecommendation: number[][];
		difficultyPrediction: number[][];
		learningPath: number[][];
	};
}

export interface TrainingResult {
	model: tf.LayersModel;
	history: {
		loss: number[];
		valLoss: number[];
		accuracy: number[];
		valAccuracy: number[];
	};
	modelVersion: string;
	trainingDate: Date;
	hyperparameters: MainModelConfig;
}

export class MainModelTrainer {
	private config: MainModelConfig;
	private model: tf.LayersModel | null = null;

	constructor(config?: Partial<MainModelConfig>) {
		this.config = {
			inputDim: 256,
			hiddenLayers: [512, 256, 128, 64],
			outputHeads: {
				contentRecommendation: 128,
				difficultyPrediction: 10,
				learningPath: 32
			},
			learningRate: 0.001,
			batchSize: 64,
			epochs: 100,
			validationSplit: 0.2,
			dropoutRate: 0.3,
			...config
		};
	}

	/**
	 * Build the main AIVO neural network architecture
	 */
	buildModel(): tf.LayersModel {
		// Input layer
		const input = tf.input({ shape: [this.config.inputDim] });

		// Shared feature extraction layers
		let x = input;
		
		// Build hidden layers with batch normalization and dropout
		for (let i = 0; i < this.config.hiddenLayers.length; i++) {
			const units = this.config.hiddenLayers[i];
			
			// Dense layer
			x = tf.layers.dense({
				units,
				activation: "relu",
				kernelInitializer: "heNormal",
				name: `shared_dense_${i + 1}`
			}).apply(x) as tf.SymbolicTensor;

			// Batch normalization
			x = tf.layers.batchNormalization({
				name: `shared_bn_${i + 1}`
			}).apply(x) as tf.SymbolicTensor;

			// Dropout for regularization
			x = tf.layers.dropout({
				rate: this.config.dropoutRate,
				name: `shared_dropout_${i + 1}`
			}).apply(x) as tf.SymbolicTensor;
		}

		// Multi-head outputs
		const sharedFeatures = x;

		// Head 1: Content Recommendation
		let contentHead = tf.layers.dense({
			units: 256,
			activation: "relu",
			name: "content_dense_1"
		}).apply(sharedFeatures) as tf.SymbolicTensor;

		contentHead = tf.layers.dropout({
			rate: 0.2,
			name: "content_dropout"
		}).apply(contentHead) as tf.SymbolicTensor;

		const contentOutput = tf.layers.dense({
			units: this.config.outputHeads.contentRecommendation,
			activation: "softmax",
			name: "content_output"
		}).apply(contentHead) as tf.SymbolicTensor;

		// Head 2: Difficulty Prediction
		let difficultyHead = tf.layers.dense({
			units: 128,
			activation: "relu",
			name: "difficulty_dense_1"
		}).apply(sharedFeatures) as tf.SymbolicTensor;

		difficultyHead = tf.layers.dropout({
			rate: 0.2,
			name: "difficulty_dropout"
		}).apply(difficultyHead) as tf.SymbolicTensor;

		const difficultyOutput = tf.layers.dense({
			units: this.config.outputHeads.difficultyPrediction,
			activation: "softmax",
			name: "difficulty_output"
		}).apply(difficultyHead) as tf.SymbolicTensor;

		// Head 3: Learning Path Optimization
		let pathHead = tf.layers.dense({
			units: 128,
			activation: "relu",
			name: "path_dense_1"
		}).apply(sharedFeatures) as tf.SymbolicTensor;

		pathHead = tf.layers.dropout({
			rate: 0.2,
			name: "path_dropout"
		}).apply(pathHead) as tf.SymbolicTensor;

		const pathOutput = tf.layers.dense({
			units: this.config.outputHeads.learningPath,
			activation: "softmax",
			name: "path_output"
		}).apply(pathHead) as tf.SymbolicTensor;

		// Create multi-output model
		this.model = tf.model({
			inputs: input,
			outputs: [contentOutput, difficultyOutput, pathOutput]
		});

		// Compile with separate losses for each head
		this.model.compile({
			optimizer: tf.train.adam(this.config.learningRate),
			loss: {
				content_output: "categoricalCrossentropy",
				difficulty_output: "categoricalCrossentropy",
				path_output: "categoricalCrossentropy"
			},
			metrics: {
				content_output: "accuracy",
				difficulty_output: "accuracy",
				path_output: "accuracy"
			}
		} as tf.ModelCompileArgs);

		return this.model;
	}

	/**
	 * Train the main AIVO model on general curriculum data
	 */
	async train(trainingData: TrainingData): Promise<TrainingResult> {
		if (!this.model) {
			this.buildModel();
		}

		console.log("Starting main AIVO model training...");
		console.log(`Training samples: ${trainingData.features.length}`);
		console.log(`Architecture: ${this.config.hiddenLayers.join(" -> ")}`);

		// Convert training data to tensors
		const xTrain = tf.tensor2d(trainingData.features);
		const yContentTrain = tf.tensor2d(trainingData.labels.contentRecommendation);
		const yDifficultyTrain = tf.tensor2d(trainingData.labels.difficultyPrediction);
		const yPathTrain = tf.tensor2d(trainingData.labels.learningPath);

		// Train the model
		const history = await this.model!.fit(xTrain, [yContentTrain, yDifficultyTrain, yPathTrain], {
			batchSize: this.config.batchSize,
			epochs: this.config.epochs,
			validationSplit: this.config.validationSplit,
			shuffle: true,
			callbacks: {
				onEpochEnd: (epoch, logs) => {
					if (epoch % 10 === 0) {
						console.log(
							`Epoch ${epoch + 1}/${this.config.epochs} - ` +
							`loss: ${logs?.loss?.toFixed(4)} - ` +
							`val_loss: ${logs?.val_loss?.toFixed(4)} - ` +
							`content_acc: ${logs?.content_output_accuracy?.toFixed(4)} - ` +
							`difficulty_acc: ${logs?.difficulty_output_accuracy?.toFixed(4)} - ` +
							`path_acc: ${logs?.path_output_accuracy?.toFixed(4)}`
						);
					}
				}
			}
		});

		// Clean up tensors
		xTrain.dispose();
		yContentTrain.dispose();
		yDifficultyTrain.dispose();
		yPathTrain.dispose();

		// Generate model version
		const modelVersion = `aivo-main-v${Date.now()}`;

		return {
			model: this.model!,
			history: {
				loss: history.history.loss as number[],
				valLoss: history.history.val_loss as number[],
				accuracy: history.history.content_output_accuracy as number[],
				valAccuracy: history.history.val_content_output_accuracy as number[]
			},
			modelVersion,
			trainingDate: new Date(),
			hyperparameters: this.config
		};
	}

	/**
	 * Save the trained main model to disk
	 */
	async saveModel(model: tf.LayersModel, savePath: string, metadata?: any): Promise<string> {
		const modelDir = path.resolve(savePath);
		
		// Ensure directory exists
		await fs.mkdir(modelDir, { recursive: true });

		// Save model architecture and weights
		const modelPath = `file://${modelDir}`;
		await model.save(modelPath);

		// Save metadata
		const metadataPath = path.join(modelDir, "metadata.json");
		await fs.writeFile(
			metadataPath,
			JSON.stringify({
				version: metadata?.modelVersion || "aivo-main-v1",
				architecture: {
					inputDim: this.config.inputDim,
					hiddenLayers: this.config.hiddenLayers,
					outputHeads: this.config.outputHeads
				},
				trainingDate: metadata?.trainingDate || new Date().toISOString(),
				hyperparameters: this.config,
				performance: metadata?.performance || null
			}, null, 2)
		);

		console.log(`Main AIVO model saved to: ${modelDir}`);
		return modelDir;
	}

	/**
	 * Load a saved main model from disk
	 */
	async loadModel(loadPath: string): Promise<tf.LayersModel> {
		const modelDir = path.resolve(loadPath);
		const modelPath = `file://${modelDir}/model.json`;

		console.log(`Loading main AIVO model from: ${modelDir}`);
		this.model = await tf.loadLayersModel(modelPath);

		// Load metadata
		const metadataPath = path.join(modelDir, "metadata.json");
		try {
			const metadataContent = await fs.readFile(metadataPath, "utf-8");
			const metadata = JSON.parse(metadataContent);
			console.log(`Loaded model version: ${metadata.version}`);
		} catch (error) {
			console.warn("Could not load model metadata:", error);
		}

		return this.model;
	}

	/**
	 * Export model weights for cloning to learner-specific instances
	 */
	async exportWeights(): Promise<tf.NamedTensorMap> {
		if (!this.model) {
			throw new Error("No model loaded. Build or load a model first.");
		}

		return this.model.getWeights().reduce((map, tensor, index) => {
			const layerName = this.model!.weights[index].originalName || `weight_${index}`;
			map[layerName] = tensor;
			return map;
		}, {} as tf.NamedTensorMap);
	}

	/**
	 * Get model summary for inspection
	 */
	getModelSummary(): string {
		if (!this.model) {
			return "No model built yet";
		}

		let summary = "Main AIVO Model Architecture\n";
		summary += "=" .repeat(80) + "\n";
		this.model.summary();
		return summary;
	}

	/**
	 * Predict using the main model (for testing)
	 */
	predict(features: number[][]): tf.Tensor[] {
		if (!this.model) {
			throw new Error("No model loaded. Build or load a model first.");
		}

		const inputTensor = tf.tensor2d(features);
		const predictions = this.model.predict(inputTensor) as tf.Tensor[];
		inputTensor.dispose();

		return predictions;
	}

	/**
	 * Dispose of the model and free memory
	 */
	dispose(): void {
		if (this.model) {
			this.model.dispose();
			this.model = null;
		}
	}
}
