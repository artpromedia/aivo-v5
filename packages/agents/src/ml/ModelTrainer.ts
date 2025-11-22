/**
 * ML Model Trainer
 * 
 * Trains TensorFlow model to predict optimal learning decisions based on
 * collected training data. Replaces GPT-4 fallback with local predictions.
 */

import * as tf from "@tensorflow/tfjs-node";
import type { TrainingDataPoint } from "./TrainingDataCollector";

export interface ModelConfig {
	inputDim: number;
	hiddenLayers: number[];
	outputDim: number;
	learningRate: number;
	batchSize: number;
	epochs: number;
	validationSplit: number;
}

export interface TrainingResult {
	model: tf.LayersModel;
	history: {
		loss: number[];
		valLoss: number[];
		accuracy: number[];
		valAccuracy: number[];
	};
	metrics: {
		finalLoss: number;
		finalAccuracy: number;
		trainingTime: number;
	};
}

export class ModelTrainer {
	private config: ModelConfig;

	constructor(config?: Partial<ModelConfig>) {
		this.config = {
			inputDim: 18, // Number of input features
			hiddenLayers: [64, 32, 16], // Three hidden layers
			outputDim: 5, // 5 possible actions
			learningRate: 0.001,
			batchSize: 32,
			epochs: 50,
			validationSplit: 0.2,
			...config
		};
	}

	/**
	 * Build neural network model
	 */
	buildModel(): tf.LayersModel {
		const model = tf.sequential();

		// Input layer
		model.add(
			tf.layers.dense({
				inputDim: this.config.inputDim,
				units: this.config.hiddenLayers[0],
				activation: "relu",
				kernelInitializer: "heNormal"
			})
		);

		model.add(tf.layers.dropout({ rate: 0.3 }));

		// Hidden layers
		for (let i = 1; i < this.config.hiddenLayers.length; i++) {
			model.add(
				tf.layers.dense({
					units: this.config.hiddenLayers[i],
					activation: "relu",
					kernelInitializer: "heNormal"
				})
			);
			model.add(tf.layers.dropout({ rate: 0.2 }));
		}

		// Output layer (softmax for classification)
		model.add(
			tf.layers.dense({
				units: this.config.outputDim,
				activation: "softmax"
			})
		);

		// Compile model
		model.compile({
			optimizer: tf.train.adam(this.config.learningRate),
			loss: "categoricalCrossentropy",
			metrics: ["accuracy"]
		});

		return model;
	}

	/**
	 * Prepare training data
	 */
	prepareData(dataPoints: TrainingDataPoint[]): {
		xTrain: tf.Tensor2D;
		yTrain: tf.Tensor2D;
		featureStats: { means: number[]; stds: number[] };
		actionMapping: Record<string, number>;
	} {
		// Filter data points with outcomes
		const validData = dataPoints.filter(d => d.outcome !== undefined);

		if (validData.length === 0) {
			throw new Error("No valid training data with outcomes");
		}

		// Extract features
		const features = validData.map(d => [
			d.features.difficulty,
			d.features.accuracy,
			d.features.avgResponseTime,
			d.features.hintsUsed,
			d.features.avgAttemptsPerQuestion,
			d.features.consecutiveCorrect,
			d.features.consecutiveIncorrect,
			d.features.engagementScore,
			d.features.sessionDuration,
			d.features.timeSinceBreak,
			d.features.focusLevel,
			d.features.strugglesCount,
			d.features.age,
			d.features.hasADHD ? 1 : 0,
			d.features.hasDyslexia ? 1 : 0,
			d.features.hasAutism ? 1 : 0,
			d.features.gradeLevel,
			// Add outcome features for supervised learning
			d.outcome!.nextAccuracy
		]);

		// Normalize features
		const { normalized, means, stds } = this.normalizeFeatures(features);

		// Map actions to indices
		const actionMapping: Record<string, number> = {
			continue: 0,
			adjust_difficulty: 1,
			take_break: 2,
			provide_help: 3,
			change_activity: 4
		};

		// One-hot encode actions
		const labels = validData.map(d => {
			const actionIndex = actionMapping[d.labels.action] ?? 0;
			const oneHot = new Array(this.config.outputDim).fill(0);
			oneHot[actionIndex] = 1;
			return oneHot;
		});

		const xTrain = tf.tensor2d(normalized);
		const yTrain = tf.tensor2d(labels);

		return {
			xTrain,
			yTrain,
			featureStats: { means, stds },
			actionMapping
		};
	}

	/**
	 * Normalize features (z-score normalization)
	 */
	private normalizeFeatures(features: number[][]): {
		normalized: number[][];
		means: number[];
		stds: number[];
	} {
		const numFeatures = features[0].length;
		const means: number[] = [];
		const stds: number[] = [];

		// Calculate means and stds for each feature
		for (let i = 0; i < numFeatures; i++) {
			const featureValues = features.map(f => f[i]);
			const mean = featureValues.reduce((a, b) => a + b, 0) / featureValues.length;
			const variance =
				featureValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
				featureValues.length;
			const std = Math.sqrt(variance) || 1; // Avoid division by zero

			means.push(mean);
			stds.push(std);
		}

		// Normalize
		const normalized = features.map(sample =>
			sample.map((value, i) => (value - means[i]) / stds[i])
		);

		return { normalized, means, stds };
	}

	/**
	 * Train model
	 */
	async train(dataPoints: TrainingDataPoint[]): Promise<TrainingResult> {
		console.log(`Training with ${dataPoints.length} data points...`);

		const startTime = Date.now();

		// Prepare data
		const { xTrain, yTrain, featureStats, actionMapping } = this.prepareData(dataPoints);

		console.log(`Input shape: ${xTrain.shape}`);
		console.log(`Output shape: ${yTrain.shape}`);

		// Build model
		const model = this.buildModel();
		model.summary();

		// Train
		const history = await model.fit(xTrain, yTrain, {
			batchSize: this.config.batchSize,
			epochs: this.config.epochs,
			validationSplit: this.config.validationSplit,
			callbacks: {
				onEpochEnd: (epoch: number, logs?: tf.Logs) => {
					console.log(
						`Epoch ${epoch + 1}: loss=${logs?.loss.toFixed(4)}, accuracy=${logs?.acc.toFixed(4)}, val_loss=${logs?.val_loss.toFixed(4)}, val_accuracy=${logs?.val_acc.toFixed(4)}`
					);
				}
			}
		});

		const trainingTime = Date.now() - startTime;

		// Extract history
		const loss = history.history.loss as number[];
		const valLoss = history.history.val_loss as number[];
		const accuracy = history.history.acc as number[];
		const valAccuracy = history.history.val_acc as number[];

		// Clean up tensors
		xTrain.dispose();
		yTrain.dispose();

		// Save feature stats and action mapping with model
		(model as any).featureStats = featureStats;
		(model as any).actionMapping = actionMapping;

		return {
			model,
			history: {
				loss,
				valLoss,
				accuracy,
				valAccuracy
			},
			metrics: {
				finalLoss: loss[loss.length - 1],
				finalAccuracy: accuracy[accuracy.length - 1],
				trainingTime
			}
		};
	}

	/**
	 * Save trained model
	 */
	async saveModel(model: tf.LayersModel, path: string): Promise<void> {
		await model.save(`file://${path}`);
		
		// Save feature stats and action mapping separately
		const metadata = {
			featureStats: (model as any).featureStats,
			actionMapping: (model as any).actionMapping,
			config: this.config,
			trainedAt: new Date().toISOString()
		};
		
		const fs = await import("fs/promises");
		await fs.writeFile(
			`${path}/metadata.json`,
			JSON.stringify(metadata, null, 2)
		);
		
		console.log(`Model saved to ${path}`);
	}

	/**
	 * Load trained model
	 */
	async loadModel(path: string): Promise<tf.LayersModel> {
		const model = await tf.loadLayersModel(`file://${path}/model.json`);
		
		// Load metadata
		const fs = await import("fs/promises");
		const metadataJson = await fs.readFile(`${path}/metadata.json`, "utf-8");
		const metadata = JSON.parse(metadataJson);
		
		// Attach metadata to model
		(model as any).featureStats = metadata.featureStats;
		(model as any).actionMapping = metadata.actionMapping;
		
		console.log(`Model loaded from ${path}`);
		return model;
	}

	/**
	 * Make prediction
	 */
	predict(
		model: tf.LayersModel,
		features: {
			difficulty: number;
			accuracy: number;
			avgResponseTime: number;
			hintsUsed: number;
			avgAttemptsPerQuestion: number;
			consecutiveCorrect: number;
			consecutiveIncorrect: number;
			engagementScore: number;
			sessionDuration: number;
			timeSinceBreak: number;
			focusLevel: number;
			strugglesCount: number;
			age: number;
			hasADHD: boolean;
			hasDyslexia: boolean;
			hasAutism: boolean;
			gradeLevel: number;
		}
	): { action: string; confidence: number; probabilities: Record<string, number> } {
		// Extract feature stats
		const { featureStats, actionMapping } = model as any;
		if (!featureStats || !actionMapping) {
			throw new Error("Model metadata not found. Model may not be properly trained/loaded.");
		}

		// Prepare input (without nextAccuracy for prediction)
		const input = [
			features.difficulty,
			features.accuracy,
			features.avgResponseTime,
			features.hintsUsed,
			features.avgAttemptsPerQuestion,
			features.consecutiveCorrect,
			features.consecutiveIncorrect,
			features.engagementScore,
			features.sessionDuration,
			features.timeSinceBreak,
			features.focusLevel,
			features.strugglesCount,
			features.age,
			features.hasADHD ? 1 : 0,
			features.hasDyslexia ? 1 : 0,
			features.hasAutism ? 1 : 0,
			features.gradeLevel,
			0 // Placeholder for nextAccuracy (not available during prediction)
		];

		// Normalize
		const normalized = input.map(
			(value, i) => (value - featureStats.means[i]) / featureStats.stds[i]
		);

		// Make prediction
		const inputTensor = tf.tensor2d([normalized]);
		const prediction = model.predict(inputTensor) as tf.Tensor;
		const probabilities = prediction.dataSync();

		// Get action with highest probability
		const maxIndex = probabilities.indexOf(Math.max(...probabilities));
		const reverseMapping = Object.fromEntries(
			Object.entries(actionMapping).map(([k, v]) => [v, k])
		);
		const predictedAction = reverseMapping[maxIndex];
		const confidence = probabilities[maxIndex];

		// Clean up
		inputTensor.dispose();
		prediction.dispose();

		// Build probabilities object
		const probs: Record<string, number> = {};
		Object.entries(actionMapping).forEach(([action, index]) => {
			probs[action] = probabilities[index as number];
		});

		return {
			action: predictedAction,
			confidence,
			probabilities: probs
		};
	}

	/**
	 * Evaluate model on test data
	 */
	async evaluate(
		model: tf.LayersModel,
		testData: TrainingDataPoint[]
	): Promise<{
		accuracy: number;
		loss: number;
		confusionMatrix: number[][];
	}> {
		const { xTrain, yTrain } = this.prepareData(testData);

		const evaluation = model.evaluate(xTrain, yTrain) as tf.Scalar[];
		const loss = await evaluation[0].data();
		const accuracy = await evaluation[1].data();

		// Calculate confusion matrix
		const predictions = model.predict(xTrain) as tf.Tensor;
		const predClasses = predictions.argMax(-1).dataSync();
		const trueClasses = yTrain.argMax(-1).dataSync();

		const confusionMatrix: number[][] = Array(this.config.outputDim)
			.fill(0)
			.map(() => Array(this.config.outputDim).fill(0));

		for (let i = 0; i < predClasses.length; i++) {
			confusionMatrix[trueClasses[i]][predClasses[i]]++;
		}

		// Clean up
		xTrain.dispose();
		yTrain.dispose();
		predictions.dispose();
		evaluation.forEach(t => t.dispose());

		return {
			accuracy: accuracy[0],
			loss: loss[0],
			confusionMatrix
		};
	}
}
