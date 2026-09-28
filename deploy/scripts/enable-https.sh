#!/usr/bin/env bash
# Run on the VPS after HTTP works and DNS points to the server.
# Requires: deploy/.env with API_HOST, ADMIN_HOST, WWW_HOST, APEX_HOST set.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT}/deploy/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

EMAIL="${CERTBOT_EMAIL:-}"
if [[ -z "${EMAIL}" ]]; then
  echo "Set CERTBOT_EMAIL in deploy/.env (e.g. admin@yourdomain.org.np)"
  exit 1
fi

DOMAINS=(-d "${API_HOST}" -d "${ADMIN_HOST}" -d "${WWW_HOST}")
if [[ -n "${APEX_HOST}" && "${APEX_HOST}" != "${WWW_HOST}" ]]; then
  DOMAINS+=(-d "${APEX_HOST}")
fi

docker compose -f "${ROOT}/deploy/docker-compose.prod.yml" --env-file "${ENV_FILE}" run --rm \
  certbot certonly --webroot -w /var/www/certbot \
  "${DOMAINS[@]}" \
  --email "${EMAIL}" --agree-tos --no-eff-email

echo "Certificates issued. Add SSL server blocks to deploy/nginx/conf.d/nhms.conf.template and redeploy nginx."
