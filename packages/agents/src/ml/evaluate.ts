#!/usr/bin/env tsx
/**
 * Model Evaluation Script
 * 
 * Evaluates trained ML model against test data and GPT-4 decisions.
 * Generates comprehensive evaluation report.
 * 
 * Run: pnpm tsx src/ml/evaluate.ts
 */

import { ModelTrainer } from "./ModelTrainer";
import { ModelEvaluator } from "./ModelEvaluator";
import { getTrainingDataCollector } from "./TrainingDataCollector";
import { PrismaClient } from "@prisma/client";
import path from "path";

async function main() {
	console.log("=== ML Model Evaluation Script ===\n");

	const prisma = new PrismaClient();

	try {
		// Load model
		console.log("Loading trained model...");
		const modelPath = path.join(process.cwd(), "models", "personalized-learning");
		const trainer = new ModelTrainer();
		const model = await trainer.loadModel(modelPath);
		console.log("✓ Model loaded\n");

		// Load test data
		console.log("Loading test data...");
		const collector = getTrainingDataCollector();
		const allData = await collector.exportTrainingData({
			startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
			minDataPoints: 50
		});

		// Split into train/test (80/20)
		const splitIndex = Math.floor(allData.length * 0.8);
		const testData = allData.slice(splitIndex);
		console.log(`✓ Loaded ${testData.length} test samples\n`);

		// Evaluate model
		console.log("Evaluating model...");
		const evaluator = new ModelEvaluator(prisma);
		const metrics = await evaluator.evaluateModel(model, testData);
		console.log("✓ Evaluation complete\n");

		// Generate report
		const report = evaluator.generateReport(metrics);
		console.log(report);

		// Save results
		console.log("\nSaving evaluation results...");
		await evaluator.saveEvaluationResults(metrics, "v1.0.0");
		console.log("✓ Results saved\n");

		// Export report to file
		const fs = await import("fs/promises");
		const reportPath = path.join(process.cwd(), "models", "personalized-learning", "evaluation-report.txt");
		await fs.writeFile(reportPath, report);
		console.log(`Report saved to: ${reportPath}\n`);

		// Recommendations
		console.log("=== Recommendations ===");
		if (metrics.accuracy < 0.7) {
			console.log("⚠️  Model accuracy is below 70%. Consider:");
			console.log("   - Collecting more training data");
			console.log("   - Adjusting model architecture");
			console.log("   - Tuning hyperparameters");
		} else if (metrics.accuracy < 0.85) {
			console.log("✓ Model performance is acceptable");
			console.log("  Consider collecting more data to improve accuracy");
		} else {
			console.log("✓ Excellent model performance!");
			console.log("  Ready for production deployment");
		}

		// Check calibration
		const avgCalibrationError =
			metrics.confidenceCalibration.bins.reduce((sum, _, i) => {
				return (
					sum +
					Math.abs(
						metrics.confidenceCalibration.confidence[i] -
							metrics.confidenceCalibration.accuracy[i]
					)
				);
			}, 0) / metrics.confidenceCalibration.bins.length;

		if (avgCalibrationError > 0.1) {
			console.log("\n⚠️  Model confidence is poorly calibrated");
			console.log("   Consider recalibrating confidence scores");
		} else {
			console.log("\n✓ Model confidence is well calibrated");
		}

		console.log("\n=== Next Steps ===");
		console.log("1. Review evaluation report for insights");
		console.log("2. Compare with GPT-4 performance");
		console.log("3. A/B test in production");
		console.log("4. Monitor real-world performance\n");

		await collector.shutdown();
		await prisma.$disconnect();
	} catch (error) {
		console.error("Evaluation failed:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
}

main();
