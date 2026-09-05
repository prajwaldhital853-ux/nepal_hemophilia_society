# Nepal Hemophilia Digital Management System (NHMS)

Nationwide digital platform for hemophilia patient care, treatment tracking, and reporting across Nepal.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend API | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 |
| Admin Panel | Next.js 15 (App Router, code splitting) |
| Public Website | Next.js 15 |
| Mobile App | Flutter (Android + iOS) |

## Project Structure

```
nepal_hemophilia_digital_management_system/
├── backend/                 # Django + DRF API
│   ├── config/              # Project settings, URLs, WSGI
│   └── apps/                # Feature apps (one app per domain)
│       ├── accounts/
│       ├── provinces/
│       ├── hospitals/
│       ├── patients/
│       ├── factors/
│       ├── injections/
│       ├── treatments/
│       ├── notifications/
│       ├── audit/
│       └── reports/
├── admin-panel/             # Next.js admin dashboard
├── website/                 # Next.js public website
├── patient-app/             # Flutter mobile app
├── docker-compose.yml       # PostgreSQL for local dev
├── plan.md                  # Full project plan
└── .env.example             # Environment template
```

## Prerequisites

- Python 3.12+ (3.14 supported)
- Node.js 20+
- PostgreSQL 16 (via Docker or local install)
- Flutter SDK 3.x (for mobile app)
- Docker Desktop (recommended for PostgreSQL)

## Quick Start

### 1. Environment setup

```powershell
cd D:\nepal_hemophilia_digital_management_system
copy .env.example .env
```

### 2. Start PostgreSQL

```powershell
docker compose up -d
```

### 3. Backend (Django)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

API: http://localhost:8000/api/v1/

### 4. Admin Panel (Next.js)

```powershell
cd admin-panel
copy .env.example .env.local
npm install
npm run dev
```

Admin: http://localhost:3000

### 5. Public Website (Next.js)

```powershell
cd website
copy .env.example .env.local
npm install
npm run dev
```

Website: http://localhost:3001

### 6. Mobile App (Flutter)

```powershell
cd patient-app
flutter pub get
flutter run
```

## Django Apps

Each backend feature is a separate Django app under `backend/apps/`:

| App | Responsibility |
|-----|----------------|
| `accounts` | Auth, users, roles, JWT |
| `provinces` | Provinces & districts |
| `hospitals` | Hospitals & hospital admins |
| `patients` | Patient registration, verification, profiles |
| `factors` | Factor/medicine catalog |
| `injections` | Injection records |
| `treatments` | Treatment records |
| `notifications` | In-app & SMS notifications |
| `audit` | Audit logs |
| `reports` | Report generation |

## Documentation

See [plan.md](./plan.md) for the complete project blueprint, medical requirements, and phased execution plan.
