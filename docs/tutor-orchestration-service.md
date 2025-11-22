# AI Tutor Orchestration Service

The TutorOrchestrationService integrates the AITutorAgent into the brain-orchestrator, providing real-time conversational support for learners during learning sessions.

## Overview

The service manages AITutorAgent instances for multiple learners, handles conversation state, coordinates with other learning agents, and provides REST API endpoints for frontend integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                     │
│                  (Learner Web/Mobile UI)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Brain Orchestrator Service (Port 4003)         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         TutorOrchestrationService                    │  │
│  │  - Session management                                │  │
│  │  - Agent lifecycle                                   │  │
│  │  - Conversation state                                │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  AITutorAgent (@aivo/agents)                │
│  - Natural language understanding                           │
│  - Progressive hint system                                  │
│  - Emotional support                                        │
│  - Safety filters                                           │
└────────────┬─────────────────────┬──────────────────────────┘
             │                     │
             ▼                     ▼
    ┌─────────────┐      ┌──────────────────┐
    │   OpenAI    │      │ PersonalizedAgent│
    │   GPT-4     │      │ (coordination)   │
    └─────────────┘      └──────────────────┘
```

## Features

### 1. **Session Management**
- Start/end tutoring sessions
- Track session context (activity, question, hints)
- Maintain conversation history (last 100 interactions)
- Auto-cleanup on session end

### 2. **Conversational Support**
- Process learner input with context awareness
- Classify input type (question, answer, frustration, confusion)
- Generate appropriate responses (hints, encouragement, explanations)
- Progressive hint escalation (4 levels)

### 3. **Emotional Intelligence**
- Detect and respond to frustration
- Handle confusion with clear explanations
- Suggest breaks when needed (2+ frustrations or 3+ confusions)
- Provide empathetic, supportive feedback

### 4. **Question Management**
- Set current question with correct answer
- Track hint progression per question
- Reset hints on correct answer
- Support multiple answer types (text, numeric, multiple choice)

### 5. **Analytics & Insights**
- Conversation quality metrics (0-1 scale)
- Emotional support score
- Hint effectiveness rate
- Engagement level tracking
- Session summaries (interactions, hints, frustration, duration)

## API Endpoints

### Start Tutor Session
```http
POST /tutor/sessions/start
Content-Type: application/json

{
  "sessionId": "session-123",
  "learnerId": "learner-456",
  "activity": {
    "id": "activity-789",
    "subject": "math",
    "topic": "fractions",
    "difficulty": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session-123",
  "requestId": "uuid"
}
```

### Process Learner Input
```http
POST /tutor/input
Content-Type: application/json

{
  "sessionId": "session-123",
  "learnerInput": "Can you help me with this problem?",
  "inputType": "question"
}
```

**Input Types:**
- `question` - Help request or general question
- `answer` - Answer attempt to current question
- `frustration` - Expression of frustration or difficulty
- `confusion` - Expression of confusion or misunderstanding
- `off_topic` - Off-topic conversation

**Response:**
```json
{
  "response": {
    "message": "Let's think about this together! Can you tell me what you already know about fractions?",
    "type": "hint",
    "shouldSpeak": true,
    "emotion": "encouraging",
    "visualAids": ["fraction_diagram"],
    "nextPrompt": "Try it yourself now!",
    "breakSuggested": false,
    "confidence": 0.87,
    "reasoning": "Learner requested help; providing Level 0 hint (gentle nudge)"
  },
  "requestId": "uuid"
}
```

**Response Types:**
- `hint` - Progressive hint (does not give answer)
- `encouragement` - Celebration of correct answer
- `correction` - Supportive correction of wrong answer
- `explanation` - Clarification of confusion
- `redirect` - Gentle redirect from off-topic
- `general` - General conversational response

**Emotions:**
- `excited` - Celebrating success
- `encouraging` - Motivating during challenge
- `sympathetic` - Empathizing with frustration
- `neutral` - Standard tone
- `calm` - Soothing when learner is stressed

### Set Current Question
```http
POST /tutor/questions/set
Content-Type: application/json

{
  "sessionId": "session-123",
  "question": {
    "id": "q-456",
    "text": "What is 1/2 + 1/4?",
    "type": "short_answer",
    "correctAnswer": "3/4",
    "hints": [
      "Think about finding a common denominator",
      "Convert 1/2 to fourths",
      "1/2 = 2/4, so 2/4 + 1/4 = ?"
    ]
  }
}
```

**Question Types:**
- `multiple_choice` - Select from options
- `short_answer` - Text response
- `numeric` - Number answer
- `open_ended` - No correct answer

### Get Conversation History
```http
GET /tutor/sessions/:sessionId/history
```

**Response:**
```json
{
  "history": [
    {
      "learnerInput": "Can you help me?",
      "tutorResponse": "Of course! What would you like help with?",
      "timestamp": "2025-11-22T10:30:00Z",
      "inputType": "question"
    }
  ],
  "requestId": "uuid"
}
```

### Get Session Summary
```http
GET /tutor/sessions/:sessionId/summary
```

**Response:**
```json
{
  "summary": {
    "interactionCount": 15,
    "hintCount": 3,
    "frustrationCount": 1,
    "confusionCount": 2,
    "sessionDuration": 12.5
  },
  "requestId": "uuid"
}
```

### Get Conversation Insights
```http
GET /tutor/learners/:learnerId/insights
```

**Response:**
```json
{
  "insights": {
    "totalInteractions": 45,
    "conversationQuality": 0.82,
    "emotionalSupport": 0.91,
    "hintEffectiveness": 0.75,
    "engagementLevel": 0.88,
    "recommendations": [
      "Continue current hint strategy - high effectiveness",
      "Excellent emotional support - maintain approach"
    ]
  },
  "requestId": "uuid"
}
```

### End Tutor Session
```http
POST /tutor/sessions/:sessionId/end
```

**Response:**
```json
{
  "success": true,
  "requestId": "uuid"
}
```

## Usage Examples

### Starting a Session
```typescript
import { getTutorOrchestrationService } from "./tutorOrchestration";

const tutorService = getTutorOrchestrationService();

await tutorService.startSession("session-123", "learner-456", {
  id: "activity-789",
  subject: "math",
  topic: "fractions"
});
```

### Processing Learner Input
```typescript
// Learner asks for help
const response = await tutorService.processLearnerInput(
  "session-123",
  "I don't understand how to add fractions",
  "confusion"
);

console.log(response.message);
// "Let me break this down into simple steps..."

if (response.breakSuggested) {
  // Show break UI
}
```

### Setting Current Question
```typescript
tutorService.setCurrentQuestion("session-123", {
  id: "q-1",
  text: "What is 2 + 3?",
  type: "numeric",
  correctAnswer: 5
});

// Learner answers
const response = await tutorService.processLearnerInput(
  "session-123",
  "5",
  "answer"
);

if (response.type === "encouragement") {
  // Correct answer! Show celebration
  tutorService.recordCorrectAnswer("session-123"); // Resets hint count
}
```

### Handling Frustration
```typescript
const response = await tutorService.handleFrustration(
  "session-123",
  "this is too hard"
);

// Response will be empathetic and may suggest a break
if (response.breakSuggested) {
  // Suggest 5-minute break to learner
}
```

### Getting Insights
```typescript
const insights = await tutorService.getConversationInsights("learner-456");

console.log(`Conversation quality: ${insights.conversationQuality * 100}%`);
console.log(`Hint effectiveness: ${insights.hintEffectiveness * 100}%`);
console.log(`Engagement: ${insights.engagementLevel * 100}%`);

// Use insights to adjust teaching approach
if (insights.hintEffectiveness < 0.6) {
  // Consider different hint strategy
}
```

## Progressive Hint System

The tutor provides **4 levels of hints** without giving away the answer:

### Level 0: Gentle Nudge
- Encourages learner to think
- Asks guiding questions
- **Example:** "Think about what you already know about adding numbers"

### Level 1: Strategy Hint
- Suggests an approach or strategy
- Points to relevant concepts
- **Example:** "Try using a number line to count up from the first number"

### Level 2: Partial Walkthrough
- Breaks problem into steps
- Shows first step(s)
- **Example:** "First, let's add the ones place: 3 + 5 = 8. Now what about the tens place?"

### Level 3: Worked Example
- Shows similar problem solved
- Learner applies to their problem
- **Example:** "Here's how to solve 2 + 3: Start at 2, count up 3 more: 3, 4, 5. Now try your problem the same way."

Hint level **resets to 0** when learner answers correctly.

## Safety Features

The service implements multiple safety layers:

1. **Personal Information Filtering**
   - Blocks requests for phone, address, email, password
   - Returns appropriate boundary-setting message

2. **Positive Language**
   - Replaces negative words (stupid → challenging, hate → find difficult)
   - Maintains encouraging, supportive tone

3. **Link Filtering**
   - Removes external URLs from responses
   - Keeps learner in safe learning environment

4. **Content Moderation**
   - All responses filtered through OpenAI's moderation API
   - Inappropriate content blocked

## Integration with PersonalizedLearningAgent

The TutorOrchestrationService coordinates with PersonalizedLearningAgent:

```typescript
// AITutorAgent sends emotional state updates
agent.sendMessage({
  to: "personalized-learning-agent",
  type: "emotion_detected",
  data: {
    emotion: "frustrated",
    intensity: 0.8,
    context: "struggling with fractions"
  }
});

// PersonalizedLearningAgent can adjust difficulty/activity
```

This allows the system to:
- Adjust content difficulty when learner is frustrated
- Switch activities when confusion persists
- Schedule breaks based on emotional state
- Provide targeted support based on struggles

## Metrics & Monitoring

The service tracks:

- **Interaction Metrics**
  - Total interactions per session
  - Input type distribution (questions, answers, frustration, confusion)
  - Response type distribution (hints, encouragement, correction)

- **Performance Metrics**
  - Response latency (avg, p95, p99)
  - Hint effectiveness rate
  - Break suggestion rate

- **Quality Metrics**
  - Conversation quality score (0-1)
  - Emotional support score (0-1)
  - Engagement level (0-1)

- **Error Tracking**
  - Failed API calls
  - Invalid session IDs
  - Agent initialization errors

## Environment Variables

```bash
# Redis for conversation history
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI for GPT-4
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://...
```

## Testing

```bash
# Run unit tests
cd packages/agents
pnpm test AITutorAgent

# Run integration tests
cd services/brain-orchestrator
pnpm test tutorOrchestration
```

## Troubleshooting

### Agent Not Responding
- Check OpenAI API key is valid
- Verify Redis is running
- Check session exists (`getSessionSummary`)

### Hints Too Easy/Hard
- Review `hintEffectiveness` metric
- Adjust hint level thresholds in AITutorAgent
- Review conversation history for patterns

### Break Not Suggested When Expected
- Check `shouldSuggestBreak()` logic
- Verify frustration/confusion being detected
- Review conversation history classification

### High Latency
- Check OpenAI API status
- Review prompt length (may need shortening)
- Check Redis connection latency
- Consider caching common responses

## Best Practices

1. **Start Session Early**
   - Call `startSession` before first learner interaction
   - Provides context for personalization

2. **Set Questions Proactively**
   - Set question before learner sees it
   - Enables immediate hint support

3. **Handle Breaks Gracefully**
   - Show calm, inviting break UI
   - Don't force breaks, suggest them
   - Resume conversation smoothly

4. **Monitor Insights**
   - Check insights after each session
   - Use to improve teaching approach
   - Track trends over time

5. **Clean Up Sessions**
   - Always call `endSession` when done
   - Prevents memory leaks
   - Saves conversation data

## Future Enhancements

- [ ] Multi-modal support (voice, images)
- [ ] Subject-specific tutor personas
- [ ] Parent/teacher conversation summaries
- [ ] Adaptive hint difficulty based on learner history
- [ ] Integration with content authoring system
- [ ] Real-time collaboration (multiple learners)
- [ ] Gamification elements (achievements, progress)
