#!/bin/bash
#
# backup.sh
# Local development backup script for AIVO
# Used with docker-compose backup profile
#
# Usage: docker-compose --profile backup run backup
#

set -e

# Configuration
BACKUP_DIR="/backups"
DATABASE_URL="${DATABASE_URL:-postgresql://aivo:aivopass@db:5432/aivo_v5}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="aivo_backup_${TIMESTAMP}.sql.gz"

echo "========================================="
echo "AIVO Development Backup"
echo "========================================="
echo "Timestamp: $TIMESTAMP"
echo "Output: ${BACKUP_DIR}/${BACKUP_FILE}"
echo "========================================="

# Wait for database to be ready
echo "Waiting for database..."
until pg_isready -h db -U aivo; do
  sleep 2
done

# Create backup
echo "Creating backup..."
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Get file size
BACKUP_SIZE=$(ls -lh "${BACKUP_DIR}/${BACKUP_FILE}" | awk '{print $5}')

# Verify backup
echo "Verifying backup integrity..."
if gunzip -t "${BACKUP_DIR}/${BACKUP_FILE}"; then
  echo "✓ Backup verified"
else
  echo "✗ Backup verification failed!"
  exit 1
fi

# Keep only last 5 local backups
echo "Cleaning up old backups..."
ls -t ${BACKUP_DIR}/*.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm -f

# Summary
echo ""
echo "========================================="
echo "Backup Complete!"
echo "========================================="
echo "File: ${BACKUP_FILE}"
echo "Size: ${BACKUP_SIZE}"
echo "Location: ${BACKUP_DIR}/"
echo ""
echo "To restore:"
echo "  gunzip -c ${BACKUP_DIR}/${BACKUP_FILE} | psql \$DATABASE_URL"
echo "========================================="
