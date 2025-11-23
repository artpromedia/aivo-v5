# AIVO v5 Mobile Apps - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Studio
- Docker Desktop (for database)

## Quick Start (5 minutes)

### 1. Start Backend Services

```bash
# From project root
cd Aivo-v5.1

# Start PostgreSQL database
docker-compose -f docker-compose.db.yml up -d

# Verify migration is applied
npx prisma migrate status

# Start API server (web app includes API)
cd apps/web
pnpm dev
# API will be running at http://localhost:3000
```

### 2. Start Learner Mobile App

```bash
# New terminal window
cd mobile/learner-mobile

# Install dependencies (first time only)
pnpm install

# Start Expo dev server
pnpm start

# Follow Expo prompts:
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator
# - Scan QR code with Expo Go app for physical device
```

### 3. Start Parent-Teacher Mobile App

```bash
# New terminal window
cd mobile/parent-teacher-mobile

# Install dependencies (first time only)
pnpm install

# Start Expo dev server
pnpm start

# Follow Expo prompts:
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator
# - Scan QR code with Expo Go app for physical device
```

## Testing the Apps

### Learner App Features

1. **Speech Practice**
   - Navigate to Speech Practice
   - Grant microphone permissions
   - Record pronunciation of target word
   - View accuracy feedback
   - Progress through word list

2. **Learning Session**
   - Navigate to Learning Session
   - Complete activities
   - Request hints from AI tutor
   - Watch engagement meter
   - See tutor messages adapt to performance

### Parent-Teacher App Features

1. **Dashboard**
   - View multiple learners (if configured)
   - See real-time metrics
   - Review progress charts
   - Check domain performance

2. **Approval Queue**
   - Review difficulty adjustment proposals
   - Approve or reject changes
   - System adapts based on decision

## Configuration

### API URL Configuration

For **physical devices**, you need to use your computer's IP address:

**Find your IP:**

```bash
# Mac/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

**Update .env files:**

```env
# mobile/learner-mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.1.xxx:3000

# mobile/parent-teacher-mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.1.xxx:3000
```

Replace `192.168.1.xxx` with your actual IP address.

### Test Credentials

Create a test user in the database or use existing credentials:

```sql
-- Connect to database
docker exec -it aivo-v5-postgres psql -U aivo -d aivo_v5

-- Create test user (password: test123)
INSERT INTO "User" (id, email, username, password, role, "isActive")
VALUES (
  'test-user-1',
  'test@aivo.app',
  'testuser',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZQfX' -- bcrypt hash of 'test123'
  'PARENT',
  true
);
```

## Troubleshooting

### "Cannot connect to API"

**Problem:** App can't reach backend server

**Solutions:**
1. Verify backend is running: `curl http://localhost:3000/api/health`
2. Check API_URL in mobile app .env file
3. Use IP address instead of localhost for physical devices
4. Disable firewall temporarily
5. Ensure phone and computer on same WiFi network

### "Microphone permission denied"

**Problem:** Can't record audio

**Solutions:**
1. Go to device Settings → Apps → Expo Go → Permissions
2. Enable Microphone permission
3. Restart the app
4. On iOS simulator: I/O → Input → Microphone

### "Module not found: @aivo/api-client"

**Problem:** Workspace dependencies not linked

**Solutions:**
```bash
# From project root
pnpm install

# Or rebuild workspace
pnpm install --force
```

### "Expo Dev Client crashes"

**Problem:** App crashes on startup

**Solutions:**
1. Clear Expo cache: `expo start -c`
2. Reinstall dependencies: `rm -rf node_modules && pnpm install`
3. Update Expo: `pnpm update expo`

### "Speech analysis returns errors"

**Problem:** Speech API endpoint failing

**Solutions:**
1. Verify backend has `/api/speech/analyze` route
2. Check audio file upload size limits
3. Verify FormData format is correct
4. Check backend logs for errors

## Development Tips

### Hot Reload

Expo supports hot reloading. Save any file to see changes instantly:

```bash
# Force reload
- Press 'r' in Expo terminal

# Clear cache and reload
- Press 'shift + r' in Expo terminal
```

### Debugging

**React Native Debugger:**
```bash
# Install
brew install --cask react-native-debugger

# Start
open "rndebugger://set-debugger-loc?host=localhost&port=8081"

# In app, shake device and select "Debug"
```

**Console Logs:**
- View in Expo terminal
- View in React Native Debugger
- View with `adb logcat` (Android)
- View with Console.app (iOS)

### Testing on Physical Device

**iOS:**
1. Install Expo Go from App Store
2. Scan QR code from Expo dev server
3. Ensure same WiFi network

**Android:**
1. Install Expo Go from Play Store
2. Scan QR code from Expo dev server
3. Ensure same WiFi network

## Building for Production

### iOS (requires Mac + Xcode)

```bash
cd mobile/learner-mobile

# Build for App Store
eas build --platform ios

# Or local build
expo run:ios --configuration Release
```

### Android

```bash
cd mobile/learner-mobile

# Build APK
eas build --platform android

# Or local build
expo run:android --variant release
```

## Environment Variables Reference

### Required Variables

```env
# Backend API base URL
EXPO_PUBLIC_API_URL=http://localhost:3000

# Optional: Enable analytics
EXPO_PUBLIC_ENABLE_ANALYTICS=false

# Optional: Sentry DSN for error tracking
EXPO_PUBLIC_SENTRY_DSN=

# Optional: Google OAuth (for social login)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=
```

## Next Steps

After getting the apps running:

1. **Customize Branding**
   - Update app.json with your app name/icon
   - Customize colors in styles
   - Add your logo assets

2. **Set Up Push Notifications**
   - Configure Firebase Cloud Messaging
   - Update native code for notifications
   - Test notification delivery

3. **Integrate Speech Recognition**
   - Set up Google Cloud Speech-to-Text
   - Update analyzeSpeech in mobile-client.ts
   - Test with real audio samples

4. **Deploy Backend**
   - Deploy to Vercel/Railway/Fly.io
   - Update EXPO_PUBLIC_API_URL
   - Configure production database

5. **Submit to App Stores**
   - Set up Apple Developer account
   - Set up Google Play Console
   - Follow submission guidelines

## Support

- Documentation: `/docs/mobile-implementation.md`
- Issues: GitHub Issues
- Email: support@aivo.app

## Useful Commands

```bash
# Clear all caches
expo start -c

# Check for updates
pnpm outdated

# Update dependencies
pnpm update

# Build and run on device
expo run:ios
expo run:android

# View device logs
npx react-native log-ios
npx react-native log-android

# Analyze bundle size
expo export
```

---

**Last Updated:** November 23, 2024
**Quick Start Time:** ~5 minutes
**Status:** Ready for Development
