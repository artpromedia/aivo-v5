/**
 * Data Retention Policy Configuration
 *
 * This file defines the default retention periods for various data types
 * in accordance with GDPR and other privacy regulations.
 *
 * Retention periods can be customized per-tenant via the RetentionPolicy table.
 */

export interface RetentionPolicyConfig {
  /** Data type identifier */
  dataType: string;
  /** Number of days to retain data */
  retentionDays: number;
  /** Human-readable description */
  description: string;
  /** Legal basis for retention period */
  legalBasis: string;
}

/**
 * Default retention policies
 *
 * These defaults comply with:
 * - GDPR Article 5(1)(e) - storage limitation
 * - COPPA requirements for children's data
 * - General data minimization principles
 */
export const DEFAULT_RETENTION_POLICIES: RetentionPolicyConfig[] = [
  {
    dataType: 'telemetry',
    retentionDays: 90,
    description: 'Telemetry events, behavioral analytics, and engagement metrics',
    legalBasis:
      'Legitimate interest for service improvement; limited to 90 days to minimize data exposure',
  },
  {
    dataType: 'audit_logs',
    retentionDays: 365,
    description: 'Audit log entries for security and compliance purposes',
    legalBasis:
      'Legal obligation for security compliance and potential investigations; 1 year standard',
  },
  {
    dataType: 'session_recordings',
    retentionDays: 30,
    description: 'Learning session recordings, focus data, and detailed interaction logs',
    legalBasis: 'Contract performance for personalized learning; short retention to minimize risk',
  },
  {
    dataType: 'deleted_data',
    retentionDays: 90,
    description: 'Records of completed data deletion requests (for compliance audit trail)',
    legalBasis: 'Legal obligation to demonstrate GDPR compliance',
  },
  {
    dataType: 'export_requests',
    retentionDays: 30,
    description: 'Data export request records and download links',
    legalBasis: 'Contract performance for data portability requests',
  },
  {
    dataType: 'consent_history',
    retentionDays: 1825, // 5 years
    description: 'Consent records and audit trail',
    legalBasis: 'Legal obligation to demonstrate valid consent was obtained',
  },
  {
    dataType: 'safety_incidents',
    retentionDays: 365,
    description: 'Safety incident reports and responses',
    legalBasis: 'Legal obligation for child safety and potential investigations',
  },
];

/**
 * Data categories and their handling requirements
 */
export const DATA_CATEGORIES = {
  /** Directly identifies an individual */
  PERSONAL_IDENTIFIERS: {
    examples: ['name', 'email', 'phone', 'address'],
    handling: 'Encrypt at rest, delete on account closure',
    accessLevel: 'RESTRICTED',
  },
  /** Sensitive child data requiring extra protection */
  CHILD_LEARNING_DATA: {
    examples: ['assessments', 'IEP goals', 'diagnoses', 'behavioral data'],
    handling: 'Encrypted, parental consent required, strict access controls',
    accessLevel: 'HIGHLY_RESTRICTED',
  },
  /** Aggregated/anonymized analytics */
  ANALYTICS: {
    examples: ['engagement metrics', 'feature usage', 'error rates'],
    handling: 'Aggregated and anonymized where possible',
    accessLevel: 'INTERNAL',
  },
  /** Data derived from AI processing */
  AI_DERIVED: {
    examples: ['personalized models', 'learning predictions', 'content recommendations'],
    handling: 'Delete on account closure, user can opt-out of AI training',
    accessLevel: 'RESTRICTED',
  },
} as const;

/**
 * Consent types and their requirements
 */
export const CONSENT_REQUIREMENTS = {
  TERMS_OF_SERVICE: {
    required: true,
    description: 'Acceptance of platform terms and conditions',
    minAge: 13, // COPPA threshold
    parentalConsentRequired: true, // For users under 18
  },
  PRIVACY_POLICY: {
    required: true,
    description: 'Acknowledgment of data collection and processing practices',
    minAge: 13,
    parentalConsentRequired: true,
  },
  DATA_PROCESSING: {
    required: true,
    description: 'Consent for processing personal data to provide the service',
    minAge: 13,
    parentalConsentRequired: true,
  },
  MARKETING_EMAIL: {
    required: false,
    description: 'Consent to receive marketing emails',
    minAge: 16, // GDPR threshold for marketing
    parentalConsentRequired: true,
  },
  ANALYTICS: {
    required: false,
    description: 'Consent for analytics and usage tracking',
    minAge: 13,
    parentalConsentRequired: true,
  },
  AI_TRAINING: {
    required: false,
    description: 'Consent for using anonymized data to improve AI models',
    minAge: 16,
    parentalConsentRequired: true,
  },
  BIOMETRIC_DATA: {
    required: false,
    description: 'Consent for voice recognition and speech analysis',
    minAge: 16,
    parentalConsentRequired: true,
  },
  CHILD_DATA: {
    required: true,
    description: 'COPPA-compliant parental consent for child data collection',
    minAge: 0,
    parentalConsentRequired: true,
  },
} as const;

/**
 * Deletion grace period configuration
 */
export const DELETION_CONFIG = {
  /** Days before deletion request is executed */
  gracePeriodDays: 30,
  /** Allow users to cancel during grace period */
  allowCancellation: true,
  /** Send reminder emails before final deletion */
  reminderEmails: [7, 3, 1], // Days before deletion
};

/**
 * Export configuration
 */
export const EXPORT_CONFIG = {
  /** Hours before export download link expires */
  linkExpirationHours: 24,
  /** Maximum export file size in MB */
  maxFileSizeMB: 100,
  /** Supported export formats */
  formats: ['json', 'csv', 'pdf'] as const,
};
