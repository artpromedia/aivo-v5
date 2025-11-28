#!/bin/bash
#
# verify-backup.sh
# Verifies AIVO database backup integrity and contents
#
# Usage:
#   ./verify-backup.sh <backup-file>
#   ./verify-backup.sh --latest
#   ./verify-backup.sh --all-recent
#

set -e

# Configuration
BACKUP_BUCKET="${BACKUP_BUCKET:-aivo-backups}"
TEMP_DIR="/tmp/backup-verify-$$"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; }

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

mkdir -p "$TEMP_DIR"

# Parse arguments
BACKUP_FILE=""
VERIFY_ALL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --latest)
      aws s3 cp s3://${BACKUP_BUCKET}/latest-backup.json "$TEMP_DIR/latest.json"
      BACKUP_FILE=$(cat "$TEMP_DIR/latest.json" | grep -o '"filename": "[^"]*"' | cut -d'"' -f4)
      shift
      ;;
    --all-recent)
      VERIFY_ALL=true
      shift
      ;;
    --bucket)
      BACKUP_BUCKET="$2"
      shift 2
      ;;
    *)
      BACKUP_FILE="$1"
      shift
      ;;
  esac
done

verify_single_backup() {
  local backup_file=$1
  local backup_path=$2
  local errors=0
  
  echo ""
  echo "========================================="
  echo "Verifying: $backup_file"
  echo "========================================="
  
  # Download backup
  log_info "Downloading backup..."
  if ! aws s3 cp "s3://${BACKUP_BUCKET}/${backup_path}/${backup_file}" "$TEMP_DIR/$backup_file" 2>/dev/null; then
    log_fail "Failed to download backup"
    return 1
  fi
  
  local file_size=$(ls -lh "$TEMP_DIR/$backup_file" | awk '{print $5}')
  log_info "Downloaded: $file_size"
  
  # Test 1: File size check
  local size_bytes=$(stat -f%z "$TEMP_DIR/$backup_file" 2>/dev/null || stat -c%s "$TEMP_DIR/$backup_file")
  if [ "$size_bytes" -lt 1000 ]; then
    log_fail "Backup file suspiciously small (<1KB)"
    ((errors++))
  else
    log_pass "File size check: $file_size"
  fi
  
  # Test 2: Gzip integrity
  log_info "Testing gzip integrity..."
  if gunzip -t "$TEMP_DIR/$backup_file" 2>/dev/null; then
    log_pass "Gzip integrity: Valid"
  else
    log_fail "Gzip integrity: Corrupted"
    ((errors++))
    return $errors
  fi
  
  # Test 3: SQL content validation
  log_info "Validating SQL content..."
  gunzip -c "$TEMP_DIR/$backup_file" > "$TEMP_DIR/backup.sql"
  
  # Check for PostgreSQL dump markers
  if grep -q "PostgreSQL database dump" "$TEMP_DIR/backup.sql"; then
    log_pass "PostgreSQL dump header: Present"
  else
    log_fail "PostgreSQL dump header: Missing"
    ((errors++))
  fi
  
  if grep -q "PostgreSQL database dump complete" "$TEMP_DIR/backup.sql"; then
    log_pass "PostgreSQL dump footer: Present"
  else
    log_fail "PostgreSQL dump footer: Missing (incomplete dump?)"
    ((errors++))
  fi
  
  # Test 4: Check for critical tables
  log_info "Checking for critical tables..."
  local critical_tables=("User" "Learner" "Tenant" "Session" "LearningPath" "Assessment")
  
  for table in "${critical_tables[@]}"; do
    if grep -q "CREATE TABLE.*\"$table\"" "$TEMP_DIR/backup.sql" || \
       grep -q "COPY.*\"$table\"" "$TEMP_DIR/backup.sql"; then
      log_pass "Table $table: Found"
    else
      log_warn "Table $table: Not found (may be empty or renamed)"
    fi
  done
  
  # Test 5: Count tables and data
  local table_count=$(grep -c "CREATE TABLE" "$TEMP_DIR/backup.sql" || echo "0")
  local copy_count=$(grep -c "^COPY " "$TEMP_DIR/backup.sql" || echo "0")
  
  log_info "Tables defined: $table_count"
  log_info "Data sections: $copy_count"
  
  if [ "$table_count" -lt 10 ]; then
    log_warn "Fewer tables than expected (found $table_count)"
  fi
  
  # Test 6: Check for schema definitions
  if grep -q "CREATE SCHEMA" "$TEMP_DIR/backup.sql" || grep -q "public" "$TEMP_DIR/backup.sql"; then
    log_pass "Schema definitions: Present"
  else
    log_warn "Schema definitions: May be missing"
  fi
  
  # Test 7: Check for indexes and constraints
  local index_count=$(grep -c "CREATE INDEX\|CREATE UNIQUE INDEX" "$TEMP_DIR/backup.sql" || echo "0")
  local constraint_count=$(grep -c "ADD CONSTRAINT" "$TEMP_DIR/backup.sql" || echo "0")
  
  log_info "Indexes: $index_count"
  log_info "Constraints: $constraint_count"
  
  # Cleanup
  rm -f "$TEMP_DIR/$backup_file" "$TEMP_DIR/backup.sql"
  
  # Summary
  echo ""
  if [ $errors -eq 0 ]; then
    log_pass "Verification PASSED"
  else
    log_fail "Verification FAILED with $errors error(s)"
  fi
  
  return $errors
}

find_backup_path() {
  local file=$1
  
  if aws s3 ls "s3://${BACKUP_BUCKET}/daily/${file}" > /dev/null 2>&1; then
    echo "daily"
  elif aws s3 ls "s3://${BACKUP_BUCKET}/weekly/${file}" > /dev/null 2>&1; then
    echo "weekly"
  elif aws s3 ls "s3://${BACKUP_BUCKET}/monthly/${file}" > /dev/null 2>&1; then
    echo "monthly"
  else
    echo ""
  fi
}

# Main execution
if [ "$VERIFY_ALL" = true ]; then
  log_info "Verifying all recent backups..."
  
  total=0
  passed=0
  failed=0
  
  # Get last 3 daily backups
  for backup in $(aws s3 ls s3://${BACKUP_BUCKET}/daily/ | tail -3 | awk '{print $4}'); do
    ((total++))
    if verify_single_backup "$backup" "daily"; then
      ((passed++))
    else
      ((failed++))
    fi
  done
  
  echo ""
  echo "========================================="
  echo "Verification Summary"
  echo "========================================="
  echo "Total verified: $total"
  echo "Passed: $passed"
  echo "Failed: $failed"
  echo "========================================="
  
  exit $failed
  
elif [ -n "$BACKUP_FILE" ]; then
  backup_path=$(find_backup_path "$BACKUP_FILE")
  
  if [ -z "$backup_path" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
  fi
  
  verify_single_backup "$BACKUP_FILE" "$backup_path"
  exit $?
  
else
  echo "Usage: $0 <backup-file> | --latest | --all-recent"
  echo ""
  echo "Options:"
  echo "  --latest      Verify the most recent backup"
  echo "  --all-recent  Verify last 3 daily backups"
  echo "  --bucket      S3 bucket name (default: aivo-backups)"
  exit 1
fi
