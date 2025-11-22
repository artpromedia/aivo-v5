# Federated Learning Implementation for AIVO v5

## Overview

AIVO v5 now implements **true federated learning** with neural network weight cloning, replacing the previous OpenAI fine-tuning approach. This architecture enables:

- **Privacy-preserving learning**: Learner data stays local, only model updates are shared
- **Personalized models**: Each learner gets an independent clone of the main model
- **Continuous improvement**: Main model benefits from all learners' progress
- **Differential privacy**: Optional noise injection protects individual learners

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Main AIVO Model                              │
│  - Trained on general curriculum data                            │
│  - Base knowledge for all subjects                               │
│  - Periodically updated via federated aggregation                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Clone Weights
                 ├──────────────────────────────────────────┐
                 │                                           │
                 ▼                                           ▼
┌────────────────────────────┐              ┌────────────────────────────┐
│  Learner Model (Alex)      │              │  Learner Model (Sam)       │
│  - Cloned weights from     │              │  - Cloned weights from     │
│    main model              │              │    main model              │
│  - Trains locally on       │              │  - Trains locally on       │
│    Alex's data             │              │    Sam's data              │
│  - Personalized to Alex    │              │  - Personalized to Sam     │
└────────────────┬───────────┘              └────────────────┬───────────┘
                 │                                           │
                 │ Weight Deltas                             │ Weight Deltas
                 └───────────────┬───────────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────┐
                 │  Federated Aggregation        │
                 │  - Collect deltas from all    │
                 │    active learners            │
                 │  - Average using FedAvg       │
                 │  - Apply differential privacy │
                 │  - Update main model          │
                 └───────────────────────────────┘
```

## Components

### 1. MainModelTrainer (`packages/agents/src/ml/MainModelTrainer.ts`)

Trains the base AIVO neural network on general curriculum data.

**Architecture:**
- Input: 256 features (content embeddings, subject context, learner context, session context)
- Hidden layers: [512, 256, 128, 64] with batch normalization and dropout
- Multi-head output:
  - Content recommendation (128 categories)
  - Difficulty prediction (10 levels)
  - Learning path optimization (32 actions)

**Usage:**
```typescript
import { MainModelTrainer } from "@aivo/agents";

const trainer = new MainModelTrainer({
  inputDim: 256,
  hiddenLayers: [512, 256, 128, 64],
  learningRate: 0.001,
  epochs: 100
});

// Build model
const model = trainer.buildModel();

// Train on curriculum data
const result = await trainer.train(trainingData);

// Save main model
await trainer.saveModel(
  result.model,
  "./models/main-aivo",
  result
);
```

### 2. ModelCloner (`packages/agents/src/ml/ModelCloner.ts`)

Clones neural network weights from main model to learner instances.

**Features:**
- Deep clone of model architecture and weights
- Layer freezing (freeze early layers, train later layers)
- Weight delta extraction for federated aggregation
- Model comparison and versioning

**Usage:**
```typescript
import { ModelCloner } from "@aivo/agents";

const cloner = new ModelCloner();

// Clone model for learner
const cloneInfo = await cloner.cloneModel({
  mainModelPath: "./models/main-aivo",
  learnerModelPath: "./models/learners/learner-123",
  learnerId: "learner-123",
  freezeLayers: ["shared_dense_1", "shared_bn_1"] // Freeze feature extraction layers
});

console.log(`Cloned model: ${cloneInfo.clonedModelPath}`);
console.log(`Trainable params: ${cloneInfo.architecture.trainableParams}`);
```

### 3. FederatedLearningManager (`packages/agents/src/ml/FederatedLearning.ts`)

Implements federated learning protocols.

**Features:**
- Local model training on learner data
- Gradient clipping for privacy
- Differential privacy noise injection
- Multiple aggregation strategies (FedAvg, FedProx, Weighted)
- Privacy budget calculation

**Usage:**
```typescript
import { FederatedLearningManager } from "@aivo/agents";

const fedManager = new FederatedLearningManager();

// Train learner model locally
const update = await fedManager.trainLocalModel(
  {
    learnerModelPath: "./models/learners/learner-123",
    localEpochs: 5,
    batchSize: 32,
    learningRate: 0.001,
    clipNorm: 1.0, // Gradient clipping
    noiseMultiplier: 0.1 // Differential privacy
  },
  trainingData
);

// Aggregate updates from multiple learners
const aggregationResult = await fedManager.aggregateUpdates(
  [update1, update2, update3],
  "fedavg"
);

// Update main model
await fedManager.updateMainModel(
  "./models/main-aivo",
  aggregationResult.aggregatedWeights,
  1.0 // learning rate
);
```

### 4. ModelRegistry (`packages/agents/src/ml/ModelRegistry.ts`)

Tracks model versions and training history.

**Features:**
- Main model version control
- Learner model instance registry
- Training session tracking
- Federated update history
- Performance metrics

**Usage:**
```typescript
import { ModelRegistry } from "@aivo/agents";

const registry = new ModelRegistry();
await registry.initialize();

// Register main model
await registry.registerMainModel({
  version: "aivo-main-v1",
  modelPath: "./models/main-aivo",
  createdAt: new Date(),
  trainingMetrics: { accuracy: 0.85, loss: 0.42, epochs: 100, samples: 10000 },
  architecture: { /* ... */ },
  federatedUpdates: []
});

// Register learner model
await registry.registerLearnerModel({
  learnerId: "learner-123",
  modelPath: "./models/learners/learner-123",
  sourceVersion: "aivo-main-v1",
  clonedAt: new Date(),
  trainingHistory: [],
  performanceMetrics: { accuracy: 0.80, loss: 0.50, improvement: 0 },
  status: "active"
});

// Get eligible learners for aggregation
const eligible = registry.getEligibleForAggregation(7); // Last 7 days
console.log(`${eligible.length} learners ready for aggregation`);
```

### 5. FederatedAggregationService (`packages/agents/src/ml/FederatedAggregationService.ts`)

Orchestrates periodic federated updates.

**Features:**
- Scheduled aggregation jobs
- Automatic learner eligibility detection
- Multi-strategy aggregation
- Performance evaluation
- Privacy budget tracking

**Usage:**
```typescript
import { FederatedAggregationService } from "@aivo/agents";

const service = new FederatedAggregationService({
  mainModelPath: "./models/main-aivo",
  aggregationStrategy: "weighted",
  minimumLearners: 5,
  maxStaleDays: 7,
  learningRate: 0.1,
  enableDifferentialPrivacy: true,
  noiseMultiplier: 0.1,
  clipNorm: 1.0
});

await service.initialize();

// Run scheduled aggregation
const jobId = await service.runScheduledAggregation();

if (jobId) {
  const job = service.getJobStatus(jobId);
  console.log(`Aggregation completed with ${job.contributingLearners.length} learners`);
  console.log(`Performance improvement: ${job.aggregationResults?.performanceImprovement}`);
}
```

### 6. Updated AIVOModelCloner (`apps/web/lib/ai/model-cloner.ts`)

Now supports both federated learning (weight cloning) and legacy fine-tuning.

**Environment Variables:**
```bash
# Enable federated learning
USE_FEDERATED_LEARNING=true

# Path to main AIVO model
AIVO_MAIN_MODEL_PATH=/path/to/models/main-aivo

# Optional: OpenAI API for legacy fallback
OPENAI_API_KEY=sk-...

# Optional: Pinecone for vector store
PINECONE_API_KEY=...
PINECONE_INDEX=aivo-personalized
```

**Behavior:**
- **If `USE_FEDERATED_LEARNING=true` and main model exists**: Clone weights
- **Otherwise**: Fall back to OpenAI fine-tuning

## Database Schema

### New Models

```prisma
model MainModelVersion {
  id                String              @id
  version           String              @unique
  modelPath         String
  architecture      Json
  trainingMetrics   Json
  status            ModelVersionStatus  @default(ACTIVE)
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  federatedUpdates  FederatedUpdate[]
}

model FederatedUpdate {
  id                     String            @id
  mainModelVersionId     String
  mainModelVersion       MainModelVersion  @relation(fields: [mainModelVersionId], references: [id])
  aggregationStrategy    String
  contributingLearners   String[]
  performanceImprovement Float
  privacyBudget          Float?
  metadata               Json?
  createdAt              DateTime          @default(now())
}

model ModelTrainingSession {
  id                      String             @id
  personalizedModelId     String
  personalizedModel       PersonalizedModel  @relation(fields: [personalizedModelId], references: [id])
  epochs                  Int
  batchSize               Int
  samples                 Int
  finalLoss               Float
  finalAccuracy           Float
  contributedToFederation Boolean            @default(false)
  federatedUpdateId       String?
  metadata                Json?
  createdAt               DateTime           @default(now())
}
```

### Updated Models

```prisma
model PersonalizedModel {
  id                 String                  @id
  learnerId          String                  @unique
  learner            Learner                 @relation(fields: [learnerId], references: [id])
  modelId            String?
  systemPrompt       String?                 @db.Text
  vectorStoreId      String?
  configuration      Json
  status             PersonalizedModelStatus @default(PENDING)
  summary            String?
  version            Int                     @default(1)
  performanceMetrics Json?
  lastTrainedAt      DateTime?
  metadata           Json? // NEW: Stores federated learning metadata
  createdAt          DateTime                @default(now())
  updatedAt          DateTime                @updatedAt
  trainingSessions   ModelTrainingSession[] // NEW
}
```

## Workflow

### Initial Setup

1. **Train Main Model:**
```bash
# Prepare training data from curriculum
node scripts/prepare-curriculum-data.js

# Train main model
node scripts/train-main-model.js
```

2. **Enable Federated Learning:**
```bash
# .env
USE_FEDERATED_LEARNING=true
AIVO_MAIN_MODEL_PATH=./models/main-aivo
```

### Learner Provisioning

When a learner completes baseline assessment:

1. **Assessment Completion** triggers `/api/ai/clone-model`
2. **AIVOModelCloner** checks if federated learning enabled
3. **If enabled**: Clone weights from main model
   - Create learner directory: `./models/learners/{learnerId}`
   - Copy model architecture and weights
   - Freeze early layers (feature extraction)
   - Allow later layers to adapt
4. **Store metadata** in database:
   - `PersonalizedModel` record with `federatedLearning: true`
   - Path to cloned model
   - Architecture info
5. **Learner ready** to use personalized model

### Local Training

During learning sessions:

1. **Collect training data** from learner interactions
2. **Train local model** using `FederatedLearningManager`
   - Run 5-10 epochs on learner data
   - Apply gradient clipping
   - Add differential privacy noise
3. **Save updated model** to learner directory
4. **Record training session** in database
5. **Mark as eligible** for federation

### Federated Aggregation

Run periodically (e.g., weekly via cron):

```bash
# Schedule aggregation
node scripts/run-federated-aggregation.js
```

**Process:**
1. **Identify eligible learners** (trained recently, not yet contributed)
2. **Extract weight deltas** from each learner model
3. **Aggregate deltas** using FedAvg/FedProx/Weighted strategy
4. **Evaluate main model** before/after update
5. **Update main model** with aggregated deltas
6. **Record update** in database and registry
7. **Mark learners** as contributed

### Monitoring

```typescript
import { ModelRegistry } from "@aivo/agents";

const registry = new ModelRegistry();
await registry.initialize();

// Get statistics
const stats = registry.getStatistics();
console.log(`Active learner models: ${stats.activeLearnerModels}`);
console.log(`Total federated updates: ${stats.totalFederatedUpdates}`);
console.log(`Average performance: ${stats.averagePerformance.toFixed(2)}`);

// Check specific learner
const learner = registry.getLearnerModel("learner-123");
console.log(`Training sessions: ${learner.trainingHistory.length}`);
console.log(`Accuracy: ${learner.performanceMetrics.accuracy}`);
console.log(`Improvement: ${learner.performanceMetrics.improvement}`);
```

## Privacy Guarantees

### Differential Privacy

**Epsilon (ε) Budget:**
- Lower epsilon = stronger privacy, less accuracy
- Higher epsilon = weaker privacy, more accuracy
- Typical values: 0.1 to 10.0

**Configuration:**
```typescript
{
  enableDifferentialPrivacy: true,
  noiseMultiplier: 0.1, // Gaussian noise σ
  clipNorm: 1.0 // Gradient clipping threshold
}
```

**Privacy Budget Calculation:**
```typescript
const epsilon = fedManager.calculatePrivacyBudget(
  epochs: 5,
  batchSize: 32,
  datasetSize: 1000,
  noiseMultiplier: 0.1,
  delta: 1e-5
);
console.log(`Privacy budget: ε = ${epsilon.toFixed(4)}`);
```

### Gradient Clipping

Limits the magnitude of weight updates to prevent outliers from dominating:

```typescript
// Clip gradients to max norm of 1.0
clipNorm: 1.0
```

### Data Locality

- Raw learner data **never leaves** local model
- Only weight deltas (model updates) are shared
- Aggregated updates make individual contributions indistinguishable

## Performance Considerations

### Model Size

- **Main model:** ~2MB (depending on architecture)
- **Learner model (cloned):** ~2MB each
- **Weight deltas:** ~100KB per learner
- **Total for 100 learners:** ~200MB + overhead

### Training Time

- **Main model initial training:** 2-4 hours (100 epochs, 10K samples)
- **Learner model cloning:** <1 second
- **Local training per session:** 1-2 minutes (5 epochs, 100 samples)
- **Federated aggregation:** 5-10 minutes (100 learners)

### Recommended Schedule

- **Local training:** After each learning session (5-10 minutes of activity)
- **Federated aggregation:** Weekly (Sunday night)
- **Main model retraining:** Quarterly (on fresh curriculum data)

## Migration from Fine-Tuning

### For Existing Learners

1. **Keep existing fine-tuned models** as fallback
2. **Train main model** on general curriculum
3. **Enable federated learning** with environment variable
4. **New learners** get cloned models automatically
5. **Gradually migrate** existing learners:
   ```typescript
   // Script: migrate-learner-to-federated.ts
   const cloner = new AIVOModelCloner();
   for (const learner of existingLearners) {
     await cloner.cloneModel(learner.profile);
   }
   ```

### Coexistence

Both approaches can coexist:
- `USE_FEDERATED_LEARNING=true`: New learners use cloning
- Existing learners continue with fine-tuned models
- Gradually retire fine-tuned models as learners re-onboard

## Next Steps

1. ✅ Train initial main AIVO model on curriculum data
2. ✅ Enable federated learning in environment
3. ✅ Test model cloning with sample learner
4. ✅ Run local training simulation
5. ✅ Execute federated aggregation with multiple learners
6. ☐ Set up cron job for weekly aggregation
7. ☐ Monitor performance metrics
8. ☐ Tune privacy parameters based on epsilon budget

## Resources

- **TensorFlow Federated:** https://www.tensorflow.org/federated
- **FedAvg Paper:** McMahan et al., "Communication-Efficient Learning of Deep Networks from Decentralized Data"
- **Differential Privacy:** Dwork & Roth, "The Algorithmic Foundations of Differential Privacy"
- **FedProx:** Li et al., "Federated Optimization in Heterogeneous Networks"

## Support

For questions or issues:
- File an issue in the repository
- Contact the ML team
- Review test files in `packages/agents/src/__tests__/`
