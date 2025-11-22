# Federated Learning Quick Reference

Quick commands and examples for working with the federated learning system.

## Setup Commands

```bash
# 1. Run database migration
tsx scripts/run-migration.ts

# 2. Train main model
tsx scripts/train-main-model.ts

# 3. Test cloning
tsx scripts/test-model-cloning.ts

# 4. Run aggregation
tsx scripts/run-federated-aggregation.ts
```

## Environment Variables

```env
# Required
USE_FEDERATED_LEARNING=true
AIVO_MAIN_MODEL_PATH=./models/main-aivo
DATABASE_URL=postgresql://user:pass@localhost:5432/aivo

# Optional - Privacy
ENABLE_DIFFERENTIAL_PRIVACY=true
NOISE_MULTIPLIER=0.1
CLIP_NORM=1.0

# Optional - Training
TRAINING_EPOCHS=100
BATCH_SIZE=64
```

## Common Tasks

### Train Main Model
```bash
tsx scripts/train-main-model.ts
```

### Test Model Cloning
```bash
tsx scripts/test-model-cloning.ts
```

### Run Aggregation (Dry Run)
```bash
tsx scripts/run-federated-aggregation.ts --dry-run
```

### Run Aggregation (Real)
```bash
tsx scripts/run-federated-aggregation.ts \
  --strategy weighted \
  --min-learners 5 \
  --max-stale 7
```

### View Database
```bash
npx prisma studio
```

## Code Examples

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

### Find Eligible Learners
```typescript
const eligible = registry.getEligibleForAggregation(7);
console.log(`${eligible.length} learners ready`);
```

### Clone Model Manually
```typescript
import { ModelCloner } from "@aivo/agents";

const cloner = new ModelCloner();
const info = await cloner.cloneModel({
  mainModelPath: './models/main-aivo',
  learnerModelPath: './models/learners/abc',
  learnerId: 'abc',
  freezeLayers: ['shared_dense_1', 'shared_bn_1']
});
```

### Train Learner Model
```typescript
import { FederatedLearningManager } from "@aivo/agents";

const manager = new FederatedLearningManager({
  enableDifferentialPrivacy: true
});

await manager.trainLocalModel(model, trainingData, {
  learnerId: 'abc',
  epochs: 10,
  batchSize: 32
});
```

### Aggregate Updates
```typescript
import { FederatedAggregationService } from "@aivo/agents";

const service = new FederatedAggregationService({
  mainModelPath: './models/main-aivo',
  aggregationStrategy: 'weighted',
  minimumLearners: 5
});

await service.initialize();
const jobId = await service.scheduleAggregation();
const result = await service.runScheduledAggregation(jobId);
```

## Troubleshooting

### "Main model not found"
```bash
# Train main model first
tsx scripts/train-main-model.ts
```

### "@aivo/agents module not found"
```bash
# Build the package
pnpm --filter @aivo/agents build
```

### "Migration failed"
```bash
# Check database connection
npx prisma db pull

# Validate schema
npx prisma validate

# Run manually
npx prisma migrate dev --name federated_learning
```

### "No eligible learners"
```bash
# Lower threshold
tsx scripts/run-federated-aggregation.ts --min-learners 1

# Allow older training
tsx scripts/run-federated-aggregation.ts --max-stale 14
```

## File Locations

```
models/
├── main-aivo/              # Main model
│   ├── model.json
│   ├── weights.bin
│   └── metadata.json
├── learners/               # Learner models
│   └── {learnerId}/
│       ├── model.json
│       ├── weights.bin
│       └── clone-metadata.json
└── registry/               # Tracking
    ├── main-models.json
    ├── learner-models.json
    └── federated-updates.json
```

## Database Tables

- `MainModelVersion` - Main model versions
- `FederatedUpdate` - Aggregation events
- `ModelTrainingSession` - Training history
- `PersonalizedModel.metadata` - Federated metadata

## Monitoring

### Check Aggregation Logs
```bash
cat logs/aggregation.log
```

### View Registry
```bash
cat models/registry/main-models.json
cat models/registry/learner-models.json
cat models/registry/federated-updates.json
```

### Query Database
```sql
-- Check learner models
SELECT 
  "learnerId",
  "metadata"->>'federatedLearning' as is_federated,
  "metadata"->>'clonedModelPath' as model_path
FROM "PersonalizedModel"
WHERE "metadata" IS NOT NULL;

-- Check training sessions
SELECT COUNT(*) as sessions, 
       AVG("finalAccuracy") as avg_accuracy
FROM "ModelTrainingSession";

-- Check federated updates
SELECT "createdAt", 
       array_length("contributingLearners", 1) as learner_count,
       "performanceImprovement"
FROM "FederatedUpdate"
ORDER BY "createdAt" DESC;
```

## Cron Job Setup (Windows)

1. Open Task Scheduler
2. Create Basic Task: "AIVO Federated Aggregation"
3. Trigger: Weekly, Sunday, 2:00 AM
4. Action: Start a program
   - Program: `C:\Program Files\nodejs\node.exe`
   - Arguments: `tsx scripts\run-federated-aggregation.ts`
   - Start in: `C:\Users\ofema\Aivo-v5.1`

## Cron Job Setup (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add line (runs every Sunday at 2 AM)
0 2 * * 0 cd /path/to/aivo && tsx scripts/run-federated-aggregation.ts >> logs/aggregation.log 2>&1
```

## Documentation Links

- **Technical Docs:** `docs/federated-learning-implementation.md`
- **Activation Guide:** `docs/federated-learning-activation.md`
- **Summary:** `docs/federated-learning-summary.md`
- **Quick Ref:** `docs/federated-learning-quick-ref.md` (this file)

## Support

For detailed information, see the full documentation:
- Architecture details: `federated-learning-implementation.md`
- Setup instructions: `federated-learning-activation.md`
- Component overview: `federated-learning-summary.md`
