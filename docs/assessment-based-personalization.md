# Assessment-Based Model Personalization

This document describes how AIVO uses baseline assessment data to create truly personalized learning models for each learner.

## Vision & Flow

```
Parent/Teacher Enrolls Child
         ↓
   Add Child Information
         ↓
   [REDIRECT TO BASELINE ASSESSMENT]
         ↓
   Assessment Evaluates Learning Level
   (Per Subject/Domain)
         ↓
   Results Processed into Training Data
         ↓
   Main Model Cloned & Personalized
   (Using Assessment Results)
         ↓
   Recommended Starting Levels Set
         ↓
   Personalized Model ACTIVE
         ↓
   Child Learns (Game Theory Approach)
         ↓
   Model Monitors Performance
         ↓
   Adaptive Level Adjustments Recommended
   (Requires Parent/Teacher Approval)
```

## Components

### 1. Baseline Assessment Flow

When a child is enrolled, they're immediately redirected to the baseline assessment:

**Location:** `apps/learner-web/app/baseline/page.tsx`

**Purpose:**
- Evaluate learner's current knowledge across all domains
- Test multiple modalities (visual, auditory, kinesthetic)
- Measure confidence and engagement
- Collect speech samples (if applicable)

**Data Collected:**
```typescript
{
  sessionId: string;
  learnerId: string;
  domainResults: [
    {
      domain: "MATH" | "LITERACY" | "SCIENCE" | ...
      component: "counting" | "reading" | "observation" | ...
      modality: "visual" | "auditory" | "kinesthetic"
      score: 0-1 // Performance score
      confidence: 0-1 // Confidence level
      responses: any // Raw response data
    }
  ];
  speechSamples: [...];
  completedAt: Date;
}
```

### 2. Assessment Data Processor

**File:** `packages/agents/src/ml/AssessmentDataProcessor.ts`

**Purpose:** Converts baseline assessment results into training data for model personalization

**Key Methods:**

```typescript
// Process assessment into training data
const trainingData = await processor.processAssessment(assessmentData);

// Get recommended starting levels
const levels = processor.getRecommendedLevels(trainingData.metadata);
// Returns:
// {
//   MATH: { level: 3, label: "Grade 3 / Intermediate", confidence: 0.85 },
//   LITERACY: { level: 4, label: "Grade 4 / Proficient", confidence: 0.78 },
//   ...
// }
```

**Training Data Generated:**
- **Features:** 256-dimensional vectors encoding domain, component, modality, performance
- **Labels:** Multi-head (content preferences, difficulty levels, learning paths)
- **Metadata:** Recommended levels, confidence, domain breakdown

### 3. Enhanced Model Cloner

**File:** `apps/web/lib/ai/model-cloner.ts`

**Enhanced `cloneWithWeights()` method:**

```typescript
async cloneWithWeights(profile: LearnerProfile) {
  // Step 1: Fetch baseline assessment
  const assessment = await this.fetchBaselineAssessment(learnerId);
  
  // Step 2: Clone weights from main model
  const clone = await this.modelCloner.cloneModel({
    mainModelPath: './models/main-aivo',
    learnerModelPath: './models/learners/[id]',
    freezeLayers: ['shared_dense_1', 'shared_bn_1', ...] // Keep shared features
  });
  
  // Step 3: Personalize with assessment data
  const result = await this.personalizeWithAssessment(
    learnerModelPath,
    assessment,
    learnerId
  );
  
  // Step 4: Store with recommended levels
  await prisma.personalizedModel.create({
    ...
    configuration: {
      ...profile,
      recommendedLevels: result.recommendedLevels
    },
    metadata: {
      personalized: true,
      assessmentBased: true,
      recommendedLevels: result.recommendedLevels,
      ...
    }
  });
}
```

**Key Features:**
1. **Fetches completed baseline assessment** for learner
2. **Clones generic main model** (frozen early layers)
3. **Performs initial personalization training** using assessment data
4. **Saves pre-personalized model** with recommended starting levels
5. **Sets model status to ACTIVE** immediately (ready to use)

### 4. Personalization Training

**Method:** `personalizeWithAssessment()`

**Process:**
```typescript
// Convert assessment to training samples
const trainingData = await processor.processAssessment(assessment);
// Generates 15-100 samples depending on assessment completeness

// Load cloned model
const model = await modelCloner.loadClonedModel(learnerModelPath);

// Perform quick personalization training
await federatedLearning.trainLocalModel(model, trainingData, {
  learnerId,
  epochs: 5, // Quick personalization, not full training
  batchSize: 16,
  learningRate: 0.01 // Higher rate for faster adaptation
});

// Save personalized model
await model.save(`file://${learnerModelPath}`);
```

**Result:**
- Model weights adjusted based on learner's demonstrated abilities
- Strengths reinforced, weaknesses identified
- Ready to provide personalized recommendations from session 1

### 5. Adaptive Level Adjustment

**File:** `packages/agents/src/ml/AdaptiveLevelAdjustment.ts`

**Purpose:** Monitors performance and recommends level changes (game theory approach)

**Thresholds:**
```typescript
LEVEL_UP_SUCCESS_THRESHOLD = 0.85 // 85% success rate
LEVEL_UP_MIN_SESSIONS = 5 // Minimum sessions before level up

LEVEL_DOWN_STRUGGLE_THRESHOLD = 0.50 // Below 50% success
LEVEL_DOWN_MIN_SESSIONS = 3 // Faster intervention for struggles
```

**Usage:**
```typescript
const engine = new AdaptiveLevelAdjustmentEngine(prisma);

// Analyze learner performance
const recommendations = await engine.analyzeAndRecommend(learnerId);

// Returns recommendations like:
// [{
//   domain: "MATH",
//   currentLevel: 3,
//   recommendedLevel: 4,
//   adjustment: +1,
//   confidence: 0.92,
//   reason: "Consistent success (87%) with 5 consecutive wins. Ready for more challenge!",
//   urgency: "soon",
//   requiresApproval: true
// }]
```

**Recommendation Triggers:**

**Level Up:**
- Success rate ≥ 85%
- 3+ consecutive successes
- 5+ sessions at current level
- Engagement not low

**Level Down:**
- Success rate ≤ 50%
- 2+ consecutive struggles
- 3+ sessions (faster intervention)
- OR low engagement with low success

**Notification to Parents/Teachers:**
```
🎯 Level Adjustment Recommendations for Learner ABC

⬆️ LEVEL UP MATH
  Current Level: 3
  Recommended: 4
  Confidence: 92%
  Reason: Consistent success (87%) with 5 consecutive wins.
          Ready for more challenge!
  Urgency: soon
  
  Evidence:
    - Success Rate: 87%
    - Trend: improving
    - Engagement: high

⚠️ These recommendations require parent/teacher approval.
```

### 6. Approval & Application

**Apply Level Adjustment:**
```typescript
await engine.applyLevelAdjustment(
  learnerId,
  domain: "MATH",
  newLevel: 4,
  approvedBy: "parent-xyz"
);
```

**Effects:**
- Updates learner's `PersonalizedModel.configuration.domainLevels`
- Logs adjustment in history
- PersonalizedLearningAgent reloads configuration
- Next session uses new level

## Complete Enrollment to Learning Flow

### Phase 1: Enrollment & Assessment

```typescript
// 1. Parent enrolls child
POST /api/learners
{
  name: "Emma",
  gradeLevel: 3,
  dateOfBirth: "2018-05-15",
  diagnoses: [],
  ...
}

// 2. System creates learner record
const learner = await prisma.learner.create({...});

// 3. Redirect to baseline assessment
redirect('/baseline?learnerId=' + learner.id);

// 4. Learner completes assessment
// Tests across MATH, LITERACY, SCIENCE, etc.
// Records scores, confidence, modalities

// 5. Assessment marked complete
await prisma.baselineAssessmentSession.update({
  where: { id: sessionId },
  data: { 
    status: "COMPLETED",
    completedAt: new Date()
  }
});
```

### Phase 2: Model Creation & Personalization

```typescript
// 6. Trigger model cloning
const cloner = new AIVOModelCloner();
await cloner.cloneModel({
  learnerId: learner.id,
  gradeLevel: 3,
  actualLevel: 3,
  domainLevels: {},
  learningStyle: "VISUAL",
  ...
});

// Inside cloner:
// a) Fetch baseline assessment
const assessment = await fetchBaselineAssessment(learnerId);

// b) Clone main model
const clone = await modelCloner.cloneModel({...});

// c) Process assessment data
const trainingData = await assessmentProcessor.processAssessment(assessment);

// d) Personalize model
await federatedLearning.trainLocalModel(model, trainingData, {
  epochs: 5,
  batchSize: 16
});

// e) Get recommended levels
const recommendedLevels = assessmentProcessor.getRecommendedLevels(
  trainingData.metadata
);
// Result: { MATH: 3, LITERACY: 4, SCIENCE: 3, ... }

// f) Save personalized model
await prisma.personalizedModel.create({
  learnerId,
  status: "ACTIVE",
  configuration: {
    ...profile,
    recommendedLevels
  },
  metadata: {
    personalized: true,
    assessmentBased: true,
    clonedModelPath: './models/learners/emma-123',
    recommendedLevels: {
      MATH: { level: 3, label: "Grade 3 / Intermediate", confidence: 0.85 },
      LITERACY: { level: 4, label: "Grade 4 / Proficient", confidence: 0.90 },
      ...
    }
  }
});
```

### Phase 3: Learning Sessions

```typescript
// 7. First learning session
const agent = new PersonalizedLearningAgent(learnerId);
await agent.initialize();
// Loads personalized model from ./models/learners/emma-123
// Already knows Emma's strengths/weaknesses from assessment

// 8. Model provides personalized recommendations
const recommendation = await agent.recommendNext({
  domain: "MATH",
  previousPerformance: 0.85,
  ...
});
// Uses recommended starting level (3) from assessment
// Adjusted weights favor Emma's learning style

// 9. Track performance
await agent.recordSession({
  domain: "MATH",
  score: 0.87,
  timeSpent: 420,
  engagement: 0.92
});
```

### Phase 4: Adaptive Adjustment

```typescript
// 10. After 5-10 sessions, analyze performance
const adjuster = new AdaptiveLevelAdjustmentEngine(prisma);
const recommendations = await adjuster.analyzeAndRecommend(learnerId);

// 11. System detects Emma is ready for MATH level 4
// [{
//   domain: "MATH",
//   currentLevel: 3,
//   recommendedLevel: 4,
//   confidence: 0.92,
//   reason: "Consistent success (87%) with 5 consecutive wins..."
// }]

// 12. Notify parent/teacher
await sendNotification(parent.id, {
  type: "LEVEL_ADJUSTMENT",
  learner: "Emma",
  recommendations
});

// 13. Parent approves
await adjuster.applyLevelAdjustment(
  learnerId: emma.id,
  domain: "MATH",
  newLevel: 4,
  approvedBy: parent.id
);

// 14. Next session uses level 4 for MATH
// Model continues to adapt and improve
```

## Key Benefits

### 1. **True Personalization from Day 1**
- Model pre-trained on learner's actual abilities
- No "cold start" problem
- Recommendations match learner's demonstrated level

### 2. **Data-Driven Starting Points**
- Assessment results determine initial levels
- Confidence scores guide recommendation strength
- Multiple modalities ensure accurate evaluation

### 3. **Game Theory Adaptation**
- Maintains optimal challenge level (85% success)
- Quick intervention on struggles (50% threshold)
- Engagement monitoring prevents boredom/frustration

### 4. **Parent/Teacher Oversight**
- All level changes require approval
- Clear evidence provided (success rate, trend, engagement)
- Urgency levels guide priority (immediate, soon, when_convenient)

### 5. **Continuous Improvement**
- Model learns from every session
- Federated learning shares insights across learners
- Privacy-preserved (data stays local)

## Configuration

### Environment Variables

```env
# Enable assessment-based personalization
USE_FEDERATED_LEARNING=true
AIVO_MAIN_MODEL_PATH=./models/main-aivo

# Personalization training settings
PERSONALIZATION_EPOCHS=5
PERSONALIZATION_BATCH_SIZE=16
PERSONALIZATION_LEARNING_RATE=0.01

# Differential privacy (optional)
ENABLE_DIFFERENTIAL_PRIVACY=true
NOISE_MULTIPLIER=0.1
CLIP_NORM=1.0
```

### Level Adjustment Thresholds

Can be customized in `AdaptiveLevelAdjustmentEngine`:

```typescript
LEVEL_UP_SUCCESS_THRESHOLD = 0.85 // Adjust for easier/harder level ups
LEVEL_DOWN_STRUGGLE_THRESHOLD = 0.50 // Adjust for faster/slower intervention
LEVEL_UP_MIN_SESSIONS = 5 // More/fewer sessions before allowing level up
```

## Monitoring

### Check Personalization Status

```typescript
// Check if model was personalized with assessment
const model = await prisma.personalizedModel.findUnique({
  where: { learnerId }
});

console.log(model.metadata.personalized); // true
console.log(model.metadata.assessmentBased); // true
console.log(model.metadata.recommendedLevels); 
// { MATH: { level: 3, label: "...", confidence: 0.85 }, ... }
```

### View Performance & Recommendations

```typescript
const adjuster = new AdaptiveLevelAdjustmentEngine(prisma);
const recommendations = await adjuster.analyzeAndRecommend(learnerId);

for (const rec of recommendations) {
  console.log(`${rec.domain}: ${rec.currentLevel} → ${rec.recommendedLevel}`);
  console.log(`  Reason: ${rec.reason}`);
  console.log(`  Confidence: ${(rec.confidence * 100).toFixed(0)}%`);
}
```

## Testing

### Test Assessment-Based Cloning

```typescript
// 1. Create test learner
const learner = await prisma.learner.create({
  name: "Test Learner",
  gradeLevel: 3
});

// 2. Create baseline assessment with results
const assessment = await prisma.baselineAssessmentSession.create({
  learnerId: learner.id,
  status: "COMPLETED",
  completedAt: new Date(),
  domainResults: {
    create: [
      {
        domain: "MATH",
        component: "counting",
        modality: "visual",
        score: 0.85,
        confidence: 0.90
      },
      {
        domain: "LITERACY",
        component: "reading",
        modality: "visual",
        score: 0.92,
        confidence: 0.88
      }
    ]
  }
});

// 3. Clone and personalize
const cloner = new AIVOModelCloner();
const modelId = await cloner.cloneModel({
  learnerId: learner.id,
  ...profile
});

// 4. Verify personalization
const model = await prisma.personalizedModel.findUnique({
  where: { id: modelId }
});

expect(model.metadata.personalized).toBe(true);
expect(model.metadata.assessmentBased).toBe(true);
expect(model.metadata.recommendedLevels.MATH).toBeDefined();
expect(model.metadata.recommendedLevels.LITERACY).toBeDefined();
```

## Future Enhancements

1. **Real-time Level Suggestions**: Auto-suggest during sessions (not just scheduled)
2. **Parent Dashboard**: Visual progress tracking and approval interface
3. **Email/SMS Notifications**: For urgent level adjustments
4. **Multi-Subject Optimization**: Balance difficulty across all subjects
5. **Peer Comparison**: Anonymous benchmarking (privacy-preserved)
6. **Learning Style Refinement**: Continuous modality preference learning
7. **Speech Integration**: Use speech samples for pronunciation-based personalization

## Summary

The assessment-based personalization system ensures that every learner starts with a model that already "knows" them. By combining:
- **Baseline assessment data** (what they know now)
- **Neural network weight cloning** (personalized starting point)
- **Initial personalization training** (optimize for their patterns)
- **Adaptive level adjustment** (continuous optimization)
- **Parent/teacher oversight** (guided progression)

AIVO provides a truly personalized, adaptive learning experience that grows with each learner while maintaining privacy and parental control.
