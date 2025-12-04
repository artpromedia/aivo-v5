/**
 * GDPR Compliance Types
 */

export interface GdprConfig {
  /** Redis connection URL for clearing cached agent memory */
  redisUrl?: string;
  /** Vector DB connection URL */
  vectorDbUrl?: string;
  /** Days before deletion request is executed (default: 30) */
  deletionGracePeriodDays?: number;
  /** Export download link expiration in hours (default: 24) */
  exportLinkExpirationHours?: number;
}

export interface DataDeletionResult {
  userId: string;
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledFor: Date;
  deletedRecords?: DeletedRecordsSummary;
  errorMessage?: string;
}

export interface DeletedRecordsSummary {
  learningSessions: number;
  tutorInteractions: number;
  telemetryEvents: number;
  personalData: boolean;
  redisKeysCleared: number;
  vectorDbRecordsRemoved: number;
}

export interface DataExportResult {
  userId: string;
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  downloadUrl?: string;
  expiresAt?: Date;
  format: 'json' | 'csv' | 'pdf';
  errorMessage?: string;
}

export interface UserExportData {
  user: {
    id: string;
    email?: string;
    username: string;
    name?: string;
    role: string;
    createdAt: Date;
  };
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    preferences?: Record<string, unknown>;
  };
  learners?: LearnerExportData[];
  learningSessions?: LearningSessionExport[];
  consents: ConsentExport[];
}

export interface LearnerExportData {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gradeLevel: number;
  region?: string;
  diagnoses?: DiagnosisExport[];
  iepGoals?: IepGoalExport[];
  progress?: ProgressExport[];
}

export interface LearningSessionExport {
  id: string;
  subject: string;
  topic: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  completion?: number;
}

export interface DiagnosisExport {
  type: string;
  description?: string;
  diagnosedAt?: Date;
}

export interface IepGoalExport {
  goal: string;
  category: string;
  status: string;
  progress: number;
}

export interface ProgressExport {
  domain: string;
  date: Date;
  level: number;
  score?: number;
}

export interface ConsentExport {
  type: string;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  version: string;
}

export interface ConsentUpdate {
  consentType: string;
  granted: boolean;
  version?: string;
}

export interface ConsentPreferences {
  userId: string;
  consents: Array<{
    type: string;
    granted: boolean;
    grantedAt?: Date;
    revokedAt?: Date;
    version: string;
  }>;
}

export type ConsentType =
  | 'TERMS_OF_SERVICE'
  | 'PRIVACY_POLICY'
  | 'DATA_PROCESSING'
  | 'MARKETING_EMAIL'
  | 'MARKETING_SMS'
  | 'ANALYTICS'
  | 'AI_TRAINING'
  | 'DATA_SHARING'
  | 'BIOMETRIC_DATA'
  | 'CHILD_DATA';

export interface RetentionPolicyConfig {
  telemetryDays: number;
  auditLogDays: number;
  sessionRecordingDays: number;
  deletedDataDays: number;
}
