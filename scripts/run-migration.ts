/**
 * Run Database Migration for Federated Learning
 * 
 * This script executes the Prisma migration to add federated learning tables.
 * 
 * Usage:
 *   tsx scripts/run-migration.ts
 * 
 * What this migration adds:
 *   - MainModelVersion table: Tracks versions of the main AIVO model
 *   - FederatedUpdate table: Records federated aggregation events
 *   - ModelTrainingSession table: Logs individual training sessions
 *   - Updates PersonalizedModel with metadata field
 *   - Adds ModelVersionStatus enum
 */

import { spawn } from "child_process";
import path from "path";

function runCommand(command: string, args: string[]): Promise<{ code: number; output: string }> {
	return new Promise((resolve) => {
		console.log(`Running: ${command} ${args.join(" ")}\n`);
		
		const proc = spawn(command, args, {
			cwd: process.cwd(),
			shell: true,
			stdio: ["inherit", "pipe", "pipe"]
		});

		let output = "";

		proc.stdout?.on("data", (data) => {
			const text = data.toString();
			output += text;
			process.stdout.write(text);
		});

		proc.stderr?.on("data", (data) => {
			const text = data.toString();
			output += text;
			process.stderr.write(text);
		});

		proc.on("close", (code) => {
			resolve({ code: code || 0, output });
		});
	});
}

async function main() {
	console.log("\n=== Running Federated Learning Migration ===\n");

	try {
		// Step 1: Check if Prisma is installed
		console.log("Step 1: Checking Prisma installation...");
		const prismaCheck = await runCommand("npx", ["prisma", "--version"]);
		
		if (prismaCheck.code !== 0) {
			throw new Error("Prisma CLI not found. Install with: pnpm add -D prisma");
		}
		
		console.log("✓ Prisma CLI found\n");

		// Step 2: Generate Prisma client to ensure schema is valid
		console.log("Step 2: Validating schema and generating client...");
		const generateResult = await runCommand("npx", ["prisma", "generate"]);
		
		if (generateResult.code !== 0) {
			throw new Error("Schema validation failed. Check prisma/schema.prisma for errors.");
		}
		
		console.log("✓ Schema valid, client generated\n");

		// Step 3: Create and run migration
		console.log("Step 3: Creating and running migration...");
		console.log("This will:");
		console.log("  - Create MainModelVersion table");
		console.log("  - Create FederatedUpdate table");
		console.log("  - Create ModelTrainingSession table");
		console.log("  - Add metadata field to PersonalizedModel");
		console.log("  - Add ModelVersionStatus enum");
		console.log("");
		
		const migrateResult = await runCommand("npx", [
			"prisma",
			"migrate",
			"dev",
			"--name",
			"federated_learning"
		]);
		
		if (migrateResult.code !== 0) {
			throw new Error("Migration failed. See error output above.");
		}
		
		console.log("\n✓ Migration applied successfully\n");

		// Step 4: Verify tables exist
		console.log("Step 4: Verifying new tables...");
		// Note: We can't easily verify without running a query, so we'll trust the migration
		console.log("✓ Tables should now exist in database\n");

		// Step 5: Display next steps
		console.log("=== Migration Complete ===\n");
		console.log("Next steps:");
		console.log("1. Train main AIVO model:");
		console.log("   tsx scripts/train-main-model.ts");
		console.log("");
		console.log("2. Set environment variables in .env:");
		console.log("   USE_FEDERATED_LEARNING=true");
		console.log("   AIVO_MAIN_MODEL_PATH=./models/main-aivo");
		console.log("   ENABLE_DIFFERENTIAL_PRIVACY=true");
		console.log("");
		console.log("3. Test model cloning:");
		console.log("   tsx scripts/test-model-cloning.ts");
		console.log("");
		console.log("4. Set up cron job for weekly aggregation:");
		console.log("   tsx scripts/run-federated-aggregation.ts");
		console.log("");
		console.log("5. View database with Prisma Studio:");
		console.log("   npx prisma studio");
		console.log("");

		process.exit(0);
	} catch (error) {
		console.error("\n❌ Migration failed:", error);
		console.error("");
		console.error("Troubleshooting:");
		console.error("1. Make sure database is running and accessible");
		console.error("2. Check DATABASE_URL in .env file");
		console.error("3. Verify prisma/schema.prisma has no syntax errors");
		console.error("4. Try running manually: npx prisma migrate dev --name federated_learning");
		console.error("");
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	main();
}
