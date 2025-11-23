# AIVO v5 Agent System Implementation

## Overview

Complete implementation of the AI Agent system for AIVO v5, including database schema, authentication, agent orchestration, and API endpoints.

## Components Implemented

### 1. Database Schema (`prisma/schema.prisma`)

#### NextAuth Models
- **Account**: OAuth provider account storage
  - Stores refresh/access tokens, OAuth provider info
  - Relations: User (1:many)
  
- **VerificationToken**: Email verification tokens
  - Unique identifier + token pairs
  - Expiration tracking

#### Agent System Models
- **AgentState**: Persistent agent memory and state
  - `agentId` (unique): Agent identifier
  - `learnerId`: Associated learner
  - `agentType`: Enum (PERSONALIZED_LEARNING, AI_TUTOR, CONTENT_ADAPTATION, SPEECH_ANALYSIS, PROGRESS_MONITORING)
  - `state` (Json): Current agent state
  - `memory` (Json): Agent memory storage
  - `lastActivity`: Timestamp for cleanup

- **AgentInteraction**: Interaction logging and metrics
  - Input/output Json storage
  - Performance metrics (durationMs, success)
  - Error tracking
  - Relations: Learner (many:1)

### 2. Authentication (`packages/auth/src/config.ts`)

Complete NextAuth configuration:
- **PrismaAdapter**: Database-backed sessions
- **Providers**:
  - Google OAuth (offline access, consent prompt)
  - Credentials (bcrypt password hashing)
- **Callbacks**:
  - JWT: Role/email persistence
  - Session: User data injection
  - SignIn: OAuth profile auto-creation
- **Events**: signIn/signOut logging
- **Session**: 30-day JWT sessions
- **Pages**: Custom auth pages (/auth/signin, /auth/signup, /auth/error)

### 3. Agent System (`packages/brain-model/src/agents/`)

#### AgentManager (`AgentManager.ts`)
Singleton orchestrator managing all agent instances:

**Methods**:
- `getInstance()`: Get singleton instance
- `initializeAgentsForLearner(learnerId)`: Create agent set
  - PersonalizedLearningAgent (temperature: 0.7)
  - AITutorAgent (temperature: 0.8)
  - ContentAdaptationAgent (temperature: 0.3)
- `processLearningInteraction(learnerId, interaction)`: Multi-step orchestration
  - Creates execution plan with dependencies
  - Logs interactions to database
  - Returns orchestrated results
- `shutdownAgentsForLearner(learnerId)`: Cleanup
- `getAgentMetrics(learnerId)`: Performance analytics

**Configuration**:
```typescript
{
  modelConfig: {
    provider: 'openai',
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.3-0.8,
    maxTokens: 1000-2000
  },
  memoryConfig: {
    maxShortTermItems: 20-50,
    maxLongTermItems: 200-1000,
    consolidationThreshold: 0.5-0.7
  },
  coordinationConfig: {
    allowInterAgentComm: true,
    broadcastEvents: true/false,
    coordinationStrategy: 'centralized'
  }
}
```

#### AgentOrchestrator (`base/AgentOrchestrator.ts`)
Base orchestration engine:

**Features**:
- Agent registration
- Dependency-based execution
- Parallel step processing
- Timeout handling
- Input enrichment from dependencies

**Execution Plan Structure**:
```typescript
{
  id: string,
  steps: [
    {
      id: 'analyze',
      agentId: 'learning_agent_id',
      action: 'analyze_interaction',
      input: {...},
      dependencies: []
    },
    {
      id: 'adapt',
      agentId: 'content_agent_id',
      action: 'adapt_content',
      input: {...},
      dependencies: ['analyze']
    }
  ],
  parallel: false,
  timeout: 10000
}
```

#### Agent Implementations

**PersonalizedLearningAgent** (`implementations/PersonalizedLearningAgent.ts`)
- **Actions**: analyze_interaction, adapt_learning_path, recommend_activities
- **Features**: Performance assessment, skill identification, learning path adaptation
- **Memory**: Short-term interaction history (max 50 items)

**AITutorAgent** (`implementations/AITutorAgent.ts`)
- **Actions**: generate_response, provide_feedback, answer_question
- **Features**: Adaptive messaging, encouragement, suggestions
- **Conversation History**: Full interaction tracking

**ContentAdaptationAgent** (`implementations/ContentAdaptationAgent.ts`)
- **Actions**: adapt_content, simplify_content, adjust_difficulty
- **Features**: Visual supports, scaffolding, readability adjustment
- **Caching**: Adaptation result caching for performance

### 4. API Routes (`apps/web/app/api/agents/interact/route.ts`)

**POST /api/agents/interact**
- **Authentication**: Required (NextAuth session)
- **Input**: `{ learnerId, interaction }`
- **Process**: Orchestrates multi-agent interaction
- **Output**: `{ success, result }`
- **Errors**: 401 (Unauthorized), 400 (Bad Request), 500 (Server Error)

**GET /api/agents/interact?learnerId=<id>**
- **Authentication**: Required
- **Output**: Agent metrics (total interactions, success rate, avg duration)

### 5. Environment Configuration (`.env.example`)

Required variables:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5433/aivo_v5?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5433/aivo_v5?schema=public"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here_minimum_32_chars

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Models
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Next Steps

### Required Before Production

1. **Run Prisma Migration**
   ```bash
   npx prisma migrate dev --name add-auth-and-agents
   ```
   This will apply all schema changes to the database.

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in actual values for:
     - DATABASE_URL (PostgreSQL connection)
     - NEXTAUTH_SECRET (generate with: `openssl rand -base64 32`)
     - GOOGLE_CLIENT_ID/SECRET (from Google Cloud Console)
     - OPENAI_API_KEY (from OpenAI dashboard)

3. **Set Up Google OAuth**
   - Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Secret to .env

4. **Test Authentication Flow**
   ```bash
   npm run dev
   # Navigate to /auth/signin
   # Test both Google OAuth and email/password login
   ```

5. **Test Agent System**
   ```bash
   # POST to /api/agents/interact
   curl -X POST http://localhost:3000/api/agents/interact \
     -H "Content-Type: application/json" \
     -d '{
       "learnerId": "test-learner-id",
       "interaction": {
         "type": "question",
         "content": "How do I solve this math problem?",
         "score": 75
       }
     }'
   ```

### Enhancements (Optional)

1. **Add More Agent Types**
   - SpeechAnalysisAgent
   - ProgressMonitoringAgent
   - Create in `packages/brain-model/src/agents/implementations/`

2. **Implement Real LLM Integration**
   - Currently using placeholder responses
   - Integrate OpenAI API in agent execute() methods
   - Add streaming support for real-time responses

3. **Add Agent State Persistence**
   - Save/load agent memory to/from database
   - Implement memory consolidation (short-term → long-term)

4. **Add Monitoring & Analytics**
   - Agent performance dashboards
   - Interaction success rate tracking
   - Cost/token usage monitoring

5. **Implement Rate Limiting**
   - Per-learner interaction limits
   - API endpoint throttling
   - Cost control mechanisms

## File Structure

```
packages/
  auth/
    src/
      config.ts                 # NextAuth configuration
  brain-model/
    src/
      agents/
        AgentManager.ts         # Main orchestrator
        base/
          AgentOrchestrator.ts  # Base orchestration engine
        implementations/
          PersonalizedLearningAgent.ts
          AITutorAgent.ts
          ContentAdaptationAgent.ts
      index.ts                  # Package exports
  persistence/
    src/
      client.ts                 # Prisma client
      index.ts                  # Persistence exports

apps/
  web/
    app/
      api/
        auth/
          [...nextauth]/
            route.ts            # NextAuth API route
        agents/
          interact/
            route.ts            # Agent interaction API

prisma/
  schema.prisma               # Database schema
  migrations/                 # Migration history
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│  /api/agents/interact (POST/GET)                           │
│  - Authentication check                                     │
│  - Request validation                                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   AgentManager                              │
│  - Singleton instance                                       │
│  - Agent lifecycle management                               │
│  - Interaction processing                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────────┐  ┌─────────────────┐
│ AgentOrchestrator│  │  Prisma Client  │
│ - Plan execution │  │  - AgentState   │
│ - Dependencies   │  │  - Interaction  │
└────┬─────────────┘  └─────────────────┘
     │
     ├───────┬───────┬───────┐
     ▼       ▼       ▼       ▼
┌─────────┐ ┌──────┐ ┌──────┐
│Learning │ │Tutor │ │Content│
│ Agent   │ │Agent │ │ Agent │
└─────────┘ └──────┘ └──────┘
```

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Google OAuth flow works
- [ ] Email/password authentication works
- [ ] Agent initialization creates all three agents
- [ ] Agent interactions log to database
- [ ] Orchestration plan executes with dependencies
- [ ] API returns proper error codes
- [ ] Session management persists across requests
- [ ] Agent metrics calculation works
- [ ] Agent cleanup/shutdown works

## Known Limitations

1. **No Real LLM Integration**: Agents return placeholder responses
2. **Memory Not Persisted**: Agent memory is in-memory only
3. **No Streaming**: Responses are not streamed
4. **Basic Error Handling**: Limited error recovery
5. **No Rate Limiting**: No protection against abuse
6. **No Cost Tracking**: LLM API costs not monitored

## Support

For issues or questions:
- Check Prisma schema validation: `npx prisma validate`
- View database schema: `npx prisma studio`
- Check agent logs in console
- Review API response errors
