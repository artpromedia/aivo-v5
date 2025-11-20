# Mobile Caregiver Application - Feature Guide

This document describes the enhanced mobile caregiver flows in the parent-teacher mobile application.

## Overview

The parent-teacher mobile app provides caregivers (parents, guardians, and teachers) with detailed insights into learner progress and the ability to manage difficulty adjustments proposed by AIVO's adaptive learning system.

## New Features

### 1. Detailed Difficulty Proposal Review

**Screen:** `DifficultyProposalDetailScreen`

Caregivers can now view comprehensive details about difficulty adjustment proposals:

**Features:**
- **Visual Change Summary**: Clear display of current vs. proposed difficulty levels
- **Rationale Explanation**: Detailed reasoning for the proposed change
- **Context-Aware Messaging**: Different explanations for increases vs. decreases in difficulty
- **Creator Attribution**: Shows whether the proposal came from AIVO's system, a teacher, or a parent request
- **Timestamp Information**: When the proposal was created
- **Approve/Reject Actions**: Direct action buttons with loading states

**User Flow:**
1. Tap on a difficulty proposal from the dashboard
2. Review the detailed explanation and rationale
3. Tap "Approve Change" or "Not Right Now"
4. System updates the learner's difficulty level and navigates back

**Technical Details:**
- Fetches full proposal data from API using proposal ID
- Uses React Navigation for smooth transitions
- Implements optimistic UI updates with error handling
- Integrates with `@aivo/ui` theme components

### 2. Learner Progress Overview

**Screen:** `LearnerProgressScreen`

A comprehensive view of learner performance and learning profile:

**Features:**
- **Subject Performance Cards**: 
  - Enrolled grade vs. working level
  - Mastery score percentage
  - Visual difficulty recommendations (color-coded)
  
- **Baseline Assessment Summary**:
  - Notes from initial assessment
  - Per-subject grade level information
  
- **Recent Activity Timeline**:
  - Dates of recent practice sessions
  - Activity patterns
  
- **Learning Profile**:
  - Neurodiversity accommodations (e.g., ADHD-friendly settings)
  - Learning preferences (step-by-step, visual learning)
  - Adaptive features in use

**User Flow:**
1. Tap "View Progress" from dashboard
2. Scroll through different sections
3. Tap back button to return to dashboard

**Technical Details:**
- Uses `getCaregiverLearnerOverview` API endpoint
- Displays rich `CaregiverLearnerOverview` data structure
- Color-coded recommendation badges:
  - 🟠 Orange: "Consider easier material"
  - 🔵 Gray: "Maintaining current pace"
  - 🟢 Green: "Ready for more challenge"

### 3. Enhanced Dashboard Navigation

**Screen:** `DashboardScreen` (updated)

The main dashboard now includes:
- **Tap-to-navigate** difficulty proposals (previously inline actions only)
- **Progress link** to access detailed learner overview
- **Refresh capability** to reload latest data
- **Visual indicators** showing which proposals can be reviewed

## Navigation Structure

```
Login Screen
    ↓
Dashboard Screen
    ├─→ Difficulty Proposal Detail Screen → (approve/reject) → Dashboard
    ├─→ Learner Progress Screen → Dashboard
    └─→ Logout → Login Screen
```

## API Integration

### New Mobile API Methods

Added to `packages/api-client/src/index.ts`:

```typescript
respondToDifficultyProposal(body: { 
  proposalId: string; 
  decision: "approve" | "reject" 
})
```

This method complements the existing `decideOnDifficultyProposal` but uses simpler terminology for mobile contexts.

### Data Flow

1. **Dashboard loads**: `listNotifications()` + `listDifficultyProposals()`
2. **Proposal detail**: `listDifficultyProposals()` → filter by ID
3. **Proposal response**: `respondToDifficultyProposal()` → refresh dashboard
4. **Progress view**: `getCaregiverLearnerOverview()`

## Design Patterns

### Theme Integration
All screens use `NativeThemeProviderByGrade` from `@aivo/ui` for consistent styling across grade levels.

### Error Handling
- Network errors display inline error messages
- Loading states prevent duplicate actions
- Graceful degradation if data is missing

### State Management
- Local component state for UI interactions
- Auth context for global user/token state
- Navigation params for screen-to-screen data passing

### Accessibility
- Large touch targets for buttons
- High contrast text colors
- Clear visual hierarchy
- Descriptive labels

## Future Enhancements

Potential additions to the mobile caregiver experience:

1. **Push Notifications**: Alert caregivers when new proposals arrive
2. **Historical View**: See past difficulty decisions and outcomes
3. **Progress Charts**: Visual graphs of mastery over time
4. **Multi-Learner Support**: Switch between multiple children
5. **Communication Hub**: Direct messaging with teachers
6. **Session Scheduling**: View and manage learning session times
7. **Goal Setting**: Collaborative goal-setting with learners
8. **Offline Mode**: Cache recent data for offline viewing

## Testing

To test the new flows:

1. Start the API gateway: `cd services/api-gateway && pnpm dev`
2. Start the mobile app: `cd mobile/parent-teacher-mobile && pnpm start`
3. Log in with demo credentials: `guardian@example.com` / `dev-password`
4. Interact with difficulty proposals and progress views

## Technical Architecture

**Stack:**
- React Native + Expo
- React Navigation (Native Stack)
- TypeScript (strict mode)
- Aivo UI component library
- Centralized API client

**Key Dependencies:**
- `@react-navigation/native` & `@react-navigation/native-stack`
- `expo-secure-store` (token storage)
- `@aivo/types`, `@aivo/ui`, `@aivo/api-client`

## File Structure

```
mobile/parent-teacher-mobile/
├── App.tsx                    # Root navigation setup
├── src/
│   ├── AuthContext.tsx       # Authentication & API client
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── DashboardScreen.tsx
│       ├── DifficultyProposalDetailScreen.tsx  # NEW
│       └── LearnerProgressScreen.tsx           # NEW
└── tsconfig.json             # Extends mobile base config
```

## Maintenance

When updating these screens:
- Keep consistent with `@aivo/ui` design system
- Maintain TypeScript strict mode compliance
- Test on both iOS and Android
- Update API client if endpoints change
- Document new features in this guide
