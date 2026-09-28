#!/usr/bin/env bash
# NHMS API container entrypoint (VPS / Docker production).
set -euo pipefail

cd /app

export USE_SQLITE="${USE_SQLITE:-false}"

echo "==> NHMS API startup (PORT=${PORT:-8000})"

if [[ "${USE_SQLITE}" == "true" ]]; then
  echo "==> Using SQLite"
elif [[ -n "${DATABASE_URL:-}" ]]; then
  echo "==> Using DATABASE_URL"
elif [[ -n "${POSTGRES_HOST:-}" ]]; then
  echo "==> Using POSTGRES_* (${POSTGRES_HOST})"
else
  echo "ERROR: Configure DATABASE_URL or POSTGRES_* for production."
  exit 1
fi

echo "==> migrate"
python manage.py migrate --noinput
python manage.py migrate --check

echo "==> collectstatic"
python manage.py collectstatic --noinput

if [[ "${RESET_SUPER_ADMIN_ON_START:-false}" == "true" ]]; then
  echo "==> ensure_super_admin (RESET_SUPER_ADMIN_ON_START=true)"
  python manage.py ensure_super_admin
fi

if [[ "${RUN_SEED_ON_START:-false}" == "true" ]]; then
  echo "==> seed_nhms"
  python manage.py seed_nhms
fi

if [[ "${RUN_DEMO_SEED_ON_START:-false}" == "true" ]]; then
  echo "==> seed_demo_data (requires NHMS_DEMO_PASSWORD in production)"
  python manage.py seed_demo_data
fi

if [[ "${RUN_CMS_SEED_ON_START:-true}" == "true" ]]; then
  echo "==> seed_cms --update"
  python manage.py seed_cms --update
fi

echo "==> gunicorn"
exec gunicorn config.wsgi:application --config gunicorn.conf.py
