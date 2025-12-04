/**
 * Data Retention Service
 * Enforces retention policies for various data types
 */

import { info, error as logError, recordMetric } from '@aivo/observability';
import type { RetentionPolicyConfig } from './types';

// Use any for prisma to avoid type issues before prisma generate
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientAny = any;

// Default retention periods
export const DEFAULT_RETENTION_POLICY: RetentionPolicyConfig = {
  telemetryDays: 90,
  auditLogDays: 365,
  sessionRecordingDays: 30,
  deletedDataDays: 90, // Keep deletion records for compliance
};

export class RetentionService {
  private prisma: PrismaClientAny;
  private config: RetentionPolicyConfig;

  constructor(prisma: PrismaClientAny, config?: Partial<RetentionPolicyConfig>) {
    this.prisma = prisma;
    this.config = { ...DEFAULT_RETENTION_POLICY, ...config };
  }

  /**
   * Initialize retention policies in database
   */
  async initializePolicies(): Promise<void> {
    const policies = [
      {
        dataType: 'telemetry',
        retentionDays: this.config.telemetryDays,
        description: 'Telemetry events and behavioral data',
      },
      {
        dataType: 'audit_logs',
        retentionDays: this.config.auditLogDays,
        description: 'Audit log entries for compliance',
      },
      {
        dataType: 'session_recordings',
        retentionDays: this.config.sessionRecordingDays,
        description: 'Learning session recordings and focus data',
      },
      {
        dataType: 'deleted_data',
        retentionDays: this.config.deletedDataDays,
        description: 'Records of deleted data for compliance',
      },
    ];

    for (const policy of policies) {
      await this.prisma.retentionPolicy.upsert({
        where: { dataType: policy.dataType },
        create: policy,
        update: {
          retentionDays: policy.retentionDays,
          description: policy.description,
        },
      });
    }

    info('Retention policies initialized');
  }

  /**
   * Get current retention policies
   */
  async getPolicies(): Promise<
    Array<{
      dataType: string;
      retentionDays: number;
      lastExecutedAt?: Date;
      nextExecutionAt?: Date;
    }>
  > {
    const policies = await this.prisma.retentionPolicy.findMany({
      where: { isActive: true },
    });

    return policies.map(
      (p: {
        dataType: string;
        retentionDays: number;
        lastExecutedAt?: Date | null;
        nextExecutionAt?: Date | null;
      }) => ({
        dataType: p.dataType,
        retentionDays: p.retentionDays,
        lastExecutedAt: p.lastExecutedAt || undefined,
        nextExecutionAt: p.nextExecutionAt || undefined,
      }),
    );
  }

  /**
   * Update a retention policy
   */
  async updatePolicy(dataType: string, retentionDays: number): Promise<void> {
    await this.prisma.retentionPolicy.update({
      where: { dataType },
      data: { retentionDays },
    });

    info('Retention policy updated', { meta: { dataType, retentionDays } });
    recordMetric({
      name: 'gdpr_policy_updated',
      value: 1,
      labels: { data_type: dataType },
      timestamp: Date.now(),
    });
  }

  /**
   * Execute retention cleanup for all data types
   */
  async executeRetention(): Promise<{
    telemetryDeleted: number;
    auditLogsDeleted: number;
    focusDataDeleted: number;
    completedDeletionsCleared: number;
  }> {
    const results = {
      telemetryDeleted: 0,
      auditLogsDeleted: 0,
      focusDataDeleted: 0,
      completedDeletionsCleared: 0,
    };

    try {
      // 1. Clean up telemetry data (90 days)
      const telemetryCutoff = new Date();
      telemetryCutoff.setDate(telemetryCutoff.getDate() - this.config.telemetryDays);

      const telemetryResult = await this.prisma.telemetryEvent.deleteMany({
        where: { createdAt: { lt: telemetryCutoff } },
      });
      results.telemetryDeleted = telemetryResult.count;

      // 2. Clean up audit logs (1 year)
      const auditCutoff = new Date();
      auditCutoff.setDate(auditCutoff.getDate() - this.config.auditLogDays);

      const auditResult = await this.prisma.auditLogEntry.deleteMany({
        where: { createdAt: { lt: auditCutoff } },
      });
      results.auditLogsDeleted = auditResult.count;

      // 3. Clean up focus/session data (30 days)
      const sessionCutoff = new Date();
      sessionCutoff.setDate(sessionCutoff.getDate() - this.config.sessionRecordingDays);

      const focusResult = await this.prisma.focusData.deleteMany({
        where: { createdAt: { lt: sessionCutoff } },
      });
      results.focusDataDeleted = focusResult.count;

      // 4. Clean up old completed deletion requests (90 days)
      const deletionCutoff = new Date();
      deletionCutoff.setDate(deletionCutoff.getDate() - this.config.deletedDataDays);

      const deletionResult = await this.prisma.dataDeletionRequest.deleteMany({
        where: {
          status: 'COMPLETED',
          completedAt: { lt: deletionCutoff },
        },
      });
      results.completedDeletionsCleared = deletionResult.count;

      // Update policy execution timestamps
      await this.prisma.retentionPolicy.updateMany({
        where: { isActive: true },
        data: {
          lastExecutedAt: new Date(),
          nextExecutionAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
        },
      });

      info('Retention cleanup completed', { meta: results });
      recordMetric({
        name: 'gdpr_retention_executed',
        value: 1,
        timestamp: Date.now(),
      });
      recordMetric({
        name: 'gdpr_telemetry_deleted',
        value: results.telemetryDeleted,
        timestamp: Date.now(),
      });
      recordMetric({
        name: 'gdpr_audit_logs_deleted',
        value: results.auditLogsDeleted,
        timestamp: Date.now(),
      });
      recordMetric({
        name: 'gdpr_focus_data_deleted',
        value: results.focusDataDeleted,
        timestamp: Date.now(),
      });

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logError('Retention cleanup failed', { meta: { error: errorMessage } });
      recordMetric({
        name: 'gdpr_retention_failed',
        value: 1,
        timestamp: Date.now(),
      });
      throw err;
    }
  }

  /**
   * Get data age statistics for monitoring
   */
  async getDataAgeStats(): Promise<{
    telemetry: { oldest?: Date; count: number };
    auditLogs: { oldest?: Date; count: number };
    focusData: { oldest?: Date; count: number };
  }> {
    const [telemetryStats, auditStats, focusStats] = await Promise.all([
      this.prisma.telemetryEvent.aggregate({
        _min: { createdAt: true },
        _count: true,
      }),
      this.prisma.auditLogEntry.aggregate({
        _min: { createdAt: true },
        _count: true,
      }),
      this.prisma.focusData.aggregate({
        _min: { createdAt: true },
        _count: true,
      }),
    ]);

    return {
      telemetry: {
        oldest: telemetryStats._min.createdAt || undefined,
        count: telemetryStats._count,
      },
      auditLogs: {
        oldest: auditStats._min.createdAt || undefined,
        count: auditStats._count,
      },
      focusData: {
        oldest: focusStats._min.createdAt || undefined,
        count: focusStats._count,
      },
    };
  }
}
