/**
 * @aivo/gdpr - GDPR Compliance Package
 *
 * Provides utilities for:
 * - Data deletion (right to be forgotten)
 * - Data export (data portability)
 * - Consent management
 * - Retention policy enforcement
 */

export { DataDeletionService } from './deletion';
export { DataExportService } from './export';
export { ConsentService } from './consent';
export { RetentionService, DEFAULT_RETENTION_POLICY } from './retention';

export type {
  GdprConfig,
  DataDeletionResult,
  DeletedRecordsSummary,
  DataExportResult,
  UserExportData,
  LearnerExportData,
  LearningSessionExport,
  ConsentExport,
  ConsentPreferences,
  ConsentUpdate,
  ConsentType,
  RetentionPolicyConfig,
} from './types';
