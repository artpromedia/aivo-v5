# Agentic AI Brain System

## Overview

The Agentic AI Brain is AIVO v5's autonomous learning management system. It provides intelligent, explainable decision-making for personalized learning experiences, with special optimizations for neurodivergent learners.

## Core Philosophy

### Explainable AI

Every decision made by the Brain comes with a complete reasoning trace. Parents can ask "Why did AIVO do that?" and get a clear, understandable explanation.

### Parent Control

While the Brain can operate autonomously, parents always have control. They can:

- Approve/reject high-impact decisions
- Set autonomy levels (minimal to full autonomy)
- Configure intervention policies
- View all decisions and reasoning

### Learner-Centric

The Brain adapts to each learner's:

- Cognitive state (engagement, frustration, fatigue)
- Learning patterns (best times, preferred formats)
- Neurodiversity profile (sensory sensitivities, preferences)
- Goals and interests

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              AIVO Platform                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│    ┌────────────────────────────────────────────────────────────────┐   │
│    │                    Agentic Brain Service                        │   │
│    │  ┌─────────────────────────────────────────────────────────────┐│   │
│    │  │                    Session Management                        ││   │
│    │  │  • Start/End Sessions                                        ││   │
│    │  │  • Process Interactions                                      ││   │
│    │  │  • Track Cognitive State                                     ││   │
│    │  └─────────────────────────────────────────────────────────────┘│   │
│    │                                                                  │   │
│    │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │   │
│    │  │ Reasoning  │ │   Brain    │ │ Proactive  │ │   Goal     │   │   │
│    │  │  Engine    │ │  Memory    │ │   Agent    │ │  Planner   │   │   │
│    │  │  (ReAct)   │ │            │ │            │ │            │   │   │
│    │  └──────┬─────┘ └──────┬─────┘ └──────┬─────┘ └──────┬─────┘   │   │
│    │         │              │              │              │          │   │
│    │         └──────────────┴──────────────┴──────────────┘          │   │
│    │                              │                                   │   │
│    │                    ┌─────────┴─────────┐                        │   │
│    │                    │   Tool Executor   │                        │   │
│    │                    │                   │                        │   │
│    │                    │ • assess_understanding                     │   │
│    │                    │ • adjust_difficulty                        │   │
│    │                    │ • generate_content                         │   │
│    │                    │ • query_memory                             │   │
│    │                    │ • set_goal                                 │   │
│    │                    │ • track_progress                           │   │
│    │                    │ • notify_parent                            │   │
│    │                    │ • request_break                            │   │
│    │                    └───────────────────┘                        │   │
│    └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│    ┌────────────────────────────────────────────────────────────────┐   │
│    │                        Persistence Layer                        │   │
│    │  • BrainMemory          • BrainDecision                        │   │
│    │  • BrainLearningGoal    • BrainReasoningTrace                  │   │
│    │  • BrainActionPlan      • BrainInterventionPolicy              │   │
│    │  • BrainGoalProgress    • BrainAutonomousCycle                 │   │
│    │  • BrainPatternLibrary  • BrainSessionMonitoring               │   │
│    └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. ReasoningEngine (ReAct Pattern)

The ReAct (Reasoning + Acting) pattern provides multi-step reasoning:

```
┌─────────────────────────────────────────────────────────────┐
│                       ReAct Loop                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐                                           │
│   │ Observation │ ← Gather context from environment         │
│   └──────┬──────┘                                           │
│          │                                                   │
│          ▼                                                   │
│   ┌─────────────┐                                           │
│   │   Thought   │ ← Reason about what to do                 │
│   └──────┬──────┘                                           │
│          │                                                   │
│          ▼                                                   │
│   ┌─────────────┐                                           │
│   │   Action    │ ← Execute a tool or make decision         │
│   └──────┬──────┘                                           │
│          │                                                   │
│          ▼                                                   │
│   ┌─────────────┐                                           │
│   │   Result    │ ← Observe action result                   │
│   └──────┬──────┘                                           │
│          │                                                   │
│          ▼                                                   │
│   ┌─────────────┐                                           │
│   │  Complete?  │ ──No──▶ Loop back to Observation          │
│   └──────┬──────┘                                           │
│          │                                                   │
│          │ Yes                                               │
│          ▼                                                   │
│   ┌─────────────┐                                           │
│   │   Answer    │ ← Final decision with explanation         │
│   └─────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. BrainMemory

Four types of memory with decay simulation:

| Memory Type    | Purpose                                   | Decay Rate |
| -------------- | ----------------------------------------- | ---------- |
| **Episodic**   | Specific events (sessions, interactions)  | Fast       |
| **Semantic**   | Learned facts (skill levels, preferences) | Slow       |
| **Procedural** | How-to knowledge (learning strategies)    | Very Slow  |
| **Emotional**  | Emotional associations with topics        | Medium     |

### 3. ProactiveAgent

Monitors cognitive state and triggers interventions:

```
Cognitive State Thresholds:
├─ Frustration > 70% → Suggest easier content or break
├─ Engagement < 30% → Switch topic or format
├─ Fatigue > 80% → Mandatory break suggestion
├─ Cognitive Load > 85% → Reduce complexity
└─ Confidence < 25% → Provide encouragement/hints
```

### 4. GoalPlanner

Hierarchical goal management:

```
Main Goal: Master Fractions
├─ Sub-Goal 1: Understanding Numerators (Level 3)
│   ├─ Milestone: Complete 10 numerator exercises
│   └─ Milestone: Score 80% on numerator quiz
├─ Sub-Goal 2: Understanding Denominators (Level 3)
│   ├─ Milestone: Complete 10 denominator exercises
│   └─ Milestone: Score 80% on denominator quiz
└─ Sub-Goal 3: Adding Fractions (Level 4)
    ├─ Milestone: Complete 15 addition exercises
    └─ Milestone: Score 85% on fraction addition quiz
```

## Cognitive State Model

The Brain tracks a comprehensive cognitive state:

```typescript
interface CognitiveState {
  cognitiveLoad: number; // 0-100: Mental effort required
  engagement: number; // 0-100: Focus and interest level
  frustration: number; // 0-100: Struggle/challenge level
  fatigue: number; // 0-100: Mental tiredness
  confidence: number; // 0-100: Self-belief in abilities
  motivation: number; // 0-100: Drive to continue
  attention: number; // 0-100: Concentration level
  emotionalState: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  timestamp: Date;
}
```

### State Updates

The cognitive state is updated based on:

| Event            | Effect                                    |
| ---------------- | ----------------------------------------- |
| Correct answer   | ↑ Confidence, ↑ Motivation, ↓ Frustration |
| Incorrect answer | ↓ Confidence, ↑ Frustration               |
| Hint request     | ↑ Cognitive Load, ↓ Confidence            |
| Skip             | ↑ Frustration, ↓ Engagement               |
| Time passing     | ↑ Fatigue                                 |
| Achievement      | ↑ Confidence, ↑ Motivation                |

## Autonomy Levels

### MINIMAL

- Every decision requires parent approval
- Brain provides recommendations only
- Best for new users or concerned parents

### GUIDED (Default)

- Routine decisions are automatic
- High-impact decisions need approval:
  - Goal modifications
  - Difficulty changes > 2 levels
  - Topic switches
- Parents notified of all decisions

### PROACTIVE

- Brain acts autonomously
- Parents receive notifications
- Can override any decision after the fact

### AUTONOMOUS

- Full autonomy for the Brain
- Minimal parent involvement
- Weekly summary reports only

## Decision Types

| Type                    | Description           | Default Autonomy Requirement |
| ----------------------- | --------------------- | ---------------------------- |
| `CONTENT_SELECTION`     | Choosing next content | Automatic                    |
| `DIFFICULTY_ADJUSTMENT` | Changing difficulty   | Guided (if > 1 level)        |
| `BREAK_SUGGESTION`      | Suggesting breaks     | Automatic                    |
| `TOPIC_SWITCH`          | Changing subjects     | Guided                       |
| `INTERVENTION`          | Proactive help        | Automatic                    |
| `GOAL_MODIFICATION`     | Changing goals        | Requires Approval            |
| `REWARD_TRIGGER`        | Giving rewards        | Automatic                    |

## Intervention Policies

Parents can configure custom intervention policies:

```json
{
  "name": "Frustration Break",
  "triggers": [
    { "metric": "frustration", "operator": ">", "threshold": 70 },
    { "metric": "consecutiveWrong", "operator": ">", "threshold": 3 }
  ],
  "actions": [
    { "type": "suggest_break", "duration": 5 },
    { "type": "notify_parent", "message": "Child struggling with content" }
  ],
  "cooldownMinutes": 30,
  "maxDailyTriggers": 5
}
```

## API Reference

### Session Endpoints

#### Start Session

```http
POST /api/brain/session/start
Content-Type: application/json

{
  "visitorId": "learner-123",
  "sessionType": "LEARNING",
  "targetGoals": ["goal-1", "goal-2"],
  "timeLimit": 45
}
```

#### Process Interaction

```http
POST /api/brain/session/{sessionId}/interact
Content-Type: application/json

{
  "visitorId": "learner-123",
  "interaction": {
    "type": "ANSWER",
    "contentId": "content-456",
    "response": true,
    "duration": 5000
  }
}
```

### Decision Endpoints

#### Get Decisions

```http
GET /api/brain/decisions/{visitorId}?limit=20
```

#### Explain Decision

```http
GET /api/brain/decisions/{decisionId}/explain?detailLevel=DETAILED
```

Response:

```json
{
  "decision": { ... },
  "explanation": "Decided to reduce difficulty based on...",
  "reasoningTrace": {
    "fullTrace": [...],
    "summary": "Selected easier content with 85% confidence",
    "keyInsights": ["High frustration detected", "3 consecutive wrong answers"]
  },
  "parentFriendlyExplanation": "Your child was feeling challenged, so AIVO provided easier content to rebuild confidence."
}
```

### Parent Dashboard

#### Get Dashboard

```http
GET /api/brain/parent/{visitorId}/dashboard
```

Response:

```json
{
  "currentSession": { ... },
  "recentDecisions": [...],
  "activeGoals": [...],
  "pendingApprovals": [...],
  "weeklyProgress": {
    "totalTime": 180,
    "goalsCompleted": 3,
    "sessionsCount": 12
  },
  "brainInsights": [
    "Learns best in the morning",
    "Prefers visual content",
    "Shows strong interest in science"
  ]
}
```

## Data Models

### BrainDecision

```typescript
{
  id: string;
  visitorId: string;
  decisionType: DecisionType;
  context: DecisionContext;
  options: DecisionOption[];
  selectedOptionId: string;
  reasoningChain: ReasoningStep[];
  confidence: number;
  outcomeExpected: string;
  outcomeActual?: string;
  parentNotified: boolean;
  parentApproved?: boolean;
  autonomyLevelUsed: AutonomyLevel;
  createdAt: Date;
  updatedAt: Date;
}
```

### BrainMemory

```typescript
{
  id: string;
  visitorId: string;
  memoryType: MemoryType;
  content: string;
  importance: number;       // 0-100
  emotionalValence?: number; // -1 to 1
  associatedTopics: string[];
  accessCount: number;
  decayFactor: number;
  createdAt: Date;
  lastAccessed: Date;
}
```

## Integration Guide

### 1. Initialize the Brain

```typescript
import { AgenticBrainService } from '@aivo/agentic-brain';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const brain = new AgenticBrainService(prisma, {
  autonomyLevel: 'GUIDED',
  maxCycleIterations: 5,
  decisionConfidenceThreshold: 70,
});
```

### 2. Start a Session

```typescript
const session = await brain.startSession(
  'learner-123',
  'LEARNING',
  ['goal-math-fractions'],
  45, // 45 minute session
);
```

### 3. Process Interactions

```typescript
const result = await brain.processInteraction('learner-123', session.sessionId, {
  type: 'ANSWER',
  contentId: 'content-789',
  response: true,
  duration: 3500,
});

// Check for interventions
if (result.interventions?.length) {
  // Handle interventions (e.g., show break suggestion)
}

// Get next activity
const nextActivity = result.nextActivity;
```

### 4. End Session

```typescript
const summary = await brain.endSession('learner-123', session.monitoringId, 'COMPLETED');

// summary.parentReport contains a friendly summary for parents
```

## Best Practices

### 1. Respect Cognitive Load

Don't overwhelm learners. If cognitive load > 80%, simplify or take a break.

### 2. Balance Autonomy

Start with GUIDED mode and increase autonomy as trust is built.

### 3. Explain Everything

Always provide reasoning for decisions. Transparency builds trust.

### 4. Monitor Patterns

Use detected patterns to personalize, but avoid over-fitting to short-term behavior.

### 5. Parent Communication

Keep parents informed. They are partners in their child's education.

## Troubleshooting

### Brain Not Making Decisions

- Check if Prisma client is regenerated with Brain models
- Verify autonomy level allows automatic decisions
- Check for pending parent approvals blocking the queue

### High Latency

- Reduce maxCycleIterations for faster decisions
- Use caching for frequently accessed memories
- Consider running reasoning asynchronously

### Missing Memories

- Check memory decay settings
- Ensure memories are being stored with proper importance scores
- Verify visitorId is consistent across sessions

## Future Roadmap

- [ ] Vector embeddings for semantic memory search
- [ ] Federated learning across learners (privacy-preserving)
- [ ] Real-time WebSocket updates
- [ ] Advanced ML models for pattern detection
- [ ] Multi-modal learning style detection
- [ ] Voice-based interaction support
