#!/bin/bash
set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
FILENAME="theevent_${DATE}.sql.gz.enc"

echo "[$(date)] Starting backup..."

# Dump and compress
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST:-postgres}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --no-owner --no-privileges \
  | gzip \
  | openssl enc -aes-256-cbc -salt -pass "pass:${BACKUP_ENCRYPTION_KEY}" \
  > "${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Backup created: ${FILENAME} ($(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1))"

# Retention
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
find "${BACKUP_DIR}" -name "theevent_*.sql.gz.enc" -mtime "+${RETENTION_DAYS}" -delete
echo "[$(date)] Old backups cleaned (retention: ${RETENTION_DAYS} days)"

# List remaining
echo "[$(date)] Current backups:"
ls -lh "${BACKUP_DIR}"/theevent_*.sql.gz.enc 2>/dev/null || echo "No backups found"
