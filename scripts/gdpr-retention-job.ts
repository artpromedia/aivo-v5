/**
 * GDPR Retention Job
 *
 * This script enforces data retention policies and processes pending deletions.
 * Run via cron: daily at 2 AM
 *
 * crontab: 0 2 * * * node /path/to/gdpr-retention-job.js
 */

import { PrismaClient } from '@prisma/client';
import { DataDeletionService, RetentionService } from '@aivo/gdpr';
import { info, error as logError, recordMetric } from '@aivo/observability';

async function main() {
  const prisma = new PrismaClient();

  try {
    info('Starting GDPR retention job');

    // Initialize services
    const deletionService = new DataDeletionService(prisma, {
      deletionGracePeriodDays: 30,
    });

    const retentionService = new RetentionService(prisma, {
      telemetryDays: 90,
      auditLogDays: 365,
      sessionRecordingDays: 30,
      deletedDataDays: 90,
    });

    // 1. Process pending data deletion requests
    info('Processing pending deletion requests...');
    const pendingDeletions = await deletionService.getPendingDeletions();

    let deletionsProcessed = 0;
    let deletionsFailed = 0;

    for (const deletion of pendingDeletions) {
      try {
        const result = await deletionService.processDeletion(deletion.id);
        if (result.status === 'completed') {
          deletionsProcessed++;
          info('Deletion completed', {
            requestId: deletion.id,
            userId: deletion.userId,
          });
        } else if (result.status === 'failed') {
          deletionsFailed++;
          logError('Deletion failed', {
            requestId: deletion.id,
            error: result.errorMessage,
          });
        }
      } catch (err) {
        deletionsFailed++;
        logError('Deletion processing error', {
          requestId: deletion.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    recordMetric('gdpr_job_deletions_processed', deletionsProcessed);
    recordMetric('gdpr_job_deletions_failed', deletionsFailed);

    // 2. Execute retention cleanup
    info('Executing retention cleanup...');
    const retentionResults = await retentionService.executeRetention();

    info('Retention cleanup completed', retentionResults);
    recordMetric('gdpr_job_retention_completed', 1);

    // 3. Get data age stats for monitoring
    const stats = await retentionService.getDataAgeStats();
    info('Data age statistics', {
      telemetryCount: stats.telemetry.count,
      telemetryOldest: stats.telemetry.oldest?.toISOString(),
      auditLogsCount: stats.auditLogs.count,
      auditLogsOldest: stats.auditLogs.oldest?.toISOString(),
      focusDataCount: stats.focusData.count,
      focusDataOldest: stats.focusData.oldest?.toISOString(),
    });

    // 4. Summary
    const summary = {
      deletions: {
        pending: pendingDeletions.length,
        processed: deletionsProcessed,
        failed: deletionsFailed,
      },
      retention: retentionResults,
      dataStats: {
        telemetryRecords: stats.telemetry.count,
        auditLogRecords: stats.auditLogs.count,
        focusDataRecords: stats.focusData.count,
      },
    };

    info('GDPR retention job completed', summary);
    console.log(JSON.stringify(summary, null, 2));

    return summary;
  } catch (err) {
    logError('GDPR retention job failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    recordMetric('gdpr_job_failed', 1);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('GDPR job failed:', err);
    process.exit(1);
  });
