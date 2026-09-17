#!/usr/bin/env bash
# NHMS — Render.com startup (no shell access needed)
#
# Render Web Service settings:
#   Root Directory:  backend
#   Build Command:   pip install -r requirements.txt
#   Start Command:   bash ../render.sh
#
# Attach a Render PostgreSQL database and link it (sets DATABASE_URL).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}/backend"

echo "==> NHMS backend startup (PORT=${PORT:-8000}, Python $(python -V 2>&1))"

export USE_SQLITE="${USE_SQLITE:-false}"

if [[ "${USE_SQLITE}" == "true" ]]; then
  echo "==> Using SQLite (USE_SQLITE=true)"
elif [[ -n "${DATABASE_URL:-}" ]]; then
  echo "==> Using DATABASE_URL for Postgres"
elif [[ -n "${POSTGRES_HOST:-}" && -n "${POSTGRES_DB:-}" && -n "${POSTGRES_USER:-}" ]]; then
  echo "==> Using POSTGRES_* variables for Postgres (${POSTGRES_HOST})"
else
  echo "ERROR: No database configured."
  echo "  Option A — link Render Postgres to this web service (sets DATABASE_URL automatically)"
  echo "  Option B — add env var DATABASE_URL with the Internal Database URL from Render"
  echo "  Option C — set POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD (not localhost)"
  exit 1
fi

echo "==> Running migrations"
python manage.py migrate --noinput
python manage.py migrate --check

echo "==> Collecting static files"
python manage.py collectstatic --noinput

if [[ "${RUN_SEED_ON_START:-true}" == "true" ]]; then
  echo "==> Seeding reference data (idempotent) — set RUN_SEED_ON_START=false after first deploy to speed up restarts"
  python manage.py seed_nhms
  if [[ "${RUN_DEMO_SEED_ON_START:-true}" == "true" ]]; then
    echo "==> Seeding demo patients/admins (idempotent) — set RUN_DEMO_SEED_ON_START=false after first deploy"
    python manage.py seed_demo_data
    python manage.py seed_cms
  else
    echo "==> Skipping demo seed (RUN_DEMO_SEED_ON_START=false)"
  fi
else
  echo "==> Skipping seed (RUN_SEED_ON_START=false)"
fi

if [[ -n "${CLOUDINARY_URL:-}" || -n "${CLOUDINARY_CLOUD_NAME:-}" ]]; then
  echo "==> Cloudinary configured for patient/admin photos and documents"
fi

echo "==> Starting Gunicorn on 0.0.0.0:${PORT:-8000}"
exec gunicorn config.wsgi:application --config gunicorn.conf.py
