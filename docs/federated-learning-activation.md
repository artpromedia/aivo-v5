# Federated Learning Activation Guide

This guide walks you through activating the federated learning system in AIVO v5.

## Prerequisites

- PostgreSQL database running and accessible
- Node.js 18+ installed
- pnpm package manager
- All dependencies installed (`pnpm install`)

## Activation Steps

### Step 1: Run Database Migration

The migration adds the required tables for federated learning.

```bash
tsx scripts/run-migration.ts
```

This creates:
- `MainModelVersion` - Tracks main model versions
- `FederatedUpdate` - Records aggregation events
- `ModelTrainingSession` - Logs training sessions
- Adds `metadata` field to `PersonalizedModel`
- Adds `ModelVersionStatus` enum

**Verification:**
```bash
npx prisma studio
```
Navigate to the database and verify the new tables exist.

---

### Step 2: Train Main AIVO Model

Generate the base neural network model that will be cloned for each learner.

```bash
tsx scripts/train-main-model.ts
```

**What this does:**
- Generates 10,000 synthetic curriculum samples
- Trains a 256-input neural network with multi-head architecture
- Saves model to `./models/main-aivo/`
- Registers model version in ModelRegistry

**Configuration (optional):**
```bash
# Set custom paths/parameters
export AIVO_MAIN_MODEL_PATH=./models/main-aivo
export TRAINING_EPOCHS=100
export BATCH_SIZE=64
```

**Expected output:**
```
=== Training Main AIVO Model ===

Generating 10,000 curriculum data samples...
✓ Generated 10,000 samples

Initializing MainModelTrainer...
✓ Trainer initialized

Training model...
Epoch 10/100 - Loss: 0.8234, Accuracy: 0.7145
Epoch 20/100 - Loss: 0.6512, Accuracy: 0.7834
...
Epoch 100/100 - Loss: 0.2145, Accuracy: 0.9123

Final Training Results:
  - Final Loss: 0.2145
  - Final Accuracy: 91.23%
  - Validation Loss: 0.2456
  - Validation Accuracy: 89.67%

Saving model...
✓ Model saved to ./models/main-aivo

Registering in ModelRegistry...
✓ Registered version 1.0.0
```

---

### Step 3: Configure Environment Variables

Create or update your `.env` file:

```bash
# Copy the example
cp .env.federated.example .env
```

Required variables:
```env
# Enable federated learning
USE_FEDERATED_LEARNING=true

# Path to main model
AIVO_MAIN_MODEL_PATH=./models/main-aivo

# Differential privacy (recommended)
ENABLE_DIFFERENTIAL_PRIVACY=true
NOISE_MULTIPLIER=0.1
CLIP_NORM=1.0

# Database connection (if not already set)
DATABASE_URL=postgresql://user:password@localhost:5432/aivo
```

**Important:** Restart your application after changing environment variables.

---

### Step 4: Test Model Cloning

Verify that the cloning system works correctly.

```bash
tsx scripts/test-model-cloning.ts
```

**What this tests:**
- Verifies main model exists
- Clones model for a test learner
- Checks frozen vs trainable layers
- Compares weights with main model
- Extracts weight deltas
- Registers in ModelRegistry

**Expected output:**
```
=== Testing Model Cloning ===

Step 1: Verifying main model exists...
✓ Main model found

Step 2: Initializing cloner and registry...
✓ Initialized

Step 3: Cloning model for test learner...
✓ Model cloned successfully

Clone Information:
  - Learner ID: test-learner-1234567890
  - Source Version: 1.0.0
  - Total Layers: 15
  - Frozen Layers: 4
  - Trainable Layers: 11
  - Total Parameters: 156,928
  - Trainable Parameters: 89,344
  - Frozen Parameters: 67,584

...

✓ All tests passed!
```

---

### Step 5: Verify Integration

Test that learner provisioning automatically clones models.

**Manual test:**
1. Create a new learner account
2. Complete baseline assessment
3. Check logs for model cloning
4. Verify in database:
   ```sql
   SELECT * FROM "PersonalizedModel" 
   WHERE "learnerId" = 'your-learner-id';
   ```
5. Check model file exists:
   ```bash
   ls models/learners/[learner-id]/
   ```

**Expected database record:**
```json
{
  "id": "clm1234567890",
  "learnerId": "learner-abc",
  "baseModel": "aivo-super-model-v1",
  "status": "ACTIVE",
  "metadata": {
    "federatedLearning": true,
    "clonedModelPath": "./models/learners/learner-abc",
    "sourceVersion": "1.0.0",
    "architecture": {
      "totalLayers": 15,
      "frozenLayers": 4,
      "trainableLayers": 11
    }
  }
}
```

---

### Step 6: Set Up Aggregation Cron Job

Schedule weekly federated aggregation to improve the main model.

#### Option A: Manual Testing

Test aggregation manually first:

```bash
# Dry run (no changes)
tsx scripts/run-federated-aggregation.ts --dry-run

# Real aggregation
tsx scripts/run-federated-aggregation.ts --min-learners 3
```

#### Option B: Windows Task Scheduler

1. Open **Task Scheduler**
2. Click **Create Basic Task**
3. Name: "AIVO Federated Aggregation"
4. Trigger: **Weekly**, Sunday, 2:00 AM
5. Action: **Start a program**
   - Program: `C:\Program Files\nodejs\node.exe`
   - Arguments: `C:\Users\[user]\AppData\Roaming\npm\tsx scripts\run-federated-aggregation.ts`
   - Start in: `C:\Users\ofema\Aivo-v5.1`
6. Finish and test

#### Option C: Linux/Mac Cron

```bash
# Edit crontab
crontab -e

# Add line (runs every Sunday at 2 AM)
0 2 * * 0 cd /path/to/aivo && tsx scripts/run-federated-aggregation.ts >> logs/aggregation.log 2>&1
```

**Aggregation Options:**
```bash
# Use different strategy
tsx scripts/run-federated-aggregation.ts --strategy fedavg

# Require more learners
tsx scripts/run-federated-aggregation.ts --min-learners 10

# Allow older training (up to 14 days)
tsx scripts/run-federated-aggregation.ts --max-stale 14

# Custom learning rate
tsx scripts/run-federated-aggregation.ts --learning-rate 0.05
```

---

## Verification Checklist

After completing all steps, verify:

- [ ] Database has federated learning tables
- [ ] Main model trained and saved in `models/main-aivo/`
- [ ] Environment variable `USE_FEDERATED_LEARNING=true`
- [ ] Test cloning script passes all tests
- [ ] New learner gets cloned model on provisioning
- [ ] Cloned model file exists in `models/learners/[id]/`
- [ ] Database PersonalizedModel has metadata.federatedLearning = true
- [ ] Aggregation script can run successfully
- [ ] Cron job scheduled (or manual process defined)

---

## Monitoring

### Check Registry Statistics

```typescript
import { ModelRegistry } from "@aivo/agents";

const registry = new ModelRegistry();
await registry.initialize();

const stats = registry.getStatistics();
console.log(stats);
// {
//   totalMainVersions: 1,
//   totalLearnerModels: 25,
//   activeLearnerModels: 25,
//   totalFederatedUpdates: 3,
//   totalTrainingSessions: 150
// }
```

### View Aggregation History

```typescript
const updates = registry.getFederatedUpdates();
updates.forEach(update => {
  console.log(`Update ${update.updateId}:`);
  console.log(`  - Date: ${update.aggregatedAt}`);
  console.log(`  - Learners: ${update.contributingLearners.length}`);
  console.log(`  - Strategy: ${update.aggregationStrategy}`);
  console.log(`  - Improvement: ${update.performanceImprovement}%`);
});
```

### Check Learner Eligibility

```typescript
const eligible = registry.getEligibleForAggregation(7); // 7 days
console.log(`${eligible.length} learners ready for aggregation`);
```

---

## Troubleshooting

### Migration Fails

**Error:** "Schema validation failed"
- Check `prisma/schema.prisma` for syntax errors
- Ensure all relations are valid
- Run `npx prisma validate`

**Error:** "Can't reach database"
- Verify `DATABASE_URL` in `.env`
- Check database is running
- Test connection: `npx prisma db pull`

### Training Fails

**Error:** "Main model path not found"
- Set `AIVO_MAIN_MODEL_PATH` environment variable
- Ensure parent directory exists: `mkdir -p models/main-aivo`

**Error:** "Out of memory"
- Reduce `BATCH_SIZE` (try 32 or 16)
- Reduce training samples in script

### Cloning Fails

**Error:** "Main model not found"
- Train main model first: `tsx scripts/train-main-model.ts`
- Check `AIVO_MAIN_MODEL_PATH` matches trained model location

**Error:** "@aivo/agents module not found"
- Build the package: `pnpm --filter @aivo/agents build`
- Or install: `pnpm install`

### Aggregation Fails

**Error:** "No eligible learners"
- Check learners have trained recently (within 7 days)
- Lower `--min-learners` threshold
- Verify registry has learner models: check `models/registry/learner-models.json`

**Error:** "Performance degradation"
- Review aggregation strategy (try `weighted` instead of `fedavg`)
- Lower learning rate: `--learning-rate 0.05`
- Check for corrupted learner models

---

## Next Steps

1. **Monitor Performance:**
   - Track main model accuracy over time
   - Compare learner-specific vs shared model performance
   - Adjust aggregation frequency based on results

2. **Optimize Privacy:**
   - Fine-tune `NOISE_MULTIPLIER` for privacy/utility tradeoff
   - Monitor privacy budget consumption
   - Consider increasing `CLIP_NORM` if needed

3. **Scale Up:**
   - Increase `minimumLearners` for aggregation as user base grows
   - Consider more frequent aggregations (bi-weekly)
   - Add monitoring/alerting for failed aggregations

4. **Advanced Features:**
   - Implement weighted aggregation by learner performance
   - Add model compression for faster downloads
   - Create admin dashboard for federated learning metrics

---

## Support

For issues or questions:
- Check `docs/federated-learning-implementation.md` for detailed architecture
- Review logs in `logs/aggregation.log`
- Open an issue on the project repository

---

**Congratulations!** 🎉 Your federated learning system is now active. Each learner will have their own personalized model that learns from their interactions while contributing to improve the main model for everyone.
