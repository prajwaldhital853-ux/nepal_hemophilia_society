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

# Map Render DATABASE_URL → POSTGRES_* (Django reads POSTGRES_* in settings.py)
if [[ -n "${DATABASE_URL:-}" && -z "${POSTGRES_HOST:-}" ]]; then
  echo "==> Mapping DATABASE_URL to POSTGRES_*"
  # shellcheck disable=SC1090
  eval "$(python - <<'PY'
import os
from urllib.parse import urlparse

url = urlparse(os.environ["DATABASE_URL"])
mapping = {
    "POSTGRES_HOST": url.hostname or "",
    "POSTGRES_PORT": str(url.port or 5432),
    "POSTGRES_USER": url.username or "",
    "POSTGRES_PASSWORD": url.password or "",
    "POSTGRES_DB": (url.path or "/").lstrip("/"),
}
for key, value in mapping.items():
    safe = value.replace("'", "'\"'\"'")
    print(f"export {key}='{safe}'")
PY
)"
fi

export USE_SQLITE="${USE_SQLITE:-false}"

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
