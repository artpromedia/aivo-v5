# Agent Integration and Orchestration Layer

## Overview

The Agent Integration and Orchestration Layer provides comprehensive real-time communication between the frontend and the specialized agent system (PersonalizedLearningAgent, AITutorAgent, SpeechAnalysisAgent). It includes both REST API and WebSocket protocols for flexible integration patterns.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌───────────────────┐        ┌──────────────────────────┐     │
│  │  AgentProvider    │────────│ AdaptiveLearningSession  │     │
│  │  (WebSocket)      │        │  (React Component)       │     │
│  └─────────┬─────────┘        └──────────────────────────┘     │
└────────────┼────────────────────────────────────────────────────┘
             │
             │ WebSocket (Real-time) + REST API (Synchronous)
             │
┌────────────┼────────────────────────────────────────────────────┐
│            │          Integration Layer                         │
│  ┌─────────▼─────────┐        ┌──────────────────────────┐     │
│  │ WebSocket Server  │        │     REST API Routes      │     │
│  │  (Socket.IO)      │        │  (/api/agents)          │     │
│  └─────────┬─────────┘        └────────┬─────────────────┘     │
│            │                            │                        │
│  ┌─────────▼────────────────────────────▼─────────────────┐    │
│  │          Agent Registry & Session Management           │    │
│  │  - Multi-learner support (Map<learnerId, agents>)     │    │
│  │  - Automatic cleanup (30min timeout)                  │    │
│  │  - Authentication (JWT)                               │    │
│  └─────────┬──────────────────────────────────────────────┘    │
└────────────┼────────────────────────────────────────────────────┘
             │
┌────────────┼────────────────────────────────────────────────────┐
│            │              Agent Layer                           │
│  ┌─────────▼──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │ PersonalizedLearning   │  │  AITutor     │  │   Speech    ││
│  │       Agent            │  │   Agent      │  │  Analysis   ││
│  │ (ML + GPT-4)          │  │  (GPT-4)     │  │  (TensorFlow)││
│  └────────┬───────────────┘  └──────┬───────┘  └──────┬──────┘│
└───────────┼──────────────────────────┼─────────────────┼────────┘
            │                          │                 │
┌───────────▼──────────────────────────▼─────────────────▼────────┐
│                    Infrastructure Layer                          │
│    Redis (Memory)   │   Prisma (DB)    │   TensorFlow (ML)      │
└──────────────────────────────────────────────────────────────────┘
```

## Components

### 1. REST API (`apps/web/app/api/agents/route.ts`)

**Purpose**: Synchronous HTTP-based agent interactions

**Endpoints**:
- `POST /api/agents` - Main handler for 8 actions
- `GET /api/agents?learnerId=X` - Get session status

**Actions**:
1. **start_session**: Creates PersonalizedLearningAgent + AITutorAgent
   ```typescript
   POST /api/agents
   {
     "action": "start_session",
     "learnerId": "learner_123",
     "subject": "mathematics",
     "gradeLevel": 5
   }
   
   // Response
   {
     "success": true,
     "sessionId": "uuid-session-id",
     "agentIds": {
       "learning": "learning-learner_123",
       "tutor": "tutor-learner_123"
     }
   }
   ```

2. **process_interaction**: Process learner answer
   ```typescript
   POST /api/agents
   {
     "action": "process_interaction",
     "learnerId": "learner_123",
     "activityId": "activity_456",
     "response": { "answer": "42" },
     "timestamp": "2024-01-15T10:30:00Z"
   }
   
   // Response
   {
     "success": true,
     "result": {
       "shouldAdaptContent": true,
       "recommendation": { /* next activity */ },
       "confidence": 0.89,
       "reasoning": "Student demonstrates strong understanding..."
     }
   }
   ```

3. **get_recommendation**: Get adaptive content recommendation
4. **analyze_speech**: Phoneme analysis and therapy recommendations
5. **get_tutor_response**: Conversational tutor interaction
6. **end_session**: Shutdown all agents and cleanup
7. **get_insights**: Generate insights from any agent
8. **GET status**: Check active sessions

**Features**:
- Authentication: `getServerSession()` check on all requests
- Session Management: `activeSessions` Map tracks startTime, lastActivity, agents
- Agent Registry: `agentRegistry` Map<learnerId, Map<type, agent>> for concurrent learners
- Automatic Cleanup: Every 5 minutes, shuts down inactive sessions (>30min)
- Error Recovery: Try-catch on all handlers, detailed error messages

### 2. WebSocket Server (`services/brain-orchestrator/src/websocket-server.ts`)

**Purpose**: Real-time bidirectional communication with Socket.IO

**Events**:

**Client → Server**:
- `agent:learning` - Learning agent interactions
  ```typescript
  socket.emit("agent:learning", {
    action: "process_answer",
    activityId: "activity_123",
    answer: { text: "42" }
  }, (response) => {
    console.log("Result:", response.result);
  });
  ```

- `agent:tutor` - Tutor agent interactions
  ```typescript
  socket.emit("agent:tutor", {
    input: "I don't understand this problem",
    inputType: "confusion",
    currentActivity: { id: "123", type: "math" }
  }, (response) => {
    console.log("Tutor:", response.result.response);
  });
  ```

- `agent:speech` - Speech analysis
  ```typescript
  socket.emit("agent:speech", {
    audioBuffer: "base64_audio_data",
    targetText: "The cat sat on the mat",
    taskType: "articulation",
    childAge: 6
  }, (response) => {
    console.log("Analysis:", response.result);
  });
  ```

**Server → Client**:
- `content:adapted` - Content adaptation triggered
  ```typescript
  socket.on("content:adapted", (data) => {
    console.log("New content:", data.recommendation);
    console.log("Reasoning:", data.reasoning);
  });
  ```

- `tutor:message` - Real-time tutor message
  ```typescript
  socket.on("tutor:message", (data) => {
    console.log("Tutor:", data.response);
    if (data.breakSuggested) {
      console.log("Break suggested");
    }
  });
  ```

- `break:suggested` - Break recommendation
  ```typescript
  socket.on("break:suggested", (data) => {
    console.log("Reason:", data.reason);
    console.log("Duration:", data.recommendedBreakDuration, "minutes");
  });
  ```

**Features**:
- Authentication: JWT verification via Socket.IO middleware
- Session Tracking: AgentSession interface tracks agents, timestamps
- Multi-learner Support: `learnerSockets` Map enables per-learner broadcasting
- Automatic Cleanup: Disconnection handler shuts down agents
- Error Handling: Error events and try-catch on all handlers
- Reconnection: Built-in Socket.IO reconnection logic

### 3. AgentProvider (`apps/web/components/agents/AgentProvider.tsx`)

**Purpose**: React Context for WebSocket communication

**Usage**:
```tsx
import { AgentProvider } from "@/components/agents";

function App() {
  return (
    <AgentProvider 
      learnerId="learner_123" 
      autoConnect={true}
    >
      <YourComponents />
    </AgentProvider>
  );
}
```

**Hooks**:

**useAgents()**: Core WebSocket management
```tsx
const { 
  connected, 
  connecting, 
  error, 
  sendMessage,
  subscribe, 
  unsubscribe,
  reconnect 
} = useAgents();

// Subscribe to events
useEffect(() => {
  const handler = (data) => console.log(data);
  subscribe("content:adapted", handler);
  return () => unsubscribe("content:adapted", handler);
}, [subscribe, unsubscribe]);

// Send messages
const result = await sendMessage("learning", {
  action: "process_answer",
  answer: "42"
});
```

**useLearningAgent()**: Learning agent interactions
```tsx
const { startSession, processAnswer, getRecommendation } = useLearningAgent();

// Start session
await startSession({ subject: "math", gradeLevel: 5 });

// Process answer
const result = await processAnswer({
  answer: "42",
  questionId: "q_123",
  activityId: "act_456"
});

// Get recommendation
const rec = await getRecommendation({ context: { topic: "fractions" } });
```

**useTutorAgent()**: Tutor agent interactions
```tsx
const { sendInput, requestHint } = useTutorAgent();

// Ask question
await sendInput({
  input: "I don't understand",
  inputType: "confusion",
  currentActivity: { id: "123", subject: "math" }
});

// Request hint
await requestHint({ questionId: "q_123", hintLevel: 2 });
```

**useSpeechAgent()**: Speech analysis
```tsx
const { analyzeSpeech } = useSpeechAgent();

// Analyze speech
const analysis = await analyzeSpeech({
  audioBuffer: audioArrayBuffer,
  targetText: "The cat sat on the mat",
  taskType: "articulation",
  childAge: 6
});
```

**Features**:
- Automatic reconnection with exponential backoff (max 5 attempts)
- Connection state management (connected, connecting, error)
- Event subscription/unsubscription
- 30-second message timeout
- Audio buffer conversion (ArrayBuffer → base64)

### 4. AdaptiveLearningSession (`apps/web/components/agents/AdaptiveLearningSession.tsx`)

**Purpose**: Complete learning session UI with agent integration

**Usage**:
```tsx
import { AdaptiveLearningSession } from "@/components/agents";

function LearningPage() {
  return (
    <AdaptiveLearningSession
      learnerId="learner_123"
      subject="Mathematics"
      gradeLevel={5}
      onActivityChange={(activity) => {
        console.log("New activity:", activity);
      }}
      onBreakSuggested={(reason, duration) => {
        console.log("Break suggested:", reason, duration);
      }}
      onError={(error) => {
        console.error("Error:", error);
      }}
    />
  );
}
```

**Features**:
- Automatic session initialization on connection
- Real-time activity adaptation
- Tutor message display
- Break suggestion UI
- Answer submission
- Loading states
- Error handling
- Responsive design with Tailwind CSS

**UI Components**:
- Connection status indicator
- Current activity card with difficulty visualization
- Answer textarea with submit button
- "Ask Tutor" button for help
- Tutor message popup (blue background)
- Break suggestion dialog (yellow background)
- Loading spinners

## Integration Patterns

### Pattern 1: REST API Only (Simple)
Use REST API for simple, synchronous interactions without real-time requirements.

```tsx
async function processAnswer(answer: string) {
  const response = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "process_interaction",
      learnerId: "learner_123",
      response: { answer }
    })
  });
  
  const result = await response.json();
  return result;
}
```

### Pattern 2: WebSocket Only (Real-time)
Use WebSocket for real-time interactions with event streaming.

```tsx
import { AgentProvider, useLearningAgent } from "@/components/agents";

function Component() {
  const { processAnswer } = useLearningAgent();
  
  useEffect(() => {
    const { subscribe, unsubscribe } = useAgents();
    
    const handler = (data) => {
      console.log("Content adapted:", data);
    };
    
    subscribe("content:adapted", handler);
    return () => unsubscribe("content:adapted", handler);
  }, []);
  
  return <button onClick={() => processAnswer({ answer: "42" })}>Submit</button>;
}
```

### Pattern 3: Hybrid (Recommended)
Use WebSocket for real-time features, REST API for background operations.

```tsx
// Real-time learning session via WebSocket
<AgentProvider learnerId="learner_123">
  <AdaptiveLearningSession />
</AgentProvider>

// Background insights fetch via REST API
async function loadInsights() {
  const response = await fetch("/api/agents", {
    method: "POST",
    body: JSON.stringify({
      action: "get_insights",
      learnerId: "learner_123",
      agentType: "learning"
    })
  });
  return response.json();
}
```

## Session Lifecycle

### 1. Session Start
```typescript
// Frontend
const { startSession } = useLearningAgent();
await startSession({ subject: "math", gradeLevel: 5 });

// Backend (WebSocket)
- Creates PersonalizedLearningAgent with config
- Creates AITutorAgent with config
- Initializes both agents
- Stores in agentRegistry Map
- Creates sessionInfo in activeSessions Map
- Returns sessionId and agent IDs
```

### 2. Active Learning
```typescript
// Frontend
const { processAnswer } = useLearningAgent();
await processAnswer({ answer: "42", questionId: "q_123" });

// Backend
- Gets learning agent from registry
- Processes interaction through ML model or GPT-4
- Updates lastActivity timestamp
- Emits "content:adapted" event if needed
- Returns result with confidence + reasoning
```

### 3. Tutor Interaction
```typescript
// Frontend
const { sendInput } = useTutorAgent();
await sendInput({ input: "I don't understand", inputType: "confusion" });

// Backend
- Gets tutor agent from registry
- Classifies input type (GPT-4)
- Generates appropriate response (hint, clarification, empathy)
- Emits "tutor:message" event
- Emits "break:suggested" if frustration detected
- Returns response
```

### 4. Session End
```typescript
// Frontend disconnect or explicit end
socket.disconnect();

// Backend
- Disconnect handler triggered
- Shuts down all agents (learningAgent.shutdown(), tutorAgent.shutdown())
- Removes from agentRegistry and activeSessions
- Removes from learnerSockets tracking
- Cleans up resources
```

### 5. Automatic Cleanup
```typescript
// Backend periodic check (every 5 minutes)
- Iterate activeSessions
- Check lastActivity timestamp
- If inactive > 30 minutes:
  - Shutdown all agents
  - Remove from registry
  - Disconnect socket
```

## Error Handling

### Connection Errors
```tsx
const { error, reconnect } = useAgents();

if (error) {
  return (
    <div>
      <p>Connection error: {error}</p>
      <button onClick={reconnect}>Reconnect</button>
    </div>
  );
}
```

### Agent Errors
```tsx
try {
  const result = await processAnswer({ answer: "42" });
} catch (error) {
  console.error("Agent error:", error.message);
  // Fallback to REST API or show error to user
}
```

### Timeout Handling
```tsx
// Built into AgentProvider (30s timeout per message)
const result = await sendMessage("learning", { action: "process_answer" });
// Throws "Agent response timeout" if no response in 30s
```

## Performance Optimization

### 1. Connection Pooling
- Single WebSocket connection per learner
- Multiple agents share same connection
- Reduces overhead and latency

### 2. Event Batching
```tsx
// Batch multiple events
socket.emit("agent:learning", [
  { action: "process_answer", answer: "42" },
  { action: "get_recommendation" }
], (responses) => {
  console.log("Batch results:", responses);
});
```

### 3. Selective Subscriptions
```tsx
// Only subscribe to needed events
useEffect(() => {
  subscribe("content:adapted", handleContentAdapted);
  // Don't subscribe to all events if not needed
}, []);
```

### 4. Agent Reuse
- Agents persist across multiple interactions
- No re-initialization overhead
- Conversation history preserved

## Security

### Authentication
- REST API: `getServerSession()` check on all requests
- WebSocket: JWT verification in Socket.IO middleware
- Token stored in sessionStorage

### Authorization
```typescript
// Verify learner access
const session = await getServerSession();
if (session.user.id !== learnerId && !session.user.isAdmin) {
  return reply.status(403).send({ error: "Unauthorized" });
}
```

### Data Validation
- Zod schemas on REST API
- Type checking on WebSocket events
- Sanitization of user inputs

### Rate Limiting
```typescript
// TODO: Implement rate limiting
// - Max requests per minute per learner
// - Max concurrent sessions per user
// - Timeout enforcement
```

## Monitoring

### Metrics to Track
1. **Connection Metrics**:
   - Active WebSocket connections
   - Connection success/failure rate
   - Reconnection attempts
   - Average connection duration

2. **Agent Metrics**:
   - Active agents per type
   - Agent initialization time
   - Agent response latency
   - Agent error rate
   - ML model vs GPT-4 usage ratio

3. **Session Metrics**:
   - Active sessions count
   - Average session duration
   - Sessions per learner
   - Cleanup frequency

4. **Performance Metrics**:
   - Message processing time
   - Event emission latency
   - Memory usage per session
   - CPU usage per agent

### Logging
```typescript
// Example logging
console.log("Session started:", {
  learnerId,
  sessionId,
  timestamp: new Date().toISOString(),
  agentTypes: ["learning", "tutor"]
});

// Error logging
console.error("Agent error:", {
  learnerId,
  agentType: "learning",
  error: error.message,
  stack: error.stack
});
```

## Testing

### Unit Tests
```typescript
describe("AgentProvider", () => {
  it("connects to WebSocket server", async () => {
    const { result } = renderHook(() => useAgents(), {
      wrapper: ({ children }) => (
        <AgentProvider learnerId="test_123">{children}</AgentProvider>
      )
    });
    
    await waitFor(() => expect(result.current.connected).toBe(true));
  });
});
```

### Integration Tests
```typescript
describe("Learning Session", () => {
  it("processes answer and adapts content", async () => {
    // Start session
    const session = await startSession({ subject: "math" });
    
    // Process answer
    const result = await processAnswer({ answer: "42" });
    
    // Verify content adaptation
    expect(result.shouldAdaptContent).toBe(true);
    expect(result.recommendation).toBeDefined();
  });
});
```

### E2E Tests
```typescript
describe("Full Learning Flow", () => {
  it("completes adaptive learning session", async () => {
    // Connect
    await page.goto("/learn");
    await page.waitForSelector(".learning-session");
    
    // Answer questions
    await page.fill("textarea", "42");
    await page.click("button:has-text('Submit')");
    
    // Verify tutor message
    await page.waitForSelector(".tutor-message");
    
    // Ask tutor
    await page.click("button:has-text('Ask Tutor')");
    await page.waitForSelector(".tutor-response");
  });
});
```

## Deployment

### Environment Variables
```bash
# WebSocket Server
NEXT_PUBLIC_SOCKET_URL=http://localhost:4003
NEXTAUTH_SECRET=your-secret-key
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/aivo
```

### Docker Compose
```yaml
services:
  brain-orchestrator:
    build: ./services/brain-orchestrator
    ports:
      - "4003:4003"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_HOST=redis
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - redis
      - postgres
      
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SOCKET_URL=http://brain-orchestrator:4003
```

### Production Considerations
1. **Load Balancing**: Use sticky sessions for WebSocket connections
2. **Redis Pub/Sub**: Broadcast events across multiple server instances
3. **Health Checks**: Endpoint to check WebSocket server status
4. **Graceful Shutdown**: Close connections before server restart
5. **SSL/TLS**: Use wss:// in production
6. **CORS**: Configure allowed origins properly

## Troubleshooting

### Connection Issues
**Problem**: WebSocket won't connect
**Solutions**:
- Check NEXT_PUBLIC_SOCKET_URL environment variable
- Verify brain-orchestrator is running on port 4003
- Check firewall rules
- Verify JWT token is valid

### Agent Not Responding
**Problem**: No response from agent
**Solutions**:
- Check agent initialization logs
- Verify OpenAI API key is set
- Check Redis connection
- Verify database connection
- Look for timeout errors (30s limit)

### Session Cleanup Issues
**Problem**: Sessions not being cleaned up
**Solutions**:
- Check cleanup interval (5 minutes)
- Verify lastActivity is being updated
- Check for errors in cleanup handler
- Monitor memory usage

### Performance Degradation
**Problem**: Slow response times
**Solutions**:
- Check ML model loading time
- Monitor GPT-4 API latency
- Verify Redis response times
- Check database query performance
- Profile agent processing time

## Next Steps

### Pending Implementation
1. **AgentOrchestrator**: Event bus for agent-to-agent coordination
2. **Performance Monitoring**: Metrics collection and dashboard
3. **Database Migration**: Execute Prisma migration for MLTrainingData and SpeechAnalysis tables
4. **Rate Limiting**: Implement request throttling
5. **Caching**: Add Redis caching for frequent queries
6. **Load Testing**: Stress test with multiple concurrent sessions

### Future Enhancements
1. **Agent Collaboration**: Enable PersonalizedLearningAgent to request help from AITutorAgent
2. **Multi-modal Input**: Support video, drawing, code input
3. **Offline Mode**: Queue actions when disconnected
4. **Analytics Dashboard**: Real-time session monitoring
5. **A/B Testing**: Test different agent configurations
6. **Adaptive Hints**: ML-powered hint selection
7. **Voice Input**: Integrate speech recognition
8. **Progress Tracking**: Visualize learning progress over time

## Resources

- **REST API**: `apps/web/app/api/agents/route.ts`
- **WebSocket Server**: `services/brain-orchestrator/src/websocket-server.ts`
- **AgentProvider**: `apps/web/components/agents/AgentProvider.tsx`
- **AdaptiveLearningSession**: `apps/web/components/agents/AdaptiveLearningSession.tsx`
- **PersonalizedLearningAgent**: `packages/agents/src/PersonalizedLearningAgent.ts`
- **AITutorAgent**: `packages/agents/src/AITutorAgent.ts`
- **SpeechAnalysisAgent**: `packages/agents/src/SpeechAnalysisAgent.ts`
- **Socket.IO Docs**: https://socket.io/docs/v4/
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction
- **React Context**: https://react.dev/reference/react/createContext
