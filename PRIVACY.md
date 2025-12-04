# AIVO Privacy & Data Protection

This document outlines AIVO's GDPR compliance implementation and data protection practices.

## Table of Contents

- [Overview](#overview)
- [Data Collection](#data-collection)
- [User Rights](#user-rights)
- [Data Retention](#data-retention)
- [Consent Management](#consent-management)
- [API Reference](#api-reference)
- [Scheduled Jobs](#scheduled-jobs)
- [Configuration](#configuration)

## Overview

AIVO implements comprehensive GDPR compliance features including:

- **Right to be Forgotten** (Article 17) - Complete data deletion with 30-day grace period
- **Data Portability** (Article 20) - Export user data in JSON/CSV/PDF formats
- **Consent Management** - Granular consent tracking and preferences
- **Data Minimization** - Automatic retention policy enforcement
- **Transparency** - Clear audit trails for all data operations

## Data Collection

### Categories of Data

| Category             | Examples                           | Legal Basis              | Retention      |
| -------------------- | ---------------------------------- | ------------------------ | -------------- |
| Personal Identifiers | Name, email, phone                 | Contract                 | Until deletion |
| Child Learning Data  | Assessments, IEP goals, diagnoses  | Parental consent (COPPA) | Until deletion |
| Analytics            | Engagement metrics, usage patterns | Legitimate interest      | 90 days        |
| AI-Derived           | Personalized models, predictions   | Consent                  | Until deletion |
| Audit Logs           | Security events, changes           | Legal obligation         | 1 year         |

### Special Considerations for Children's Data

AIVO serves neurodiverse learners, many of whom are minors. We implement:

1. **COPPA Compliance** - Verifiable parental consent for users under 13
2. **Enhanced Protection** - Encrypted storage, strict access controls
3. **Minimal Collection** - Only collect data necessary for educational services
4. **Parent Access** - Parents can view, export, and delete their child's data

## User Rights

### Right to Access (Article 15)

Users can request a copy of all their personal data via the data export feature.

### Right to Rectification (Article 16)

Users can update their personal information through the platform settings.

### Right to Erasure (Article 17)

Users can request complete data deletion with a 30-day grace period:

```http
DELETE /api/users/:userId/data
```

The deletion process:

1. Request is logged with 30-day scheduled execution
2. User receives confirmation email
3. User can cancel within 30 days
4. After 30 days, data is permanently deleted/anonymized

### Right to Data Portability (Article 20)

Users can export their data in machine-readable format:

```http
GET /api/users/:userId/export?format=json
```

Supported formats: JSON, CSV, PDF

### Right to Restrict Processing

Users can revoke specific consents to limit how their data is processed.

## Data Retention

### Default Retention Periods

| Data Type          | Retention | Rationale              |
| ------------------ | --------- | ---------------------- |
| Telemetry Events   | 90 days   | Service improvement    |
| Audit Logs         | 1 year    | Security compliance    |
| Session Recordings | 30 days   | Minimize exposure      |
| Deletion Records   | 90 days   | Compliance audit trail |
| Consent History    | 5 years   | Legal requirement      |
| Safety Incidents   | 1 year    | Child safety           |

### Automated Cleanup

A daily scheduled job enforces retention policies:

```bash
# Run daily at 2 AM
0 2 * * * npx ts-node scripts/gdpr-retention-job.ts
```

### Data Anonymization

For analytics purposes, some data is anonymized rather than deleted:

- Learning sessions: Interactions cleared, aggregate metrics retained
- Tutor interactions: Input/output cleared, timing data retained
- User records: Personal info replaced with "Deleted User"

## Consent Management

### Consent Types

| Type             | Required | Description                      |
| ---------------- | -------- | -------------------------------- |
| TERMS_OF_SERVICE | Yes      | Platform terms acceptance        |
| PRIVACY_POLICY   | Yes      | Privacy practices acknowledgment |
| DATA_PROCESSING  | Yes      | Core data processing consent     |
| MARKETING_EMAIL  | No       | Marketing communications         |
| ANALYTICS        | No       | Usage tracking                   |
| AI_TRAINING      | No       | Model improvement                |
| BIOMETRIC_DATA   | No       | Voice/speech analysis            |
| CHILD_DATA       | Yes\*    | COPPA parental consent           |

\*Required for users under 13

### Updating Consent

```http
PATCH /api/users/:userId/consent
Content-Type: application/json

{
  "consents": [
    { "consentType": "MARKETING_EMAIL", "granted": false },
    { "consentType": "AI_TRAINING", "granted": true }
  ]
}
```

## API Reference

### Data Deletion

#### Request Deletion

```http
DELETE /api/users/:userId/data
Authorization: Bearer <token>

{
  "reason": "Account closure"  // optional
}
```

Response:

```json
{
  "success": true,
  "message": "Data deletion scheduled. You can cancel within 30 days.",
  "requestId": "del_abc123",
  "scheduledFor": "2024-02-04T00:00:00Z"
}
```

#### Cancel Deletion

```http
POST /api/users/:userId/data/cancel-deletion
Authorization: Bearer <token>

{
  "requestId": "del_abc123"
}
```

#### Get Deletion Status

```http
GET /api/users/:userId/data/deletion-status
Authorization: Bearer <token>
```

### Data Export

#### Request Export

```http
GET /api/users/:userId/export?format=json
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true,
  "requestId": "exp_abc123",
  "status": "completed",
  "downloadUrl": "/api/gdpr/exports/exp_abc123/download",
  "expiresAt": "2024-01-05T12:00:00Z",
  "format": "json"
}
```

#### Download Export

```http
GET /api/gdpr/exports/:requestId/download
Authorization: Bearer <token>
```

### Consent Management

#### Get Consents

```http
GET /api/users/:userId/consent
Authorization: Bearer <token>
```

Response:

```json
{
  "userId": "user_123",
  "consents": [
    {
      "type": "PRIVACY_POLICY",
      "granted": true,
      "grantedAt": "2024-01-01T00:00:00Z",
      "version": "1.0"
    }
  ]
}
```

#### Update Consents

```http
PATCH /api/users/:userId/consent
Authorization: Bearer <token>

{
  "consents": [
    { "consentType": "MARKETING_EMAIL", "granted": false }
  ]
}
```

### Admin Endpoints

#### Get Retention Policies

```http
GET /admin/gdpr/retention-policies
Authorization: Bearer <admin-token>
```

#### Execute Retention Cleanup

```http
POST /admin/gdpr/retention/execute
Authorization: Bearer <admin-token>
```

#### Process Pending Deletions

```http
POST /admin/gdpr/deletions/process
Authorization: Bearer <admin-token>
```

## Scheduled Jobs

### GDPR Retention Job

Location: `scripts/gdpr-retention-job.ts`

Schedule: Daily at 2 AM

Tasks:

1. Process pending deletion requests past grace period
2. Clean up expired data per retention policies
3. Report data age statistics

### Setting Up Cron

```bash
# Add to crontab
0 2 * * * cd /app && npx ts-node scripts/gdpr-retention-job.ts >> /var/log/gdpr-job.log 2>&1
```

### Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: gdpr-retention-job
spec:
  schedule: '0 2 * * *'
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: gdpr-job
              image: aivo/api-gateway:latest
              command: ['npx', 'ts-node', 'scripts/gdpr-retention-job.ts']
          restartPolicy: OnFailure
```

## Configuration

### Environment Variables

```bash
# Deletion grace period (default: 30 days)
GDPR_DELETION_GRACE_DAYS=30

# Export link expiration (default: 24 hours)
GDPR_EXPORT_LINK_HOURS=24

# Redis URL for clearing cached data
REDIS_URL=redis://localhost:6379

# Vector DB URL for removing embeddings
VECTOR_DB_URL=http://localhost:6333
```

### Retention Policy Override

Custom retention periods can be set via the `RetentionPolicy` database table:

```sql
UPDATE retention_policy
SET retention_days = 60
WHERE data_type = 'telemetry';
```

## Database Schema

### DataDeletionRequest

Tracks deletion requests through their lifecycle.

```prisma
model DataDeletionRequest {
  id            String @id
  userId        String
  requestedBy   String
  requestType   DataDeletionRequestType
  status        DataDeletionRequestStatus
  reason        String?
  scheduledFor  DateTime
  processedAt   DateTime?
  completedAt   DateTime?
  deletedData   Json?
  errorMessage  String?
  createdAt     DateTime
  updatedAt     DateTime
}
```

### ConsentRecord

Tracks user consent with full audit trail.

```prisma
model ConsentRecord {
  id          String @id
  userId      String
  consentType ConsentType
  granted     Boolean
  version     String
  ipAddress   String?
  userAgent   String?
  grantedAt   DateTime?
  revokedAt   DateTime?
  expiresAt   DateTime?
  metadata    Json?
  createdAt   DateTime
  updatedAt   DateTime
}
```

### RetentionPolicy

Configurable retention periods per data type.

```prisma
model RetentionPolicy {
  id              String @id
  dataType        String @unique
  retentionDays   Int
  description     String?
  isActive        Boolean
  lastExecutedAt  DateTime?
  nextExecutionAt DateTime?
  createdAt       DateTime
  updatedAt       DateTime
}
```

## Security Considerations

1. **Authentication Required** - All GDPR endpoints require valid JWT
2. **Authorization** - Users can only access their own data; admins can access any
3. **Audit Logging** - All GDPR operations are logged for compliance
4. **Rate Limiting** - Export and deletion endpoints are rate-limited
5. **Encryption** - Personal data encrypted at rest

## Compliance Checklist

- [x] Data subject access requests (export)
- [x] Right to erasure (deletion with grace period)
- [x] Consent management (granular preferences)
- [x] Data portability (JSON/CSV/PDF export)
- [x] Retention policies (automated cleanup)
- [x] Audit logging (full operation trail)
- [x] Data minimization (retention limits)
- [x] Child data protection (COPPA compliance)
- [x] Anonymization (for analytics retention)

## Support

For data protection inquiries:

- Email: privacy@aivo.ai
- Data Protection Officer: dpo@aivo.ai

For GDPR requests that cannot be handled through the platform:

- Submit request via email with verified identity
- Response within 30 days as required by GDPR
