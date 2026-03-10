#!/bin/bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: restore.sh <backup_filename>"
  echo "Available backups:"
  ls -lh /backups/theevent_*.sql.gz.enc 2>/dev/null || echo "No backups found"
  exit 1
fi

BACKUP_FILE="/backups/$1"
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "[$(date)] Restoring from: $1"
echo "WARNING: This will overwrite the current database!"
read -p "Continue? (yes/no): " confirm
if [ "${confirm}" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

openssl enc -aes-256-cbc -d -salt -pass "pass:${BACKUP_ENCRYPTION_KEY}" -in "${BACKUP_FILE}" \
  | gunzip \
  | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
    -h "${POSTGRES_HOST:-postgres}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}"

echo "[$(date)] Restore complete."
