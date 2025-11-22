# Assessment-Based Personalization - Quick Reference

## The Vision in Action

**When a child is enrolled:**
1. Parent/teacher adds child info
2. **Immediately redirected to baseline assessment**
3. Assessment evaluates learning level per subject
4. System creates **personalized model** based on assessment
5. **Recommended starting levels** set automatically
6. Child begins learning with model that **already knows them**
7. As child learns, model **monitors performance**
8. System **recommends level adjustments** to parent/teacher
9. Parent/teacher approves → **levels adjust** → child continues learning

## Key Components Created

### 1. AssessmentDataProcessor (`packages/agents/src/ml/AssessmentDataProcessor.ts`)
**Purpose:** Converts assessment results into training data

```typescript
import { AssessmentDataProcessor } from "@aivo/agents";

const processor = new AssessmentDataProcessor();
const trainingData = await processor.processAssessment(assessmentData);
const levels = processor.getRecommendedLevels(trainingData.metadata);
// Returns: { MATH: { level: 3, label: "Grade 3 / Intermediate", confidence: 0.85 } }
```

### 2. Enhanced AIVOModelCloner (`apps/web/lib/ai/model-cloner.ts`)
**Now includes:**
- `fetchBaselineAssessment()` - Gets completed assessment
- `personalizeWithAssessment()` - Trains model on assessment data  
- Stores `recommendedLevels` in model metadata

```typescript
// Automatically happens when cloning
const cloner = new AIVOModelCloner();
await cloner.cloneModel(learnerProfile);
// Result: Personalized model ready with recommended levels
```

### 3. AdaptiveLevelAdjustmentEngine (`packages/agents/src/ml/AdaptiveLevelAdjustment.ts`)
**Purpose:** Game theory adaptive difficulty

```typescript
import { AdaptiveLevelAdjustmentEngine } from "@aivo/agents";

const engine = new AdaptiveLevelAdjustmentEngine(prisma);

// Analyze performance and get recommendations
const recommendations = await engine.analyzeAndRecommend(learnerId);

// Apply approved adjustment
await engine.applyLevelAdjustment(learnerId, "MATH", 4, "parent-id");
```

## How It Works

### Baseline Assessment → Personalized Model

```typescript
// 1. Learner completes baseline assessment
const assessment = {
  learnerId: "emma-123",
  domainResults: [
    { domain: "MATH", score: 0.85, confidence: 0.90 },
    { domain: "LITERACY", score: 0.92, confidence: 0.88 }
  ]
};

// 2. System clones and personalizes model
await cloner.cloneModel(profile);

// Internally:
// - Fetches assessment
// - Clones main model weights
// - Processes assessment into training data (15-100 samples)
// - Performs 5 epochs of personalization training
// - Calculates recommended levels
// - Saves personalized model with levels

// 3. Model ready with starting levels
const model = await prisma.personalizedModel.findUnique({
  where: { learnerId: "emma-123" }
});

console.log(model.metadata.recommendedLevels);
// {
//   MATH: { level: 3, label: "Grade 3 / Intermediate", confidence: 0.85 },
//   LITERACY: { level: 4, label: "Grade 4 / Proficient", confidence: 0.92 }
// }
```

### Adaptive Level Adjustment

**Level Up Trigger:**
- Success rate ≥ 85%
- 3+ consecutive successes
- 5+ sessions at current level

**Level Down Trigger:**
- Success rate ≤ 50%
- 2+ consecutive struggles
- 3+ sessions (faster intervention)

**Recommendation Example:**
```
⬆️ LEVEL UP MATH
  Current: 3 → Recommended: 4
  Confidence: 92%
  Reason: Consistent success (87%) with 5 consecutive wins. Ready for more challenge!
  Urgency: soon
  
  Evidence:
    - Success Rate: 87%
    - Trend: improving
    - Engagement: high
```

## Usage Examples

### After Enrollment

```typescript
// Parent enrolls child
POST /api/learners { name: "Emma", gradeLevel: 3, ... }

// System redirects to baseline
redirect('/baseline?learnerId=emma-123');

// Emma completes assessment
// System automatically creates personalized model
```

### Check Recommended Levels

```typescript
const model = await prisma.personalizedModel.findUnique({
  where: { learnerId: "emma-123" }
});

const config = model.configuration as any;
console.log(config.recommendedLevels);
// Levels determined by baseline assessment
```

### Monitor & Adjust

```typescript
// After several sessions, check for adjustments
const adjuster = new AdaptiveLevelAdjustmentEngine(prisma);
const recs = await adjuster.analyzeAndRecommend("emma-123");

if (recs.length > 0) {
  // Notify parent/teacher
  await sendNotification(parentId, {
    type: "LEVEL_ADJUSTMENT",
    recommendations: recs
  });
}

// Parent approves
await adjuster.applyLevelAdjustment(
  "emma-123",
  "MATH",
  4, // new level
  "parent-abc"
);
```

## Configuration

```env
# Enable assessment-based personalization
USE_FEDERATED_LEARNING=true
AIVO_MAIN_MODEL_PATH=./models/main-aivo

# Personalization settings
PERSONALIZATION_EPOCHS=5
PERSONALIZATION_BATCH_SIZE=16
PERSONALIZATION_LEARNING_RATE=0.01
```

## Database Schema

### PersonalizedModel Enhanced

```prisma
model PersonalizedModel {
  // ... existing fields ...
  configuration Json // Now includes recommendedLevels
  metadata Json? // Includes:
  // {
  //   personalized: true,
  //   assessmentBased: true,
  //   recommendedLevels: { MATH: {...}, LITERACY: {...} },
  //   clonedModelPath: "./models/learners/emma-123",
  //   ...
  // }
}
```

### BaselineAssessmentSession

```prisma
model BaselineAssessmentSession {
  id String @id
  learnerId String
  status BaselineAssessmentStatus // IN_PROGRESS, COMPLETED, ABANDONED
  completedAt DateTime?
  domainResults BaselineDomainResult[]
  speechSamples SpeechAssessmentSample[]
}

model BaselineDomainResult {
  id String @id
  sessionId String
  domain BaselineDomain // MATH, LITERACY, SCIENCE, etc.
  component String // counting, reading, etc.
  modality String // visual, auditory, kinesthetic
  score Float? // 0-1
  confidence Float? // 0-1
  responses Json?
}
```

## Benefits

### ✅ True Personalization from Day 1
Model pre-trained on learner's actual abilities from assessment

### ✅ Data-Driven Starting Points
No guessing - levels based on demonstrated performance

### ✅ Game Theory Adaptation
Maintains optimal challenge (85% success rate)

### ✅ Parent/Teacher Oversight
All level changes require approval with clear evidence

### ✅ Continuous Improvement
Model learns from every session, gets better over time

## Testing

```bash
# 1. Create test learner with assessment
tsx scripts/test-assessment-personalization.ts

# 2. Verify personalization
tsx scripts/verify-recommended-levels.ts

# 3. Test level adjustment
tsx scripts/test-level-adjustment.ts
```

## Documentation

- **Complete Guide:** `docs/assessment-based-personalization.md`
- **Technical Docs:** `docs/federated-learning-implementation.md`
- **Activation:** `docs/federated-learning-activation.md`

## Summary

The system now implements your complete vision:
1. **Enrollment** → Immediate baseline assessment
2. **Assessment** → Personalized model creation
3. **Recommended levels** → Set automatically per subject
4. **Game theory learning** → Optimal challenge maintained
5. **Performance monitoring** → Continuous adaptation
6. **Parent/teacher approval** → Guided level adjustments

Every learner gets a model that already knows them from day 1! 🎯
