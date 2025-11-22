# PersonalizedLearningAgent Integration Guide

## Overview

The `PersonalizedLearningAgent` provides real-time, AI-powered learning adaptations for individual learners during their sessions. It leverages machine learning, emotional intelligence, and neurodiversity accommodations to optimize the learning experience.

## Architecture

### Components

1. **PersonalizedLearningAgent** (`@aivo/agents`)
   - Core decision-making agent
   - Extends BaseAgent with episodic memory, Redis coordination
   - Integrates with Prisma for learner profiles
   - Uses GPT-4 for nuanced learning decisions

2. **SessionOrchestrationService** (`services/brain-orchestrator/src/sessionOrchestration.ts`)
   - Manages agent lifecycle per learner
   - Builds LearningContext from session state
   - Translates agent decisions to session adaptations
   - Tracks performance metrics and focus levels

### Data Flow

```
Session Activity
  ↓
SessionState (performance history, focus, struggles)
  ↓
SessionOrchestrationService.buildLearningContext()
  ↓
LearningContext (recentPerformance, sessionDuration, focusLevel)
  ↓
PersonalizedLearningAgent.processInput()
  ↓
  ├─→ analyzeLearningState() → Performance/Engagement/CognitiveLoad/Emotional assessment
  ├─→ makeLearningDecision() → Decision tree + AI fallback
  ├─→ applyAccommodations() → ADHD/Dyslexia/Autism adaptations
  ├─→ generatePersonalizedFeedback() → Encourage/Support messages
  └─→ updateLearningMemory() → Episodic memory integration
  ↓
AdaptationDecision (action, reasoning, confidence, feedback)
  ↓
Session Flow Adjustment (difficulty, breaks, help, activity change)
```

## Usage Example

### 1. Initialize Session Orchestration

```typescript
import { getSessionOrchestrationService } from "./sessionOrchestration";

const orchestration = getSessionOrchestrationService();
```

### 2. Create Session State

```typescript
const sessionState: SessionState = {
	sessionId: "session-123",
	learnerId: "learner-456",
	currentActivity: {
		id: "activity-1",
		type: "practice",
		difficulty: 5,
		contentId: "fractions-intro",
		estimatedMinutes: 10
	},
	startTime: new Date(),
	lastBreakTime: 0,
	focusLevel: 85,
	strugglesDetected: [],
	performanceHistory: []
};
```

### 3. Record Performance After Each Response

```typescript
// After learner answers a question
orchestration.recordPerformance(sessionState, {
	accuracy: 0.8, // 80% correct
	responseTime: 12, // seconds
	hintsUsed: 1,
	attempts: 2
});

// Update focus level based on observations
orchestration.updateFocusLevel(sessionState, 80);
```

### 4. Check for Adaptations Periodically

```typescript
// Every 5-10 questions, check if adaptation needed
const decision = await orchestration.makeAdaptationDecision(sessionState);

console.log(`Action: ${decision.action}`);
console.log(`Reasoning: ${decision.reasoning}`);
console.log(`Confidence: ${decision.confidence}`);
console.log(`Feedback: ${decision.feedback}`);

// Act on decision
switch (decision.action) {
	case "adjust_difficulty":
		const newDifficulty = decision.details.newDifficulty;
		sessionState.currentActivity.difficulty = newDifficulty;
		console.log(`Adjusted difficulty to ${newDifficulty}`);
		break;

	case "take_break":
		const breakType = decision.details.breakType; // "short", "movement", "mindful"
		console.log(`Suggesting ${breakType} break`);
		orchestration.recordBreak(sessionState);
		// Show break screen to learner
		break;

	case "provide_help":
		const helpType = decision.details.helpType; // "hint", "scaffolding", "worked_example"
		console.log(`Providing ${helpType}`);
		// Show appropriate help resource
		break;

	case "change_activity":
		const newActivityId = decision.details.newActivityId;
		console.log(`Switching to activity ${newActivityId}`);
		// Load different activity
		break;

	case "continue":
		console.log("Continue with current activity");
		break;
}

// Display personalized feedback to learner
showFeedbackMessage(decision.feedback);
```

### 5. Generate Session Insights

```typescript
// At end of session or for analytics
const insights = await orchestration.generateSessionInsights("learner-456");

console.log("Session Insights:", insights);
/*
{
  learnerId: "learner-456",
  timestamp: "2025-11-22T...",
  patterns: {
    mostCommonAction: "adjust_difficulty",
    averageConfidence: 0.85,
    difficultyTrend: "increasing",
    breakFrequency: 0.15
  },
  recommendations: [
    "Learner showing mastery, consider advancing curriculum",
    "Maintain current break schedule (10 min intervals)"
  ]
}
*/
```

### 6. Cleanup When Session Ends

```typescript
await orchestration.endSession("learner-456");
```

## Decision Logic

### Performance Levels
- **Struggling**: accuracy < 50%, high hints, intervention needed
- **Developing**: accuracy 50-75%, moderate support
- **Proficient**: accuracy 75-90%, minimal support
- **Mastery**: accuracy > 90%, ready for advancement

### Engagement Levels
- **Low**: < 40 → investigate boredom or frustration
- **Medium**: 40-70 → typical engagement
- **High**: > 70 → optimal engagement

### Cognitive Load
- **Low**: fast responses, no hints → increase difficulty
- **Optimal**: moderate pace, some hints → maintain
- **High**: slow responses, many hints → provide support
- **Overload**: very slow, many errors → reduce difficulty

### Emotional States
- **Frustrated**: consecutive errors → reduce difficulty, encourage
- **Bored**: high accuracy, low engagement → increase difficulty
- **Confident**: high accuracy, high engagement → maintain/advance
- **Anxious**: moderate accuracy, high response time → provide support

## Neurodiversity Accommodations

### ADHD
- Chunked content presentation
- Frequent breaks (every 10 minutes)
- Clear structure and progress indicators
- Movement breaks when focus drops

### Dyslexia
- OpenDyslexic font
- Increased line spacing (1.8)
- Larger text size
- High-contrast color scheme
- Audio support options

### Autism
- Reduced animations
- Calm color palette
- Predictable structure
- Clear expectations
- Sensory break options

## Configuration

### Environment Variables

```bash
# Required for PersonalizedLearningAgent
OPENAI_API_KEY=sk-...
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # optional

# Database
DATABASE_URL=postgresql://...
```

### Agent Configuration

```typescript
const config: AgentConfig = {
	learnerId: "learner-123",
	agentId: "learning-agent-learner-123",
	modelConfig: {
		provider: "openai",
		modelName: "gpt-4-turbo-preview", // For nuanced decisions
		temperature: 0.7, // Balance creativity with consistency
		maxTokens: 1500
	},
	memoryConfig: {
		maxShortTermItems: 20, // Recent decisions
		maxLongTermItems: 100, // Historical patterns
		consolidationThreshold: 5 // Episodes before consolidation
	},
	coordinationConfig: {
		allowInterAgentComm: false, // No inter-agent comm needed
		broadcastEvents: true, // Emit insights for analytics
		coordinationStrategy: "centralized"
	}
};
```

## Testing

### Unit Tests

Tests cover:
- ✅ Learner profile loading
- ✅ Performance assessment (struggling/mastery)
- ✅ Break detection (ADHD-aware intervals)
- ✅ Emotional state inference (frustration/boredom)
- ✅ Accommodation application
- ✅ Personalized feedback generation
- ✅ Memory management

```bash
cd packages/agents
pnpm test PersonalizedLearningAgent
```

### Integration Testing

```typescript
// Example integration test
const orchestration = getSessionOrchestrationService();

// Simulate struggling learner
for (let i = 0; i < 5; i++) {
	orchestration.recordPerformance(sessionState, {
		accuracy: 0.3,
		responseTime: 25,
		hintsUsed: 3,
		attempts: 4
	});
}

const decision = await orchestration.makeAdaptationDecision(sessionState);
expect(decision.action).toBe("adjust_difficulty");
expect(decision.details.newDifficulty).toBeLessThan(sessionState.currentActivity.difficulty);
```

## Performance Considerations

### Agent Lifecycle
- Agents are created per learner and persist for session duration
- Agents maintain state in Redis for coordination
- Shutdown agents when session ends to free resources

### Decision Frequency
- Check every 5-10 questions (not every question)
- More frequent checks for struggling learners
- Less frequent for high-performing learners

### OpenAI API Costs
- Primary decision tree runs locally (no API cost)
- AI fallback used for edge cases (~5-10% of decisions)
- Typical session: 2-3 API calls, ~$0.01-0.03

### Redis Usage
- Agent state: ~10KB per learner
- Memory items: ~1KB per item
- Episodic memory: ~5KB per episode

## Future Enhancements

### ML Model Training
- Collect learner performance data
- Train TensorFlow model for predictions
- Replace GPT-4 fallback with local model
- Reduce API costs and latency

### Advanced Patterns
- Multi-learner cohort analysis
- Curriculum optimization
- Predictive intervention
- Adaptive pacing algorithms

### Dashboard Integration
- Real-time adaptation visualization
- Teacher alerts for interventions
- Progress analytics
- A/B testing framework

## Troubleshooting

### Agent Not Initializing
- Check `OPENAI_API_KEY` is set
- Verify Redis is running
- Check database connection
- Review Prisma schema alignment

### Unexpected Decisions
- Review learner profile (diagnoses, preferences)
- Check performance history data quality
- Verify focus level tracking
- Enable debug logging

### Memory Issues
- Limit agent count (1 per active learner)
- Shutdown agents after session
- Monitor Redis memory usage
- Adjust memoryConfig thresholds

## Support

For questions or issues:
- Check logs: `@aivo/observability` integration
- Review agent state: `agent.getAgentState()`
- Generate insights: `agent.generateInsight()`
- Consult agent framework docs: `packages/agents/README.md`
