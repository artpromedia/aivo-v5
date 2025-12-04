/**
 * Data Export Service
 * Handles data portability requests (GDPR Article 20)
 */

import { info, error as logError, recordMetric } from '@aivo/observability';
import type { DataExportResult, UserExportData, GdprConfig } from './types';

// Use any for prisma to avoid type issues before prisma generate
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientAny = any;

export class DataExportService {
  private prisma: PrismaClientAny;
  private config: GdprConfig;

  constructor(prisma: PrismaClientAny, config: GdprConfig = {}) {
    this.prisma = prisma;
    this.config = {
      exportLinkExpirationHours: 24,
      ...config,
    };
  }

  /**
   * Request a data export
   */
  async requestExport(
    userId: string,
    requestedBy: string,
    format: 'json' | 'csv' | 'pdf' = 'json',
  ): Promise<DataExportResult> {
    const request = await this.prisma.dataExportRequest.create({
      data: {
        userId,
        requestedBy,
        status: 'PENDING',
        format: format.toUpperCase() as 'JSON' | 'CSV' | 'PDF',
      },
    });

    info('Data export request created', {
      userId,
      meta: { requestId: request.id },
    });

    recordMetric({
      name: 'gdpr_export_requested',
      value: 1,
      labels: { format },
      timestamp: Date.now(),
    });

    return {
      userId,
      requestId: request.id,
      status: 'pending',
      format,
    };
  }

  /**
   * Process an export request
   */
  async processExport(requestId: string): Promise<DataExportResult> {
    const request = await this.prisma.dataExportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== 'PENDING') {
      throw new Error(`Invalid export request: ${requestId}`);
    }

    await this.prisma.dataExportRequest.update({
      where: { id: requestId },
      data: { status: 'PROCESSING' },
    });

    try {
      const exportData = await this.collectUserData(request.userId);

      // In a real implementation, you would:
      // 1. Serialize to the requested format
      // 2. Upload to secure storage (S3, Azure Blob, etc.)
      // 3. Generate a signed download URL

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (this.config.exportLinkExpirationHours || 24));

      // For now, store the data as JSON in the database
      // In production, use secure file storage
      const downloadUrl = `/api/gdpr/exports/${requestId}/download`;

      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          downloadUrl,
          expiresAt,
          completedAt: new Date(),
          // Store the export data for later download
          exportedData: exportData as unknown as Record<string, unknown>,
        },
      });

      info('Data export completed', { userId: request.userId, meta: { requestId } });
      recordMetric({
        name: 'gdpr_export_completed',
        value: 1,
        timestamp: Date.now(),
      });

      return {
        userId: request.userId,
        requestId,
        status: 'completed',
        downloadUrl,
        expiresAt,
        format: request.format.toLowerCase() as 'json' | 'csv' | 'pdf',
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'FAILED',
          errorMessage,
        },
      });

      logError('Data export failed', { meta: { requestId } });
      recordMetric({
        name: 'gdpr_export_failed',
        value: 1,
        timestamp: Date.now(),
      });

      return {
        userId: request.userId,
        requestId,
        status: 'failed',
        format: request.format.toLowerCase() as 'json' | 'csv' | 'pdf',
        errorMessage,
      };
    }
  }

  /**
   * Collect all user data for export
   */
  async collectUserData(userId: string): Promise<UserExportData> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        learnerProfile: {
          include: {
            diagnoses: true,
            iepGoals: true,
            progress: true,
          },
        },
        ownedLearners: {
          include: {
            diagnoses: true,
            iepGoals: true,
            progress: true,
          },
        },
        sessions: true,
      },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Get consent records
    const consents = await this.prisma.consentRecord.findMany({
      where: { userId },
    });

    // Get learning sessions for all learners
    const learnerIds = [
      user.learnerProfile?.id,
      ...(user.ownedLearners || []).map((l: { id: string }) => l.id),
    ].filter(Boolean) as string[];

    const learningSessions =
      learnerIds.length > 0
        ? await this.prisma.learningSession.findMany({
            where: { learnerId: { in: learnerIds } },
            select: {
              id: true,
              subject: true,
              topic: true,
              startTime: true,
              endTime: true,
              duration: true,
              completion: true,
            },
          })
        : [];

    // Build export data
    const exportData: UserExportData = {
      user: {
        id: user.id,
        email: user.email || undefined,
        username: user.username,
        name: user.name || undefined,
        role: user.role,
        createdAt: user.createdAt,
      },
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            phone: user.profile.phone || undefined,
            address: user.profile.address || undefined,
            preferences: user.profile.preferences as Record<string, unknown> | undefined,
          }
        : undefined,
      learners: [
        ...(user.learnerProfile ? [user.learnerProfile] : []),
        ...(user.ownedLearners || []),
      ].map(
        (learner: {
          id: string;
          firstName: string;
          lastName: string;
          dateOfBirth: Date;
          gradeLevel: number;
          region?: string;
          diagnoses?: { type: string; description?: string; diagnosedAt?: Date }[];
          iepGoals?: { goal: string; category: string; status: string; progress: number }[];
          progress?: { domain: string; date: Date; level: number; score?: number }[];
        }) => ({
          id: learner.id,
          firstName: learner.firstName,
          lastName: learner.lastName,
          dateOfBirth: learner.dateOfBirth,
          gradeLevel: learner.gradeLevel,
          region: learner.region || undefined,
          diagnoses: (learner.diagnoses || []).map((d) => ({
            type: d.type,
            description: d.description || undefined,
            diagnosedAt: d.diagnosedAt || undefined,
          })),
          iepGoals: (learner.iepGoals || []).map((g) => ({
            goal: g.goal,
            category: g.category,
            status: g.status,
            progress: g.progress,
          })),
          progress: (learner.progress || []).map((p) => ({
            domain: p.domain,
            date: p.date,
            level: p.level,
            score: p.score || undefined,
          })),
        }),
      ),
      learningSessions: learningSessions.map(
        (s: {
          id: string;
          subject: string;
          topic: string;
          startTime: Date;
          endTime?: Date | null;
          duration?: number | null;
          completion?: number | null;
        }) => ({
          id: s.id,
          subject: s.subject,
          topic: s.topic,
          startTime: s.startTime,
          endTime: s.endTime || undefined,
          duration: s.duration || undefined,
          completion: s.completion || undefined,
        }),
      ),
      consents: consents.map(
        (c: {
          consentType: string;
          granted: boolean;
          grantedAt?: Date | null;
          revokedAt?: Date | null;
          version: string;
        }) => ({
          type: c.consentType,
          granted: c.granted,
          grantedAt: c.grantedAt || undefined,
          revokedAt: c.revokedAt || undefined,
          version: c.version,
        }),
      ),
    };

    return exportData;
  }

  /**
   * Get export request status
   */
  async getExportStatus(requestId: string): Promise<DataExportResult | null> {
    const request = await this.prisma.dataExportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return null;
    }

    // Check if expired
    if (request.expiresAt && request.expiresAt < new Date()) {
      if (request.status === 'COMPLETED') {
        await this.prisma.dataExportRequest.update({
          where: { id: requestId },
          data: { status: 'EXPIRED' },
        });
        return {
          userId: request.userId,
          requestId: request.id,
          status: 'expired',
          format: request.format.toLowerCase() as 'json' | 'csv' | 'pdf',
        };
      }
    }

    return {
      userId: request.userId,
      requestId: request.id,
      status: request.status.toLowerCase() as DataExportResult['status'],
      downloadUrl: request.downloadUrl || undefined,
      expiresAt: request.expiresAt || undefined,
      format: request.format.toLowerCase() as 'json' | 'csv' | 'pdf',
      errorMessage: request.errorMessage || undefined,
    };
  }

  /**
   * Get pending export requests
   */
  async getPendingExports(): Promise<Array<{ id: string; userId: string }>> {
    return this.prisma.dataExportRequest.findMany({
      where: { status: 'PENDING' },
      select: { id: true, userId: true },
    });
  }
}
