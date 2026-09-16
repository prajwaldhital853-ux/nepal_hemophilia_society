# NHMS production go-live checklist

National-level system. Do not go live until every item is done and signed off.

## Must-have before production

- [ ] `DJANGO_DEBUG=False` on every public host
- [ ] Unique `DJANGO_SECRET_KEY` (64+ random bytes), never the insecure default
- [ ] Unique `BACKUP_ENCRYPTION_KEY` stored in a secrets manager, not in git
- [ ] PostgreSQL only (SQLite off). Encrypted disks and automated DB snapshots
- [ ] TLS everywhere (admin, API, website, patient API). HSTS enabled
- [ ] `DJANGO_ALLOWED_HOSTS` limited to real hostnames
- [ ] `DJANGO_CORS_ALLOWED_ORIGINS` limited to the real admin and website origins
- [ ] Cloudinary or equivalent for uploads; no world-readable media bucket
- [ ] Super Admin password rotated from any seed/demo account; seed users disabled
- [ ] Default `superadmin` / demo passwords removed
- [ ] Admin tokens: 8h access / 12h refresh. Patient: 7d / 30d. No multi-year JWTs
- [ ] Device lock live: 3 failed logins → 5 minute **device** lock; unused attempts reset after 1 hour
- [ ] Login throttle live (`login_device` 12/minute). Not IP-based lockout
- [ ] Encrypted daily backup cron: `python manage.py create_backup --kind auto`
- [ ] Super Admin workstation can create/download backups from Settings → Backups
- [ ] Backup files kept only on Super Admin device + encrypted server store (14 retained)
- [ ] Restore drill completed once (decrypt backup, restore to a staging DB)
- [ ] SMTP credentials for alerts, not console email
- [ ] Error tracking (Sentry or equivalent) without PHI in breadcrumbs
- [ ] Structured audit log retention policy (who viewed/changed clinical data)
- [ ] RBAC signed off: Super Admin, Admin, Province, Center, Treatment, Website Manager
- [ ] Website content management limited to Super Admin / allowed Admin / Website Manager
- [ ] Admins cannot edit or delete their own privileged account
- [ ] Province Admin can create center admins only in their own province
- [ ] Patient self-registration remains disabled
- [ ] File uploads: PDF/JPG/PNG only, size cap, virus scan if available
- [ ] Rate limits on login, refresh, password change, anonymous API
- [ ] JSON-only API in production (no browsable API)
- [ ] Database user is not a superuser; least-privilege grants
- [ ] Off-site encrypted backup copy (not only the app server)
- [ ] Incident response contacts and 24/7 on-call for the go-live window
- [ ] Penetration test (login lock, IDOR across provinces, JWT, backups, uploads)
- [ ] Data Protection / MoHP / NHMS legal sign-off for PHI hosting in Nepal or approved region

## Security already implemented in this codebase

- Device-scoped login lock (not IP) for admin and patient
- Device login throttle plus remaining-attempt responses (`401` / `423`)
- Shortened JWTs; tokens in admin `sessionStorage`
- Security headers (nosniff, frame deny, referrer, HSTS in production)
- Encrypted `.zip.enc` backups, Super Admin only
- Cursor pagination on list APIs (patients, users, admins, audit, injections, treatments, stock, documents)
- HttpOnly session/CSRF cookies; HTTPS redirects when `DEBUG=False`
- Password validators; patient password-change throttle
- Clinical access scoped by province/center with `canLogClinical` for visiting patients

## Daily operations after go-live

- Super Admin opens Settings → Backups at least once per day (auto-creates if older than 20 hours and downloads to that device)
- Confirm cron `create_backup --kind auto` ran; alert if missing
- Review audit trail for failed logins and backup downloads
- Rotate Super Admin password on a 90-day cycle
- Patch Django, Next.js, Expo, and OS monthly

## Do not

- Do not lock by IP (shared hospital NAT would lock a whole center)
- Do not store backups on staff laptops other than the designated Super Admin workstation
- Do not commit `.env`, `private_backups/`, or JWT secrets
- Do not expose `/api/v1/backups/` through a public unauthenticated proxy
- Do not leave `DJANGO_API_DEBUG_ERRORS=true` after an incident
