# TODO Implementation Prompts

This document contains detailed implementation prompts for completing the remaining TODO items in the AIVO v5 codebase. Each prompt is designed to be self-contained and actionable.

---

## 1. Authentication Context Integration (Python Backend)

### Prompt: Implement Auth Context for Python FastAPI Routes

**Files to modify:**
- `backend/api/routes/iep_upload.py`
- `backend/api/routes/iep_goals.py`
- `backend/api/dependencies/auth.py`

**Task:**
Implement authentication context integration for the Python FastAPI backend to replace hardcoded user IDs with actual authenticated user information.

**Requirements:**

1. Create/update the auth dependency in `backend/api/dependencies/auth.py`:
```python
# Implement get_current_user dependency that:
# - Extracts JWT token from Authorization header
# - Validates token against the same secret used by Node.js services
# - Returns user object with: id, email, role, tenant_id
# - Handles token expiration and invalid tokens with proper HTTP exceptions
```

2. Update IEP upload routes (`backend/api/routes/iep_upload.py`):
   - Line 177: Replace `user_id = "system"` with `current_user.id` from auth dependency
   - Line 445-446: Replace `verified_by_id = "system"` with authenticated user
   - Line 1028-1029: Replace hardcoded `verified_by_id` with authenticated user

3. Update IEP goals routes (`backend/api/routes/iep_goals.py`):
   - Line 540: Replace `"current-user"` with `current_user.id`
   - Line 541: Replace `"PARENT"` with `current_user.role`

**Implementation Details:**
```python
# backend/api/dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from core.config import settings

security = HTTPBearer()

class CurrentUser:
    def __init__(self, id: str, email: str, role: str, tenant_id: str):
        self.id = id
        self.email = email
        self.role = role
        self.tenant_id = tenant_id

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> CurrentUser:
    """Extract and validate user from JWT token."""
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"]
        )
        return CurrentUser(
            id=payload["sub"],
            email=payload["email"],
            role=payload["role"],
            tenant_id=payload.get("tenantId", "default")
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# Optional: For routes that can work without auth
async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))
) -> Optional[CurrentUser]:
    if not credentials:
        return None
    return await get_current_user(credentials)
```

**Usage in routes:**
```python
from api.dependencies.auth import get_current_user, CurrentUser

@router.post("/upload", response_model=UploadResponse)
async def upload_iep_document(
    learner_id: str,
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),  # Add this
    # ... rest of params
):
    # Replace: user_id = "system"
    user_id = current_user.id
```

**Acceptance Criteria:**
- [ ] All IEP routes use authenticated user ID
- [ ] Token validation matches Node.js service validation
- [ ] Proper 401 errors for invalid/expired tokens
- [ ] User role is correctly extracted for authorization checks

---

## 2. Notification System Implementation

### Prompt: Implement Multi-Channel Notification System

**Files to modify:**
- `scripts/run-federated-aggregation.ts` (line 70)
- `packages/agents/src/ml/AdaptiveLevelAdjustment.ts` (lines 318, 338-339)
- New: `packages/notifications/` package

**Task:**
Create a comprehensive notification system that supports email, SMS, push notifications, and in-app dashboard notifications for level adjustment recommendations and other system events.

**Requirements:**

1. Create new `@aivo/notifications` package:
```
packages/notifications/
├── src/
│   ├── index.ts
│   ├── NotificationService.ts
│   ├── channels/
│   │   ├── EmailChannel.ts
│   │   ├── SMSChannel.ts
│   │   ├── PushChannel.ts
│   │   └── DashboardChannel.ts
│   ├── templates/
│   │   ├── level-adjustment.ts
│   │   ├── iep-update.ts
│   │   └── system-alert.ts
│   └── types.ts
├── package.json
└── tsconfig.json
```

2. Implement NotificationService:
```typescript
// packages/notifications/src/NotificationService.ts

interface NotificationPayload {
  type: 'level_adjustment' | 'iep_update' | 'system_alert' | 'reminder';
  recipientId: string;
  recipientType: 'parent' | 'teacher' | 'admin';
  channels: ('email' | 'sms' | 'push' | 'dashboard')[];
  urgency: 'immediate' | 'high' | 'normal' | 'low';
  data: Record<string, any>;
}

interface NotificationResult {
  success: boolean;
  channelResults: {
    channel: string;
    sent: boolean;
    error?: string;
  }[];
}

class NotificationService {
  // Send notification through configured channels
  async send(payload: NotificationPayload): Promise<NotificationResult>;

  // Store notification in database for dashboard display
  async createDashboardNotification(payload: NotificationPayload): Promise<void>;

  // Get user's notification preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences>;

  // Batch send notifications (for scheduled jobs)
  async sendBatch(payloads: NotificationPayload[]): Promise<NotificationResult[]>;
}
```

3. Integrate with AdaptiveLevelAdjustment:
```typescript
// In packages/agents/src/ml/AdaptiveLevelAdjustment.ts

import { NotificationService } from '@aivo/notifications';

private async createNotification(
  learnerId: string,
  recommendations: LevelRecommendation[]
): Promise<void> {
  const notificationService = new NotificationService();

  // Get parent/teacher IDs for this learner
  const recipients = await this.getNotificationRecipients(learnerId);

  for (const recipient of recipients) {
    await notificationService.send({
      type: 'level_adjustment',
      recipientId: recipient.id,
      recipientType: recipient.role,
      channels: this.getChannelsForUrgency(recommendations[0].urgency),
      urgency: recommendations[0].urgency,
      data: {
        learnerId,
        recommendations,
        learnerName: await this.getLearnerName(learnerId),
      }
    });
  }
}

private getChannelsForUrgency(urgency: string): string[] {
  switch (urgency) {
    case 'immediate':
      return ['email', 'sms', 'push', 'dashboard'];
    case 'high':
      return ['email', 'push', 'dashboard'];
    default:
      return ['dashboard'];
  }
}
```

4. Email templates:
```typescript
// packages/notifications/src/templates/level-adjustment.ts

export const levelAdjustmentEmail = {
  subject: (data: any) =>
    `Learning Level Recommendation for ${data.learnerName}`,

  html: (data: any) => `
    <h2>Level Adjustment Recommendation</h2>
    <p>Our adaptive learning system has identified potential adjustments for ${data.learnerName}:</p>
    <ul>
      ${data.recommendations.map((r: any) => `
        <li>
          <strong>${r.domain}</strong>: ${r.reason}
          <br>Recommended: ${r.currentLevel} → ${r.recommendedLevel}
        </li>
      `).join('')}
    </ul>
    <p><a href="${data.dashboardUrl}">Review and approve in your dashboard</a></p>
  `
};
```

**Database Schema Addition:**
```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String
  type        String
  title       String
  message     String
  data        Json?
  read        Boolean  @default(false)
  readAt      DateTime?
  urgency     String   @default("normal")
  channels    String[] // channels used to send
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId, read])
  @@index([createdAt])
}
```

**Acceptance Criteria:**
- [ ] Email notifications sent via configured provider (SendGrid/SES)
- [ ] SMS notifications via Twilio for immediate urgency
- [ ] Push notifications via Firebase Cloud Messaging
- [ ] Dashboard notifications stored in database
- [ ] User preferences respected for channel selection
- [ ] Templates are customizable and localized

---

## 3. Frontend API Integration

### Prompt: Connect Frontend Components to Backend APIs

**Files to modify:**
- `apps/parent-teacher-web/app/iep/[goalId]/page.tsx`
- `apps/parent-teacher-web/app/iep/[goalId]/add-data/page.tsx`
- `apps/parent-teacher-web/app/iep/page.tsx`
- `apps/parent-teacher-web/components/iep/useIEPDataEntryForm.ts`
- `apps/web/app/dyslexia/**/*.tsx`
- `apps/web/app/(portals)/teacher/learners/[learnerId]/adhd/**/*.tsx`

**Task:**
Replace all mock data and placeholder API calls with actual backend API integration using the `@aivo/api-client` package.

**Requirements:**

1. **IEP Goal Detail Page** (`apps/parent-teacher-web/app/iep/[goalId]/page.tsx`):
```typescript
// Replace lines 348-391

import { useApiClient } from '@aivo/api-client';
import { useAuth } from '@/hooks/useAuth';

export default function GoalDetailPage({ params }: Props) {
  const { goalId } = params;
  const api = useApiClient();
  const { user } = useAuth();

  const [goal, setGoal] = useState<IEPGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('progress');

  // Get role from auth context instead of hardcoded
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // Load goal from API
  useEffect(() => {
    const loadGoal = async () => {
      setLoading(true);
      try {
        const response = await api.iep.getGoal(goalId);
        setGoal(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load goal');
      } finally {
        setLoading(false);
      }
    };
    loadGoal();
  }, [goalId, api]);

  // Update goal status
  const handleStatusChange = async (newStatus: GoalStatus) => {
    try {
      await api.iep.updateGoalStatus(goalId, newStatus);
      setGoal(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Add note
  const handleAddNote = async (content: string, isPrivate: boolean) => {
    try {
      const note = await api.iep.addGoalNote(goalId, { content, isPrivate });
      setGoal(prev => prev ? {
        ...prev,
        notes: [...prev.notes, note.data]
      } : null);
      toast.success('Note added');
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  // Edit goal
  const handleEditGoal = () => {
    router.push(`/iep/${goalId}/edit`);
  };

  // Share/export
  const handleShare = async () => {
    try {
      const exportUrl = await api.iep.exportGoal(goalId, 'pdf');
      window.open(exportUrl.data.url, '_blank');
    } catch (err) {
      toast.error('Failed to export goal');
    }
  };
}
```

2. **IEP Data Entry Form** (`apps/parent-teacher-web/components/iep/useIEPDataEntryForm.ts`):
```typescript
// Replace lines 244-265

import { useApiClient } from '@aivo/api-client';
import { useAuth } from '@/hooks/useAuth';

export function useIEPDataEntryForm(goalId: string) {
  const api = useApiClient();
  const { user } = useAuth();

  const submitDataPoint = async (formData: DataPointFormData) => {
    // Upload evidence file if present
    let evidenceUrl: string | undefined;
    if (formData.evidenceFile) {
      const uploadResponse = await api.files.upload(formData.evidenceFile, {
        folder: `iep/${goalId}/evidence`,
        allowedTypes: ['image/*', 'application/pdf', 'video/*']
      });
      evidenceUrl = uploadResponse.data.url;
    }

    // Create the data point
    const dataPoint = await api.iep.addDataPoint(goalId, {
      value: formData.value,
      date: formData.date,
      setting: formData.setting,
      notes: formData.notes,
      evidenceUrl,
      recordedBy: user?.name || 'Unknown',
      recordedById: user?.id,
    });

    return dataPoint.data;
  };

  return { submitDataPoint, /* other form methods */ };
}
```

3. **ADHD Study Sessions** (`apps/web/app/(portals)/teacher/learners/[learnerId]/adhd/study/page.tsx`):
```typescript
// Replace lines 80-107

import { useApiClient } from '@aivo/api-client';

export default function StudySessionsPage({ params }: Props) {
  const api = useApiClient();
  const { learnerId } = params;

  // Start new study session
  const handleStartSession = async (settings: StudySessionSettings) => {
    try {
      const session = await api.adhd.createStudySession(learnerId, {
        subject: settings.subject,
        plannedDuration: settings.duration,
        breakInterval: settings.breakInterval,
        breakDuration: settings.breakDuration,
      });
      setActiveSession(session.data);
      toast.success('Study session started');
    } catch (err) {
      toast.error('Failed to start session');
    }
  };

  // Record interval completion
  const handleIntervalComplete = async (
    sessionId: string,
    intervalData: IntervalData
  ) => {
    try {
      await api.adhd.recordStudyInterval(sessionId, {
        intervalNumber: intervalData.number,
        focusRating: intervalData.focusRating,
        completedTasks: intervalData.tasks,
        distractions: intervalData.distractions,
      });
    } catch (err) {
      console.error('Failed to record interval:', err);
    }
  };

  // End session
  const handleEndSession = async (sessionId: string) => {
    try {
      const summary = await api.adhd.endStudySession(sessionId, {
        completionStatus: 'completed',
        selfRating: selfRating,
        reflectionNotes: notes,
      });
      setSessionSummary(summary.data);
      toast.success('Session completed!');
    } catch (err) {
      toast.error('Failed to end session');
    }
  };
}
```

4. **Dyslexia Phonics** (`apps/web/app/dyslexia/phonics/page.tsx`):
```typescript
// Replace line 83

const handleSaveSession = async (sessionData: DecodingSessionData) => {
  try {
    await api.dyslexia.saveDecodingSession(learnerId, {
      skillsAssessed: sessionData.skills,
      wordsAttempted: sessionData.words,
      accuracy: sessionData.accuracy,
      errors: sessionData.errors,
      duration: sessionData.duration,
    });
    toast.success('Session saved');
    router.push('/dyslexia/dashboard');
  } catch (err) {
    toast.error('Failed to save session');
  }
};
```

5. **Create API Client Methods** (if not existing):
```typescript
// packages/api-client/src/modules/iep.ts

export class IEPApi {
  constructor(private client: HttpClient) {}

  getGoal(goalId: string) {
    return this.client.get<IEPGoal>(`/api/iep/goals/${goalId}`);
  }

  updateGoalStatus(goalId: string, status: GoalStatus) {
    return this.client.patch(`/api/iep/goals/${goalId}/status`, { status });
  }

  addGoalNote(goalId: string, data: { content: string; isPrivate: boolean }) {
    return this.client.post(`/api/iep/goals/${goalId}/notes`, data);
  }

  addDataPoint(goalId: string, data: DataPointInput) {
    return this.client.post(`/api/iep/goals/${goalId}/data`, data);
  }

  exportGoal(goalId: string, format: 'pdf' | 'csv') {
    return this.client.get(`/api/iep/goals/${goalId}/export?format=${format}`);
  }
}

// packages/api-client/src/modules/adhd.ts

export class ADHDApi {
  constructor(private client: HttpClient) {}

  createStudySession(learnerId: string, data: StudySessionInput) {
    return this.client.post(`/api/adhd/learners/${learnerId}/study-sessions`, data);
  }

  recordStudyInterval(sessionId: string, data: IntervalInput) {
    return this.client.post(`/api/adhd/study-sessions/${sessionId}/intervals`, data);
  }

  endStudySession(sessionId: string, data: EndSessionInput) {
    return this.client.post(`/api/adhd/study-sessions/${sessionId}/end`, data);
  }
}
```

**Acceptance Criteria:**
- [ ] All mock data replaced with API calls
- [ ] Proper loading and error states
- [ ] Toast notifications for success/failure
- [ ] Optimistic updates where appropriate
- [ ] Proper TypeScript types for all API responses

---

## 4. Level Adjustment History & Agent Reload

### Prompt: Implement Level Adjustment Persistence and Agent Notification

**Files to modify:**
- `packages/agents/src/ml/AdaptiveLevelAdjustment.ts` (lines 379-380)
- `prisma/schema.prisma`
- `packages/agents/src/PersonalizedLearningAgent.ts`

**Task:**
Implement database persistence for level adjustments and create a mechanism to notify the PersonalizedLearningAgent to reload its configuration when levels change.

**Requirements:**

1. **Database Schema:**
```prisma
// Add to prisma/schema.prisma

model LevelAdjustmentHistory {
  id                String   @id @default(cuid())
  learnerId         String
  domain            String   // MATH, READING, etc.
  previousLevel     Float
  newLevel          Float
  adjustmentType    String   // 'increase' | 'decrease'
  reason            String
  confidence        Float
  approvedBy        String?  // User ID who approved
  approvedAt        DateTime?
  status            String   @default("pending") // pending, approved, rejected
  metrics           Json     // Performance metrics that triggered this
  createdAt         DateTime @default(now())

  learner           Learner  @relation(fields: [learnerId], references: [id])

  @@index([learnerId, domain])
  @@index([status])
  @@index([createdAt])
}
```

2. **Implement History Logging:**
```typescript
// In AdaptiveLevelAdjustment.ts

import { prisma } from '@aivo/persistence';
import { EventEmitter } from 'events';

// Create a shared event emitter for level changes
export const levelAdjustmentEvents = new EventEmitter();

async applyLevelAdjustment(
  learnerId: string,
  domain: string,
  newLevel: number,
  approvedBy: string
): Promise<void> {
  try {
    // Get current level
    const currentConfig = await this.getLearnerConfig(learnerId);
    const currentLevel = currentConfig.domainLevels[domain] || 5;

    // Log the adjustment in history
    const adjustment = await prisma.levelAdjustmentHistory.create({
      data: {
        learnerId,
        domain,
        previousLevel: currentLevel,
        newLevel,
        adjustmentType: newLevel > currentLevel ? 'increase' : 'decrease',
        reason: `Approved level change from ${currentLevel} to ${newLevel}`,
        confidence: 0.9, // From the recommendation
        approvedBy,
        approvedAt: new Date(),
        status: 'approved',
        metrics: {
          successRate: currentConfig.metrics?.successRate,
          engagementScore: currentConfig.metrics?.engagementScore,
        }
      }
    });

    // Update the learner's brain profile
    await prisma.brainProfile.update({
      where: { learnerId },
      data: {
        domainLevels: {
          ...currentConfig.domainLevels,
          [domain]: newLevel
        },
        updatedAt: new Date()
      }
    });

    console.log(`✅ Level adjusted for ${domain}: ${newLevel} (approved by ${approvedBy})`);

    // Emit event to notify PersonalizedLearningAgent
    levelAdjustmentEvents.emit('levelChanged', {
      learnerId,
      domain,
      previousLevel: currentLevel,
      newLevel,
      adjustmentId: adjustment.id
    });

  } catch (error) {
    console.error("Error applying level adjustment:", error);
    throw error;
  }
}
```

3. **PersonalizedLearningAgent Reload:**
```typescript
// In packages/agents/src/PersonalizedLearningAgent.ts

import { levelAdjustmentEvents } from './ml/AdaptiveLevelAdjustment';

export class PersonalizedLearningAgent extends BaseAgent {
  private configCache: Map<string, LearnerConfig> = new Map();

  constructor() {
    super();
    this.setupLevelChangeListener();
  }

  private setupLevelChangeListener(): void {
    levelAdjustmentEvents.on('levelChanged', async (event) => {
      const { learnerId, domain, newLevel } = event;

      // Invalidate cache for this learner
      this.configCache.delete(learnerId);

      // Reload configuration
      await this.reloadLearnerConfig(learnerId);

      console.log(
        `🔄 PersonalizedLearningAgent reloaded config for learner ${learnerId}`,
        `(${domain} now at level ${newLevel})`
      );
    });
  }

  private async reloadLearnerConfig(learnerId: string): Promise<void> {
    const config = await this.fetchLearnerConfig(learnerId);
    this.configCache.set(learnerId, config);

    // If there's an active session, update it
    const activeSession = this.getActiveSession(learnerId);
    if (activeSession) {
      activeSession.updateDifficultySettings(config.domainLevels);
    }
  }

  async getLearnerConfig(learnerId: string): Promise<LearnerConfig> {
    if (!this.configCache.has(learnerId)) {
      const config = await this.fetchLearnerConfig(learnerId);
      this.configCache.set(learnerId, config);
    }
    return this.configCache.get(learnerId)!;
  }
}
```

4. **API Endpoints for History:**
```typescript
// services/api-gateway/src/routes/level-adjustments.ts

import { FastifyInstance } from 'fastify';
import { prisma } from '@aivo/persistence';

export async function levelAdjustmentRoutes(fastify: FastifyInstance) {
  // Get adjustment history for a learner
  fastify.get('/learners/:learnerId/level-adjustments', async (request) => {
    const { learnerId } = request.params as { learnerId: string };

    return prisma.levelAdjustmentHistory.findMany({
      where: { learnerId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  });

  // Get pending adjustments for approval
  fastify.get('/level-adjustments/pending', async (request) => {
    const user = request.user;

    // Get learners this user can approve for
    const learnerIds = await getLearnerIdsForUser(user.id, user.role);

    return prisma.levelAdjustmentHistory.findMany({
      where: {
        learnerId: { in: learnerIds },
        status: 'pending'
      },
      include: {
        learner: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  });

  // Approve or reject adjustment
  fastify.post('/level-adjustments/:id/review', async (request) => {
    const { id } = request.params as { id: string };
    const { action } = request.body as { action: 'approve' | 'reject' };
    const user = request.user;

    if (action === 'approve') {
      const adjustment = await prisma.levelAdjustmentHistory.findUnique({
        where: { id }
      });

      if (!adjustment) throw new Error('Adjustment not found');

      // Apply the adjustment
      const adaptiveService = new AdaptiveLevelAdjustment();
      await adaptiveService.applyLevelAdjustment(
        adjustment.learnerId,
        adjustment.domain,
        adjustment.newLevel,
        user.id
      );
    } else {
      await prisma.levelAdjustmentHistory.update({
        where: { id },
        data: {
          status: 'rejected',
          approvedBy: user.id,
          approvedAt: new Date()
        }
      });
    }

    return { success: true };
  });
}
```

**Acceptance Criteria:**
- [ ] All level adjustments logged to database
- [ ] History includes before/after values and metrics
- [ ] PersonalizedLearningAgent receives real-time updates
- [ ] Active sessions update difficulty when levels change
- [ ] API endpoints for viewing and approving adjustments
- [ ] Parent/teacher dashboard shows pending approvals

---

## 5. Calm Corner Navigation Pages

### Prompt: Create Calm Corner Feature Pages

**Files to create:**
- `apps/parent-teacher-web/app/learner/calm-corner/page.tsx`
- `apps/parent-teacher-web/app/learner/calm-corner/breathing/page.tsx`
- `apps/parent-teacher-web/app/learner/calm-corner/games/page.tsx`
- `apps/parent-teacher-web/app/learner/calm-corner/sounds/page.tsx`

**File to modify:**
- `apps/parent-teacher-web/app/learner/sensory/page.tsx` (line 816)

**Task:**
Create the Calm Corner feature pages for emotional regulation support, including breathing exercises, focus games, and calming sounds.

**Requirements:**

1. **Calm Corner Hub** (`calm-corner/page.tsx`):
```tsx
'use client';

import { motion } from 'framer-motion';
import { Wind, Gamepad2, Music, Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const calmCornerActivities = [
  {
    id: 'breathing',
    title: 'Breathing Exercises',
    description: 'Guided breathing to help you feel calm',
    icon: Wind,
    color: 'bg-blue-100 text-blue-600',
    href: '/learner/calm-corner/breathing'
  },
  {
    id: 'games',
    title: 'Focus Games',
    description: 'Calming games to redirect your energy',
    icon: Gamepad2,
    color: 'bg-green-100 text-green-600',
    href: '/learner/calm-corner/games'
  },
  {
    id: 'sounds',
    title: 'Calming Sounds',
    description: 'Relaxing sounds and music',
    icon: Music,
    color: 'bg-purple-100 text-purple-600',
    href: '/learner/calm-corner/sounds'
  },
  {
    id: 'feelings',
    title: 'How Am I Feeling?',
    description: 'Check in with your emotions',
    icon: Heart,
    color: 'bg-pink-100 text-pink-600',
    href: '/learner/calm-corner/feelings'
  }
];

export default function CalmCornerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white p-6">
      <Link href="/learner/sensory" className="inline-flex items-center text-gray-600 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Sensory Settings
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calm Corner</h1>
        <p className="text-gray-600">Take a moment to relax and reset</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {calmCornerActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={activity.href}>
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className={`w-14 h-14 rounded-xl ${activity.color} flex items-center justify-center mb-4`}>
                  <activity.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {activity.title}
                </h3>
                <p className="text-sm text-gray-500">{activity.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

2. **Breathing Exercises** (`calm-corner/breathing/page.tsx`):
```tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import Link from 'next/link';

type BreathingPattern = {
  name: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
  cycles: number;
};

const breathingPatterns: BreathingPattern[] = [
  {
    name: '4-7-8 Breathing',
    description: 'A calming technique to reduce anxiety',
    inhale: 4,
    hold: 7,
    exhale: 8,
    cycles: 4
  },
  {
    name: 'Box Breathing',
    description: 'Equal counts for balance and focus',
    inhale: 4,
    hold: 4,
    exhale: 4,
    cycles: 4
  },
  {
    name: 'Simple Calm',
    description: 'Easy breathing for beginners',
    inhale: 3,
    hold: 0,
    exhale: 3,
    cycles: 6
  }
];

export default function BreathingPage() {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(0);
  const [cycle, setCycle] = useState(1);

  // Breathing animation logic
  useEffect(() => {
    if (!isActive || !selectedPattern) return;

    const interval = setInterval(() => {
      setCount(prev => {
        const maxCount = phase === 'inhale' ? selectedPattern.inhale :
                        phase === 'hold' ? selectedPattern.hold :
                        selectedPattern.exhale;

        if (prev >= maxCount) {
          // Move to next phase
          if (phase === 'inhale' && selectedPattern.hold > 0) {
            setPhase('hold');
          } else if (phase === 'inhale' || phase === 'hold') {
            setPhase('exhale');
          } else {
            // Exhale complete - new cycle
            if (cycle >= selectedPattern.cycles) {
              setIsActive(false);
              return 0;
            }
            setCycle(c => c + 1);
            setPhase('inhale');
          }
          return 1;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, phase, cycle, selectedPattern]);

  const circleScale = phase === 'inhale' ? 1.5 : phase === 'hold' ? 1.5 : 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <Link href="/learner/calm-corner" className="inline-flex items-center text-gray-600 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Calm Corner
      </Link>

      {!selectedPattern ? (
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center mb-6">Choose a Breathing Exercise</h1>
          <div className="space-y-4">
            {breathingPatterns.map(pattern => (
              <button
                key={pattern.name}
                onClick={() => setSelectedPattern(pattern)}
                className="w-full bg-white rounded-xl p-4 text-left shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900">{pattern.name}</h3>
                <p className="text-sm text-gray-500">{pattern.description}</p>
                <div className="mt-2 text-xs text-blue-600">
                  Breathe in {pattern.inhale}s
                  {pattern.hold > 0 && ` • Hold ${pattern.hold}s`}
                  {' '}• Breathe out {pattern.exhale}s
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold mb-2">{selectedPattern.name}</h2>
          <p className="text-gray-500 mb-8">Cycle {cycle} of {selectedPattern.cycles}</p>

          {/* Breathing Circle */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <motion.div
              animate={{ scale: circleScale }}
              transition={{ duration: phase === 'hold' ? 0 :
                phase === 'inhale' ? selectedPattern.inhale : selectedPattern.exhale,
                ease: 'easeInOut'
              }}
              className="absolute w-48 h-48 rounded-full bg-blue-200 opacity-50"
            />
            <motion.div
              animate={{ scale: circleScale * 0.8 }}
              transition={{ duration: phase === 'hold' ? 0 :
                phase === 'inhale' ? selectedPattern.inhale : selectedPattern.exhale,
                ease: 'easeInOut'
              }}
              className="absolute w-32 h-32 rounded-full bg-blue-400 opacity-50"
            />
            <div className="z-10 text-center">
              <div className="text-3xl font-bold text-blue-700">
                {phase === 'inhale' ? 'Breathe In' :
                 phase === 'hold' ? 'Hold' : 'Breathe Out'}
              </div>
              <div className="text-5xl font-bold text-blue-900 mt-2">{count}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => {
                setIsActive(!isActive);
                if (!isActive) {
                  setPhase('inhale');
                  setCount(1);
                  setCycle(1);
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700"
            >
              {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isActive ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => {
                setIsActive(false);
                setPhase('inhale');
                setCount(0);
                setCycle(1);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>

          <button
            onClick={() => setSelectedPattern(null)}
            className="mt-6 text-gray-500 hover:text-gray-700"
          >
            Choose different exercise
          </button>
        </div>
      )}
    </div>
  );
}
```

3. **Update Sensory Page Navigation** (`sensory/page.tsx` line 816):
```typescript
// Replace the TODO comment with actual navigation
onClick={() => {
  const routes: Record<string, string> = {
    games: '/learner/calm-corner/games',
    breathing: '/learner/calm-corner/breathing',
    music: '/learner/calm-corner/sounds',
  };
  router.push(routes[destination] || '/learner/calm-corner');
}}
```

**Acceptance Criteria:**
- [ ] Calm Corner hub page with activity selection
- [ ] Breathing exercises with animated visual guidance
- [ ] Multiple breathing patterns (4-7-8, Box, Simple)
- [ ] Focus games page (can use simple existing games)
- [ ] Calming sounds page with ambient audio options
- [ ] Navigation from sensory page works correctly
- [ ] Accessible with keyboard and screen readers
- [ ] Grade-appropriate theming applied

---

## 6. Session Data Calculations

### Prompt: Implement Average Time Per Task Calculation

**Files to modify:**
- `packages/agents/src/ml/AdaptiveLevelAdjustment.ts` (line 303)
- `services/api-gateway/src/server.ts` (line 1030)

**Task:**
Implement proper calculations for average time per task and per-subject grade derivation from session data.

**Requirements:**

1. **Average Time Per Task** (`AdaptiveLevelAdjustment.ts`):
```typescript
// Replace line 303 with actual calculation

private async calculateAverageTimePerTask(
  learnerId: string,
  domain: string,
  sessions: SessionData[]
): Promise<number> {
  // Get task completion data from sessions
  const taskTimes: number[] = [];

  for (const session of sessions) {
    const tasks = await prisma.taskCompletion.findMany({
      where: {
        sessionId: session.id,
        domain: domain,
        completedAt: { not: null }
      },
      select: {
        startedAt: true,
        completedAt: true,
        taskType: true
      }
    });

    for (const task of tasks) {
      if (task.startedAt && task.completedAt) {
        const timeMs = task.completedAt.getTime() - task.startedAt.getTime();
        const timeSeconds = timeMs / 1000;

        // Filter outliers (tasks taking > 30 min or < 5 sec are likely errors)
        if (timeSeconds >= 5 && timeSeconds <= 1800) {
          taskTimes.push(timeSeconds);
        }
      }
    }
  }

  if (taskTimes.length === 0) {
    return 0; // No valid task data
  }

  // Calculate average, removing top and bottom 10% (trimmed mean)
  const sorted = taskTimes.sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * 0.1);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

  return trimmed.length > 0
    ? trimmed.reduce((a, b) => a + b, 0) / trimmed.length
    : sorted.reduce((a, b) => a + b, 0) / sorted.length;
}

// Update the analyzePerformance method
private async analyzePerformance(
  learnerId: string,
  domain: string,
  sessions: SessionData[]
): Promise<PerformanceAnalysis> {
  // ... existing code ...

  return {
    // ... other fields ...
    averageTimePerTask: await this.calculateAverageTimePerTask(learnerId, domain, sessions),
    // ... other fields ...
  };
}
```

2. **Per-Subject Grade Derivation** (`server.ts` line 1030):
```typescript
// Replace line 1030 with subject-aware grade lookup

async function getSubjectGradeLevel(
  learnerId: string,
  subject: string
): Promise<number> {
  const learnerProfile = await getLearnerWithBrainProfile(learnerId);

  if (!learnerProfile?.brainProfile) {
    // Fallback to enrolled grade if no brain profile
    return learnerProfile?.enrolledGrade ?? 5;
  }

  const brainProfile = learnerProfile.brainProfile as BrainProfile;

  // Check for subject-specific level in domain levels
  const domainMap: Record<string, string> = {
    'math': 'MATH',
    'mathematics': 'MATH',
    'reading': 'READING',
    'ela': 'READING',
    'english': 'READING',
    'writing': 'WRITING',
    'science': 'SCIENCE',
    'social_studies': 'SOCIAL_STUDIES',
    'history': 'SOCIAL_STUDIES',
  };

  const domain = domainMap[subject.toLowerCase()] || subject.toUpperCase();

  // Get subject-specific level if available
  const domainLevels = brainProfile.domainLevels as Record<string, number> | null;
  if (domainLevels && domainLevels[domain]) {
    return domainLevels[domain];
  }

  // Fallback to current grade from brain profile or enrolled grade
  return brainProfile.currentGrade ?? learnerProfile.enrolledGrade ?? 5;
}

// Usage in the route:
app.post('/api/content/adaptive', async (request, reply) => {
  const { learnerId, subject } = request.body;

  const baseFrom = await getSubjectGradeLevel(learnerId, subject);
  const direction: 'easier' | 'harder' =
    body.toAssessedGradeLevel > baseFrom ? 'harder' : 'easier';

  // ... rest of handler
});
```

**Acceptance Criteria:**
- [ ] Average time per task calculated from actual session data
- [ ] Outliers filtered from time calculations
- [ ] Per-subject grade levels used for adaptive content
- [ ] Fallback to enrolled grade when specific data unavailable
- [ ] Performance metrics include accurate timing data

---

## 7. Federated Learning Evaluation

### Prompt: Implement Model Evaluation for Federated Learning

**Files to modify:**
- `packages/agents/src/ml/FederatedAggregationService.ts` (line 296)

**Task:**
Implement the model evaluation function that runs against a test dataset after federated aggregation.

**Requirements:**

```typescript
// In FederatedAggregationService.ts

import * as tf from '@tensorflow/tfjs-node';

interface EvaluationResult {
  loss: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
}

/**
 * Evaluate the main model against the test dataset
 */
private async evaluateMainModel(): Promise<EvaluationResult> {
  try {
    // Load test dataset
    const testData = await this.loadTestDataset();

    if (!testData || testData.features.length === 0) {
      console.warn('No test data available, returning mock values');
      return this.getMockEvaluationResult();
    }

    // Convert to tensors
    const xTest = tf.tensor2d(testData.features);
    const yTest = tf.tensor2d(testData.labels);

    // Get model predictions
    const predictions = this.mainModel.predict(xTest) as tf.Tensor;

    // Calculate loss
    const loss = tf.losses.binaryCrossentropy(yTest, predictions).dataSync()[0];

    // Calculate accuracy
    const predictedClasses = predictions.argMax(-1);
    const trueClasses = yTest.argMax(-1);
    const correctPredictions = predictedClasses.equal(trueClasses);
    const accuracy = correctPredictions.mean().dataSync()[0];

    // Calculate precision, recall, F1
    const { precision, recall, f1Score, confusionMatrix } =
      await this.calculateMetrics(trueClasses, predictedClasses, testData.numClasses);

    // Cleanup tensors
    tf.dispose([xTest, yTest, predictions, predictedClasses, trueClasses, correctPredictions]);

    return {
      loss,
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix
    };

  } catch (error) {
    console.error('Error evaluating model:', error);
    return this.getMockEvaluationResult();
  }
}

/**
 * Load test dataset from storage
 */
private async loadTestDataset(): Promise<{
  features: number[][];
  labels: number[][];
  numClasses: number;
} | null> {
  try {
    // Option 1: Load from file
    const testDataPath = path.join(process.cwd(), 'data', 'test_dataset.json');
    if (fs.existsSync(testDataPath)) {
      const data = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
      return data;
    }

    // Option 2: Load from database (subset of learner data held out for testing)
    const testSessions = await prisma.learningSession.findMany({
      where: {
        isTestData: true,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        taskCompletions: true
      },
      take: 1000
    });

    if (testSessions.length === 0) return null;

    // Transform session data into features and labels
    const features: number[][] = [];
    const labels: number[][] = [];

    for (const session of testSessions) {
      const featureVector = this.extractFeatures(session);
      const labelVector = this.extractLabels(session);

      features.push(featureVector);
      labels.push(labelVector);
    }

    return {
      features,
      labels,
      numClasses: this.getNumClasses()
    };

  } catch (error) {
    console.error('Error loading test dataset:', error);
    return null;
  }
}

/**
 * Extract features from a learning session
 */
private extractFeatures(session: LearningSession): number[] {
  return [
    session.duration / 3600, // Normalized duration
    session.taskCompletions.length / 20, // Normalized task count
    session.correctAnswers / Math.max(session.totalAnswers, 1),
    session.averageResponseTime / 60,
    session.engagementScore / 100,
    session.difficultyLevel / 12,
    // Add more features as needed
  ];
}

/**
 * Calculate precision, recall, and F1 score
 */
private async calculateMetrics(
  trueClasses: tf.Tensor,
  predictedClasses: tf.Tensor,
  numClasses: number
): Promise<{
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
}> {
  const trueArray = await trueClasses.array() as number[];
  const predArray = await predictedClasses.array() as number[];

  // Build confusion matrix
  const confusionMatrix: number[][] = Array(numClasses)
    .fill(null)
    .map(() => Array(numClasses).fill(0));

  for (let i = 0; i < trueArray.length; i++) {
    confusionMatrix[trueArray[i]][predArray[i]]++;
  }

  // Calculate metrics per class and average
  let totalPrecision = 0;
  let totalRecall = 0;

  for (let c = 0; c < numClasses; c++) {
    const tp = confusionMatrix[c][c];
    const fp = confusionMatrix.reduce((sum, row, i) =>
      i !== c ? sum + row[c] : sum, 0);
    const fn = confusionMatrix[c].reduce((sum, val, i) =>
      i !== c ? sum + val : sum, 0);

    const precision = tp / Math.max(tp + fp, 1);
    const recall = tp / Math.max(tp + fn, 1);

    totalPrecision += precision;
    totalRecall += recall;
  }

  const avgPrecision = totalPrecision / numClasses;
  const avgRecall = totalRecall / numClasses;
  const f1Score = 2 * (avgPrecision * avgRecall) / Math.max(avgPrecision + avgRecall, 0.001);

  return {
    precision: avgPrecision,
    recall: avgRecall,
    f1Score,
    confusionMatrix
  };
}

private getMockEvaluationResult(): EvaluationResult {
  return {
    loss: 0.3,
    accuracy: 0.85,
    precision: 0.83,
    recall: 0.82,
    f1Score: 0.825,
    confusionMatrix: [[45, 5], [8, 42]]
  };
}
```

**Acceptance Criteria:**
- [ ] Model evaluation runs on actual test data
- [ ] Loss and accuracy calculated correctly
- [ ] Precision, recall, and F1 score computed
- [ ] Confusion matrix generated
- [ ] Graceful fallback when test data unavailable
- [ ] Results logged and stored for monitoring

---

## Summary

| Category | Prompt # | Priority | Estimated Effort |
|----------|----------|----------|------------------|
| Auth Context | 1 | High | 2-3 hours |
| Notification System | 2 | High | 1-2 days |
| Frontend API Integration | 3 | High | 1-2 days |
| Level Adjustment Persistence | 4 | Medium | 4-6 hours |
| Calm Corner Pages | 5 | Medium | 4-6 hours |
| Session Data Calculations | 6 | Medium | 2-3 hours |
| Federated Learning Eval | 7 | Low | 4-6 hours |

**Recommended Implementation Order:**
1. Auth Context (foundation for all authenticated operations)
2. Frontend API Integration (user-facing functionality)
3. Level Adjustment Persistence (data integrity)
4. Notification System (user engagement)
5. Session Data Calculations (analytics accuracy)
6. Calm Corner Pages (feature completeness)
7. Federated Learning Eval (ML optimization)
