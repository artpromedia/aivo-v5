#!/usr/bin/env tsx
/**
 * Automated Model Retraining Script
 * 
 * Runs periodically (e.g., weekly) to:
 * 1. Export latest training data
 * 2. Train new model version
 * 3. Evaluate new model vs current model
 * 4. Auto-deploy if improvement exceeds threshold
 * 
 * Run: pnpm tsx src/ml/retrain.ts
 */

import { ModelTrainer } from "./ModelTrainer";
import { ModelEvaluator } from "./ModelEvaluator";
import { getTrainingDataCollector } from "./TrainingDataCollector";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs/promises";

const IMPROVEMENT_THRESHOLD = 0.05; // 5% improvement required for auto-deploy
const MIN_TRAINING_DATA = 500; // Minimum data points needed

async function main() {
	console.log("=== Automated Model Retraining ===");
	console.log(`Started: ${new Date().toISOString()}\n`);

	const prisma = new PrismaClient();

	try {
		// 1. Export latest training data
		console.log("Step 1: Exporting training data...");
		const collector = getTrainingDataCollector();
		const allData = await collector.exportTrainingData({
			startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
			minDataPoints: MIN_TRAINING_DATA
		});

		console.log(`✓ Exported ${allData.length} training data points`);

		if (allData.length < MIN_TRAINING_DATA) {
			console.warn(`⚠️  Insufficient training data (${allData.length} < ${MIN_TRAINING_DATA})`);
			console.log("Exiting without retraining.\n");
			await collector.shutdown();
			await prisma.$disconnect();
			return;
		}

		// Get training stats
		const stats = await collector.getTrainingStats();
		console.log("\nTraining Data Statistics:");
		console.log(`- Total data points: ${stats.totalDataPoints}`);
		console.log(`- Data points with outcomes: ${stats.dataPointsWithOutcome}`);
		console.log(`- Unique learners: ${stats.uniqueLearners}\n`);

		// 2. Train new model
		console.log("Step 2: Training new model...");
		const trainer = new ModelTrainer({
			epochs: 100, // More epochs for production
			batchSize: 32,
			validationSplit: 0.2,
			learningRate: 0.0005 // Lower learning rate for fine-tuning
		});

		const result = await trainer.train(allData);
		console.log(`✓ Training complete`);
		console.log(`  Loss: ${result.metrics.finalLoss.toFixed(4)}`);
		console.log(`  Accuracy: ${(result.metrics.finalAccuracy * 100).toFixed(2)}%`);
		console.log(`  Training time: ${(result.metrics.trainingTime / 1000).toFixed(1)}s\n`);

		// 3. Evaluate new model
		console.log("Step 3: Evaluating new model...");
		const evaluator = new ModelEvaluator(prisma);
		
		// Split data for evaluation
		const splitIndex = Math.floor(allData.length * 0.8);
		const testData = allData.slice(splitIndex);
		
		const newModelMetrics = await evaluator.evaluateModel(result.model, testData);
		console.log(`✓ New model accuracy: ${(newModelMetrics.accuracy * 100).toFixed(2)}%\n`);

		// 4. Load current model and compare
		console.log("Step 4: Comparing with current model...");
		let currentModelMetrics;
		let shouldDeploy = false;
		let improvement = 0;

		try {
			const currentModelPath = path.join(process.cwd(), "models", "personalized-learning");
			const currentModel = await trainer.loadModel(currentModelPath);
			
			currentModelMetrics = await evaluator.evaluateModel(currentModel, testData);
			console.log(`✓ Current model accuracy: ${(currentModelMetrics.accuracy * 100).toFixed(2)}%`);

			improvement = newModelMetrics.accuracy - currentModelMetrics.accuracy;
			console.log(`  Improvement: ${(improvement * 100).toFixed(2)}%\n`);

			if (improvement > IMPROVEMENT_THRESHOLD) {
				shouldDeploy = true;
				console.log(`✓ Improvement exceeds threshold (${(IMPROVEMENT_THRESHOLD * 100).toFixed(0)}%)`);
			} else if (improvement > 0) {
				console.log(`⚠️  Improvement below threshold (${(IMPROVEMENT_THRESHOLD * 100).toFixed(0)}%)`);
				console.log("  New model shows improvement but not significant enough for auto-deploy");
			} else {
				console.log(`✗ New model does not improve performance`);
				console.log("  Keeping current model");
			}
		} catch (error) {
			console.log("⚠️  Current model not found. This is the first model.");
			shouldDeploy = true;
		}

		// 5. Deploy if approved
		if (shouldDeploy) {
			console.log("\nStep 5: Deploying new model...");

			// Backup current model
			const modelPath = path.join(process.cwd(), "models", "personalized-learning");
			const backupPath = path.join(
				process.cwd(),
				"models",
				`personalized-learning-backup-${Date.now()}`
			);

			try {
				await fs.access(modelPath);
				await fs.rename(modelPath, backupPath);
				console.log(`✓ Backed up current model to ${backupPath}`);
			} catch {
				console.log("  No existing model to backup");
			}

			// Save new model
			await trainer.saveModel(result.model, modelPath);
			console.log(`✓ Deployed new model to ${modelPath}`);

			// Save evaluation results
			await evaluator.saveEvaluationResults(newModelMetrics, `v${Date.now()}`);
			console.log(`✓ Saved evaluation results`);

			// Generate and save report
			const report = evaluator.generateReport(newModelMetrics);
			await fs.writeFile(
				path.join(modelPath, "deployment-report.txt"),
				`Deployed: ${new Date().toISOString()}\n\n${report}`
			);
			console.log(`✓ Generated deployment report\n`);

			// Send notification (placeholder - implement actual notification)
			console.log("=== Deployment Notification ===");
			console.log(`New model deployed successfully`);
			console.log(`Accuracy: ${(newModelMetrics.accuracy * 100).toFixed(2)}%`);
			if (currentModelMetrics) {
				console.log(`Improvement: ${(improvement * 100).toFixed(2)}%`);
			}
			console.log(`Training data: ${allData.length} points`);
			console.log(`Evaluation: ${testData.length} test samples\n`);
		} else {
			console.log("\nStep 5: Skipping deployment");
			console.log("Saving new model as candidate...");

			const candidatePath = path.join(
				process.cwd(),
				"models",
				`personalized-learning-candidate-${Date.now()}`
			);
			await trainer.saveModel(result.model, candidatePath);
			console.log(`✓ Saved candidate model to ${candidatePath}`);

			// Save evaluation
			const report = evaluator.generateReport(newModelMetrics);
			await fs.writeFile(
				path.join(candidatePath, "evaluation-report.txt"),
				`Trained: ${new Date().toISOString()}\n\n${report}`
			);
			console.log(`✓ Generated evaluation report\n`);
		}

		// 6. Summary
		console.log("=== Retraining Summary ===");
		console.log(`Training data: ${allData.length} points`);
		console.log(`New model accuracy: ${(newModelMetrics.accuracy * 100).toFixed(2)}%`);
		if (currentModelMetrics) {
			console.log(`Previous model accuracy: ${(currentModelMetrics.accuracy * 100).toFixed(2)}%`);
			console.log(`Improvement: ${improvement > 0 ? "+" : ""}${(improvement * 100).toFixed(2)}%`);
		}
		console.log(`Deployed: ${shouldDeploy ? "Yes" : "No"}`);
		console.log(`\nCompleted: ${new Date().toISOString()}\n`);

		// Cleanup
		await collector.shutdown();
		await prisma.$disconnect();

		// Exit with appropriate code
		process.exit(0);
	} catch (error) {
		console.error("\n❌ Retraining failed:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
}

main();
