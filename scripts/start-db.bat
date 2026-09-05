@echo off
REM Start PostgreSQL via Docker (requires Docker Desktop)
docker compose up -d
echo PostgreSQL started. Check: docker compose ps
