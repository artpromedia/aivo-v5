# Gap Fix Prompts for aivo-v5

Use these prompts with Claude Code or similar AI assistants to systematically fix the gaps in the codebase.

---

## 1. LLM Provider SDK Integration (13 TODOs)

**Files:** `services/model-dispatch/src/providers.ts`, `services/model-dispatch/src/server.ts`

```
Wire up all LLM provider SDKs in services/model-dispatch/src/providers.ts. The file has placeholder TODOs for each provider. For each provider:

1. **OpenAI** (line 42): Install `openai` package, implement generate() using OpenAI SDK with chat.completions.create(), implement healthCheck() with a models.list() call
2. **Anthropic** (line 90): Install `@anthropic-ai/sdk`, implement generate() using messages.create(), implement healthCheck()
3. **Google Generative AI** (line 133): Install `@google/generative-ai`, implement generate() using generateContent(), implement healthCheck()
4. **Llama/Together** (line 158): Install `together-ai`, implement generate() for Llama models
5. **Cohere** (line 185): Install `cohere-ai`, implement generate() using chat(), implement healthCheck()
6. **Mistral** (line 213): Install `@mistralai/mistralai`, implement generate() using chat(), implement healthCheck()
7. **HuggingFace** (line 240): Use fetch to HuggingFace Inference API
8. **Groq** (line 267): Install `groq-sdk`, implement generate() using chat.completions.create()
9. **Together AI** (line 294): Already have SDK from Llama, reuse for Together-hosted models
10. **Replicate** (line 321): Install `replicate`, implement generate() using run()
11. **Azure OpenAI** (line 347): Install `@azure/openai`, implement generate() with deployment-based config
12. **AWS Bedrock** (line 378): Install `@aws-sdk/client-bedrock-runtime`, implement generate() using InvokeModelCommand
13. **Custom/OpenAI-compatible** (line 408): Implement using fetch with OpenAI-compatible API format

Also fix line 812 in server.ts to encrypt API keys before storing using the existing encryption utilities.

Ensure all implementations:
- Handle errors gracefully with proper error types
- Respect the timeout settings
- Return responses in the unified ProviderResponse format
- Log appropriately using the existing logger
```

---

## 2. API Gateway Authentication & Real Data (11 TODOs)

**File:** `services/api-gateway/src/server.ts`

```
Replace hardcoded values with real data in services/api-gateway/src/server.ts:

1. **Lines 859-861**: Replace hardcoded tenantId, region, currentGrade with values from the authenticated user's session and learner profile. Use the existing auth middleware to get the user context.

2. **Line 869**: Implement mapping of the actual assessment response from the baseline-assessment service instead of returning mock data.

3. **Line 889**: Implement real auth/tenant resolution - extract tenant from JWT token or session, validate user belongs to tenant.

4. **Line 904**: Link learner profile to real authenticated user ID from the auth context instead of hardcoded learnerId.

5. **Line 926**: Call the brain-orchestrator service to compute real subject levels. Use the existing HTTP client to call brain-orchestrator's /compute-levels endpoint.

6. **Line 959**: Derive per-subject grades from the learner's brain profile data rather than using a single base grade.

7. **Line 991**: Query the database to lookup real caregiver(s) for the learner using Prisma - check the LearnerCaregiver relation.

8. **Line 1561**: Add authorization check to enforce that the authenticated user is a parent/teacher of the specified learner. Query LearnerCaregiver or LearnerTeacher relations.

9. **Line 2151**: Call the model-dispatch service to generate content. Use fetch to POST to model-dispatch /v1/generate endpoint with the prompt and model preferences.

Reference the existing auth patterns in the codebase (packages/auth) and the Prisma schema for the correct relation queries.
```

---

## 3. IEP Upload Backend (18 TODOs)

**File:** `backend/api/routes/iep_upload.py`

```
Implement the IEP upload backend in backend/api/routes/iep_upload.py:

1. **S3 Upload (line 79)**:
   - Use boto3 to upload files to S3
   - Generate a unique key using UUID and original filename
   - Set appropriate content-type metadata
   - Return the S3 URL

2. **Database Records (lines 83, 112, 135, 155, 164, 190, 420)**:
   - Use the existing database session from backend/db/
   - Create IEPDocument model with fields: id, learnerId, fileName, s3Url, status, uploadedAt, processedAt
   - Implement CRUD operations for querying documents by learner/status

3. **Background Processing (line 86)**:
   - Use Python's asyncio or Celery to queue document processing
   - The processing should extract IEP goals using the existing ML models in backend/ml/

4. **Status Tracking (line 135)**:
   - Query Redis or database for real-time processing status
   - Return status enum: PENDING, PROCESSING, COMPLETED, FAILED

5. **Extraction & Verification (lines 211, 225)**:
   - Update extraction records in database
   - Track verification status per extracted goal

6. **Approval Flow (line 365)**:
   - Implement approval logic that moves goals to the active IEP
   - Update goal status and link to learner profile

7. **Delete/Reprocess (lines 382, 399)**:
   - Implement soft delete with status update
   - Requeue for processing by resetting status and calling background task

8. **Goal Validator (line 461)**:
   - Call the brain-orchestrator's goal validation endpoint
   - Validate SMART criteria for IEP goals

9. **Batch Operations (line 516)**:
   - Implement batch verification for multiple goals
   - Use database transactions for atomicity

10. **Export (line 534)**:
    - Generate PDF/CSV export of IEP data
    - Use reportlab or similar for PDF generation

Use the existing Pydantic models in the file for request/response schemas.
```

---

## 4. IEP Goals Backend (8 TODOs)

**File:** `backend/api/routes/iep_goals.py`

```
Replace mock data with real database queries in backend/api/routes/iep_goals.py:

1. **Line 245 - Database Query**:
   - Replace the mock MOCK_GOALS dictionary with actual database queries
   - Use SQLAlchemy or the existing database helpers in backend/db/
   - Query the IEPGoal table filtering by learnerId

2. **Lines 307, 389, 445 - Auth Context**:
   - Import and use the auth dependency from backend/api/dependencies
   - Get current user ID and role from the request's auth context
   - Replace hardcoded "current-teacher", "current-user" values

3. **Line 380 - Role Permissions**:
   - Check user role (TEACHER, PARENT, THERAPIST) for context-specific permissions
   - Teachers can see all notes, parents may have restricted view

4. **Lines 390, 446 - User Role from Auth**:
   - Get actual role from authenticated user
   - Map to appropriate IEP role enum (PARENT, TEACHER, THERAPIST, etc.)

5. **Line 423 - Private Notes Filter**:
   - Filter notes where isPrivate=True based on user role
   - Only show private notes to the author or users with elevated permissions

Create the necessary SQLAlchemy models if they don't exist:
- IEPGoal: id, learnerId, title, description, category, targetDate, status, currentProgress, targetValue, unit, createdAt, createdById
- IEPDataPoint: id, goalId, value, date, notes, recordedById, recordedByRole
- IEPNote: id, goalId, content, authorId, authorRole, isPrivate, createdAt
```

---

## 5. Focus Analytics Backend (3 TODOs)

**File:** `backend/api/routes/focus_analytics.py`

```
Implement persistent storage for focus analytics in backend/api/routes/focus_analytics.py:

1. **Line 139 - Store Analytics**:
   - Create FocusSession SQLAlchemy model with fields: id, learnerId, sessionStart, sessionEnd, focusScore, breaksTaken, distractionsDetected, environmentFactors (JSON)
   - Store each analytics submission in the database
   - Associate with the learner's profile

2. **Line 163 - Store Preferences**:
   - Create or update LearnerFocusPreferences model
   - Fields: learnerId, preferredBreakDuration, focusSessionLength, environmentPreferences (JSON), notificationSettings
   - Use upsert pattern to update existing preferences

3. **Line 180 - Generate Real Insights**:
   - Query historical FocusSession data for the learner
   - Calculate trends: average focus score over time, optimal session lengths, best times of day
   - Use pandas or numpy for statistical analysis
   - Return personalized recommendations based on patterns

Add database migrations for the new models and ensure proper indexes on learnerId for efficient queries.
```

---

## 6. IEP Frontend - Parent/Teacher Web (10+ TODOs)

**Files:** `apps/parent-teacher-web/app/iep/page.tsx`, `apps/parent-teacher-web/app/iep/[goalId]/page.tsx`, `apps/parent-teacher-web/app/iep/[goalId]/add-data/page.tsx`, `apps/parent-teacher-web/components/iep/useIEPDataEntryForm.ts`

```
Implement real API integration for the IEP pages in apps/parent-teacher-web:

1. **Auth Context (page.tsx:494, [goalId]/page.tsx:348)**:
   - Import useAuth or useSession from the existing auth package
   - Replace useState(true) with actual role check: const { user } = useAuth(); const isTeacher = user?.role === 'TEACHER';

2. **Fetch Goals (page.tsx:502)**:
   - Use the @aivo/api-client package to fetch IEP goals
   - Call: apiClient.iep.getGoals(learnerId)
   - Handle loading and error states

3. **Add Goal Modal (page.tsx:552)**:
   - Create AddGoalModal component or use existing modal pattern
   - Form fields: title, description, category, targetDate, targetValue, unit
   - On submit, call apiClient.iep.createGoal()

4. **Goal Detail API ([goalId]/page.tsx:356)**:
   - Fetch single goal: apiClient.iep.getGoal(goalId)
   - Include related data points and notes

5. **Update Status ([goalId]/page.tsx:376)**:
   - Call apiClient.iep.updateGoalStatus(goalId, newStatus)
   - Optimistically update UI, revert on error

6. **Add Note Modal ([goalId]/page.tsx:386)**:
   - Create AddNoteModal with content textarea and privacy toggle
   - Call apiClient.iep.addNote(goalId, { content, isPrivate })

7. **Edit Goal ([goalId]/page.tsx:391)**:
   - Navigate to edit page: router.push(`/iep/${goalId}/edit`)
   - Or open modal with pre-filled form

8. **Share/Export ([goalId]/page.tsx:396)**:
   - Open dropdown/modal with options: Share with team, Export PDF, Export CSV
   - Call appropriate API endpoints

9. **Data Entry Form (useIEPDataEntryForm.ts:244, 261, 265)**:
   - Upload evidence files to S3 via presigned URL
   - Get current user from auth context for recordedBy
   - Submit data point: apiClient.iep.addDataPoint(goalId, dataPoint)

10. **Notes Privacy (IEPNotesList.tsx:91)**:
    - Add isPrivate field to IEPNote type in @aivo/types
    - Update the notes list to show privacy indicator
```

---

## 7. IEP Mobile - Flutter (10 TODOs)

**Files:** `mobile/parent_teacher_flutter/lib/screens/iep_dashboard_screen.dart`, `mobile/parent_teacher_flutter/lib/screens/iep_goal_detail_screen.dart`, `mobile/parent_teacher_flutter/lib/screens/iep_data_entry_screen.dart`

```
Implement real API integration for Flutter IEP screens:

1. **Auth Context (iep_data_entry_screen.dart:815-816, iep_goal_detail_screen.dart:1282-1283)**:
   - Import AuthProvider or use Provider.of<AuthState>(context)
   - Get current user: final user = context.read<AuthProvider>().currentUser;
   - Use user.id for recordedById and user.role for recordedByRole

2. **Dashboard API (iep_dashboard_screen.dart:53)**:
   - Use the existing API client in mobile/shared/lib/api_client.dart
   - Call: await apiClient.get('/api/iep/goals?learnerId=$learnerId')
   - Parse response into List<IEPGoal> models

3. **Add Goal Sheet (iep_dashboard_screen.dart:715)**:
   - Show modal bottom sheet with goal form
   - Fields: title, category dropdown, target date picker, target value
   - Submit via apiClient.post('/api/iep/goals', body: goalData)

4. **Goal Detail Fetch (iep_goal_detail_screen.dart:42)**:
   - Call: await apiClient.get('/api/iep/goals/$goalId')
   - Update state with fetched goal data

5. **Edit Goal Navigation (iep_goal_detail_screen.dart:972)**:
   - Check if user is teacher before showing edit button
   - Navigate: Navigator.pushNamed(context, '/iep/edit', arguments: goal)

6. **Update via API (iep_goal_detail_screen.dart:1031)**:
   - Call: await apiClient.patch('/api/iep/goals/$goalId', body: updates)
   - Show success snackbar, handle errors

7. **Share Functionality (iep_goal_detail_screen.dart:1043)**:
   - Use share_plus package for native sharing
   - Generate shareable link or export data

8. **Save Data Entry (iep_data_entry_screen.dart:823)**:
   - Call: await apiClient.post('/api/iep/goals/$goalId/data-points', body: dataPoint)
   - Navigate back on success with result

Use the existing ApiClient class and add proper error handling with try/catch blocks.
```

---

## 8. ADHD/Executive Function Module (15 TODOs)

**File:** `apps/web/app/(portals)/teacher/learners/[learnerId]/adhd/*.tsx`

```
Implement API integrations for the ADHD/Executive Function module:

1. **Planner (planner/page.tsx:91, 132, 142)**:
   - Generate plan (line 91): POST to /api/adhd/planner/generate with learner context
   - Save plan (line 132): POST to /api/adhd/planner with plan data
   - Load existing (line 142): GET /api/adhd/planner?learnerId=X

2. **Study Module (study/page.tsx:80, 99, 107)**:
   - Fetch study sessions: GET /api/adhd/study-sessions?learnerId=X
   - Create session: POST /api/adhd/study-sessions
   - Update progress: PATCH /api/adhd/study-sessions/:id

3. **Binder (binder/page.tsx:90, 109)**:
   - Fetch binder sections: GET /api/adhd/binder?learnerId=X
   - Add/update section: POST/PATCH /api/adhd/binder

4. **Projects (projects/page.tsx:120, 167, 174)**:
   - Generate breakdown (line 120): POST to /api/adhd/projects/breakdown with project description, call model-dispatch for AI breakdown
   - Save breakdown (line 167): POST /api/adhd/projects
   - Fetch projects (line 174): GET /api/adhd/projects?learnerId=X

5. **Interventions (interventions/page.tsx:135, 162, 175)**:
   - Fetch interventions: GET /api/adhd/interventions?learnerId=X
   - Assign intervention: POST /api/adhd/interventions/assign
   - Update status: PATCH /api/adhd/interventions/:id

6. **Assignments (assignments/page.tsx:97, 120)**:
   - Fetch assignments: GET /api/adhd/assignments?learnerId=X
   - Create AddAssignmentModal component for new assignments

7. **EF Assessment (ef-assessment/page.tsx:163)**:
   - Save profile: POST /api/adhd/ef-profile with assessment results
   - Store in learner's brain profile

Create these API routes in apps/web/app/api/adhd/ following the existing API patterns.
```

---

## 9. Dyslexia Module (5 TODOs)

**File:** `apps/web/app/dyslexia/*.tsx`

```
Implement API integrations for the Dyslexia intervention module:

1. **Profile (profile/page.tsx:9)**:
   - Save dyslexia profile: POST /api/dyslexia/profile
   - Include: reading level, identified challenges, accommodations needed
   - Store in learner's brain profile under dyslexiaProfile field

2. **Phonological Exercises (phonological/page.tsx:19, 24)**:
   - Fetch exercises: GET /api/dyslexia/phonological/exercises?level=X
   - Submit results: POST /api/dyslexia/phonological/results
   - Track progress and adjust difficulty

3. **Fluency Training (fluency/page.tsx:50)**:
   - Fetch fluency passages: GET /api/dyslexia/fluency/passages?level=X
   - Submit reading metrics: POST /api/dyslexia/fluency/results
   - Include: words per minute, accuracy, comprehension score

4. **Phonics Practice (phonics/page.tsx:83)**:
   - Fetch phonics exercises: GET /api/dyslexia/phonics/exercises
   - Organized by pattern type (CVC, blends, digraphs, etc.)
   - Submit results and track mastery

Create API routes at apps/web/app/api/dyslexia/ that:
- Query exercises from database based on learner level
- Store results in LearnerProgress table
- Update brain profile with skill assessments
- Call model-dispatch for adaptive content generation when needed
```

---

## 10. Speech Analysis & Homework Upload (5 TODOs)

**Files:** `apps/web/app/api/speech/analyze/route.ts`, `apps/web/app/api/homework/sessions/[id]/upload/route.ts`

```
Implement real integrations for speech analysis and homework upload:

**Speech Analysis (apps/web/app/api/speech/analyze/route.ts):**

1. **Line 55 - Actual Speech Analysis**:
   - Integrate with a speech analysis service (Azure Speech, Google Speech-to-Text, or AssemblyAI)
   - Extract: transcription, pronunciation accuracy, fluency metrics, articulation patterns
   - For SLP module, analyze specific phonemes and speech patterns

2. **Line 139 - Database Storage**:
   - Create SpeechAnalysisResult model in Prisma
   - Fields: id, learnerId, sessionId, audioUrl, transcription, metrics (JSON), createdAt
   - Store results for progress tracking over time

**Homework Upload (apps/web/app/api/homework/sessions/[id]/upload/route.ts):**

3. **Line 95 - File Storage**:
   - Use AWS S3 or Google Cloud Storage
   - Generate presigned upload URL for client-side upload
   - Or use server-side upload with multipart form data
   - Store file metadata in HomeworkSubmission table

4. **Line 169 - AI Integration**:
   - Call model-dispatch service for homework analysis
   - POST to model-dispatch with image/document and analysis prompt
   - Extract: problem type, student work, potential errors, suggested feedback

5. **Line 286 - OCR Implementation**:
   - Integrate Tesseract.js for client-side OCR, or
   - Use cloud OCR service (Azure Computer Vision, Google Vision, AWS Textract)
   - Extract handwritten text from homework images
   - Return structured text for AI analysis

Add proper error handling, file type validation, and size limits.
```

---

## 11. Adaptive Learning & ML Services (7 TODOs)

**Files:** `packages/agents/src/ml/AdaptiveLevelAdjustment.ts`, `packages/agents/src/ml/FederatedAggregationService.ts`

```
Complete the ML service implementations:

**AdaptiveLevelAdjustment.ts:**

1. **Line 303 - Calculate Average Time**:
   - Query SessionData from database for the learner
   - Calculate: totalTime / numberOfTasks for recent sessions
   - Consider task complexity weighting

2. **Line 318 - Store Notifications**:
   - Create LevelAdjustmentNotification model in Prisma:
     - id, learnerId, adjustmentType, fromLevel, toLevel, reason, urgency, createdAt, readAt
   - Insert notification record when adjustment detected

3. **Lines 338-339 - Send Notifications**:
   - For dashboard: Use WebSocket to push real-time notification via existing socket infrastructure
   - For email/SMS:
     - Use @aivo/email package for email notifications
     - Integrate Twilio or similar for SMS on "immediate" urgency
   - Check user notification preferences before sending

4. **Lines 379-380 - Log & Notify Agent**:
   - Create LevelAdjustmentHistory table for audit trail
   - Emit event to PersonalizedLearningAgent using the existing event bus in packages/agents
   - Agent should reload learner configuration on receiving event

**FederatedAggregationService.ts:**

5. **Line 296 - Model Evaluation**:
   - Load test dataset from configured path or S3
   - Run aggregated model on test set
   - Calculate metrics: accuracy, precision, recall, F1
   - Compare with baseline and previous aggregation
   - Log results and trigger alerts if performance degrades
```

---

## 12. Brain Orchestrator Integration (3 TODOs)

**Files:** `services/brain-orchestrator/src/brainOrchestrator.ts`, `services/brain-orchestrator/src/tutorOrchestration.ts`

```
Complete brain orchestrator integrations:

1. **Content Authoring Integration (brainOrchestrator.ts:72)**:
   - Import ContentAuthoringService from the content authoring module
   - When generating lessons, check if custom content exists for the topic
   - Blend AI-generated content with authored curriculum content
   - Respect content authoring priorities and overrides
   - Example:
     ```typescript
     const authoredContent = await contentAuthoringService.getContentForTopic(topicId, learnerId);
     if (authoredContent) {
       // Merge with generated content, authored takes precedence
       lessonContent = mergeContent(generatedContent, authoredContent);
     }
     ```

2. **Persist Conversation History (tutorOrchestration.ts:392)**:
   - Create ConversationHistory table in Prisma:
     - id, sessionId, learnerId, role, content, timestamp, metadata (JSON)
   - Store each turn of the tutoring conversation
   - Enable future analysis of tutoring effectiveness
   - Use for training data (with consent) and debugging
   - Example:
     ```typescript
     await prisma.conversationHistory.create({
       data: {
         sessionId: session.id,
         learnerId: learner.id,
         role: message.role,
         content: message.content,
         metadata: { model: modelUsed, latency: responseTime }
       }
     });
     ```

3. **Goal Validator Service (referenced in iep_upload.py:461)**:
   - Create /validate-goal endpoint in brain-orchestrator
   - Check SMART criteria: Specific, Measurable, Achievable, Relevant, Time-bound
   - Use AI to analyze goal text and suggest improvements
   - Return validation result with suggestions
```

---

## 13. Mobile Infrastructure (3 TODOs)

**Files:** `mobile/shared/lib/logger.dart`, `mobile/learner_flutter/lib/main.dart`, `mobile/learner_flutter/lib/screens/*.dart`

```
Implement mobile infrastructure improvements:

1. **Remote Logging (mobile/shared/lib/logger.dart:90)**:
   - Add Sentry integration:
     ```dart
     import 'package:sentry_flutter/sentry_flutter.dart';

     Future<void> _sendToRemote(LogLevel level, String message, Object? error, StackTrace? stackTrace) async {
       if (level == LogLevel.error || level == LogLevel.fatal) {
         await Sentry.captureException(
           error ?? Exception(message),
           stackTrace: stackTrace,
         );
       } else if (level == LogLevel.warning) {
         Sentry.captureMessage(message, level: SentryLevel.warning);
       }
     }
     ```
   - Initialize Sentry in main.dart with DSN from environment
   - Add user context when authenticated

2. **Learner ID from Auth (mobile/learner_flutter/lib/main.dart:37)**:
   - Replace hardcoded learner ID with auth state:
     ```dart
     final authProvider = Provider.of<AuthProvider>(context, listen: false);
     final learnerId = authProvider.currentUser?.learnerId;
     ```
   - Handle unauthenticated state appropriately

3. **Analytics Navigation (mobile/learner_flutter/lib/screens/home_screen.dart:311)**:
   - Create AnalyticsDetailScreen with charts and progress data
   - Navigate: Navigator.pushNamed(context, '/analytics')
   - Show: learning time trends, skill progress, achievements

4. **Regulation Save (mobile/learner_flutter/lib/screens/regulation_screen.dart:264)**:
   - Save regulation check-in to API:
     ```dart
     await apiClient.post('/api/learners/$learnerId/regulation', body: {
       'emotionLevel': selectedEmotion,
       'strategy': selectedStrategy,
       'notes': notes,
       'timestamp': DateTime.now().toIso8601String(),
     });
     ```
```

---

## 14. Independent Living Skills (1 TODO)

**File:** `apps/web/app/(portals)/teacher/learners/[learnerId]/independent-living/skills/page.tsx`

```
Implement skill assignment for Independent Living Skills module:

**Line 160 - Skill Assignment**:

1. Create API endpoint: POST /api/ils/assignments
   - Request body: { learnerId, skillId, targetDate, customizations }
   - Create ILSAssignment record in database

2. Create assignment modal/form:
   - Select skill from available skills list
   - Set target completion date
   - Add customizations (accommodations, modifications)
   - Assign support staff if applicable

3. Update the UI:
   ```typescript
   const handleAssignSkill = async (skillId: string) => {
     setIsAssigning(true);
     try {
       await apiClient.ils.assignSkill({
         learnerId,
         skillId,
         targetDate: selectedDate,
         customizations: selectedAccommodations,
       });
       toast.success('Skill assigned successfully');
       refetchAssignments();
     } catch (error) {
       toast.error('Failed to assign skill');
     } finally {
       setIsAssigning(false);
     }
   };
   ```

4. Add progress tracking:
   - PATCH /api/ils/assignments/:id for status updates
   - Track: NOT_STARTED, IN_PROGRESS, MASTERED
   - Record evidence and notes for each skill
```

---

## 15. Notification System (1 TODO)

**File:** `scripts/run-federated-aggregation.ts`

```
Implement notification system for federated learning aggregation results:

**Line 70 - Notification Implementation**:

1. Add notification channels:
   ```typescript
   import { EmailService } from '@aivo/email';
   import { WebClient } from '@slack/web-api';

   interface NotificationConfig {
     email?: { recipients: string[] };
     slack?: { channel: string; webhookUrl: string };
   }

   async function sendNotifications(
     result: AggregationResult,
     config: NotificationConfig
   ) {
     const message = formatAggregationResult(result);

     // Email notification
     if (config.email) {
       const emailService = new EmailService();
       await emailService.send({
         to: config.email.recipients,
         subject: `Federated Aggregation Complete - ${result.status}`,
         html: message,
       });
     }

     // Slack notification
     if (config.slack) {
       const slack = new WebClient(process.env.SLACK_TOKEN);
       await slack.chat.postMessage({
         channel: config.slack.channel,
         text: message,
         attachments: [
           {
             color: result.status === 'success' ? 'good' : 'danger',
             fields: [
               { title: 'Models Aggregated', value: result.modelCount.toString() },
               { title: 'Accuracy Delta', value: result.accuracyDelta.toFixed(4) },
             ],
           },
         ],
       });
     }
   }
   ```

2. Load config from environment or settings file
3. Call sendNotifications after aggregation completes
4. Handle failures gracefully - log but don't fail the aggregation
```

---

## 16. AAC Admin Check (1 TODO)

**File:** `backend/api/routes/aac.py`

```
Add admin permission check to AAC configuration endpoint:

**Line 250 - Admin Check**:

```python
from backend.api.dependencies import get_current_user, require_role

@router.put("/config/{learner_id}")
async def update_aac_config(
    learner_id: str,
    config: AACConfigUpdate,
    current_user: User = Depends(get_current_user),
):
    # Check if user has admin/teacher role for this learner
    if not await has_permission(current_user, learner_id, ["ADMIN", "TEACHER", "SLP"]):
        raise HTTPException(
            status_code=403,
            detail="Only administrators, teachers, or SLPs can modify AAC configuration"
        )

    # Additional check: SLPs can only modify communication-related settings
    if current_user.role == "SLP" and config.has_non_communication_changes():
        raise HTTPException(
            status_code=403,
            detail="SLPs can only modify communication-related AAC settings"
        )

    # Proceed with update
    return await update_config(learner_id, config)

async def has_permission(user: User, learner_id: str, allowed_roles: list[str]) -> bool:
    if user.role == "ADMIN":
        return True
    if user.role in allowed_roles:
        # Check if user is assigned to this learner
        return await is_assigned_to_learner(user.id, learner_id)
    return False
```

Add the permission check helper to backend/api/dependencies.py for reuse across routes.
```

---

## Usage Instructions

1. **Copy the relevant prompt** for the gap you want to fix
2. **Paste into Claude Code** or your AI assistant
3. **The AI will implement** the changes across the specified files
4. **Review and test** the changes before committing
5. **Run tests**: `pnpm test` and `pnpm lint`

## Priority Order (Recommended)

1. **High Priority (Core Functionality)**:
   - Prompt #2: API Gateway Authentication (blocks other features)
   - Prompt #1: LLM Provider SDKs (enables AI features)
   - Prompt #3-4: IEP Backend (core feature)

2. **Medium Priority (Feature Completion)**:
   - Prompt #6-7: IEP Frontend/Mobile
   - Prompt #8-9: ADHD & Dyslexia modules
   - Prompt #10: Speech & Homework

3. **Lower Priority (Enhancement)**:
   - Prompt #11: ML Services
   - Prompt #12: Brain Orchestrator
   - Prompt #13: Mobile Infrastructure
   - Prompt #14-16: Remaining items
