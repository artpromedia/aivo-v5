#!/bin/bash

echo "🚀 Building AIVO Learning Mobile App (React Native)"
echo ""

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean previous builds
echo -e "${YELLOW}📦 Step 1: Cleaning previous builds...${NC}"
rm -rf node_modules
rm -rf android/build
rm -rf ios/build
rm -rf ios/Pods
echo -e "${GREEN}✓ Clean complete${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}📦 Step 2: Installing dependencies...${NC}"
pnpm install || npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: iOS Setup
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}🍎 Step 3: Setting up iOS...${NC}"
    cd ios
    pod install || {
        echo -e "${RED}⚠ Pod install failed. Trying with --repo-update...${NC}"
        pod install --repo-update
    }
    cd ..
    echo -e "${GREEN}✓ iOS setup complete${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠ Skipping iOS setup (not on macOS)${NC}"
    echo ""
fi

# Step 4: Android Setup
echo -e "${YELLOW}🤖 Step 4: Setting up Android...${NC}"
cd android
./gradlew clean || {
    echo -e "${RED}⚠ Android clean failed${NC}"
}
cd ..
echo -e "${GREEN}✓ Android setup complete${NC}"
echo ""

# Step 5: Copy environment file
echo -e "${YELLOW}⚙️  Step 5: Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ Created .env from .env.example. Please update with your configuration.${NC}"
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi
echo ""

# Step 6: Build for Android (optional)
if [ "$1" == "--android" ]; then
    echo -e "${YELLOW}🤖 Step 6: Building Android APK...${NC}"
    cd android
    ./gradlew assembleRelease
    cd ..
    echo -e "${GREEN}✓ Android build complete${NC}"
    echo -e "${GREEN}📦 APK location: android/app/build/outputs/apk/release/app-release.apk${NC}"
    echo ""
fi

# Step 7: Build for iOS (optional)
if [ "$1" == "--ios" ] && [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}🍎 Step 7: Building iOS...${NC}"
    cd ios
    xcodebuild -workspace AivoLearningMobile.xcworkspace \
               -scheme AivoLearningMobile \
               -configuration Release \
               -archivePath ./build/AivoLearningMobile.xcarchive \
               archive
    cd ..
    echo -e "${GREEN}✓ iOS build complete${NC}"
    echo ""
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env file with your backend URL"
echo "2. Start Metro bundler: pnpm start"
echo "3. Run on Android: pnpm android"
echo "4. Run on iOS: pnpm ios"
echo ""
echo "To build release versions:"
echo "  Android: ./scripts/build.sh --android"
echo "  iOS: ./scripts/build.sh --ios"
echo ""
