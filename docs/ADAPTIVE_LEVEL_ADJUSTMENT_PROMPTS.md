# Adaptive Level Adjustment - Implementation Prompts

These prompts address the remaining TODO items in `packages/agents/src/ml/AdaptiveLevelAdjustment.ts`.

---

## 1. Calculate Average Time Per Task (Line 303)

### Current State
```typescript
averageTimePerTask: 0, // TODO: Calculate from session data
```

### Prompt

**Task:** Implement the `calculateAverageTimePerTask` method to compute actual task completion times from session data.

**File to modify:** `packages/agents/src/ml/AdaptiveLevelAdjustment.ts`

**Context:**
- The `LearningSession` model has: `startTime`, `endTime`, `duration`, `interactions` (JSON)
- The `Progress` model has: `timeSpent` (Int) per domain
- The `interactions` JSON field in LearningSession contains task-level data

**Implementation:**

```typescript
/**
 * Calculate average time per task from session data
 * @param learnerId - The learner's ID
 * @param domain - The learning domain (MATH, READING, etc.)
 * @param records - Progress records for analysis
 */
private async calculateAverageTimePerTask(
  learnerId: string,
  domain: string,
  records: any[]
): Promise<number> {
  try {
    // Get learning sessions for this domain in the last 30 days
    const sessions = await this.prisma.learningSession.findMany({
      where: {
        learnerId,
        subject: domain,
        endTime: { not: null },
        startTime: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        duration: true,
        interactions: true,
        startTime: true,
        endTime: true
      },
      orderBy: { startTime: 'desc' },
      take: 50 // Last 50 sessions
    });

    if (sessions.length === 0) {
      // Fallback: Use Progress.timeSpent if no session data
      const totalTimeSpent = records.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
      const estimatedTasks = records.length * 5; // Assume ~5 tasks per session
      return estimatedTasks > 0 ? totalTimeSpent / estimatedTasks : 0;
    }

    const taskTimes: number[] = [];

    for (const session of sessions) {
      const interactions = session.interactions as any;

      if (interactions?.tasks && Array.isArray(interactions.tasks)) {
        // Extract task-level timing from interactions JSON
        for (const task of interactions.tasks) {
          if (task.startedAt && task.completedAt) {
            const startTime = new Date(task.startedAt).getTime();
            const endTime = new Date(task.completedAt).getTime();
            const durationSeconds = (endTime - startTime) / 1000;

            // Filter outliers: tasks < 3 seconds (accidental) or > 600 seconds (10 min - abandoned)
            if (durationSeconds >= 3 && durationSeconds <= 600) {
              taskTimes.push(durationSeconds);
            }
          }
        }
      } else if (session.duration && interactions?.taskCount) {
        // Fallback: Estimate from session duration / task count
        const avgTime = session.duration / interactions.taskCount;
        if (avgTime >= 3 && avgTime <= 600) {
          taskTimes.push(avgTime);
        }
      }
    }

    if (taskTimes.length === 0) {
      return 0;
    }

    // Calculate trimmed mean (remove top/bottom 10% to reduce outlier impact)
    const sorted = [...taskTimes].sort((a, b) => a - b);
    const trimCount = Math.floor(sorted.length * 0.1);
    const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

    if (trimmed.length === 0) {
      // If trimming removed everything, use full average
      return taskTimes.reduce((a, b) => a + b, 0) / taskTimes.length;
    }

    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  } catch (error) {
    console.error("Error calculating average time per task:", error);
    return 0;
  }
}
```

**Update `calculateDomainMetrics` method:**
```typescript
private async calculateDomainMetrics(domain: string, records: any[], learnerId: string): Promise<PerformanceMetrics> {
  // ... existing code ...

  return {
    domain,
    currentLevel,
    successRate,
    consecutiveSuccesses,
    consecutiveStruggles,
    averageTimePerTask: await this.calculateAverageTimePerTask(learnerId, domain, records),
    engagementScore,
    sessionCount: totalSessions,
    lastUpdated: new Date()
  };
}
```

**Note:** Also update the `fetchPerformanceMetrics` method to pass `learnerId` to `calculateDomainMetrics`.

**Acceptance Criteria:**
- [ ] Task times extracted from `interactions` JSON field
- [ ] Outliers filtered (< 3s or > 600s)
- [ ] Trimmed mean calculation to reduce outlier impact
- [ ] Fallback to `Progress.timeSpent` when session data unavailable
- [ ] Returns 0 gracefully when no data available

---

## 2. Store Level Adjustment Notifications in Database (Line 318)

### Current State
```typescript
// TODO: Store in database (create LevelAdjustmentNotification model)
// For now, just log
console.log(`\n🎯 Level Adjustment Recommendations for Learner ${learnerId}:`);
```

### Prompt

**Task:** Store level adjustment notifications in the database using the existing `Notification` model and create an `ApprovalRequest` for parent/teacher review.

**Files to modify:**
- `packages/agents/src/ml/AdaptiveLevelAdjustment.ts`
- `prisma/schema.prisma` (if new fields needed)

**Context:**
- Existing `Notification` model stores user notifications
- Existing `ApprovalRequest` model handles approval workflows with `ApprovalType` enum
- Existing `LearningAdjustmentLog` model logs approved adjustments

**Implementation:**

```typescript
import { v4 as uuidv4 } from 'uuid';

/**
 * Create notification for parent/teacher with database persistence
 */
private async createNotification(
  learnerId: string,
  recommendations: LevelAdjustmentRecommendation[]
): Promise<string> {
  try {
    // Get learner's guardian (parent) for notification
    const learner = await this.prisma.learner.findUnique({
      where: { id: learnerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        guardianId: true,
        guardian: {
          select: { id: true, email: true, firstName: true }
        }
      }
    });

    if (!learner || !learner.guardianId) {
      console.warn(`No guardian found for learner ${learnerId}`);
      return '';
    }

    const notificationId = uuidv4();
    const learnerName = `${learner.firstName} ${learner.lastName}`;

    // Determine highest urgency among recommendations
    const urgencyPriority = { immediate: 0, soon: 1, when_convenient: 2 };
    const highestUrgency = recommendations.reduce((highest, rec) =>
      urgencyPriority[rec.urgency] < urgencyPriority[highest] ? rec.urgency : highest,
      'when_convenient' as const
    );

    // Create summary message
    const domainSummary = recommendations
      .map(r => `${r.domain}: Level ${r.currentLevel} → ${r.recommendedLevel}`)
      .join(', ');

    // Store in Notification table for dashboard display
    await this.prisma.notification.create({
      data: {
        id: notificationId,
        userId: learner.guardianId,
        learnerId: learnerId,
        type: 'LEVEL_ADJUSTMENT',
        title: `Level Adjustment Recommended for ${learnerName}`,
        message: `We recommend adjusting ${learnerName}'s learning levels: ${domainSummary}`,
        data: {
          recommendations: recommendations.map(r => ({
            domain: r.domain,
            currentLevel: r.currentLevel,
            recommendedLevel: r.recommendedLevel,
            adjustment: r.adjustment,
            confidence: r.confidence,
            reason: r.reason,
            urgency: r.urgency,
            evidence: r.evidence
          })),
          learnerId,
          learnerName,
          highestUrgency,
          createdAt: new Date().toISOString()
        },
        read: false
      }
    });

    // Create ApprovalRequest for formal approval workflow
    await this.prisma.approvalRequest.create({
      data: {
        type: 'LEVEL_CHANGE',
        learnerId,
        requesterId: 'system', // System-generated request
        approverId: learner.guardianId,
        status: 'PENDING',
        details: {
          notificationId,
          recommendations: recommendations.map(r => ({
            domain: r.domain,
            currentLevel: r.currentLevel,
            recommendedLevel: r.recommendedLevel,
            adjustment: r.adjustment,
            confidence: r.confidence,
            reason: r.reason,
            urgency: r.urgency,
            evidence: r.evidence
          }))
        },
        comments: null
      }
    });

    // Log for debugging
    console.log(`\n🎯 Level Adjustment Notification Created:`);
    console.log(`   Notification ID: ${notificationId}`);
    console.log(`   Learner: ${learnerName} (${learnerId})`);
    console.log(`   Guardian: ${learner.guardian?.firstName} (${learner.guardianId})`);
    console.log(`   Recommendations: ${recommendations.length}`);
    console.log(`   Urgency: ${highestUrgency}`);

    return notificationId;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}
```

**Schema Updates (if `LEVEL_CHANGE` not in ApprovalType enum):**
```prisma
enum ApprovalType {
  GOAL_COMPLETION
  LEVEL_CHANGE      // Add this
  CONTENT_ACCESS
  SETTING_CHANGE
}
```

**Acceptance Criteria:**
- [ ] Notification stored in `Notification` table
- [ ] ApprovalRequest created for approval workflow
- [ ] Recommendations stored as JSON with full details
- [ ] Guardian ID correctly resolved from learner
- [ ] Unique notification ID generated and returned
- [ ] Error handling with proper logging

---

## 3. Send Dashboard/Email/SMS Notifications (Lines 338-339)

### Current State
```typescript
// TODO: Send notification to parent/teacher dashboard
// TODO: Send email/SMS if urgency is "immediate"
```

### Prompt

**Task:** Integrate with the existing notification system to send multi-channel notifications (dashboard, email, SMS) based on urgency level.

**Files to modify:**
- `packages/agents/src/ml/AdaptiveLevelAdjustment.ts`

**Files to reference:**
- `apps/web/lib/notifications.ts` - Existing notification service
- `apps/web/lib/notifications/email-provider.ts` - Email delivery
- `apps/web/lib/notifications/push-provider.ts` - Push notifications
- `apps/web/lib/notifications/templates.ts` - Email templates

**Implementation:**

```typescript
// Add import at top of file
import { sendNotification as sendMultiChannelNotification } from '@aivo/notifications';
// Or if using HTTP call to web app:
import fetch from 'node-fetch';

/**
 * Send multi-channel notifications based on urgency
 */
private async sendNotifications(
  learnerId: string,
  notificationId: string,
  recommendations: LevelAdjustmentRecommendation[],
  guardianId: string,
  guardianEmail: string,
  learnerName: string
): Promise<void> {
  const highestUrgency = this.getHighestUrgency(recommendations);

  // Build notification data
  const notificationData = {
    notificationId,
    learnerId,
    learnerName,
    recommendations: recommendations.map(r => ({
      domain: r.domain,
      direction: r.adjustment > 0 ? 'up' : 'down',
      currentLevel: r.currentLevel,
      recommendedLevel: r.recommendedLevel,
      reason: r.reason,
      confidence: Math.round(r.confidence * 100)
    })),
    dashboardUrl: `${process.env.APP_URL}/parent/learner/${learnerId}/levels`,
    urgency: highestUrgency
  };

  try {
    // Always send to dashboard (in-app notification)
    // This was already done in createNotification()

    // Send email for "immediate" or "soon" urgency
    if (highestUrgency === 'immediate' || highestUrgency === 'soon') {
      await this.sendEmailNotification(
        guardianEmail,
        learnerName,
        recommendations,
        notificationData.dashboardUrl,
        highestUrgency
      );
    }

    // Send SMS for "immediate" urgency only
    if (highestUrgency === 'immediate') {
      await this.sendSMSNotification(
        guardianId,
        learnerName,
        recommendations
      );
    }

    // Send push notification for all urgencies
    await this.sendPushNotification(
      guardianId,
      learnerName,
      recommendations,
      highestUrgency
    );

    console.log(`📧 Notifications sent for ${learnerName}:`);
    console.log(`   Dashboard: ✅`);
    console.log(`   Email: ${highestUrgency !== 'when_convenient' ? '✅' : '⏭️ skipped'}`);
    console.log(`   SMS: ${highestUrgency === 'immediate' ? '✅' : '⏭️ skipped'}`);
    console.log(`   Push: ✅`);

  } catch (error) {
    console.error("Error sending notifications:", error);
    // Don't throw - notification delivery failure shouldn't block the flow
  }
}

private getHighestUrgency(
  recommendations: LevelAdjustmentRecommendation[]
): 'immediate' | 'soon' | 'when_convenient' {
  const urgencyPriority = { immediate: 0, soon: 1, when_convenient: 2 };
  return recommendations.reduce((highest, rec) =>
    urgencyPriority[rec.urgency] < urgencyPriority[highest] ? rec.urgency : highest,
    'when_convenient' as const
  );
}

private async sendEmailNotification(
  email: string,
  learnerName: string,
  recommendations: LevelAdjustmentRecommendation[],
  dashboardUrl: string,
  urgency: string
): Promise<void> {
  const subject = urgency === 'immediate'
    ? `🚨 Immediate Action Needed: Learning Level Adjustment for ${learnerName}`
    : `📊 Learning Level Recommendation for ${learnerName}`;

  const recommendationsList = recommendations
    .map(r => {
      const arrow = r.adjustment > 0 ? '⬆️' : '⬇️';
      return `• ${r.domain}: ${arrow} Level ${r.currentLevel} → ${r.recommendedLevel}\n  Reason: ${r.reason}`;
    })
    .join('\n\n');

  // Use internal API to send email
  await fetch(`${process.env.INTERNAL_API_URL}/api/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
    },
    body: JSON.stringify({
      to: email,
      subject,
      template: 'level-adjustment',
      channel: 'EMAIL',
      data: {
        learnerName,
        recommendations: recommendationsList,
        dashboardUrl,
        urgency
      }
    })
  });
}

private async sendSMSNotification(
  userId: string,
  learnerName: string,
  recommendations: LevelAdjustmentRecommendation[]
): Promise<void> {
  // Get user's phone number from preferences
  const preferences = await this.prisma.notificationPreference.findFirst({
    where: { userId }
  });

  if (!preferences?.phoneNumber || !preferences?.smsEnabled) {
    console.log(`SMS skipped: No phone number or SMS disabled for user ${userId}`);
    return;
  }

  const domains = recommendations.map(r => r.domain).join(', ');
  const message = `AIVO: ${learnerName} needs a learning level adjustment (${domains}). Please review in your dashboard.`;

  // Use Twilio or other SMS provider
  await fetch(`${process.env.INTERNAL_API_URL}/api/notifications/sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
    },
    body: JSON.stringify({
      to: preferences.phoneNumber,
      message
    })
  });
}

private async sendPushNotification(
  userId: string,
  learnerName: string,
  recommendations: LevelAdjustmentRecommendation[],
  urgency: string
): Promise<void> {
  const title = urgency === 'immediate'
    ? `🚨 Action Needed for ${learnerName}`
    : `📊 Level Recommendation`;

  const body = recommendations.length === 1
    ? `${recommendations[0].domain}: ${recommendations[0].reason}`
    : `${recommendations.length} learning levels need adjustment`;

  await fetch(`${process.env.INTERNAL_API_URL}/api/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
    },
    body: JSON.stringify({
      userId,
      subject: title,
      template: 'level-adjustment-push',
      channel: 'PUSH',
      data: {
        title,
        body,
        urgency,
        action: 'REVIEW_LEVELS'
      }
    })
  });
}
```

**Update `createNotification` to call `sendNotifications`:**
```typescript
private async createNotification(
  learnerId: string,
  recommendations: LevelAdjustmentRecommendation[]
): Promise<void> {
  try {
    // ... existing code to get learner and create notification ...

    const notificationId = uuidv4();

    // ... existing database storage code ...

    // Send multi-channel notifications
    await this.sendNotifications(
      learnerId,
      notificationId,
      recommendations,
      learner.guardianId,
      learner.guardian?.email || '',
      `${learner.firstName} ${learner.lastName}`
    );

  } catch (error) {
    console.error("Error creating notification:", error);
  }
}
```

**Add Email Template** (`apps/web/lib/notifications/templates/level-adjustment.ts`):
```typescript
export const levelAdjustmentTemplate = {
  subject: (data: any) => data.subject,

  html: (data: any) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .recommendation { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .urgent { border-left: 4px solid #ef4444; }
        .soon { border-left: 4px solid #f59e0b; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Learning Level Recommendation</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>Our adaptive learning system has identified some recommended adjustments for <strong>${data.learnerName}</strong>:</p>

          <div class="recommendations">
            ${data.recommendations}
          </div>

          <p>These recommendations are based on ${data.learnerName}'s recent performance and engagement patterns.</p>

          <a href="${data.dashboardUrl}" class="button">Review & Approve</a>

          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            You're receiving this because you're ${data.learnerName}'s guardian on AIVO Learning.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,

  text: (data: any) => `
Learning Level Recommendation for ${data.learnerName}

${data.recommendations}

Review and approve at: ${data.dashboardUrl}
  `
};
```

**Acceptance Criteria:**
- [ ] Dashboard notification always sent (via database storage)
- [ ] Email sent for "immediate" and "soon" urgency
- [ ] SMS sent only for "immediate" urgency
- [ ] Push notification sent for all urgencies
- [ ] Email template created with proper styling
- [ ] Graceful handling of missing contact info
- [ ] Errors logged but don't block the flow

---

## 4. Log Adjustment History & Notify Agent (Lines 379-380)

### Current State
```typescript
console.log(`✅ Level adjusted for ${domain}: ${newLevel} (approved by ${approvedBy})`);

// TODO: Log the adjustment in history
// TODO: Notify PersonalizedLearningAgent to reload configuration
```

### Prompt

**Task:** Log level adjustments to the existing `LearningAdjustmentLog` model and implement an event-based notification system for agents to reload configuration.

**Files to modify:**
- `packages/agents/src/ml/AdaptiveLevelAdjustment.ts`

**Files to reference:**
- `prisma/schema.prisma` - `LearningAdjustmentLog` model already exists
- `packages/agents/src/PersonalizedLearningAgent.ts` - Agent to notify

**Context:**
Existing `LearningAdjustmentLog` model:
```prisma
model LearningAdjustmentLog {
  id            String   @id @default(cuid())
  learnerId     String
  previousLevel Float
  newLevel      Float
  approvedBy    String
  approvedAt    DateTime @default(now())
  reasoning     String?
  createdAt     DateTime @default(now())
  learner       Learner  @relation(...)
}
```

**Implementation:**

```typescript
import { EventEmitter } from 'events';

// Create a singleton event emitter for level adjustment events
export const levelAdjustmentEvents = new EventEmitter();

// Event types
export interface LevelAdjustmentEvent {
  type: 'LEVEL_ADJUSTED';
  learnerId: string;
  domain: string;
  previousLevel: number;
  newLevel: number;
  approvedBy: string;
  adjustmentLogId: string;
  timestamp: Date;
}

/**
 * Apply approved level adjustment with full logging and event emission
 */
async applyLevelAdjustment(
  learnerId: string,
  domain: string,
  newLevel: number,
  approvedBy: string,
  reasoning?: string
): Promise<{ success: boolean; adjustmentLogId?: string; error?: string }> {
  try {
    // Get current level before update
    const model = await this.prisma.personalizedModel.findUnique({
      where: { learnerId }
    });

    if (!model) {
      return { success: false, error: `No model found for learner ${learnerId}` };
    }

    const config = model.configuration as any;
    const previousLevel = config.domainLevels?.[domain] || 1;

    // Skip if no actual change
    if (previousLevel === newLevel) {
      console.log(`⏭️ Level unchanged for ${domain}: already at ${newLevel}`);
      return { success: true, adjustmentLogId: undefined };
    }

    // Update the learner's configuration
    if (!config.domainLevels) {
      config.domainLevels = {};
    }
    config.domainLevels[domain] = newLevel;

    await this.prisma.personalizedModel.update({
      where: { learnerId },
      data: {
        configuration: config,
        updatedAt: new Date()
      }
    });

    // Log the adjustment in history
    const adjustmentLog = await this.prisma.learningAdjustmentLog.create({
      data: {
        learnerId,
        previousLevel,
        newLevel,
        approvedBy,
        reasoning: reasoning || `${domain} level adjusted from ${previousLevel} to ${newLevel}`,
        approvedAt: new Date()
      }
    });

    console.log(`✅ Level adjusted for ${domain}: ${previousLevel} → ${newLevel} (approved by ${approvedBy})`);
    console.log(`   Adjustment Log ID: ${adjustmentLog.id}`);

    // Update any pending approval requests to APPROVED
    await this.prisma.approvalRequest.updateMany({
      where: {
        learnerId,
        type: 'LEVEL_CHANGE',
        status: 'PENDING'
      },
      data: {
        status: 'APPROVED',
        decidedAt: new Date(),
        comments: `Approved by ${approvedBy}`
      }
    });

    // Emit event for PersonalizedLearningAgent and other listeners
    const event: LevelAdjustmentEvent = {
      type: 'LEVEL_ADJUSTED',
      learnerId,
      domain,
      previousLevel,
      newLevel,
      approvedBy,
      adjustmentLogId: adjustmentLog.id,
      timestamp: new Date()
    };

    levelAdjustmentEvents.emit('levelAdjusted', event);

    console.log(`📡 Event emitted: levelAdjusted for learner ${learnerId}`);

    return { success: true, adjustmentLogId: adjustmentLog.id };

  } catch (error) {
    console.error("Error applying level adjustment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get adjustment history for a learner
 */
async getAdjustmentHistory(
  learnerId: string,
  options?: { limit?: number; domain?: string }
): Promise<any[]> {
  const where: any = { learnerId };

  if (options?.domain) {
    where.reasoning = { contains: options.domain };
  }

  return this.prisma.learningAdjustmentLog.findMany({
    where,
    orderBy: { approvedAt: 'desc' },
    take: options?.limit || 20
  });
}
```

**Update PersonalizedLearningAgent to listen for events:**

```typescript
// In packages/agents/src/PersonalizedLearningAgent.ts

import { levelAdjustmentEvents, LevelAdjustmentEvent } from './ml/AdaptiveLevelAdjustment';

export class PersonalizedLearningAgent {
  private configCache: Map<string, any> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.setupLevelChangeListener();
  }

  /**
   * Listen for level adjustment events and reload configuration
   */
  private setupLevelChangeListener(): void {
    levelAdjustmentEvents.on('levelAdjusted', async (event: LevelAdjustmentEvent) => {
      console.log(`🔄 PersonalizedLearningAgent received level adjustment event:`);
      console.log(`   Learner: ${event.learnerId}`);
      console.log(`   Domain: ${event.domain}`);
      console.log(`   New Level: ${event.newLevel}`);

      try {
        // Invalidate cached configuration for this learner
        this.configCache.delete(event.learnerId);

        // Reload configuration from database
        const newConfig = await this.loadLearnerConfiguration(event.learnerId);
        this.configCache.set(event.learnerId, newConfig);

        console.log(`   ✅ Configuration reloaded for learner ${event.learnerId}`);

        // If there's an active learning session, update it
        await this.updateActiveSession(event.learnerId, event.domain, event.newLevel);

      } catch (error) {
        console.error(`   ❌ Failed to reload configuration:`, error);
      }
    });

    console.log('🎧 PersonalizedLearningAgent listening for level adjustment events');
  }

  /**
   * Update any active learning session with new difficulty level
   */
  private async updateActiveSession(
    learnerId: string,
    domain: string,
    newLevel: number
  ): Promise<void> {
    // Check for active session in Redis or session store
    const activeSessionKey = `active_session:${learnerId}`;

    // If using Redis:
    // const session = await redis.get(activeSessionKey);
    // if (session) {
    //   const sessionData = JSON.parse(session);
    //   if (sessionData.domain === domain) {
    //     sessionData.presentationLevel = newLevel;
    //     await redis.set(activeSessionKey, JSON.stringify(sessionData));
    //     console.log(`   📝 Updated active session to level ${newLevel}`);
    //   }
    // }

    // For now, just log
    console.log(`   🔍 Checking for active sessions in domain ${domain}...`);
  }

  /**
   * Load learner configuration from database
   */
  private async loadLearnerConfiguration(learnerId: string): Promise<any> {
    const model = await this.prisma.personalizedModel.findUnique({
      where: { learnerId },
      include: {
        learner: {
          select: {
            id: true,
            firstName: true,
            gradeLevel: true
          }
        }
      }
    });

    return model?.configuration || { domainLevels: {} };
  }

  /**
   * Get learner configuration (with caching)
   */
  async getLearnerConfiguration(learnerId: string): Promise<any> {
    if (!this.configCache.has(learnerId)) {
      const config = await this.loadLearnerConfiguration(learnerId);
      this.configCache.set(learnerId, config);
    }
    return this.configCache.get(learnerId);
  }
}
```

**Schema Enhancement (optional - add domain field):**
```prisma
model LearningAdjustmentLog {
  id            String   @id @default(cuid())
  learnerId     String
  domain        String?  // Add domain field for better querying
  previousLevel Float
  newLevel      Float
  approvedBy    String
  approvedAt    DateTime @default(now())
  reasoning     String?
  metadata      Json?    // Add metadata for additional context
  createdAt     DateTime @default(now())

  learner Learner @relation(fields: [learnerId], references: [id], onDelete: Cascade)

  @@index([learnerId, domain])
  @@index([approvedAt])
}
```

**Acceptance Criteria:**
- [ ] Level adjustments logged to `LearningAdjustmentLog` table
- [ ] Previous level captured before update
- [ ] Event emitted via EventEmitter after successful adjustment
- [ ] PersonalizedLearningAgent listens for events
- [ ] Agent configuration cache invalidated on level change
- [ ] Active sessions updated when possible
- [ ] Pending approval requests marked as approved
- [ ] Adjustment history queryable by learner/domain

---

## Summary

| Prompt | Location | Priority | Complexity |
|--------|----------|----------|------------|
| **1. Average Time Per Task** | Line 303 | Medium | Medium |
| **2. Store Notifications in DB** | Line 318 | High | Medium |
| **3. Send Multi-Channel Notifications** | Lines 338-339 | High | High |
| **4. Log History & Notify Agent** | Lines 379-380 | High | Medium |

**Recommended Implementation Order:**
1. **Prompt 2** - Store notifications (foundation for other notifications)
2. **Prompt 4** - Log history & notify agent (completes the approval flow)
3. **Prompt 3** - Send multi-channel notifications (enhances user experience)
4. **Prompt 1** - Average time calculation (analytics improvement)

**Dependencies:**
- Prompt 3 depends on Prompt 2 (needs notification ID)
- All prompts use existing Prisma models
- Prompt 4 requires PersonalizedLearningAgent modifications
