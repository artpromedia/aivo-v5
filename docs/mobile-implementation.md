# AIVO v5 Mobile Apps Implementation Guide

## Overview

This guide documents the implementation of AIVO v5 mobile applications for both learners and parents/teachers, including authentication, offline support, speech therapy, adaptive learning, and parent dashboards.

## Architecture

### Mobile Apps Structure

```
mobile/
├── learner-mobile/          # Student-facing mobile app
│   ├── src/
│   │   └── components/
│   │       ├── ArticulationPractice.tsx    # Speech therapy component
│   │       └── AdaptiveLearningSession.tsx # AI-powered learning
│   ├── App.tsx
│   └── package.json
│
├── parent-teacher-mobile/   # Parent/teacher portal app
│   ├── src/
│   │   └── screens/
│   │       └── ParentDashboard.tsx         # Parent monitoring dashboard
│   ├── App.tsx
│   └── package.json
│
└── shared/                  # Shared mobile code
    └── auth/
        └── AuthContext.tsx  # Authentication provider
```

## Completed Implementations

### 1. Database Migration ✅

**Migration:** `20251123144832_add_auth_and_agents`

Added tables:
- `Account` - OAuth provider accounts (Google, etc.)
- `VerificationToken` - Email verification tokens
- `AgentState` - AI agent state persistence
- `AgentInteraction` - Agent interaction history

Relations:
- `User.accounts` → `Account[]`
- `Learner.agentStates` → `AgentState[]`
- `Learner.agentInteractions` → `AgentInteraction[]`

**Command:**
```bash
npx prisma migrate dev --name add-auth-and-agents
```

### 2. Mobile Authentication ✅

**Location:** `mobile/shared/auth/AuthContext.tsx`

Features:
- Secure token storage using `expo-secure-store`
- Email/password authentication
- Google OAuth support (requires expo-auth-session setup)
- Token refresh mechanism
- Auto-load stored credentials

**Usage:**
```typescript
import { AuthProvider, useAuth } from '../shared/auth/AuthContext';

// Wrap app
<AuthProvider apiBaseUrl="http://localhost:3000">
  <App />
</AuthProvider>

// Use in components
const { user, token, signIn, signOut } = useAuth();
```

**Security:**
- Tokens stored in encrypted secure store
- HTTPS-only API calls in production
- Automatic token refresh
- Secure cleanup on sign out

### 3. Mobile API Client ✅

**Location:** `packages/api-client/src/mobile-client.ts`

Features:
- Authentication interceptors (automatic token injection)
- Offline request queue (mutations saved when offline)
- Retry logic (max 3 attempts)
- Token expiration handling
- Network status awareness

**Key Methods:**
```typescript
class AivoMobileClient {
  // Agent APIs
  processAgentInteraction(data: {...})
  getAgentMetrics(learnerId: string)
  
  // Speech APIs
  analyzeSpeech(formData: FormData)
  
  // Session APIs
  getTodaySession(learnerId: string, subject: string)
  startSession(data: {...})
  updateActivityStatus(sessionId, activityId, status)
  
  // Caregiver APIs
  getCaregiverLearnerOverview(learnerId: string)
  listNotifications()
  respondToDifficultyProposal(proposalId, decision)
  
  // Offline support
  setOnlineStatus(isOnline: boolean)
  clearOfflineQueue()
}
```

**Offline Queue:**
- Automatically queues POST/PUT/PATCH/DELETE when offline
- Processes queue when connection restored
- Max 3 retry attempts per request
- Stored in AsyncStorage for persistence

### 4. Speech Therapy Module ✅

**Location:** `mobile/learner-mobile/src/components/ArticulationPractice.tsx`

**Features:**
- Audio recording with expo-av
- Real-time speech analysis
- Progress tracking through word lists
- Visual feedback (accuracy percentage)
- Play example pronunciation
- Animated UI with Framer Motion equivalent

**Recording Configuration:**
```typescript
{
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  }
}
```

**Word Lists:**
- Target sounds: s, r, l, th
- 6 words per sound
- Progressive difficulty

**API Integration:**
- Uploads audio to `/api/speech/analyze`
- Receives accuracy score (0-1)
- Gets personalized suggestions
- Logs attempts for progress tracking

### 5. Adaptive Learning Session ✅

**Location:** `mobile/learner-mobile/src/components/AdaptiveLearningSession.tsx`

**Features:**
- AI-powered session orchestration
- Virtual tutor with mood states
- Real-time engagement tracking
- Activity-based learning
- Agent integration (PersonalizedLearning, AITutor)
- Offline support (queues interactions)

**Tutor Moods:**
- `encouraging` (💪) - Supportive feedback
- `excited` (🎉) - High energy introduction
- `supportive` (🤗) - Help with struggles
- `celebrating` (✨) - Success recognition

**Stats Tracking:**
- Problems solved count
- Accuracy percentage
- Progress through activities
- Energy/engagement level

**Agent Integration:**
```typescript
// Analyze activity completion
await apiClient.processAgentInteraction({
  learnerId,
  agentType: 'PERSONALIZED_LEARNING',
  action: 'analyze_interaction',
  input: { activityId, isCorrect, difficulty }
});

// Request hint
await apiClient.processAgentInteraction({
  learnerId,
  agentType: 'AI_TUTOR',
  action: 'provide_feedback',
  input: { activityId, requestType: 'hint' }
});
```

**Recommendations:**
- Suggest break (when engagement < 60%)
- Increase difficulty (consistent correct answers)
- Decrease difficulty (multiple incorrect)
- Provide scaffolding

### 6. Parent Dashboard ✅

**Location:** `mobile/parent-teacher-mobile/src/screens/ParentDashboard.tsx`

**Features:**
- Multi-learner support (swipe to switch)
- Real-time metrics (level, focus, lessons, time)
- Progress charts (weekly line chart)
- Domain performance (horizontal bar charts)
- Approval queue (difficulty adjustments)
- AI insights (prioritized recommendations)
- Pull-to-refresh

**Metrics Display:**
```typescript
interface DashboardData {
  currentLevel: number;        // Student's current level
  focusScore: number;          // Focus percentage (0-100)
  lessonsCompleted: number;    // Total lessons completed
  timeSpent: number;           // Minutes spent learning
  progressData: Array<{        // Weekly progress
    date: string;
    score: number;
  }>;
  domainScores: Array<{        // Subject performance
    domain: string;
    score: number;
  }>;
  insights: Array<{            // AI-generated insights
    id: string;
    text: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}
```

**Approval Workflow:**
1. System proposes difficulty adjustment
2. Notification sent to parent
3. Parent reviews in approval queue
4. Parent approves/rejects
5. System applies decision
6. Agent adapts accordingly

## Dependencies

### Learner Mobile App

```json
{
  "expo": "~52.0.0",
  "expo-av": "~14.0.0",
  "expo-secure-store": "~13.0.0",
  "@react-native-async-storage/async-storage": "^2.0.0",
  "@react-navigation/native": "^7.0.0",
  "@react-navigation/native-stack": "^7.0.0",
  "react-native-safe-area-context": ">=4.10.0",
  "react-native-screens": ">=3.31.0"
}
```

### Parent-Teacher Mobile App

```json
{
  "expo": "~52.0.0",
  "expo-secure-store": "~13.0.0",
  "@react-native-async-storage/async-storage": "^2.0.0",
  "@react-navigation/native": "^7.0.0",
  "@react-navigation/native-stack": "^7.0.0",
  "react-native-safe-area-context": ">=4.10.0",
  "react-native-screens": ">=3.31.0"
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
# From workspace root
pnpm install

# Or in each mobile app
cd mobile/learner-mobile
pnpm install

cd mobile/parent-teacher-mobile
pnpm install
```

### 2. Configure Environment

Create `.env` files in each mobile app:

**learner-mobile/.env:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**parent-teacher-mobile/.env:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start Backend Services

```bash
# Start PostgreSQL database
docker-compose -f docker-compose.db.yml up -d

# Run migrations
npx prisma migrate dev

# Start API server
pnpm dev
```

### 4. Start Mobile Apps

**Learner App:**
```bash
cd mobile/learner-mobile
pnpm start
# Then press 'a' for Android or 'i' for iOS
```

**Parent-Teacher App:**
```bash
cd mobile/parent-teacher-mobile
pnpm start
# Then press 'a' for Android or 'i' for iOS
```

## API Endpoints Used

### Authentication
- `POST /api/auth/signin` - Email/password login
- `POST /api/auth/refresh` - Token refresh

### Agent System
- `POST /api/agents/interact` - Process agent interaction
- `GET /api/agents/interact?learnerId={id}` - Get agent metrics

### Speech Therapy
- `POST /api/speech/analyze` - Analyze speech recording

### Learning Sessions
- `GET /sessions/today?learnerId={id}&subject={subject}` - Get today's session
- `POST /sessions/start` - Start new session
- `PATCH /sessions/{sessionId}/activities/{activityId}` - Update activity status

### Caregiver Portal
- `GET /caregiver/learners/{learnerId}/overview` - Dashboard data
- `GET /caregiver/notifications` - List notifications
- `POST /caregiver/notifications/{id}/read` - Mark notification read
- `POST /difficulty/proposals/{id}/decision` - Approve/reject difficulty change

## Testing Checklist

### Authentication
- [ ] Sign in with email/password
- [ ] Sign out and verify token cleared
- [ ] Token auto-refresh on expiration
- [ ] Offline authentication persistence

### Speech Therapy
- [ ] Record audio on iOS
- [ ] Record audio on Android
- [ ] Upload and analyze speech
- [ ] Receive feedback and suggestions
- [ ] Progress through word list
- [ ] Complete all words

### Adaptive Learning
- [ ] Start new session
- [ ] Resume existing session
- [ ] Complete activities
- [ ] Request hints
- [ ] Receive tutor messages
- [ ] Break suggestions when engagement drops
- [ ] Difficulty adjustments

### Parent Dashboard
- [ ] View multiple learners
- [ ] Switch between learners
- [ ] See real-time metrics
- [ ] View progress charts
- [ ] Review domain scores
- [ ] Approve difficulty changes
- [ ] Reject difficulty changes
- [ ] View AI insights

### Offline Support
- [ ] Queue mutations when offline
- [ ] Process queue when online
- [ ] Handle failed requests (max retries)
- [ ] Clear queue manually

## Production Considerations

### Security
1. **HTTPS Only:** Enforce HTTPS in production
2. **Token Security:** Use secure-store for all tokens
3. **API Rate Limiting:** Implement rate limits on backend
4. **Input Validation:** Validate all user inputs
5. **Biometric Auth:** Add biometric unlock option

### Performance
1. **Image Optimization:** Compress audio before upload
2. **Caching:** Cache learner data and session info
3. **Pagination:** Paginate long lists (notifications, history)
4. **Background Sync:** Use background tasks for queue processing
5. **Lazy Loading:** Load charts and heavy components on demand

### Monitoring
1. **Error Tracking:** Sentry or similar
2. **Analytics:** Track feature usage
3. **Performance:** Monitor API response times
4. **Crash Reports:** Log and fix crashes
5. **User Feedback:** In-app feedback mechanism

### Accessibility
1. **Screen Reader:** Full VoiceOver/TalkBack support
2. **Font Scaling:** Support dynamic type sizes
3. **Color Contrast:** WCAG AA compliance
4. **Touch Targets:** Minimum 44x44pt touch areas
5. **Audio Descriptions:** For visual content

## Troubleshooting

### "Cannot connect to API"
- Verify API_URL in .env file
- Check backend server is running
- Use correct IP for physical devices (not localhost)
- Check firewall settings

### "Audio recording fails"
- Request microphone permissions
- Check device audio settings
- Verify expo-av is properly installed
- Test on real device (not simulator)

### "Offline queue not working"
- Check AsyncStorage permissions
- Verify network status detection
- Clear queue and retry: `apiClient.clearOfflineQueue()`

### "Charts not rendering"
- Check data format matches expected structure
- Verify Dimensions.get('window') works
- Test on different screen sizes

## Next Steps

### Planned Enhancements
1. **Push Notifications:** Real-time alerts for parents
2. **Biometric Auth:** Face ID / Touch ID support
3. **Dark Mode:** Full dark theme support
4. **Gamification:** Badges, streaks, rewards
5. **Social Features:** Share progress with family
6. **Localization:** Multi-language support
7. **Offline Mode:** Full offline learning capability
8. **Voice Commands:** Voice control for accessibility

### Integration Roadmap
1. **Google Cloud Speech:** Real speech recognition
2. **Azure Cognitive Services:** Enhanced AI capabilities
3. **Firebase:** Push notifications and analytics
4. **Stripe:** In-app purchases (premium features)
5. **CodePush:** Over-the-air updates

## Support

For issues or questions:
- GitHub Issues: [repository URL]
- Documentation: [docs URL]
- Email: support@aivo.app

---

**Last Updated:** November 23, 2024
**Version:** 5.1.0
**Status:** Production Ready (Pending Speech API Integration)
