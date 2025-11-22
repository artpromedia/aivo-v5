# ML Infrastructure Scripts

This directory contains the complete machine learning infrastructure for the Personalized Learning Agent.

## Components

### 1. TrainingDataCollector.ts
Collects training data from live learner sessions.

**Usage:**
```typescript
import { getTrainingDataCollector } from './ml/TrainingDataCollector';

const collector = getTrainingDataCollector();

// Record decision
const dataPointId = collector.recordDecision(learnerId, context, decision);

// Record outcome after session
collector.recordOutcome(dataPointId, {
  nextAccuracy: 0.85,
  nextEngagement: 0.75,
  sessionCompleted: true,
  totalSessionTime: 1200000
});

// Export for training
const trainingData = await collector.exportTrainingData({
  startDate: new Date('2024-01-01'),
  minDataPoints: 100
});
```

### 2. ModelTrainer.ts
Neural network trainer for learning decision predictions.

**Architecture:**
- Input: 18 features (performance, session context, learner profile)
- Hidden layers: [64, 32, 16] with ReLU activation and dropout
- Output: 5 actions (continue, adjust_difficulty, take_break, provide_help, change_activity)
- Loss: Categorical cross-entropy
- Optimizer: Adam

**Usage:**
```typescript
import { ModelTrainer } from './ml/ModelTrainer';

const trainer = new ModelTrainer({
  epochs: 50,
  batchSize: 32,
  learningRate: 0.001
});

const result = await trainer.train(trainingData);
await trainer.saveModel(result.model, './models/personalized-learning');
```

### 3. ModelEvaluator.ts
Evaluates model performance against GPT-4 decisions.

**Metrics:**
- Accuracy, Precision, Recall, F1 Score per action
- Confusion matrix
- Confidence calibration
- Outcome metrics (accuracy/engagement by action)

**Usage:**
```typescript
import { ModelEvaluator } from './ml/ModelEvaluator';

const evaluator = new ModelEvaluator(prisma);
const metrics = await evaluator.evaluateModel(model, testData);
const report = evaluator.generateReport(metrics);
console.log(report);
```

### 4. ModelMonitor.ts
Real-time production monitoring.

**Features:**
- Decision logging (ML vs GPT-4)
- Outcome tracking
- Alert system (low accuracy, high latency, etc.)
- Metrics dashboard

**Usage:**
```typescript
import { getModelMonitor } from './ml/ModelMonitor';

const monitor = getModelMonitor(prisma);

// Log decision
const logId = monitor.logDecision(learnerId, 'ml', decision, context, latencyMs);

// Record outcome
monitor.recordOutcome(logId, {
  nextAccuracy: 0.85,
  nextEngagement: 0.75,
  wasSuccessful: true
});

// Get metrics
const metrics = monitor.getMetrics();
console.log(monitor.generateReport());
```

### 5. ABTestFramework.ts
A/B testing framework for comparing ML vs GPT-4.

**Features:**
- Random assignment to treatment groups (ML, GPT-4, Hybrid)
- Statistical significance testing (t-test)
- Outcome tracking
- Winner determination

**Usage:**
```typescript
import { getABTestFramework } from './ml/ABTestFramework';

const abTest = getABTestFramework(prisma);

// Start test
abTest.startTest({
  name: 'ML vs GPT-4 v1.0',
  description: 'Compare ML model v1.0 against GPT-4',
  startDate: new Date(),
  groups: { ml: 40, gpt4: 40, hybrid: 20 },
  minSampleSize: 100,
  successMetrics: ['accuracy', 'engagement', 'success']
});

// Assign learners
const group = abTest.assignLearner(learnerId);

// Record decisions and outcomes
abTest.recordDecision(learnerId, decision, context);
abTest.recordOutcome(learnerId, outcome);

// Stop test and get results
const result = abTest.stopTest();
console.log(abTest.generateReport(result));
```

## Scripts

### train.ts
Train new model from scratch.

```bash
pnpm tsx src/ml/train.ts
```

**Output:**
- Trained model in `models/personalized-learning/`
- Training metrics and history
- Metadata (feature stats, action mapping)

### evaluate.ts
Evaluate trained model.

```bash
pnpm tsx src/ml/evaluate.ts
```

**Output:**
- Evaluation report with metrics
- Confidence calibration analysis
- Recommendations for deployment

### retrain.ts
Automated retraining pipeline.

```bash
pnpm tsx src/ml/retrain.ts
```

**Process:**
1. Export latest training data (last 90 days)
2. Train new model
3. Evaluate against test set
4. Compare with current model
5. Auto-deploy if improvement > 5%
6. Backup old model
7. Generate deployment report

**Schedule:** Run weekly via cron job
```cron
0 2 * * 0 cd /path/to/project && pnpm tsx packages/agents/src/ml/retrain.ts
```

## Integration with PersonalizedLearningAgent

The agent automatically loads the trained model on initialization:

```typescript
// In PersonalizedLearningAgent constructor
private async loadMLModel(): Promise<void> {
  const modelPath = path.join(process.cwd(), 'models', 'personalized-learning');
  this.mlModel = await this.modelTrainer.loadModel(modelPath);
  this.useMLModel = true;
}

// In makeLearningDecision
if (this.useMLModel && this.mlModel) {
  const mlDecision = await this.predictWithMLModel(context);
  
  if (mlDecision.confidence >= this.mlConfidenceThreshold) {
    return mlDecision; // Use ML prediction
  }
}

// Fallback to GPT-4
return await this.getAIDecision(analysis, context);
```

## Data Flow

```
Learner Session
      ↓
TrainingDataCollector.recordDecision()
      ↓
(Decision made by ML or GPT-4)
      ↓
TrainingDataCollector.recordOutcome()
      ↓
Database (MLTrainingData table)
      ↓
(Weekly) retrain.ts
      ↓
ModelTrainer.train()
      ↓
ModelEvaluator.evaluate()
      ↓
(If improvement > 5%) Auto-deploy
      ↓
PersonalizedLearningAgent uses new model
```

## Monitoring Dashboard

To view real-time metrics:

```typescript
import { getModelMonitor } from './ml/ModelMonitor';

const monitor = getModelMonitor(prisma);

// Set up event listeners
monitor.on('decision', (log) => {
  console.log('Decision made:', log);
});

monitor.on('alert', (alert) => {
  console.error('Alert:', alert);
});

// Generate report every hour
setInterval(() => {
  console.log(monitor.generateReport());
}, 60 * 60 * 1000);
```

## Database Schema

The following tables are used:

```prisma
model MLTrainingData {
  id        String   @id @default(cuid())
  learnerId String
  timestamp DateTime @default(now())
  features  Json     // 18 input features
  labels    Json     // action, difficulty adjustment, confidence
  outcome   Json?    // nextAccuracy, nextEngagement, sessionCompleted
  createdAt DateTime @default(now())

  @@index([learnerId])
  @@index([timestamp])
}

model MLEvaluationResults {
  id            String   @id @default(cuid())
  modelVersion  String
  accuracy      Float
  metrics       Json     // Full evaluation metrics
  createdAt     DateTime @default(now())
}

model MLMonitoringMetrics {
  id        String   @id @default(cuid())
  timestamp DateTime
  metrics   Json     // Real-time monitoring metrics
  createdAt DateTime @default(now())
}

model MLABTestResults {
  id        String   @id @default(cuid())
  testName  String
  duration  Float
  results   Json     // A/B test results
  createdAt DateTime @default(now())
}
```

## Performance Targets

- **Model Accuracy:** > 85% on test set
- **Confidence Calibration:** < 10% average error
- **Inference Latency:** < 100ms (ML model)
- **ML Usage Rate:** > 70% of decisions
- **Outcome Accuracy:** > 80% after ML decisions
- **Outcome Engagement:** > 75% after ML decisions

## Troubleshooting

### Model not loading
- Check if `models/personalized-learning/model.json` exists
- Verify TensorFlow.js is installed: `pnpm add @tensorflow/tfjs-node`
- Check console for error messages

### Low accuracy
- Collect more training data (target: 1000+ points)
- Increase model complexity (more layers/units)
- Tune hyperparameters (learning rate, batch size)
- Check for data quality issues

### Poor confidence calibration
- Use temperature scaling on output probabilities
- Collect more diverse training examples
- Adjust confidence threshold

### High latency
- Ensure using `@tensorflow/tfjs-node` (not browser version)
- Use GPU acceleration if available
- Profile model inference with `tf.profile()`

## Next Steps

1. **Implement continuous learning:** Update model incrementally with new data
2. **Add explainability:** Use SHAP/LIME for decision explanations
3. **Multi-model ensemble:** Combine multiple models for better predictions
4. **Transfer learning:** Pre-train on similar educational datasets
5. **Personalized models:** Train separate models per learner cohort
