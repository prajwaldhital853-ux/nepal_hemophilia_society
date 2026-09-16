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

echo "==> NHMS backend startup (PORT=${PORT:-8000})"

export USE_SQLITE="${USE_SQLITE:-false}"

if [[ "${USE_SQLITE}" == "true" ]]; then
  echo "==> Using SQLite (USE_SQLITE=true)"
elif [[ -n "${DATABASE_URL:-}" ]]; then
  echo "==> Using Render DATABASE_URL for Postgres"
else
  echo "ERROR: No DATABASE_URL found. On Render: create a PostgreSQL database and link it to this web service."
  echo "       Also remove POSTGRES_HOST=localhost from env vars if you copied from .env.example."
  exit 1
fi

echo "==> Running migrations"
python manage.py migrate --noinput

echo "==> Collecting static files"
python manage.py collectstatic --noinput

if [[ "${RUN_SEED_ON_START:-true}" == "true" ]]; then
  echo "==> Seeding reference data (idempotent)"
  python manage.py seed_nhms
fi

echo "==> Starting Gunicorn"
exec gunicorn config.wsgi:application --config gunicorn.conf.py
