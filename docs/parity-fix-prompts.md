# Web/Mobile Parity Fix Prompts

## Flutter Parent/Teacher App Gaps

### 1. Add Difficulty Recommendations & Baseline Summary to Learner Overview

```
TASK: Add difficulty recommendations and baseline summary to Flutter Learner Overview screen

CONTEXT:
- File: mobile/parent_teacher_flutter/lib/screens/learner_overview_screen.dart
- The web app at apps/parent-teacher-web/app/learner/page.tsx displays difficulty recommendations
  (harder/easier/maintain) and a baseline summary section that the Flutter app is missing.
- The API already returns this data via getCaregiverLearnerOverview()

REQUIREMENTS:
1. Add a "Difficulty Recommendations" card section showing:
   - Subject name
   - Current difficulty level
   - Recommended direction (harder/easier/maintain) with appropriate icons/colors
   - Brief rationale text

2. Add a "Baseline Summary" card section showing:
   - Baseline completion status
   - Subject-level baseline results
   - Any notes from the baseline assessment
   - Date completed

3. Match the visual style of existing cards in the screen (use Card widget with similar padding/styling)

4. Handle empty states gracefully (e.g., "No baseline completed yet")

5. Ensure the data comes from the existing API response - check LearnerOverview model for available fields

REFERENCE:
- Web implementation: apps/parent-teacher-web/app/learner/page.tsx (look for baseline and recommendation sections)
- Existing Flutter screen: mobile/parent_teacher_flutter/lib/screens/learner_overview_screen.dart
```

---

### 2. Add Resolved Proposals History to Difficulty Screen

```
TASK: Add resolved difficulty proposals history to Flutter Difficulty screen

CONTEXT:
- File: mobile/parent_teacher_flutter/lib/screens/difficulty_screen.dart
- The web app shows both pending AND resolved proposals with filtering
- Flutter currently only shows pending proposals

REQUIREMENTS:
1. Add a tab bar or segmented control to switch between "Pending" and "Resolved" proposals

2. For resolved proposals, display:
   - Subject name
   - Original level → New level
   - Decision (approved/rejected)
   - Decision date
   - Who made the decision (if available)

3. Add filtering/sorting options:
   - Filter by subject
   - Sort by date (newest/oldest)

4. Use the existing listDifficultyProposals() API with a status filter parameter
   - Check if API supports status='resolved' filter, if not may need backend update

5. Style resolved proposals differently from pending (e.g., muted colors, checkmark/x icon)

6. Handle empty state: "No resolved proposals yet"

REFERENCE:
- Web implementation: apps/parent-teacher-web/app/difficulty/page.tsx
- Current Flutter: mobile/parent_teacher_flutter/lib/screens/difficulty_screen.dart
```

---

### 3. Add Search Functionality to IEP Dashboard

```
TASK: Add goal search functionality to Flutter IEP Dashboard screen

CONTEXT:
- File: mobile/parent_teacher_flutter/lib/screens/iep_dashboard_screen.dart
- The web app has a search bar to filter goals by text
- Flutter only has category/status dropdowns

REQUIREMENTS:
1. Add a SearchBar or TextField at the top of the screen (below the progress overview card)

2. Implement search that filters goals by:
   - Goal title/name
   - Goal description
   - Category name

3. Search should be case-insensitive and support partial matches

4. Combine search with existing category/status filters (AND logic)

5. Show result count: "Showing X of Y goals"

6. Add a clear search button (X icon) when search has text

7. Debounce search input (300ms) to avoid excessive filtering

8. Handle empty search results: "No goals match your search"

REFERENCE:
- Web implementation: apps/parent-teacher-web/app/iep/page.tsx (look for search input)
- Current Flutter: mobile/parent_teacher_flutter/lib/screens/iep_dashboard_screen.dart
```

---

### 4. Add Recent Values to IEP Data Entry

```
TASK: Add recent values quick reference to Flutter IEP Data Entry screen

CONTEXT:
- File: mobile/parent_teacher_flutter/lib/screens/iep_data_entry_screen.dart
- The web app shows recent data points for quick reference when entering new data
- This helps users see trends and avoid duplicate entries

REQUIREMENTS:
1. Add a "Recent Values" section above the measurement input, showing last 3-5 data points:
   - Date
   - Value + unit
   - Context (classroom/home/etc.)

2. Make recent values tappable to pre-fill the form (optional convenience feature)

3. Show visual indicator if entering a value significantly different from recent trend

4. Handle case where no previous data exists: "This will be the first data point"

5. Load recent values from the goal's existing data points (should be available in goal detail)

6. Style as a compact horizontal scroll or vertical list depending on space

REFERENCE:
- Web implementation: apps/parent-teacher-web/app/iep/[goalId]/add-data/page.tsx
- Current Flutter: mobile/parent_teacher_flutter/lib/screens/iep_data_entry_screen.dart
```

---

### 5. Add Effectiveness Score & AI Recommendations to Sensory Settings

```
TASK: Add effectiveness score and AI recommendations to Flutter Sensory Settings screen

CONTEXT:
- File: mobile/parent_teacher_flutter/lib/screens/sensory_settings_screen.dart
- The web app displays an overall effectiveness score and AI-generated recommendations
- Flutter is missing these features

REQUIREMENTS:
1. Add an "Effectiveness Score" card at the top showing:
   - Overall score (0-100) with circular progress indicator
   - Breakdown by category (visual, auditory, motor, cognitive)
   - Trend indicator (improving/declining/stable)

2. Add an "AI Recommendations" section showing:
   - 2-3 personalized recommendations based on learner's profile
   - Each recommendation should have:
     - Title
     - Description
     - "Apply" button to auto-configure that setting
   - Recommendations should be based on diagnosis, learning patterns, and effectiveness data

3. API requirements:
   - Check if getSensoryProfile() returns effectiveness data
   - May need new endpoint for AI recommendations or include in profile response

4. Style to match existing tab content panels

REFERENCE:
- Web implementation: apps/parent-teacher-web/app/learner/sensory/page.tsx
- Current Flutter: mobile/parent_teacher_flutter/lib/screens/sensory_settings_screen.dart
```

---

## Web Parent/Teacher App Gaps

### 6. Add Chart Visualizations to Analytics Page

```
TASK: Add chart visualizations to Web Analytics page

CONTEXT:
- File: apps/parent-teacher-web/app/learner/analytics/page.tsx
- Flutter app has line charts showing mastery trends over time using fl_chart
- Web app only shows text-based data display

REQUIREMENTS:
1. Install and configure a charting library (recommend recharts - already in package.json)

2. Add a line chart for mastery progression:
   - X-axis: Date/time
   - Y-axis: Mastery percentage (0-100%)
   - Multiple lines for different subjects (color-coded)
   - Tooltip on hover showing exact values

3. Add a bar chart for practice time:
   - X-axis: Subjects
   - Y-axis: Minutes practiced
   - Show weekly/monthly toggle

4. Add factor weights visualization:
   - Pie chart or horizontal bar showing contributing factors
   - Display percentages (e.g., "Accuracy: 50%, Speed: 30%, Consistency: 20%")

5. Make charts responsive for different screen sizes

6. Add loading skeletons for charts while data loads

7. Handle empty data states with placeholder charts

REFERENCE:
- Flutter implementation: mobile/parent_teacher_flutter/lib/screens/learner_analytics_screen.dart
- Current Web: apps/parent-teacher-web/app/learner/analytics/page.tsx
- Recharts docs: https://recharts.org/
```

---

### 7. Add Statistics Tab to IEP Goal Detail

```
TASK: Add Statistics tab to Web IEP Goal Detail page

CONTEXT:
- File: apps/parent-teacher-web/app/iep/[goalId]/page.tsx
- Flutter app has a Statistics tab showing min/max/average/count of data points
- Web app is missing this tab

REQUIREMENTS:
1. Add a fourth tab "Statistics" to the existing tab interface

2. Statistics tab should display:
   - Total data points count
   - Average value
   - Minimum value (with date)
   - Maximum value (with date)
   - Standard deviation (optional)
   - Trend direction (improving/declining/stable)

3. Add visual elements:
   - Stat cards with icons
   - Mini sparkline showing trend
   - Comparison to target (% of goal achieved)

4. Calculate statistics from the goal's data points array

5. Handle edge cases:
   - No data points: "Add data points to see statistics"
   - Single data point: Show value, indicate more data needed for trends

6. Style consistently with other tabs

REFERENCE:
- Flutter implementation: mobile/parent_teacher_flutter/lib/screens/iep_goal_detail_screen.dart (Statistics tab)
- Current Web: apps/parent-teacher-web/app/iep/[goalId]/page.tsx
```

---

### 8. Add Demo Data Fallback to Sensory Settings

```
TASK: Add demo data fallback for offline/error states in Web Sensory Settings

CONTEXT:
- File: apps/parent-teacher-web/app/learner/sensory/page.tsx
- Flutter app gracefully falls back to demo data when API fails
- Web app shows error state with no usable UI

REQUIREMENTS:
1. Create a demo sensory profile constant with realistic default values:
   - Visual: high contrast off, large text off, reduced motion on
   - Auditory: volume 70%, speech rate normal
   - Motor: large touch targets on, gesture support on
   - Cognitive: extended time on, break frequency 25min
   - Environment: minimal distractions on

2. Create demo presets array matching the SENSORY_PRESETS structure

3. When API call fails:
   - Show a banner: "Unable to load saved settings. Showing defaults."
   - Load demo data into the form
   - Allow user to modify and attempt to save
   - Retry button to attempt API call again

4. Add offline detection:
   - Check navigator.onLine
   - Show appropriate message for offline vs server error

5. Cache last successful profile in localStorage as additional fallback

REFERENCE:
- Flutter implementation: mobile/parent_teacher_flutter/lib/screens/sensory_settings_screen.dart (demo data handling)
- Current Web: apps/parent-teacher-web/app/learner/sensory/page.tsx
```

---

## Minor Parity Improvements

### 9. Add Floating Action Button for Calm Corner Access (Web Learner App)

```
TASK: Add floating action button for quick Calm Corner access in Web Learner app

CONTEXT:
- Flutter app has a FAB that appears on most screens for quick access to Calm Corner
- Web app requires navigation through menus

REQUIREMENTS:
1. Create a FloatingActionButton component that:
   - Appears in bottom-right corner
   - Has a calming icon (e.g., lotus, breathing, heart)
   - Pulses gently to attract attention without being distracting
   - Opens Calm Corner/Regulation page on click

2. Add to layout so it appears on:
   - Home/Dashboard
   - Session page
   - Homework page
   - Tutor page

3. Do NOT show on:
   - Calm Corner page itself
   - Settings page
   - During active focus breaks

4. Make it dismissible (user can hide for current session)

5. Respect reduced motion preferences

REFERENCE:
- Flutter implementation: Check main.dart or app scaffold for FAB implementation
- Target files: apps/learner-web/app/layout.tsx or individual page components
```

---

### 10. Add Focus Monitor Service to Web Learner App

```
TASK: Port Focus Monitor Service to Web Learner app

CONTEXT:
- Flutter has FocusMonitorService that tracks user engagement during sessions
- Detects inactivity, suggests breaks, logs focus patterns
- Web app has minimal focus tracking

REQUIREMENTS:
1. Create a useFocusMonitor hook or context that tracks:
   - Last interaction timestamp
   - Interaction count per minute
   - Session duration
   - Inactivity periods

2. Implement inactivity detection:
   - Track mouse moves, clicks, key presses, scroll
   - After 2 minutes of inactivity, show gentle prompt
   - After 5 minutes, suggest taking a break

3. Implement break suggestions:
   - Based on continuous activity time (suggest break every 25-30 min)
   - Show non-intrusive banner or modal

4. Log focus data for analytics:
   - POST to analytics endpoint periodically
   - Include session ID, timestamps, interaction patterns

5. Respect user preferences:
   - Check sensory settings for break frequency preference
   - Allow dismissing suggestions

6. Use Web Workers for background timing if needed

REFERENCE:
- Flutter implementation: mobile/learner_flutter/lib/services/focus_monitor_service.dart
- Target location: apps/learner-web/hooks/useFocusMonitor.ts or similar
```

---

## Execution Priority

### High Priority (Core Feature Gaps):
1. **#6** - Add Chart Visualizations to Web Analytics (high visibility)
2. **#1** - Add Difficulty Recommendations to Flutter Learner Overview
3. **#2** - Add Resolved Proposals History to Flutter Difficulty Screen

### Medium Priority (Usability Improvements):
4. **#5** - Add Effectiveness Score to Flutter Sensory Settings
5. **#7** - Add Statistics Tab to Web IEP Goal Detail
6. **#3** - Add Search to Flutter IEP Dashboard

### Lower Priority (Polish):
7. **#4** - Add Recent Values to Flutter IEP Data Entry
8. **#8** - Add Demo Data Fallback to Web Sensory Settings
9. **#9** - Add FAB for Calm Corner (Web)
10. **#10** - Port Focus Monitor Service (Web)
