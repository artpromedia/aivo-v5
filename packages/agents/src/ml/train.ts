#!/usr/bin/env tsx
/**
 * Training Script
 * 
 * Trains TensorFlow model using collected training data.
 * Run: pnpm tsx src/ml/train.ts
 */

import { ModelTrainer } from "./ModelTrainer";
import { getTrainingDataCollector } from "./TrainingDataCollector";
import path from "path";

async function main() {
	console.log("=== ML Model Training Script ===\n");

	try {
		// Initialize collector
		const collector = getTrainingDataCollector();

		// Export training data
		console.log("Exporting training data...");
		const trainingData = await collector.exportTrainingData({
			startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
			minDataPoints: 100
		});

		console.log(`Loaded ${trainingData.length} training data points\n`);

		// Check if we have enough data
		if (trainingData.length < 100) {
			console.warn("Warning: Less than 100 data points. Model may not train well.");
			console.warn("Consider collecting more training data before training.\n");
		}

		// Get statistics
		const stats = await collector.getTrainingStats();
		console.log("Training Data Statistics:");
		console.log(`- Total data points: ${stats.totalDataPoints}`);
		console.log(`- Data points with outcomes: ${stats.dataPointsWithOutcome}`);
		console.log(`- Unique learners: ${stats.uniqueLearners}`);
		console.log("\nAction Distribution:");
		Object.entries(stats.actionDistribution).forEach(([action, count]) => {
			const percentage = ((count / stats.totalDataPoints) * 100).toFixed(1);
			console.log(`  ${action}: ${count} (${percentage}%)`);
		});
		console.log("\nAverage Accuracy by Action:");
		Object.entries(stats.avgAccuracyByAction).forEach(([action, accuracy]) => {
			console.log(`  ${action}: ${(accuracy * 100).toFixed(1)}%`);
		});
		console.log("");

		// Initialize trainer
		const trainer = new ModelTrainer({
			epochs: 50,
			batchSize: 32,
			validationSplit: 0.2,
			learningRate: 0.001
		});

		// Train model
		console.log("Training model...\n");
		const result = await trainer.train(trainingData);

		// Display results
		console.log("\n=== Training Complete ===");
		console.log(`Final Loss: ${result.metrics.finalLoss.toFixed(4)}`);
		console.log(`Final Accuracy: ${(result.metrics.finalAccuracy * 100).toFixed(2)}%`);
		console.log(`Training Time: ${(result.metrics.trainingTime / 1000).toFixed(1)}s\n`);

		// Save model
		const modelPath = path.join(process.cwd(), "models", "personalized-learning");
		console.log(`Saving model to ${modelPath}...`);
		await trainer.saveModel(result.model, modelPath);

		console.log("\n✓ Model training complete!");
		console.log("\nNext steps:");
		console.log("1. Integrate model into PersonalizedLearningAgent");
		console.log("2. Test model predictions vs GPT-4 decisions");
		console.log("3. Monitor model performance in production");
		console.log("4. Retrain periodically with new data\n");

		// Clean up
		await collector.shutdown();
	} catch (error) {
		console.error("Training failed:", error);
		process.exit(1);
	}
}

main();
