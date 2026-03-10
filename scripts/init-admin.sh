#!/bin/bash
set -euo pipefail

echo "Creating admin user..."
read -p "Email: " EMAIL
read -sp "Password: " PASSWORD
echo

HASH=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('${PASSWORD}', 12).then(h => console.log(h))")

PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "${POSTGRES_HOST:-localhost}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  -c "INSERT INTO admin_users (email, password_hash, display_name) VALUES ('${EMAIL}', '${HASH}', 'Admin') ON CONFLICT (email) DO UPDATE SET password_hash = '${HASH}';"

echo "Admin user created: ${EMAIL}"
