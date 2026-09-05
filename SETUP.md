# NHMS — Local Development Setup

Step-by-step guide to run all parts of the monorepo on your machine.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.12+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| PostgreSQL 16 | 16+ | Docker **or** [PostgreSQL winget](https://winget.run/pkg/PostgreSQL.PostgreSQL.17) |
| React Native / Expo | Latest via Expo SDK 57 | For mobile app (Android + iOS) |
| Docker Desktop | Optional | [docker.com](https://www.docker.com/products/docker-desktop/) |

## 1. Clone & environment

```powershell
cd D:\nepal_hemophilia_digital_management_system
copy .env.example .env
```

Edit `.env` if you need different database credentials.

## 2. PostgreSQL (choose one)

### Option A — Docker (recommended)

```powershell
docker compose up -d
docker compose ps
```

### Option B — Local PostgreSQL install

1. Install: `winget install PostgreSQL.PostgreSQL.17`
2. Create database and user matching `.env`:
   - Database: `nepal_hemophilia`
   - User: `hemophilia_user`
   - Password: `hemophilia_pass`

## 3. Backend (Django + DRF)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**URLs:**
- API health: http://localhost:8000/api/v1/health/
- Swagger docs: http://localhost:8000/api/docs/
- Django admin: http://localhost:8000/admin/

## 4. Admin Panel (Next.js)

```powershell
cd admin-panel
copy .env.example .env.local
npm install
npm run dev
```

Open: http://localhost:3000

## 5. Public Website (Next.js)

```powershell
cd website
copy .env.example .env.local
npm install
npm run dev
```

Open: http://localhost:3001

## 6. Patient App (React Native / Expo)

```powershell
cd patient-app
copy .env.example .env
npm install
npm start
```

- **Android:** `npm run android` (requires Android Studio or Expo Go)
- **iOS:** `npm run ios` (macOS + Xcode, or Expo Go on iPhone)

Code splitting: each feature screen loads via `React.lazy` when navigated to.

## Django Apps (backend/apps/)

| App | Feature |
|-----|---------|
| `accounts` | Auth, users, JWT |
| `provinces` | Provinces & districts |
| `hospitals` | Hospitals & admins |
| `patients` | Registration & verification |
| `factors` | Factor/medicine catalog |
| `injections` | Injection records |
| `treatments` | Treatment records |
| `notifications` | Notifications |
| `audit` | Audit logs |
| `reports` | Report generation |
| `core` | Health check & shared utils |

## Troubleshooting

**`src refspec main does not match any` (git push)**  
Commit files first: `git add .` → `git commit -m "Initial project setup"` → `git push`.

**PostgreSQL connection refused**  
Ensure Docker postgres is running: `docker compose up -d`

**Expo / Metro bundler issues**  
Clear cache: `npx expo start -c`

**CORS errors from frontend**  
Check `DJANGO_CORS_ALLOWED_ORIGINS` in `.env` includes `http://localhost:3000` and `http://localhost:3001`.
