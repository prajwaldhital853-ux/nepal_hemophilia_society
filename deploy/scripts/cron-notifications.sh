#!/usr/bin/env bash
# Example VPS cron (run every 15 minutes):
# */15 * * * * /opt/nhms/deploy/scripts/cron-notifications.sh >> /var/log/nhms-cron.log 2>&1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT}/deploy/.env"

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

BASE="https://${API_HOST}/api/v1/cron/notifications/"
curl -fsS "${BASE}?key=${CRON_SECRET}&job=all"
