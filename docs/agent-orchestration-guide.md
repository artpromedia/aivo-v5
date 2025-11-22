# Agent Orchestration Implementation Guide

## Overview

The Agent Orchestration system coordinates multiple specialized agents (PersonalizedLearningAgent, AITutorAgent, SpeechAnalysisAgent) to deliver adaptive learning experiences. It provides:

- **Parallel and Sequential Execution**: Optimize performance with intelligent task scheduling
- **Dependency Management**: Ensure tasks execute in the correct order
- **Retry Policies**: Automatic retry with exponential backoff for resilience
- **Timeout Handling**: Prevent hanging operations
- **Event Broadcasting**: Real-time coordination between agents
- **Error Recovery**: Fallback plans and graceful degradation

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer (Next.js)                  │
│  ┌────────────────────┐          ┌──────────────────────────┐  │
│  │  REST API          │          │  WebSocket Server        │  │
│  │  /api/agents       │          │  (Socket.IO)            │  │
│  └────────┬───────────┘          └──────────┬───────────────┘  │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
┌───────────┼──────────────────────────────────┼──────────────────┐
│           │      Agent Orchestration Layer   │                  │
│  ┌────────▼───────────────────────────────────▼────────────┐   │
│  │              AgentOrchestrator                          │   │
│  │  - Plan execution (parallel/sequential)                │   │
│  │  - Dependency resolution                               │   │
│  │  - Retry logic with backoff                           │   │
│  │  - Event bus (agent insights, errors)                 │   │
│  │  - Bull queue for job processing                      │   │
│  │  - Redis for state persistence                        │   │
│  └────────┬──────────────────┬──────────────┬──────────────┘   │
└───────────┼──────────────────┼──────────────┼──────────────────┘
            │                  │              │
┌───────────┼──────────────────┼──────────────┼──────────────────┐
│           │   Agent Layer    │              │                  │
│  ┌────────▼─────────┐ ┌──────▼────────┐ ┌──▼────────────────┐ │
│  │ Personalized     │ │  AITutor      │ │ Speech            │ │
│  │ Learning Agent   │ │  Agent        │ │ Analysis Agent    │ │
│  │ (ML + GPT-4)    │ │  (GPT-4)      │ │ (TensorFlow)      │ │
│  └──────────────────┘ └───────────────┘ └───────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Orchestration Plans

### Plan Structure

```typescript
interface OrchestrationPlan {
  id: string;                          // Unique plan identifier
  steps: OrchestrationStep[];          // Steps to execute
  parallel: boolean;                   // Execute in parallel or sequential
  timeout?: number;                    // Max execution time (ms)
  fallbackPlan?: OrchestrationPlan;   // Fallback on failure
}

interface OrchestrationStep {
  id: string;                          // Step identifier
  agentId: string;                     // Target agent ID
  action: string;                      // Action to perform
  input: unknown;                      // Input data
  dependencies?: string[];             // Step IDs this depends on
  retryPolicy?: {                      // Retry configuration
    maxRetries: number;
    backoffMs: number;
  };
}
```

### Example: Session Initialization

```typescript
const initializationPlan = {
  id: "session_init_12345",
  steps: [
    {
      id: "init_learning",
      agentId: "learning-agent-123",
      action: "initialize_session",
      input: {
        subject: "mathematics",
        gradeLevel: 5,
        sessionId: "session_12345"
      },
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000
      }
    },
    {
      id: "init_tutor",
      agentId: "tutor-agent-123",
      action: "prepare_conversation",
      input: {
        subject: "mathematics",
        gradeLevel: 5
      },
      dependencies: ["init_learning"],  // Wait for learning agent
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000
      }
    }
  ],
  parallel: true,    // Steps without dependencies run in parallel
  timeout: 30000     // 30 seconds
};

const result = await orchestrator.orchestrate(initializationPlan);
```

### Example: Learning Activity Workflow

```typescript
const learningWorkflow = {
  id: "learning_activity_789",
  steps: [
    {
      id: "present_question",
      agentId: "learning-agent-123",
      action: "get_next_activity",
      input: { learnerId: "learner_456" }
    },
    {
      id: "process_answer",
      agentId: "learning-agent-123",
      action: "process_interaction",
      input: {
        activityId: "act_789",
        response: { answer: "42" }
      },
      dependencies: ["present_question"]
    },
    {
      id: "evaluate_performance",
      agentId: "learning-agent-123",
      action: "analyze_performance",
      input: { learnerId: "learner_456" },
      dependencies: ["process_answer"]
    },
    {
      id: "provide_feedback",
      agentId: "tutor-agent-123",
      action: "generate_feedback",
      input: {
        correct: true,
        concept: "algebra"
      },
      dependencies: ["evaluate_performance"]
    }
  ],
  parallel: false,   // Sequential execution
  timeout: 45000
};
```

### Example: Parallel Analysis

```typescript
const parallelAnalysis = {
  id: "multi_analysis_999",
  steps: [
    {
      id: "learning_analysis",
      agentId: "learning-agent-123",
      action: "analyze_learning_patterns",
      input: { learnerId: "learner_456", days: 7 }
    },
    {
      id: "speech_analysis",
      agentId: "speech-agent-123",
      action: "analyze_speech_progress",
      input: { learnerId: "learner_456", days: 7 }
    },
    {
      id: "tutor_analysis",
      agentId: "tutor-agent-123",
      action: "analyze_conversation_patterns",
      input: { learnerId: "learner_456", days: 7 }
    },
    {
      id: "combine_insights",
      agentId: "learning-agent-123",
      action: "generate_comprehensive_report",
      input: {},
      dependencies: ["learning_analysis", "speech_analysis", "tutor_analysis"]
    }
  ],
  parallel: true,    // First 3 run in parallel, then combine
  timeout: 60000
};
```

## REST API Integration

### Start Session with Orchestration

```typescript
// POST /api/agents
{
  "action": "start_session",
  "learnerId": "learner_123",
  "data": {
    "subject": "mathematics",
    "gradeLevel": 5
  }
}

// Response
{
  "sessionId": "session_learner_123_1638360000000",
  "agents": {
    "learning": "learning-agent-learner_123-1638360000000",
    "tutor": "tutor-agent-learner_123-1638360000000"
  },
  "status": "ready",
  "orchestration": {
    "success": true,
    "duration": 2345,
    "results": {
      "init_learning": {
        "success": true,
        "data": { "sessionReady": true }
      },
      "init_tutor": {
        "success": true,
        "data": { "conversationReady": true }
      }
    }
  },
  "timestamp": "2024-12-01T10:00:00.000Z"
}
```

### Process Interaction

```typescript
// POST /api/agents
{
  "action": "process_interaction",
  "learnerId": "learner_123",
  "data": {
    "activityId": "act_456",
    "response": { "answer": "42" },
    "timestamp": "2024-12-01T10:05:00.000Z"
  }
}

// Response
{
  "success": true,
  "response": {
    "correct": true,
    "nextActivity": { /* ... */ },
    "adaptations": { /* ... */ }
  },
  "confidence": 0.92,
  "reasoning": "Strong performance on algebraic concepts",
  "timestamp": "2024-12-01T10:05:01.000Z"
}
```

## WebSocket Integration

### Server-Side Setup

```typescript
// services/brain-orchestrator/src/websocket-server.ts
const orchestrator = new AgentOrchestrator();

io.on('connection', (socket) => {
  socket.on('agent:learning', async (data, callback) => {
    const agent = getOrCreateAgent(socket.data.learnerId, 'learning');
    
    // Register agent with orchestrator if not already registered
    if (!orchestrator.getAgent(agent.getAgentId())) {
      await orchestrator.registerAgent(agent);
    }
    
    const response = await agent.processInput(data);
    callback(response);
    
    // Broadcast events to other agents if needed
    if (response.requiresTutorIntervention) {
      socket.emit('tutor:intervention:required', {
        reason: response.interventionReason,
        context: response.context
      });
    }
  });
});
```

### Client-Side Usage

```typescript
// Frontend
import { useAgents } from '@/components/agents/AgentProvider';

function LearningComponent() {
  const { sendMessage, subscribe } = useAgents();
  
  useEffect(() => {
    // Subscribe to orchestration events
    subscribe('content:adapted', (data) => {
      console.log('Content adapted:', data);
    });
    
    subscribe('tutor:intervention:required', (data) => {
      console.log('Tutor intervention needed:', data);
    });
  }, []);
  
  const handleAnswer = async (answer) => {
    const result = await sendMessage('learning', {
      action: 'process_answer',
      answer,
      activityId: currentActivity.id
    });
    
    // Result will trigger orchestrated workflows
  };
}
```

## Event Bus

### Agent Events

The orchestrator provides an event bus for inter-agent communication:

```typescript
// Listen for agent insights
orchestrator.on('agent:insight', ({ agentId, insight }) => {
  console.log(`Insight from ${agentId}:`, insight);
  
  // Store in analytics
  analyticsService.recordInsight(agentId, insight);
});

// Listen for agent errors
orchestrator.on('agent:error', ({ agentId, error }) => {
  console.error(`Error from ${agentId}:`, error);
  
  // Trigger fallback
  if (error.critical) {
    triggerFallbackAgent(agentId);
  }
});

// Listen for plan events
orchestrator.on('plan:fallback', ({ planId, fallbackPlanId }) => {
  console.log(`Plan ${planId} failed, executing fallback ${fallbackPlanId}`);
});

orchestrator.on('step:started', ({ stepId, agentId, jobId }) => {
  console.log(`Step ${stepId} started on agent ${agentId}`);
});

orchestrator.on('step:completed', ({ stepId, agentId, response }) => {
  console.log(`Step ${stepId} completed`);
});
```

### Agent-to-Agent Communication

```typescript
// In PersonalizedLearningAgent
class PersonalizedLearningAgent extends BaseAgent {
  async processInput(input: any) {
    const result = await this.analyzeAnswer(input);
    
    // If learner is struggling, notify tutor agent
    if (result.strugglingDetected) {
      this.emit('insight', {
        type: 'struggling_detected',
        data: {
          concept: result.concept,
          difficultyLevel: result.difficulty,
          suggestedIntervention: 'progressive_hints'
        }
      });
    }
    
    return result;
  }
}

// In AITutorAgent (receives via orchestrator event bus)
class AITutorAgent extends BaseAgent {
  async initialize() {
    await super.initialize();
    
    // Listen for insights from other agents
    this.orchestrator.on('agent:insight', ({ agentId, insight }) => {
      if (insight.type === 'struggling_detected') {
        this.prepareIntervention(insight.data);
      }
    });
  }
}
```

## Error Handling

### Retry Policies

```typescript
const planWithRetry = {
  id: "resilient_plan",
  steps: [
    {
      id: "api_call",
      agentId: "learning-agent-123",
      action: "fetch_external_data",
      input: { source: "curriculum_api" },
      retryPolicy: {
        maxRetries: 3,          // Try up to 3 times
        backoffMs: 1000         // Wait 1s, 2s, 3s between retries
      }
    }
  ],
  parallel: false,
  timeout: 15000
};

// Orchestrator will automatically retry on failure:
// 1st attempt: immediate
// 2nd attempt: after 1s delay
// 3rd attempt: after 2s delay
// 4th attempt: after 3s delay
```

### Fallback Plans

```typescript
const mainPlan = {
  id: "main_plan",
  steps: [
    {
      id: "use_ml_model",
      agentId: "learning-agent-123",
      action: "predict_with_ml",
      input: { features: [...] }
    }
  ],
  parallel: false,
  timeout: 5000,
  fallbackPlan: {
    id: "fallback_plan",
    steps: [
      {
        id: "use_gpt4",
        agentId: "learning-agent-123",
        action: "predict_with_gpt4",
        input: { features: [...] }
      }
    ],
    parallel: false,
    timeout: 10000
  }
};

// If main plan fails or times out, fallback plan executes automatically
const result = await orchestrator.orchestrate(mainPlan);
```

### Timeout Handling

```typescript
// Global timeout for entire plan
const plan = {
  id: "timed_plan",
  steps: [...],
  parallel: true,
  timeout: 30000  // Entire plan must complete in 30s
};

try {
  const result = await orchestrator.orchestrate(plan);
} catch (error) {
  if (error.message.includes('timed out')) {
    console.log('Plan exceeded timeout, attempting recovery...');
    // Implement recovery logic
  }
}
```

## Performance Optimization

### Parallel Execution

```typescript
// Execute independent tasks in parallel
const optimizedPlan = {
  id: "optimized",
  steps: [
    // These 3 run in parallel (no dependencies)
    { id: "task1", agentId: "agent1", action: "analyze_A", input: {} },
    { id: "task2", agentId: "agent2", action: "analyze_B", input: {} },
    { id: "task3", agentId: "agent3", action: "analyze_C", input: {} },
    
    // This waits for all 3 to complete
    { 
      id: "combine", 
      agentId: "agent1", 
      action: "combine_results", 
      input: {},
      dependencies: ["task1", "task2", "task3"]
    }
  ],
  parallel: true  // Enable parallel execution
};

// tasks1-3 run simultaneously, then combine runs
// Total time: max(task1, task2, task3) + combine
// Instead of: task1 + task2 + task3 + combine
```

### Job Queue Processing

The orchestrator uses Bull queue for background job processing:

```typescript
// Jobs are automatically queued and processed
// Monitor queue status:

orchestrator.on('queue:completed', ({ jobId, result }) => {
  console.log(`Job ${jobId} completed:`, result);
});

orchestrator.on('queue:failed', ({ jobId, error }) => {
  console.error(`Job ${jobId} failed:`, error);
  // Implement alerting or retry logic
});
```

## Monitoring and Analytics

### Track Orchestration Performance

```typescript
const result = await orchestrator.orchestrate(plan);

// Log metrics
console.log('Orchestration Metrics:', {
  planId: result.planId,
  success: result.success,
  duration: result.duration,
  stepCount: result.results.size,
  errorCount: result.errors?.size || 0
});

// Store in monitoring system
monitoringService.recordOrchestration({
  planId: result.planId,
  duration: result.duration,
  success: result.success,
  timestamp: new Date()
});
```

### Agent Registry Status

```typescript
// Check active agents
const allAgents = orchestrator.getAllAgents();
console.log(`Active agents: ${allAgents.length}`);

allAgents.forEach(agent => {
  console.log(`- ${agent.getAgentId()}: ${agent.constructor.name}`);
});

// Get specific agent
const learningAgent = orchestrator.getAgent('learning-agent-123');
if (learningAgent) {
  console.log('Learning agent is active');
}
```

## Testing

See `packages/agents/src/__tests__/integration/agent-orchestration.test.ts` for comprehensive test examples covering:

- Session initialization with parallel agent setup
- Agent coordination (sequential and parallel)
- Error handling and retry logic
- Timeout management
- Event broadcasting
- Complex multi-step workflows

## Best Practices

### 1. Design Efficient Plans

```typescript
// ❌ Bad: Everything sequential
const slowPlan = {
  steps: [
    { id: "1", action: "taskA" },
    { id: "2", action: "taskB" },  // Could run in parallel
    { id: "3", action: "taskC" },  // Could run in parallel
    { id: "4", action: "combine", dependencies: ["1", "2", "3"] }
  ],
  parallel: false  // Everything runs sequentially
};

// ✅ Good: Parallel where possible
const fastPlan = {
  steps: [
    { id: "1", action: "taskA" },
    { id: "2", action: "taskB" },
    { id: "3", action: "taskC" },
    { id: "4", action: "combine", dependencies: ["1", "2", "3"] }
  ],
  parallel: true  // 1, 2, 3 run in parallel, then 4
};
```

### 2. Set Appropriate Timeouts

```typescript
// ✅ Reasonable timeouts based on operation complexity
const plan = {
  id: "session_init",
  steps: [...],
  timeout: 30000  // 30s for initialization (includes network calls)
};

const analysisPlan = {
  id: "deep_analysis",
  steps: [...],
  timeout: 120000  // 2min for complex ML analysis
};
```

### 3. Use Retry Policies Wisely

```typescript
// ✅ Retry for transient failures (network, rate limits)
{
  id: "api_call",
  action: "fetch_data",
  retryPolicy: {
    maxRetries: 3,
    backoffMs: 1000
  }
}

// ❌ Don't retry for permanent failures (invalid input)
{
  id: "validate_input",
  action: "validate",
  // No retry policy - validation errors won't fix themselves
}
```

### 4. Implement Graceful Degradation

```typescript
const robustPlan = {
  id: "learning_recommendation",
  steps: [
    {
      id: "ml_prediction",
      action: "predict_with_ml",
      retryPolicy: { maxRetries: 2, backoffMs: 500 }
    }
  ],
  parallel: false,
  timeout: 5000,
  fallbackPlan: {
    id: "rule_based_fallback",
    steps: [
      { id: "rule_based", action: "predict_with_rules" }
    ],
    parallel: false,
    timeout: 2000
  }
};
```

## Next Steps

1. **Monitor Production Performance**: Track orchestration metrics, identify bottlenecks
2. **Optimize Plans**: Analyze execution times, maximize parallelization
3. **Implement Circuit Breakers**: Prevent cascade failures
4. **Add Load Testing**: Stress test with concurrent orchestrations
5. **Enhanced Analytics**: Correlate orchestration performance with learning outcomes
