#!/bin/bash
#
# backup-retention.sh
# Manages backup retention policy for AIVO database backups
#
# Retention Policy:
#   - Daily backups: Keep 7 days
#   - Weekly backups: Keep 4 weeks (Sundays)
#   - Monthly backups: Keep 12 months (1st of month)
#
# Usage: ./backup-retention.sh [--dry-run]
#

set -e

# Configuration
BACKUP_BUCKET="${BACKUP_BUCKET:-aivo-backups}"
DAILY_RETENTION_DAYS="${DAILY_RETENTION_DAYS:-7}"
WEEKLY_RETENTION_WEEKS="${WEEKLY_RETENTION_WEEKS:-4}"
MONTHLY_RETENTION_MONTHS="${MONTHLY_RETENTION_MONTHS:-12}"
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --bucket)
      BACKUP_BUCKET="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "========================================="
echo "AIVO Backup Retention Management"
echo "========================================="
echo "Bucket: $BACKUP_BUCKET"
echo "Daily retention: $DAILY_RETENTION_DAYS days"
echo "Weekly retention: $WEEKLY_RETENTION_WEEKS weeks"
echo "Monthly retention: $MONTHLY_RETENTION_MONTHS months"
echo "Dry run: $DRY_RUN"
echo "========================================="
echo ""

# Function to delete old backups
delete_old_backups() {
  local prefix=$1
  local retention_days=$2
  local cutoff_date
  
  # Calculate cutoff date
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    cutoff_date=$(date -v-${retention_days}d +%Y%m%d)
  else
    # Linux
    cutoff_date=$(date -d "-${retention_days} days" +%Y%m%d)
  fi
  
  echo "Processing $prefix (cutoff: $cutoff_date)..."
  
  # List backups older than cutoff
  aws s3 ls s3://${BACKUP_BUCKET}/${prefix}/ | while read -r line; do
    filename=$(echo "$line" | awk '{print $4}')
    
    if [ -z "$filename" ]; then
      continue
    fi
    
    # Extract date from filename (format: aivo_backup_YYYYMMDD_HHMMSS.sql.gz)
    backup_date=$(echo "$filename" | grep -oE '[0-9]{8}' | head -1)
    
    if [ -z "$backup_date" ]; then
      continue
    fi
    
    # Check if backup is older than cutoff
    if [ "$backup_date" -lt "$cutoff_date" ]; then
      echo "  Deleting: $filename (date: $backup_date)"
      
      if [ "$DRY_RUN" = false ]; then
        aws s3 rm "s3://${BACKUP_BUCKET}/${prefix}/${filename}"
      else
        echo "    [DRY RUN] Would delete: s3://${BACKUP_BUCKET}/${prefix}/${filename}"
      fi
    fi
  done
}

# Function to promote daily to weekly (Sundays only)
promote_to_weekly() {
  echo "Checking for daily backups to promote to weekly..."
  
  aws s3 ls s3://${BACKUP_BUCKET}/daily/ | while read -r line; do
    filename=$(echo "$line" | awk '{print $4}')
    
    if [ -z "$filename" ]; then
      continue
    fi
    
    # Extract date from filename
    backup_date=$(echo "$filename" | grep -oE '[0-9]{8}' | head -1)
    
    if [ -z "$backup_date" ]; then
      continue
    fi
    
    # Check if backup date was a Sunday
    year=${backup_date:0:4}
    month=${backup_date:4:2}
    day=${backup_date:6:2}
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
      day_of_week=$(date -j -f "%Y%m%d" "$backup_date" +%u 2>/dev/null || echo "")
    else
      day_of_week=$(date -d "$year-$month-$day" +%u 2>/dev/null || echo "")
    fi
    
    # Sunday is 7
    if [ "$day_of_week" = "7" ]; then
      # Check if already exists in weekly
      if ! aws s3 ls "s3://${BACKUP_BUCKET}/weekly/${filename}" > /dev/null 2>&1; then
        echo "  Promoting to weekly: $filename"
        
        if [ "$DRY_RUN" = false ]; then
          aws s3 cp "s3://${BACKUP_BUCKET}/daily/${filename}" \
            "s3://${BACKUP_BUCKET}/weekly/${filename}" \
            --storage-class STANDARD_IA
        else
          echo "    [DRY RUN] Would copy to weekly"
        fi
      fi
    fi
  done
}

# Function to promote weekly to monthly (1st of month only)
promote_to_monthly() {
  echo "Checking for weekly backups to promote to monthly..."
  
  aws s3 ls s3://${BACKUP_BUCKET}/weekly/ | while read -r line; do
    filename=$(echo "$line" | awk '{print $4}')
    
    if [ -z "$filename" ]; then
      continue
    fi
    
    # Extract date from filename
    backup_date=$(echo "$filename" | grep -oE '[0-9]{8}' | head -1)
    
    if [ -z "$backup_date" ]; then
      continue
    fi
    
    # Check if backup was on 1st of month (or closest Sunday)
    day=${backup_date:6:2}
    
    # Accept backups from day 01-07 as monthly candidates
    if [ "$day" -le "07" ]; then
      # Check if we already have a monthly for this month
      year_month=${backup_date:0:6}
      existing_monthly=$(aws s3 ls "s3://${BACKUP_BUCKET}/monthly/" | grep "aivo_backup_${year_month}" | head -1 || echo "")
      
      if [ -z "$existing_monthly" ]; then
        echo "  Promoting to monthly: $filename"
        
        if [ "$DRY_RUN" = false ]; then
          aws s3 cp "s3://${BACKUP_BUCKET}/weekly/${filename}" \
            "s3://${BACKUP_BUCKET}/monthly/${filename}" \
            --storage-class GLACIER
        else
          echo "    [DRY RUN] Would copy to monthly (Glacier)"
        fi
      fi
    fi
  done
}

# Main execution
echo "Step 1: Promoting eligible backups..."
echo "---------------------------------------"
promote_to_weekly
promote_to_monthly
echo ""

echo "Step 2: Cleaning up old backups..."
echo "---------------------------------------"

# Clean daily backups (keep 7 days)
delete_old_backups "daily" "$DAILY_RETENTION_DAYS"

# Clean weekly backups (keep 4 weeks = 28 days)
weekly_retention_days=$((WEEKLY_RETENTION_WEEKS * 7))
delete_old_backups "weekly" "$weekly_retention_days"

# Clean monthly backups (keep 12 months = 365 days)
monthly_retention_days=$((MONTHLY_RETENTION_MONTHS * 30))
delete_old_backups "monthly" "$monthly_retention_days"

# Clean WAL files (keep 7 days)
echo ""
echo "Step 3: Cleaning up old WAL files..."
echo "---------------------------------------"
delete_old_backups "wal" "$DAILY_RETENTION_DAYS"

echo ""
echo "========================================="
echo "Retention management completed!"
echo "========================================="

# Summary
echo ""
echo "Current backup counts:"
echo "  Daily:   $(aws s3 ls s3://${BACKUP_BUCKET}/daily/ | wc -l | tr -d ' ')"
echo "  Weekly:  $(aws s3 ls s3://${BACKUP_BUCKET}/weekly/ | wc -l | tr -d ' ')"
echo "  Monthly: $(aws s3 ls s3://${BACKUP_BUCKET}/monthly/ | wc -l | tr -d ' ')"
