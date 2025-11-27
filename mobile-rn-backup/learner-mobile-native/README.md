# AIVO Learning Mobile - React Native App

**Version:** 5.0.0  
**Platform:** React Native 0.73  
**Location:** `mobile/learner-mobile-native/`

Fully-featured React Native mobile application for AIVO Learning platform with Virtual Brain AI integration, adaptive learning sessions, and real-time WebSocket communication.

---

## ✨ Features

### 🤖 Virtual Brain AI
- Real-time AI chat interface with adaptive responses
- Cognitive state monitoring (attention, engagement, pace)
- Performance metrics tracking
- WebSocket-powered instant communication
- Personalized learning adaptations

### 📚 Learning Hub
- Adaptive learning sessions
- Progress tracking and analytics
- Skill mastery visualization
- Achievement system

### 👤 User Management
- Email/password authentication
- Secure token storage (MMKV)
- Persistent sessions
- Onboarding flow

### 🎨 UI/UX
- Material Design with React Native Paper
- Smooth animations using the built-in React Native Animated API
- Gradient backgrounds
- Bottom tab navigation
- Safe area handling

---

## 🚀 Quick Start

### Prerequisites
- **Node.js:** >= 18.x
- **pnpm:** 8.x or higher
- **React Native CLI:** Latest
- **Xcode:** 14+ (macOS only, for iOS)
- **Android Studio:** Latest (for Android)
- **CocoaPods:** Latest (macOS only, for iOS)

### Installation

```bash
# Navigate to project directory
cd mobile/learner-mobile-native

# Install dependencies
pnpm install

# iOS: Install pods (macOS only)
cd ios && pod install && cd ..

# Copy environment file
cp .env.example .env

# Update .env with your backend URL
# For emulator/simulator: http://localhost:8000
# For physical device: http://YOUR_COMPUTER_IP:8000
```

### Running the App

```bash
# Start Metro bundler
pnpm start

# Run on Android (in a new terminal)
pnpm android

# Run on iOS (macOS only, in a new terminal)
pnpm ios
```

---

## 🏗️ Project Structure

```
mobile/learner-mobile-native/
├── src/
│   ├── App.tsx                    # App entry point with providers
│   ├── screens/                   # Screen components
│   │   ├── auth/                  # Login & Signup
│   │   ├── onboarding/            # Onboarding flow
│   │   ├── home/                  # Home dashboard
│   │   ├── learning/              # Learning Hub & Virtual Brain
│   │   ├── progress/              # Progress tracking
│   │   └── profile/               # User profile
│   ├── navigation/                # Navigation setup
│   │   ├── RootNavigator.tsx     # Root navigation logic
│   │   ├── AuthNavigator.tsx     # Auth flow navigation
│   │   └── MainNavigator.tsx     # Main app tabs
│   ├── components/                # Reusable components
│   │   ├── common/                # MessageBubble, etc.
│   │   └── virtualBrain/          # VirtualBrainAvatar, CognitiveStateIndicator
│   ├── services/                  # API & WebSocket services
│   │   ├── api/aivoApi.ts        # REST API client
│   │   └── websocket/socketManager.ts  # WebSocket manager
│   ├── hooks/                     # Custom React hooks
│   │   ├── useVirtualBrain.ts    # Virtual Brain state & interactions
│   │   └── useLearner.ts         # Learner data management
│   ├── contexts/                  # React Context providers
│   │   ├── AuthContext.tsx       # Authentication state
│   │   ├── VirtualBrainContext.tsx  # Virtual Brain global state
│   │   └── ThemeContext.tsx      # Theme configuration
│   ├── theme/                     # Design system
│   │   └── aivoTheme.ts          # Colors, typography, spacing
│   └── types/                     # TypeScript type definitions
│       └── index.ts              # Shared types
├── android/                       # Android native project
├── ios/                          # iOS native project
├── scripts/                      # Build & utility scripts
│   └── build.sh                  # Build script for both platforms
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
└── .env.example                  # Environment variables template
```

---

## 🔌 Backend Integration

### API Endpoints Used
- **Authentication:**
  - `POST /api/v1/auth/login` - User login
  - `POST /api/v1/auth/signup` - User registration
  - `POST /api/v1/auth/refresh` - Token refresh

- **Virtual Brain:**
  - `POST /api/v1/agents/interact` - Send interaction to Virtual Brain
  - `GET /api/v1/agents/state/{learner_id}` - Get current cognitive state
  - `POST /api/v1/agents/adapt-content` - Request content adaptation

- **Learning:**
  - `POST /api/v1/learning/sessions/start` - Start learning session
  - `POST /api/v1/learning/sessions/{id}/end` - End learning session

- **Progress:**
  - `GET /api/v1/progress/learner/{id}` - Get learner progress
  - `GET /api/v1/progress/skill/{id}` - Get skill-specific progress

### WebSocket Events
**Client → Server:**
- `subscribe_learner` - Subscribe to learner updates
- `virtual_brain_interact` - Send message to Virtual Brain
- `unsubscribe_learner` - Unsubscribe from updates

**Server → Client:**
- `virtual_brain_response` - AI response from Virtual Brain
- `learner_state_update` - Cognitive state changes
- `adapted_content` - Adapted learning content
- `session_update` - Learning session updates
- `progress_update` - Progress changes
- `achievement_unlocked` - Achievement notifications

### Environment Configuration

**`.env` file:**
```env
API_BASE_URL=http://localhost:8000
WS_BASE_URL=ws://localhost:8000
NODE_ENV=development
ENABLE_VIRTUAL_BRAIN=true
ENABLE_VOICE=true
ENABLE_OFFLINE_MODE=true
```

**Physical Device Setup:**
```env
# Replace with your computer's IP address
API_BASE_URL=http://192.168.1.xxx:8000
WS_BASE_URL=ws://192.168.1.xxx:8000
```

---

## 🛠️ Development

### Scripts

```bash
# Development
pnpm start          # Start Metro bundler
pnpm android        # Run on Android
pnpm ios            # Run on iOS

# Code Quality
pnpm lint           # Run ESLint
pnpm lint:fix       # Fix ESLint errors
pnpm format         # Format with Prettier
pnpm typecheck      # TypeScript type checking

# Cleaning
pnpm clean          # Clean node_modules, cache, and reinstall
pnpm android:clean  # Clean Android build
```

### Build Script

The `scripts/build.sh` script automates the setup and build process:

```bash
# Setup only (install deps, configure env)
./scripts/build.sh

# Build Android release APK
./scripts/build.sh --android

# Build iOS release (macOS only)
./scripts/build.sh --ios
```

**What it does:**
1. Cleans previous builds
2. Installs dependencies with pnpm
3. Installs iOS pods (macOS)
4. Cleans Android gradle cache
5. Creates .env from template
6. Optionally builds release versions

---

## 📱 Building for Production

### Android

```bash
# Generate release APK
cd android
./gradlew assembleRelease

# Output location:
# android/app/build/outputs/apk/release/app-release.apk

# Generate signed bundle (for Play Store)
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

**Signing Configuration:**
1. Create `android/app/keystore.properties`:
```properties
storeFile=your-keystore.keystore
storePassword=your-store-password
keyAlias=your-key-alias
keyPassword=your-key-password
```
2. Place keystore in `android/app/`
3. Update `android/app/build.gradle` with signing config

### iOS

```bash
# Build archive (macOS only)
cd ios
xcodebuild -workspace AivoLearningMobile.xcworkspace \
           -scheme AivoLearningMobile \
           -configuration Release \
           -archivePath ./build/AivoLearningMobile.xcarchive \
           archive

# Create IPA for App Store
xcodebuild -exportArchive \
           -archivePath ./build/AivoLearningMobile.xcarchive \
           -exportPath ./build \
           -exportOptionsPlist exportOptions.plist
```

**Configure in Xcode:**
1. Open `ios/AivoLearningMobile.xcworkspace`
2. Select project → Signing & Capabilities
3. Set your Team and Bundle Identifier
4. Configure provisioning profiles

---

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### Manual Testing Checklist

**Authentication:**
- [ ] Sign up with new account
- [ ] Log in with existing account
- [ ] Token refresh on 401
- [ ] Persist session after app restart
- [ ] Sign out

**Virtual Brain:**
- [ ] Connect to WebSocket
- [ ] Send message and receive response
- [ ] View cognitive state
- [ ] See real-time state updates
- [ ] Handle connection loss/reconnect

**Navigation:**
- [ ] Bottom tabs switch correctly
- [ ] Navigate to Virtual Brain from Learning Hub
- [ ] Back navigation works
- [ ] Deep linking (if implemented)

**Offline Mode:**
- [ ] App works with no network (cached data)
- [ ] Queue interactions when offline
- [ ] Sync when back online

---

## 🐛 Troubleshooting

### Common Issues

**"Cannot connect to API"**
- Ensure backend is running (`pnpm dev` in workspace root)
- Check `API_BASE_URL` in `.env`
- For physical devices, use computer's IP address (not localhost)
- Disable firewall or allow port 8000

**"Build failed: CocoaPods"**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**"Android build failed"**
```bash
cd android
./gradlew clean
cd ..
pnpm android
```

**"Metro bundler issues"**
```bash
# Clear cache and restart
pnpm start --reset-cache
```

**"Module not found"**
```bash
# Reinstall dependencies
pnpm clean
```

**"WebSocket won't connect"**
- Check `WS_BASE_URL` in `.env`
- Ensure no SSL mismatch (use `ws://` for http, `wss://` for https)
- Verify backend WebSocket server is running

---

## 📚 Documentation

- **Main Docs:** `docs/mobile-implementation.md`
- **API Reference:** `backend/api/routes/agents.py`
- **WebSocket Guide:** `docs/websocket-integration-guide.md`
- **Monorepo Setup:** `README.md` (workspace root)

---

## 🔐 Security

- Tokens stored in MMKV (encrypted storage)
- Sensitive data in React Native Keychain
- HTTPS enforced in production
- Input validation on all forms
- XSS protection via React Native

---

## 🚢 Deployment

### App Store (iOS)
1. Configure bundle ID in Xcode
2. Set up Apple Developer account
3. Create App Store Connect entry
4. Archive and upload via Xcode or Transporter
5. Submit for review

### Google Play (Android)
1. Configure package name in `android/app/build.gradle`
2. Set up Google Play Console
3. Create app entry
4. Build signed bundle: `./gradlew bundleRelease`
5. Upload AAB to Play Console
6. Submit for review

---

## 📄 License

Proprietary - AIVO Learning Platform

---

## 🤝 Contributing

1. Create feature branch
2. Make changes following ESLint/Prettier rules
3. Test on both iOS and Android
4. Submit pull request

---

## 📧 Support

- **Documentation:** `/docs`
- **GitHub Issues:** artpromedia/aivo-v5
- **Email:** support@aivo.app

---

## 🙏 Acknowledgments

- React Native community
- Socket.IO for WebSocket support
- React Navigation for routing
- React Native Paper for UI components

---

**Built with ❤️ for personalized learning**
