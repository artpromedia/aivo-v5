/**
 * Federated Aggregation Cron Job
 * 
 * This script performs scheduled federated learning aggregation.
 * It collects updates from eligible learner models and updates the main model.
 * 
 * Usage:
 *   tsx scripts/run-federated-aggregation.ts [options]
 * 
 * Options:
 *   --strategy <strategy>  Aggregation strategy: fedavg, weighted, or fedprox (default: weighted)
 *   --min-learners <n>     Minimum number of learners required (default: 5)
 *   --max-stale <days>     Maximum days since last training (default: 7)
 *   --learning-rate <lr>   Learning rate for main model update (default: 0.1)
 *   --dry-run              Simulate without actually updating main model
 * 
 * Recommended Schedule:
 *   - Weekly: Sunday at 2 AM
 *   - Or when server load is low
 * 
 * Setup with Windows Task Scheduler:
 *   1. Open Task Scheduler
 *   2. Create Basic Task
 *   3. Set trigger: Weekly, Sunday, 2:00 AM
 *   4. Action: Start a program
 *   5. Program: C:\Program Files\nodejs\node.exe
 *   6. Arguments: C:\Users\[user]\AppData\Roaming\npm\tsx scripts\run-federated-aggregation.ts
 *   7. Start in: C:\Users\ofema\Aivo-v5.1
 */

import { FederatedAggregationService, ModelRegistry } from "@aivo/agents";
import path from "path";

// Parse command line arguments
function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		strategy: "weighted" as "fedavg" | "weighted" | "fedprox",
		minLearners: 5,
		maxStaleDays: 7,
		learningRate: 0.1,
		dryRun: false
	};

	for (let i = 0; i < args.length; i++) {
		switch (args[i]) {
			case "--strategy":
				options.strategy = args[++i] as any;
				break;
			case "--min-learners":
				options.minLearners = parseInt(args[++i]);
				break;
			case "--max-stale":
				options.maxStaleDays = parseInt(args[++i]);
				break;
			case "--learning-rate":
				options.learningRate = parseFloat(args[++i]);
				break;
			case "--dry-run":
				options.dryRun = true;
				break;
		}
	}

	return options;
}

// Send notification (email, Slack, etc.)
async function sendNotification(subject: string, message: string, isError = false) {
	// TODO: Implement notification system
	// For now, just log
	console.log(`\n[${isError ? "ERROR" : "INFO"}] ${subject}`);
	console.log(message);
}

async function main() {
	const startTime = Date.now();
	const options = parseArgs();

	console.log("\n=== Federated Learning Aggregation ===");
	console.log(`Run Time: ${new Date().toISOString()}\n`);
	console.log("Configuration:");
	console.log(`  - Aggregation Strategy: ${options.strategy}`);
	console.log(`  - Minimum Learners: ${options.minLearners}`);
	console.log(`  - Max Stale Days: ${options.maxStaleDays}`);
	console.log(`  - Learning Rate: ${options.learningRate}`);
	console.log(`  - Dry Run: ${options.dryRun ? "YES" : "NO"}`);
	console.log("");

	try {
		// Step 1: Initialize service
		console.log("Step 1: Initializing aggregation service...");
		const mainModelPath = process.env.AIVO_MAIN_MODEL_PATH || path.join(process.cwd(), "models", "main-aivo");
		
		const service = new FederatedAggregationService({
			mainModelPath,
			aggregationStrategy: options.strategy,
			minimumLearners: options.minLearners,
			maxStaleDays: options.maxStaleDays,
			learningRate: options.learningRate,
			enableDifferentialPrivacy: process.env.ENABLE_DIFFERENTIAL_PRIVACY === "true",
			noiseMultiplier: parseFloat(process.env.NOISE_MULTIPLIER || "0.1"),
			clipNorm: parseFloat(process.env.CLIP_NORM || "1.0")
		});

		await service.initialize();
		console.log("✓ Service initialized\n");

		// Step 2: Check eligibility
		console.log("Step 2: Checking for eligible learner models...");
		const registry = new ModelRegistry();
		await registry.initialize();
		
		const eligible = registry.getEligibleForAggregation(options.maxStaleDays);
		console.log(`Found ${eligible.length} eligible learner models`);

		if (eligible.length === 0) {
			console.log("\n⚠ No learner models ready for aggregation.");
			console.log("Reasons could be:");
			console.log("  - No learners have trained recently");
			console.log("  - All recent training already contributed to federation");
			console.log("  - No learner models registered yet");
			console.log("");
			
			await sendNotification(
				"Federated Aggregation: No Eligible Learners",
				`No learner models were eligible for aggregation at this time.`
			);
			
			process.exit(0);
		}

		if (eligible.length < options.minLearners) {
			console.log(`\n⚠ Only ${eligible.length} learners available, minimum is ${options.minLearners}`);
			console.log("Skipping aggregation this cycle.");
			console.log("");
			
			await sendNotification(
				"Federated Aggregation: Insufficient Learners",
				`Only ${eligible.length} learner models eligible, need ${options.minLearners} minimum.`
			);
			
			process.exit(0);
		}

		console.log("\nEligible learners:");
		eligible.slice(0, 10).forEach((learner, i) => {
			const lastTraining = learner.trainingHistory[learner.trainingHistory.length - 1];
			console.log(`  ${i + 1}. ${learner.learnerId}`);
			console.log(`     Last trained: ${lastTraining?.trainedAt?.toISOString() || "unknown"}`);
			console.log(`     Sessions: ${learner.trainingHistory.length}`);
		});
		if (eligible.length > 10) {
			console.log(`  ... and ${eligible.length - 10} more`);
		}
		console.log("");

		if (options.dryRun) {
			console.log("✓ Dry run complete - no changes made\n");
			process.exit(0);
		}

		// Step 3: Schedule aggregation
		console.log("Step 3: Scheduling aggregation job...");
		const jobId = await service.scheduleAggregation();
		
		if (!jobId) {
			throw new Error("Failed to schedule aggregation job");
		}
		
		console.log(`✓ Job scheduled: ${jobId}\n`);

		// Step 4: Execute aggregation
		console.log("Step 4: Executing aggregation...");
		console.log("This may take several minutes...\n");
		
		const result = await service.runScheduledAggregation(jobId);

		// Step 5: Display results
		console.log("\n=== Aggregation Results ===\n");
		console.log(`Job ID: ${result.jobId}`);
		console.log(`Status: ${result.status}`);
		console.log(`Contributing Learners: ${result.contributingLearners}`);
		console.log(`Strategy Used: ${result.aggregationStrategy}`);
		console.log("");
		console.log("Performance:");
		console.log(`  Before Update:`);
		console.log(`    - Loss: ${result.performanceBefore.loss.toFixed(4)}`);
		console.log(`    - Accuracy: ${(result.performanceBefore.accuracy * 100).toFixed(2)}%`);
		console.log(`  After Update:`);
		console.log(`    - Loss: ${result.performanceAfter.loss.toFixed(4)}`);
		console.log(`    - Accuracy: ${(result.performanceAfter.accuracy * 100).toFixed(2)}%`);
		console.log(`  Improvement:`);
		console.log(`    - Loss: ${result.performanceImprovement.loss > 0 ? "+" : ""}${(result.performanceImprovement.loss * 100).toFixed(2)}%`);
		console.log(`    - Accuracy: ${result.performanceImprovement.accuracy > 0 ? "+" : ""}${(result.performanceImprovement.accuracy * 100).toFixed(2)}%`);
		console.log("");
		
		if (result.privacyBudget !== undefined) {
			console.log(`Privacy Budget Used: ε=${result.privacyBudget.toFixed(4)}`);
			console.log("");
		}

		// Step 6: Update statistics
		const stats = registry.getStatistics();
		console.log("Overall Statistics:");
		console.log(`  - Total Main Versions: ${stats.totalMainVersions}`);
		console.log(`  - Total Learner Models: ${stats.totalLearnerModels}`);
		console.log(`  - Active Learner Models: ${stats.activeLearnerModels}`);
		console.log(`  - Total Federated Updates: ${stats.totalFederatedUpdates}`);
		console.log(`  - Total Training Sessions: ${stats.totalTrainingSessions}`);
		console.log("");

		const duration = ((Date.now() - startTime) / 1000).toFixed(1);
		console.log(`✓ Aggregation complete in ${duration}s\n`);

		// Send success notification
		await sendNotification(
			"Federated Aggregation: Success",
			`Successfully aggregated updates from ${result.contributingLearners} learners.\n` +
			`Performance improvement: Loss ${result.performanceImprovement.loss > 0 ? "+" : ""}${(result.performanceImprovement.loss * 100).toFixed(2)}%, ` +
			`Accuracy ${result.performanceImprovement.accuracy > 0 ? "+" : ""}${(result.performanceImprovement.accuracy * 100).toFixed(2)}%`
		);

		process.exit(0);
	} catch (error) {
		const duration = ((Date.now() - startTime) / 1000).toFixed(1);
		console.error("\n❌ Aggregation failed:", error);
		console.error(`Duration: ${duration}s\n`);
		
		// Send error notification
		await sendNotification(
			"Federated Aggregation: Failed",
			`Error: ${error instanceof Error ? error.message : String(error)}`,
			true
		);

		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	main();
}
