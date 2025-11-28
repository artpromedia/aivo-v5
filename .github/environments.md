# AIVO v5 Environments

This document describes the deployment environments for the AIVO v5 educational platform.

## Environment Overview

| Environment | URL | Branch | Auto-Deploy | Approval |
|-------------|-----|--------|-------------|----------|
| Staging | https://staging.aivo.education | `develop`, `main` | Yes | No |
| Production | https://aivo.education | `main` | No | Yes (1 reviewer) |

---

## Staging Environment

### Purpose
- Pre-production testing environment
- Feature validation before production deployment
- E2E test execution
- Performance testing

### Configuration
- **URL**: https://staging.aivo.education
- **Branch Triggers**: `develop`, `main`
- **Auto-Deploy**: Yes (after CI tests pass)
- **Manual Approval**: Not required
- **Database**: Separate staging database with seeded test data
- **Data Refresh**: Weekly (Sundays at 00:00 UTC)

### Infrastructure
- **Replicas**: 2 (reduced from production)
- **Resources**: 
  - Memory: 256Mi-1Gi
  - CPU: 100m-500m
- **Database**: PostgreSQL 15 (single instance)
- **Cache**: Redis (single instance)

### Test Users
All test users have the password: `TestPassword123!`

| Role | Email |
|------|-------|
| Super Admin | test-superadmin@aivo.test |
| Platform Admin | test-admin@aivo.test |
| District Admin | test-districtadmin@aivo.test |
| School Admin | test-schooladmin@aivo.test |
| Teacher | test-teacher@aivo.test |
| Parent | test-parent@aivo.test |
| Learner | test-learner@aivo.test |

### Feature Flags
Staging has feature flags enabled for testing new features:
- `FEATURE_NEW_HOMEWORK_UI`: true
- `FEATURE_VOICE_INPUT`: true
- `FEATURE_ADVANCED_ANALYTICS`: true

---

## Production Environment

### Purpose
- Live customer-facing environment
- Real user data and traffic
- High availability and reliability

### Configuration
- **URL**: https://aivo.education
- **Branch Triggers**: `main` only
- **Auto-Deploy**: No
- **Manual Approval**: Required (1 reviewer minimum)
- **Database**: Production database with real data
- **Backups**: Daily automated backups

### Prerequisites for Production Deployment
1. ✅ All CI tests pass
2. ✅ Staging deployment successful
3. ✅ E2E tests pass on staging
4. ✅ Manual approval from authorized reviewer
5. ✅ No active incidents

### Infrastructure
- **Replicas**: 3+ (auto-scaling enabled)
- **Resources**:
  - Memory: 512Mi-2Gi
  - CPU: 250m-1000m
- **Database**: PostgreSQL 15 (HA cluster)
- **Cache**: Redis cluster

### Deployment Process
1. Code merged to `main`
2. CI tests run
3. Docker image built and pushed
4. Staging deployment triggers automatically
5. E2E tests run against staging
6. **Manual approval required**
7. Production deployment executes
8. Smoke tests verify deployment
9. Slack notification sent

---

## Deployment Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Develop   │────▶│   Staging   │────▶│ Production  │
│   Branch    │     │ Environment │     │ Environment │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
   CI Tests           E2E Tests          Smoke Tests
                           │                   │
                           ▼                   ▼
                    Auto Deploy          Manual Approval
```

---

## Rollback Procedures

### Staging Rollback
```bash
kubectl rollout undo deployment/aivo-web -n staging
```

### Production Rollback
1. Go to GitHub Actions
2. Find the last successful deployment
3. Trigger manual rollback workflow
4. Or run:
```bash
kubectl rollout undo deployment/aivo-web -n production
```

---

## Monitoring

### Staging
- Sentry (staging project)
- Application logs (debug level)
- Performance metrics

### Production
- Sentry (production project)
- Datadog APM
- Application logs (info level)
- Uptime monitoring
- Alert thresholds configured

---

## Secrets Management

### Required GitHub Secrets

| Secret | Description | Used In |
|--------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS credentials | All deploys |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials | All deploys |
| `DOCKER_USERNAME` | Docker Hub username | Image push |
| `DOCKER_PASSWORD` | Docker Hub password | Image push |
| `STAGING_DATABASE_URL` | Staging DB connection | Staging |
| `STAGING_TEST_USER_EMAIL` | E2E test user | E2E tests |
| `STAGING_TEST_USER_PASSWORD` | E2E test password | E2E tests |
| `DATABASE_URL` | Production DB connection | Production |
| `SENTRY_AUTH_TOKEN` | Sentry authentication | Releases |
| `SLACK_WEBHOOK` | Slack notifications | All |

---

## Contact

For deployment issues, contact:
- **DevOps**: devops@aivo.education
- **On-Call**: #ops-alerts Slack channel
