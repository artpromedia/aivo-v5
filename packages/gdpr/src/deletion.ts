/**
 * Data Deletion Service
 * Handles right-to-be-forgotten requests and data anonymization
 */

import type { Redis } from 'ioredis';
import { info, error as logError, recordMetric } from '@aivo/observability';
import type { DataDeletionResult, DeletedRecordsSummary, GdprConfig } from './types';

// Use any for prisma to avoid type issues before prisma generate
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientAny = any;

export class DataDeletionService {
  private prisma: PrismaClientAny;
  private redis?: Redis;
  private config: GdprConfig;

  constructor(prisma: PrismaClientAny, config: GdprConfig = {}) {
    this.prisma = prisma;
    this.config = {
      deletionGracePeriodDays: 30,
      ...config,
    };
  }

  setRedisClient(redis: Redis): void {
    this.redis = redis;
  }

  /**
   * Create a data deletion request (30-day grace period)
   */
  async requestDeletion(
    userId: string,
    requestedBy: string,
    reason?: string,
  ): Promise<DataDeletionResult> {
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + (this.config.deletionGracePeriodDays || 30));

    const request = await this.prisma.dataDeletionRequest.create({
      data: {
        userId,
        requestedBy,
        requestType: 'USER_INITIATED',
        status: 'PENDING',
        reason,
        scheduledFor,
      },
    });

    info('Data deletion request created', {
      userId,
      meta: { requestId: request.id },
    });

    recordMetric({
      name: 'gdpr_deletion_requested',
      value: 1,
      labels: { type: 'user_initiated' },
      timestamp: Date.now(),
    });

    return {
      userId,
      requestId: request.id,
      status: 'pending',
      scheduledFor,
    };
  }

  /**
   * Cancel a pending deletion request
   */
  async cancelDeletion(requestId: string, userId: string): Promise<boolean> {
    const request = await this.prisma.dataDeletionRequest.findFirst({
      where: {
        id: requestId,
        userId,
        status: 'PENDING',
      },
    });

    if (!request) {
      return false;
    }

    await this.prisma.dataDeletionRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    info('Data deletion request cancelled', { userId, meta: { requestId } });
    recordMetric({
      name: 'gdpr_deletion_cancelled',
      value: 1,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Process a deletion request (called by scheduled job)
   */
  async processDeletion(requestId: string): Promise<DataDeletionResult> {
    const request = await this.prisma.dataDeletionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== 'PENDING') {
      throw new Error(`Invalid deletion request: ${requestId}`);
    }

    await this.prisma.dataDeletionRequest.update({
      where: { id: requestId },
      data: { status: 'PROCESSING', processedAt: new Date() },
    });

    try {
      const summary = await this.executeDataDeletion(request.userId);

      await this.prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          deletedData: summary as unknown as Record<string, unknown>,
        },
      });

      info('Data deletion completed', { userId: request.userId, meta: { requestId } });
      recordMetric({
        name: 'gdpr_deletion_completed',
        value: 1,
        timestamp: Date.now(),
      });

      return {
        userId: request.userId,
        requestId,
        status: 'completed',
        scheduledFor: request.scheduledFor,
        deletedRecords: summary,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      await this.prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: 'FAILED',
          errorMessage,
        },
      });

      logError('Data deletion failed', { meta: { requestId } });
      recordMetric({
        name: 'gdpr_deletion_failed',
        value: 1,
        timestamp: Date.now(),
      });

      return {
        userId: request.userId,
        requestId,
        status: 'failed',
        scheduledFor: request.scheduledFor,
        errorMessage,
      };
    }
  }

  /**
   * Execute the actual data deletion/anonymization
   */
  private async executeDataDeletion(userId: string): Promise<DeletedRecordsSummary> {
    const summary: DeletedRecordsSummary = {
      learningSessions: 0,
      tutorInteractions: 0,
      telemetryEvents: 0,
      personalData: false,
      redisKeysCleared: 0,
      vectorDbRecordsRemoved: 0,
    };

    // Get user's learners for anonymization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        learnerProfile: true,
        ownedLearners: true,
      },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const learnerIds = [
      user.learnerProfile?.id,
      ...(user.ownedLearners || []).map((l: { id: string }) => l.id),
    ].filter(Boolean) as string[];

    // 1. Anonymize LearningSession records (keep for analytics)
    if (learnerIds.length > 0) {
      const sessionsResult = await this.prisma.learningSession.updateMany({
        where: { learnerId: { in: learnerIds } },
        data: {
          // Keep session data but remove identifiable info
          interactions: {},
        },
      });
      summary.learningSessions = sessionsResult.count;

      // 2. Anonymize AgentInteraction records
      const interactionsResult = await this.prisma.agentInteraction.updateMany({
        where: { learnerId: { in: learnerIds } },
        data: {
          input: {},
          output: {},
        },
      });
      summary.tutorInteractions = interactionsResult.count;

      // 3. Delete telemetry events (contains personal behavioral data)
      const telemetryResult = await this.prisma.telemetryEvent.deleteMany({
        where: { learnerId: { in: learnerIds } },
      });
      summary.telemetryEvents = telemetryResult.count;
    }

    // 4. Clear Redis cached agent memory
    if (this.redis) {
      const patterns = [
        `agent:memory:${userId}:*`,
        `user:session:${userId}:*`,
        `learner:state:${userId}:*`,
      ];

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          summary.redisKeysCleared += keys.length;
        }
      }
    }

    // 5. Hard delete personal data
    // Delete in order to respect foreign key constraints

    // Delete learner-related data first
    if (learnerIds.length > 0) {
      for (const learnerId of learnerIds) {
        // Delete related records
        await this.prisma.focusData.deleteMany({ where: { learnerId } });
        await this.prisma.gameSession.deleteMany({ where: { learnerId } });
        await this.prisma.progress.deleteMany({ where: { learnerId } });
        await this.prisma.diagnosis.deleteMany({ where: { learnerId } });
        await this.prisma.iEPGoal.deleteMany({ where: { learnerId } });
        await this.prisma.notification.deleteMany({ where: { learnerId } });
        await this.prisma.message.deleteMany({ where: { learnerId } });
        await this.prisma.aIInsight.deleteMany({ where: { learnerId } });
        await this.prisma.agentState.deleteMany({ where: { learnerId } });
        await this.prisma.enrollment.deleteMany({ where: { learnerId } });
      }

      // Delete learners
      await this.prisma.learner.deleteMany({
        where: { id: { in: learnerIds } },
      });
    }

    // Delete user profile
    await this.prisma.profile.deleteMany({ where: { userId } });

    // Delete consent records (keep audit trail in deletion request)
    await this.prisma.consentRecord.deleteMany({ where: { userId } });

    // Delete sessions
    await this.prisma.session.deleteMany({ where: { userId } });

    // Delete accounts (OAuth)
    await this.prisma.account.deleteMany({ where: { userId } });

    // Delete notifications
    await this.prisma.notification.deleteMany({ where: { userId } });

    // Finally, anonymize the user record (keep for referential integrity)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.local`,
        username: `deleted-${userId}`,
        name: 'Deleted User',
        password: 'DELETED',
        isActive: false,
      },
    });

    summary.personalData = true;

    return summary;
  }

  /**
   * Get pending deletion requests that are ready to process
   */
  async getPendingDeletions(): Promise<Array<{ id: string; userId: string; scheduledFor: Date }>> {
    const requests = await this.prisma.dataDeletionRequest.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
      },
      select: {
        id: true,
        userId: true,
        scheduledFor: true,
      },
    });

    return requests;
  }

  /**
   * Get deletion request status for a user
   */
  async getDeletionStatus(userId: string): Promise<DataDeletionResult | null> {
    const request = await this.prisma.dataDeletionRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!request) {
      return null;
    }

    return {
      userId: request.userId,
      requestId: request.id,
      status: request.status.toLowerCase() as DataDeletionResult['status'],
      scheduledFor: request.scheduledFor,
      deletedRecords: request.deletedData as DeletedRecordsSummary | undefined,
      errorMessage: request.errorMessage || undefined,
    };
  }
}
