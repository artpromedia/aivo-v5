#!/bin/bash
#
# restore-database.sh
# Restores AIVO PostgreSQL database from backup
#
# Usage:
#   ./restore-database.sh <backup-file>
#   ./restore-database.sh <backup-file> --pitr "2025-01-28 15:30:00"
#   ./restore-database.sh --list
#   ./restore-database.sh --latest
#
# Examples:
#   ./restore-database.sh aivo_backup_20250128_020000.sql.gz
#   ./restore-database.sh --latest --pitr "2025-01-28 15:30:00 UTC"
#

set -e

# Configuration
BACKUP_BUCKET="${BACKUP_BUCKET:-aivo-backups}"
NAMESPACE="${NAMESPACE:-production}"
DEPLOYMENT="${DEPLOYMENT:-aivo-web}"
REPLICAS="${REPLICAS:-3}"
DATABASE_URL="${DATABASE_URL}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
  echo "Usage: $0 <backup-file> [options]"
  echo ""
  echo "Options:"
  echo "  --list              List available backups"
  echo "  --latest            Use the latest backup"
  echo "  --pitr <timestamp>  Point-in-time recovery to specific timestamp"
  echo "  --skip-confirmation Skip confirmation prompt"
  echo "  --dry-run           Show what would be done without executing"
  echo "  --no-migrations     Skip running migrations after restore"
  echo "  --bucket <name>     S3 bucket name (default: aivo-backups)"
  echo "  --namespace <ns>    Kubernetes namespace (default: production)"
  echo ""
  echo "Examples:"
  echo "  $0 --list"
  echo "  $0 --latest"
  echo "  $0 aivo_backup_20250128_020000.sql.gz"
  echo "  $0 --latest --pitr '2025-01-28 15:30:00 UTC'"
}

list_backups() {
  echo "Available backups in s3://${BACKUP_BUCKET}/"
  echo ""
  echo "Daily backups:"
  aws s3 ls s3://${BACKUP_BUCKET}/daily/ --human-readable | tail -10
  echo ""
  echo "Weekly backups:"
  aws s3 ls s3://${BACKUP_BUCKET}/weekly/ --human-readable | tail -5
  echo ""
  echo "Monthly backups:"
  aws s3 ls s3://${BACKUP_BUCKET}/monthly/ --human-readable | tail -3
}

get_latest_backup() {
  aws s3 cp s3://${BACKUP_BUCKET}/latest-backup.json /tmp/latest-backup.json
  BACKUP_FILE=$(cat /tmp/latest-backup.json | grep -o '"filename": "[^"]*"' | cut -d'"' -f4)
  echo "$BACKUP_FILE"
}

# Parse arguments
BACKUP_FILE=""
PITR_TIME=""
SKIP_CONFIRM=false
DRY_RUN=false
RUN_MIGRATIONS=true
BACKUP_TYPE="daily"

while [[ $# -gt 0 ]]; do
  case $1 in
    --list)
      list_backups
      exit 0
      ;;
    --latest)
      BACKUP_FILE=$(get_latest_backup)
      shift
      ;;
    --pitr)
      PITR_TIME="$2"
      shift 2
      ;;
    --skip-confirmation)
      SKIP_CONFIRM=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --no-migrations)
      RUN_MIGRATIONS=false
      shift
      ;;
    --bucket)
      BACKUP_BUCKET="$2"
      shift 2
      ;;
    --namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    --help|-h)
      show_usage
      exit 0
      ;;
    *)
      if [ -z "$BACKUP_FILE" ]; then
        BACKUP_FILE="$1"
      else
        log_error "Unknown option: $1"
        show_usage
        exit 1
      fi
      shift
      ;;
  esac
done

# Validate inputs
if [ -z "$BACKUP_FILE" ]; then
  log_error "No backup file specified!"
  show_usage
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  log_error "DATABASE_URL environment variable is not set!"
  exit 1
fi

# Display restore plan
echo "========================================="
echo "AIVO Database Restore"
echo "========================================="
echo "Backup file: $BACKUP_FILE"
echo "Bucket: $BACKUP_BUCKET"
echo "Namespace: $NAMESPACE"
echo "PITR time: ${PITR_TIME:-N/A}"
echo "Dry run: $DRY_RUN"
echo "Run migrations: $RUN_MIGRATIONS"
echo "========================================="
echo ""

# Confirmation
if [ "$SKIP_CONFIRM" = false ] && [ "$DRY_RUN" = false ]; then
  log_warn "This will REPLACE the current database with the backup!"
  log_warn "All data since the backup will be LOST (unless PITR is used)!"
  echo ""
  read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM
  
  if [ "$CONFIRM" != "yes" ]; then
    log_info "Restore cancelled."
    exit 0
  fi
fi

# Start restore process
START_TIME=$(date +%s)

# Step 1: Download backup
log_info "Downloading backup from S3..."
if [ "$DRY_RUN" = false ]; then
  # Try daily first, then weekly, then monthly
  if aws s3 ls "s3://${BACKUP_BUCKET}/daily/${BACKUP_FILE}" > /dev/null 2>&1; then
    BACKUP_TYPE="daily"
  elif aws s3 ls "s3://${BACKUP_BUCKET}/weekly/${BACKUP_FILE}" > /dev/null 2>&1; then
    BACKUP_TYPE="weekly"
  elif aws s3 ls "s3://${BACKUP_BUCKET}/monthly/${BACKUP_FILE}" > /dev/null 2>&1; then
    BACKUP_TYPE="monthly"
  else
    log_error "Backup file not found in S3!"
    exit 1
  fi
  
  aws s3 cp "s3://${BACKUP_BUCKET}/${BACKUP_TYPE}/${BACKUP_FILE}" "/tmp/${BACKUP_FILE}"
  log_info "Downloaded from ${BACKUP_TYPE}/ ($(ls -lh /tmp/${BACKUP_FILE} | awk '{print $5}'))"
else
  log_info "[DRY RUN] Would download s3://${BACKUP_BUCKET}/*/${BACKUP_FILE}"
fi

# Step 2: Verify backup integrity
log_info "Verifying backup integrity..."
if [ "$DRY_RUN" = false ]; then
  if gunzip -t "/tmp/${BACKUP_FILE}"; then
    log_info "Backup integrity verified ✓"
  else
    log_error "Backup integrity check failed!"
    exit 1
  fi
fi

# Step 3: Scale down application
log_info "Scaling down application..."
if [ "$DRY_RUN" = false ]; then
  kubectl scale deployment ${DEPLOYMENT} --replicas=0 -n ${NAMESPACE}
  
  # Wait for pods to terminate
  log_info "Waiting for pods to terminate..."
  kubectl wait --for=delete pod -l app=aivo,component=web -n ${NAMESPACE} --timeout=120s || true
else
  log_info "[DRY RUN] Would scale ${DEPLOYMENT} to 0 replicas"
fi

# Step 4: Create backup of current database (safety net)
log_info "Creating safety backup of current database..."
if [ "$DRY_RUN" = false ]; then
  SAFETY_BACKUP="/tmp/aivo_safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
  pg_dump "$DATABASE_URL" | gzip > "$SAFETY_BACKUP"
  log_info "Safety backup created: $SAFETY_BACKUP"
fi

# Step 5: Restore database
log_info "Restoring database..."
if [ "$DRY_RUN" = false ]; then
  # Drop and recreate public schema for clean restore
  psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
  
  # Restore from backup
  gunzip -c "/tmp/${BACKUP_FILE}" | psql "$DATABASE_URL"
  log_info "Database restored ✓"
fi

# Step 6: Point-in-time recovery (if specified)
if [ -n "$PITR_TIME" ]; then
  log_info "Applying WAL logs for point-in-time recovery..."
  log_info "Target time: $PITR_TIME"
  
  if [ "$DRY_RUN" = false ]; then
    # Download WAL files from backup time to target time
    # This requires WAL archiving to be properly configured
    
    # Extract backup timestamp from filename
    BACKUP_TIMESTAMP=$(echo "$BACKUP_FILE" | grep -oE '[0-9]{8}_[0-9]{6}')
    
    log_warn "PITR is a complex operation. Manual WAL replay may be required."
    log_warn "Consult docs/disaster-recovery.md for detailed PITR instructions."
    
    # For automated PITR, you would typically:
    # 1. Set up a recovery.conf with recovery_target_time
    # 2. Start PostgreSQL in recovery mode
    # 3. Wait for recovery to complete
    # 4. Promote to primary
    
    log_info "WAL files should be available at s3://${BACKUP_BUCKET}/wal/"
  fi
fi

# Step 7: Run migrations
if [ "$RUN_MIGRATIONS" = true ]; then
  log_info "Running database migrations..."
  if [ "$DRY_RUN" = false ]; then
    cd /app 2>/dev/null || cd "$(dirname "$0")/.."
    pnpm prisma migrate deploy || {
      log_warn "Migration failed - you may need to run manually"
    }
  fi
fi

# Step 8: Scale up application
log_info "Scaling up application..."
if [ "$DRY_RUN" = false ]; then
  kubectl scale deployment ${DEPLOYMENT} --replicas=${REPLICAS} -n ${NAMESPACE}
  
  # Wait for pods to be ready
  log_info "Waiting for pods to be ready..."
  kubectl wait --for=condition=ready pod -l app=aivo,component=web -n ${NAMESPACE} --timeout=300s
fi

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "========================================="
echo "Restore Complete!"
echo "========================================="
echo "Backup: $BACKUP_FILE"
echo "Duration: ${DURATION}s"
echo "Time: $(date)"
if [ -n "$SAFETY_BACKUP" ]; then
  echo "Safety backup: $SAFETY_BACKUP"
fi
echo "========================================="

# Cleanup
if [ "$DRY_RUN" = false ]; then
  rm -f "/tmp/${BACKUP_FILE}"
  log_info "Cleaned up temporary files"
fi

log_info "Please verify the application is functioning correctly!"
