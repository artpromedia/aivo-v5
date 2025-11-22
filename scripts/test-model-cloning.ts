/**
 * Test Model Cloning Script
 * 
 * This script tests the federated learning model cloning functionality.
 * It creates a test learner and clones the main model for them.
 * 
 * Usage:
 *   tsx scripts/test-model-cloning.ts
 * 
 * Prerequisites:
 *   - Main AIVO model must be trained (run train-main-model.ts first)
 *   - Database must be migrated with federated learning tables
 *   - USE_FEDERATED_LEARNING=true in .env
 */

import { ModelCloner, ModelRegistry } from "@aivo/agents";
import path from "path";

// Configuration
const MAIN_MODEL_PATH = process.env.AIVO_MAIN_MODEL_PATH || path.join(process.cwd(), "models", "main-aivo");
const TEST_LEARNER_ID = "test-learner-" + Date.now();

async function main() {
	console.log("\n=== Testing Model Cloning ===\n");
	console.log(`Test Learner ID: ${TEST_LEARNER_ID}`);
	console.log(`Main Model Path: ${MAIN_MODEL_PATH}`);
	console.log("");

	try {
		// Step 1: Verify main model exists
		console.log("Step 1: Verifying main model exists...");
		const fs = await import("fs/promises");
		try {
			await fs.access(path.join(MAIN_MODEL_PATH, "model.json"));
			await fs.access(path.join(MAIN_MODEL_PATH, "metadata.json"));
			console.log("✓ Main model found\n");
		} catch (error) {
			throw new Error(`Main model not found at ${MAIN_MODEL_PATH}. Run train-main-model.ts first.`);
		}

		// Step 2: Initialize cloner and registry
		console.log("Step 2: Initializing cloner and registry...");
		const cloner = new ModelCloner();
		const registry = new ModelRegistry();
		await registry.initialize();
		console.log("✓ Initialized\n");

		// Step 3: Clone model for test learner
		console.log("Step 3: Cloning model for test learner...");
		const learnerModelPath = path.join(process.cwd(), "models", "learners", TEST_LEARNER_ID);

		const cloneInfo = await cloner.cloneModel({
			mainModelPath: MAIN_MODEL_PATH,
			learnerModelPath,
			learnerId: TEST_LEARNER_ID,
			// Freeze early feature extraction layers
			freezeLayers: [
				"shared_dense_1",
				"shared_bn_1",
				"shared_dense_2",
				"shared_bn_2"
			]
		});

		console.log("✓ Model cloned successfully\n");

		// Step 4: Display clone information
		console.log("Clone Information:");
		console.log(`  - Learner ID: ${cloneInfo.learnerId}`);
		console.log(`  - Source Version: ${cloneInfo.sourceModelVersion}`);
		console.log(`  - Cloned Path: ${cloneInfo.clonedModelPath}`);
		console.log(`  - Clone Date: ${cloneInfo.cloneDate.toISOString()}`);
		console.log("\nArchitecture:");
		console.log(`  - Total Layers: ${cloneInfo.architecture.totalLayers}`);
		console.log(`  - Frozen Layers: ${cloneInfo.architecture.frozenLayers}`);
		console.log(`  - Trainable Layers: ${cloneInfo.architecture.trainableLayers}`);
		console.log(`  - Total Parameters: ${cloneInfo.architecture.totalParams.toLocaleString()}`);
		console.log(`  - Trainable Parameters: ${cloneInfo.architecture.trainableParams.toLocaleString()}`);
		console.log(`  - Frozen Parameters: ${(cloneInfo.architecture.totalParams - cloneInfo.architecture.trainableParams).toLocaleString()}`);
		console.log("");

		// Step 5: Register learner model
		console.log("Step 4: Registering learner model in registry...");
		await registry.registerLearnerModel({
			learnerId: TEST_LEARNER_ID,
			modelPath: learnerModelPath,
			sourceVersion: cloneInfo.sourceModelVersion,
			clonedAt: cloneInfo.cloneDate,
			trainingHistory: [],
			performanceMetrics: {
				accuracy: 0,
				loss: 0,
				improvement: 0
			},
			status: "active"
		});
		console.log("✓ Learner model registered\n");

		// Step 6: Verify cloned model can be loaded
		console.log("Step 5: Verifying cloned model can be loaded...");
		const { model, metadata } = await cloner.loadClonedModel(learnerModelPath);
		console.log(`✓ Successfully loaded cloned model`);
		console.log(`  - Model has ${model.layers.length} layers`);
		console.log(`  - Metadata learner ID: ${metadata?.learnerId || "unknown"}`);
		model.dispose();
		console.log("");

		// Step 7: Compare weights with main model
		console.log("Step 6: Comparing weights with main model...");
		const comparison = await cloner.compareWeights(MAIN_MODEL_PATH, learnerModelPath);
		console.log(`✓ Weight comparison complete`);
		console.log(`  - Overall similarity: ${(comparison.overallSimilarity * 100).toFixed(2)}%`);
		console.log(`  - Layer differences: ${comparison.layerDifferences.length} layers analyzed`);
		
		// Show first few layers
		console.log("\nSample layer similarities:");
		for (let i = 0; i < Math.min(5, comparison.layerDifferences.length); i++) {
			const layer = comparison.layerDifferences[i];
			console.log(`  - ${layer.layerName}: ${(layer.similarity * 100).toFixed(2)}%`);
		}
		console.log("");

		// Step 8: Test weight delta extraction
		console.log("Step 7: Testing weight delta extraction...");
		const deltas = await cloner.extractWeightDeltas(MAIN_MODEL_PATH, learnerModelPath);
		console.log(`✓ Extracted ${deltas.length} weight delta tensors`);
		
		// Calculate total delta magnitude
		let totalDeltaMagnitude = 0;
		for (const delta of deltas) {
			const magnitude = delta.abs().mean().dataSync()[0];
			totalDeltaMagnitude += magnitude;
		}
		console.log(`  - Average delta magnitude: ${(totalDeltaMagnitude / deltas.length).toExponential(4)}`);
		console.log(`  - (Should be near zero since no training has occurred yet)`);
		
		// Clean up
		deltas.forEach(d => d.dispose());
		console.log("");

		// Step 9: Display registry statistics
		console.log("Step 8: Registry statistics...");
		const stats = registry.getStatistics();
		console.log(`  - Total main model versions: ${stats.totalMainVersions}`);
		console.log(`  - Total learner models: ${stats.totalLearnerModels}`);
		console.log(`  - Active learner models: ${stats.activeLearnerModels}`);
		console.log(`  - Total federated updates: ${stats.totalFederatedUpdates}`);
		console.log(`  - Total training sessions: ${stats.totalTrainingSessions}`);
		console.log("");

		// Success!
		console.log("=== Model Cloning Test Complete ===\n");
		console.log("✓ All tests passed!");
		console.log("");
		console.log("Next steps:");
		console.log("1. Integrate model cloning into learner provisioning (already done in AIVOModelCloner)");
		console.log("2. Test local training on the cloned model");
		console.log("3. Run federated aggregation: tsx scripts/run-federated-aggregation.ts");
		console.log("");
		console.log(`Test learner model saved at: ${learnerModelPath}`);
		console.log("You can delete this test model or use it for further testing.");
		console.log("");

		process.exit(0);
	} catch (error) {
		console.error("\n❌ Test failed:", error);
		console.error("");
		console.error("Troubleshooting:");
		console.error("1. Make sure main model is trained: tsx scripts/train-main-model.ts");
		console.error("2. Check AIVO_MAIN_MODEL_PATH environment variable");
		console.error("3. Verify USE_FEDERATED_LEARNING=true in .env");
		console.error("");
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	main();
}
