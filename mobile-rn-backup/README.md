# AIVO v5 Mobile Applications

React Native (Expo) mobile applications for AIVO learning platform.

## Apps

### 📱 Learner Mobile (Expo)
Student-facing mobile app with speech therapy, adaptive learning sessions, and AI tutoring.

**Features:**
- 🎤 Speech articulation practice with real-time feedback
- 🤖 AI-powered adaptive learning sessions
- 📊 Progress tracking and engagement monitoring
- 🔒 Secure authentication with offline support
- 📴 Offline queue for learning continuity

**Path:** `mobile/learner-mobile/`

### 📱 Learner Mobile Native (React Native)
Full-featured React Native app with Virtual Brain AI integration, real-time WebSocket communication, and adaptive learning.

**Features:**
- 🤖 Virtual Brain chat with cognitive state monitoring
- 📡 Real-time WebSocket for instant AI responses
- 🎨 Material Design UI with animations
- 🔒 Secure MMKV storage with token refresh
- 📊 Progress tracking and skill mastery
- 🗺️ Bottom tab navigation + stack navigation

**Path:** `mobile/learner-mobile-native/`  
**Docs:** See `mobile/learner-mobile-native/README.md` and `NEXT_STEPS.md`

### 👨‍👩‍👧 Parent-Teacher Mobile
Parent and teacher portal for monitoring learner progress and managing approvals.

**Features:**
- 📈 Real-time learner dashboards with metrics
- 📊 Progress charts and domain performance
- ✅ Approval queue for difficulty adjustments
- 💡 AI-generated insights and recommendations
- 🔔 Notifications for important updates

**Path:** `mobile/parent-teacher-mobile/`

## Quick Start

See [MOBILE_QUICKSTART.md](../docs/MOBILE_QUICKSTART.md) for detailed setup instructions.

```bash
# Start backend
docker-compose -f docker-compose.db.yml up -d
cd apps/web && pnpm dev

# Start learner app
cd mobile/learner-mobile
pnpm install
pnpm start

# Start parent-teacher app
cd mobile/parent-teacher-mobile
pnpm install
pnpm start
```

## Shared Code

**Path:** `mobile/shared/`

### Authentication Context
**File:** `shared/auth/AuthContext.tsx`

Provides authentication state and methods across mobile apps:
- Secure token storage (expo-secure-store)
- Email/password and OAuth support
- Automatic token refresh
- Persistent sessions

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

## Technology Stack

- **Framework:** React Native (Expo 52)
- **Navigation:** React Navigation 7
- **State:** React Context + Hooks
- **Storage:** AsyncStorage + SecureStore
- **Audio:** Expo AV
- **API:** Custom mobile client with offline queue
- **TypeScript:** Full type safety

## Architecture

```
mobile/
├── learner-mobile/
│   ├── src/
│   │   └── components/
│   │       ├── ArticulationPractice.tsx    # Speech therapy
│   │       └── AdaptiveLearningSession.tsx # AI learning
│   ├── App.tsx
│   └── package.json
│
├── parent-teacher-mobile/
│   ├── src/
│   │   └── screens/
│   │       └── ParentDashboard.tsx         # Parent portal
│   ├── App.tsx
│   └── package.json
│
└── shared/
    └── auth/
        └── AuthContext.tsx                  # Auth provider
```

## Development

### Install Dependencies
```bash
pnpm install
```

### Start Development Server
```bash
# Learner app
cd mobile/learner-mobile
pnpm start

# Parent-teacher app
cd mobile/parent-teacher-mobile
pnpm start
```

### Run on Device
```bash
# iOS
pnpm ios

# Android
pnpm android
```

### Clear Cache
```bash
pnpm start -c
```

## Environment Variables

Create `.env` file in each app directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

For physical devices, use your computer's IP:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.xxx:3000
```

## Key Components

### Learner Mobile

**ArticulationPractice** (`src/components/ArticulationPractice.tsx`)
- Audio recording with expo-av
- Speech analysis via API
- Progress tracking
- Visual feedback
- 419 lines

**AdaptiveLearningSession** (`src/components/AdaptiveLearningSession.tsx`)
- AI-powered session flow
- Virtual tutor with moods
- Activity management
- Agent integration
- 453 lines

### Parent-Teacher Mobile

**ParentDashboard** (`src/screens/ParentDashboard.tsx`)
- Multi-learner support
- Real-time metrics
- Progress charts
- Approval queue
- AI insights
- 476 lines

## API Integration

### Mobile Client

**Location:** `packages/api-client/src/mobile-client.ts`

**Features:**
- Automatic authentication
- Offline request queue
- Retry logic
- Network awareness

**Usage:**
```typescript
import { AivoMobileClient } from '@aivo/api-client/mobile-client';

const client = new AivoMobileClient({
  baseUrl: 'http://localhost:3000',
  getToken: async () => await getStoredToken(),
  onTokenExpired: () => handleExpiration(),
});

// Use client
await client.analyzeSpeech(formData);
await client.processAgentInteraction({...});
```

## Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
# Install Detox
npm install -g detox-cli

# Run tests
detox test
```

### Manual Testing Checklist

**Learner App:**
- [ ] Sign in / sign out
- [ ] Record speech audio
- [ ] View feedback
- [ ] Complete learning session
- [ ] View progress
- [ ] Work offline and sync

**Parent App:**
- [ ] View dashboard
- [ ] Switch learners
- [ ] Review charts
- [ ] Approve/reject proposals
- [ ] View insights
- [ ] Pull to refresh

## Building

### Development Build
```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### Production Build
```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

## Deployment

### App Store (iOS)
1. Configure app.json with bundle ID
2. Set up Apple Developer account
3. Create App Store Connect entry
4. Build with production profile
5. Submit for review

### Play Store (Android)
1. Configure app.json with package name
2. Set up Google Play Console
3. Create app entry
4. Build signed APK/AAB
5. Submit for review

## Troubleshooting

### Common Issues

**"Cannot connect to API"**
- Check backend is running
- Verify API_URL in .env
- Use IP address for physical devices

**"Microphone permission denied"**
- Enable permissions in device settings
- Restart app after enabling

**"Module not found"**
- Run `pnpm install` in project root
- Clear cache: `pnpm start -c`

See [MOBILE_QUICKSTART.md](../docs/MOBILE_QUICKSTART.md) for detailed troubleshooting.

## Documentation

- **Setup Guide:** [MOBILE_QUICKSTART.md](../docs/MOBILE_QUICKSTART.md)
- **Implementation Details:** [mobile-implementation.md](../docs/mobile-implementation.md)
- **API Reference:** [packages/api-client/](../packages/api-client/)

## Contributing

1. Create feature branch
2. Make changes
3. Test on iOS and Android
4. Submit pull request

## License

Proprietary - AIVO Learning Platform

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@aivo.app
