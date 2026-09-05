# Nepal Hemophilia Digital Management System

## Complete Project Plan & Execution Blueprint

**Version:** 1.0  
**Date:** September 5, 2026  
**Status:** Pre-development planning  
**Source documents:** `Nepal_Hemophilia_Digital_Management_System_Report.docx` + clinical/registry research (WFH, ISTH, WBDR)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Objective & Goal](#2-project-objective--goal)
3. [Medical Background & Patient Classification](#3-medical-background--patient-classification)
4. [System Architecture](#4-system-architecture)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Core Workflows](#6-core-workflows)
7. [Module Specifications](#7-module-specifications)
8. [Hemophilia A vs B — Differentiation & Management Plan](#8-hemophilia-a-vs-b--differentiation--management-plan)
9. [Database Design](#9-database-design)
10. [Reports & Dashboards](#10-reports--dashboards)
11. [Security, Privacy & Audit](#11-security-privacy--audit)
12. [Notifications](#12-notifications)
13. [Technology Stack](#13-technology-stack)
14. [Detailed Execution Plan (Phased Roadmap)](#14-detailed-execution-plan-phased-roadmap)
15. [Pre-Coding Decisions Checklist](#15-pre-coding-decisions-checklist)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Success Criteria](#17-success-criteria)

---

## 1. Executive Summary

The **Nepal Hemophilia Digital Management System** is a nationwide digital health platform for the Nepal Hemophilia Society. It connects **hemophilia patients**, **hospitals**, **7 province administrators**, and a **national super admin** in one secure system.

The platform solves a critical coordination problem: hemophilia patients receive care at multiple hospitals, but treatment history is often fragmented. This system assigns every verified patient a **permanent Unique Patient ID** (e.g. `HEM-000123`) and stores all injection/treatment records in a **central database** accessible to authorized hospitals and administrators.

There are two main patient types:

| Type | Deficient Factor | Approx. Prevalence | Replacement Therapy |
|------|------------------|--------------------|---------------------|
| **Hemophilia A** | Factor VIII (FVIII) | ~80–85% of cases | Factor VIII products |
| **Hemophilia B** | Factor IX (FIX) | ~15–20% of cases | Factor IX products |

The system must differentiate patients by type and severity, enforce correct factor/product selection during injection entry, and produce **type-wise** and **factor-wise** reports for national planning.

---

## 2. Project Objective & Goal

### Objective (from project report)

- Connect hemophilia patients, hospitals, Province Admins, and Super Admin across Nepal in one secure digital system.
- Manage patient registration, verification, Unique Patient ID, treatment/injection records, hospital visits, and nationwide reporting.

### Final Goal

Transform hemophilia patient care, treatment tracking, hospital coordination, administration, and reporting in Nepal into an **integrated, secure, and organized digital platform** — replacing manual/paper tracking with centralized digital records.

---

## 3. Medical Background & Patient Classification

### 3.1 Hemophilia Types

Hemophilia is a rare **X-linked congenital bleeding disorder** caused by deficiency of clotting factors:

- **Hemophilia A** — deficiency of **Factor VIII (FVIII)**, gene `F8`
- **Hemophilia B** — deficiency of **Factor IX (FIX)**, gene `F9`

Accurate diagnosis requires a **factor assay** demonstrating FVIII or FIX deficiency. This must be captured during patient registration and verified by Province Admin using uploaded lab/diagnosis documents.

*Sources: [WFH Comprehensive Care Guidelines](https://guidelines.wfh.org/), [NCBI StatPearls — Hemophilia](https://www.ncbi.nlm.nih.gov/books/NBK551607/)*

### 3.2 Severity Classification

Severity is determined by **baseline factor activity level**:

| Severity | Factor Level | Typical Bleeding Pattern |
|----------|--------------|--------------------------|
| **Severe** | < 1 IU/dL (< 1%) | Spontaneous joint/muscle bleeding |
| **Moderate** | 1–5 IU/dL (1–5%) | Bleeding after trauma/surgery; occasional spontaneous bleeds |
| **Mild** | 5–40 IU/dL (5–40%) | Bleeding with major trauma/surgery; rare spontaneous bleeds |

*Source: WFH Guidelines for the Management of Hemophilia, 3rd edition*

### 3.3 Inhibitors (Important Clinical Flag)

Some patients develop **inhibitors** — antibodies that neutralize FVIII or FIX, making standard replacement therapy less effective.

| Type | Inhibitor Frequency (approx.) |
|------|-------------------------------|
| Severe Hemophilia A | ~30% develop inhibitors |
| Severe Hemophilia B | ~3% develop inhibitors |

When inhibitors are present, treatment may require **bypassing agents** (e.g. emicizumab, FEIBA, rFVIIa) instead of standard factor replacement.

**System requirement:** Track inhibitor status (`None` / `Past` / `Current`) on patient profile and flag during injection entry.

*Source: [ISTH Clinical Practice Guideline, 2024](https://doi.org/10.1016/j.jtha.2024.05.026)*

### 3.4 Treatment Modes (International Registry Standard)

Based on [WFH World Bleeding Disorders Registry (WBDR)](https://wfh.org/wp-content/uploads/2021/12/WBDR-DataSets-July2019.pdf) data standards:

| Indication | Description |
|------------|-------------|
| **Prophylaxis** | Regular scheduled factor replacement to prevent bleeds |
| **On-demand** | Factor given in response to a bleeding episode |
| **ITI** | Immune Tolerance Induction (for inhibitor patients) |
| **Surgery/Procedure** | Factor given for surgical hemostasis |
| **Trauma** | Factor given after trauma without known bleed |
| **Selective bleed prevention** | Before activity/event |
| **Other / Unknown** | Catch-all |

### 3.5 What the Project Report Already Specifies

The DOCX explicitly requires:

- **Registration:** blood group, **hemophilia type/severity**, hospital, emergency contact, documents
- **Reports:** patient reports by **hemophilia type**; injection reports **factor-wise**, dose-wise, hospital-wise, province-wise, date-wise
- **Database:** `patients`, `injection_records`, **`factors_medicines`** tables

### 3.6 What the Project Report Does NOT Define (Added by Research)

These must be designed before coding:

- Explicit mapping: Type A ↔ FVIII, Type B ↔ FIX
- Baseline factor level (%) at diagnosis
- Inhibitor status tracking
- Product catalog with factor-type filtering
- Validation rules preventing wrong factor for wrong patient type
- Structured injection fields: dose, unit (IU), indication, batch number

---

## 4. System Architecture

```
Public Website
      ↓
Patient App (Flutter/Android)
      ↓
Central REST API + Database (PostgreSQL/MySQL)
      ↓
Hospital Admin Panel (Web)
      ↓
7 × Province Admin Panels (Web)
      ↓
Super Admin Panel (Web)
      ↓
Reports (PDF / Excel / Print)
```

### Four Application Surfaces

| Surface | Users | Purpose |
|---------|-------|---------|
| **Public Website** | General public | Information about hemophilia, services, hospitals, news, contact. **No private medical data.** |
| **Patient App** | Verified patients | Profile, ID, treatment/injection history, notifications, emergency info |
| **Admin Panel (Web)** | Hospital / Province / Super admins | Patient search, record entry, verification, management, reports |
| **Backend API** | All clients | Authentication, business logic, data storage, reporting engine |

### Seven Province Administration

| # | Province |
|---|----------|
| 1 | Koshi Province |
| 2 | Madhesh Province |
| 3 | Bagmati Province |
| 4 | Gandaki Province |
| 5 | Lumbini Province |
| 6 | Karnali Province |
| 7 | Sudurpashchim Province |

Each province has its own **Province Admin** who verifies patients, manages hospitals, and views province-level reports.

---

## 5. User Roles & Permissions

### 5.1 Super Admin

**Scope:** Entire Nepal

**Capabilities:**
- National dashboard
- Manage all 7 provinces and Province Admins
- Manage all hospitals and Hospital Admins
- View/manage all patients, treatments, injections
- National reports and analytics
- Audit logs
- System settings (master data, factor catalog, notification templates)
- Correct patient medical profile (with audit trail)

### 5.2 Province Admin

**Scope:** Own province only

**Capabilities:**
- Province dashboard
- **Patient verification** (approve/reject registration)
- Patient management within province
- Hospital management within province
- Hospital Admin account management
- Treatment/injection monitoring (read-only across province)
- Province-level reports
- Notifications and settings

### 5.3 Hospital Admin

**Scope:** Own hospital only

**Capabilities:**
- Hospital dashboard
- **Search patient by Unique Patient ID**
- View patient profile (authorized fields only)
- **Add injection record**
- **Add treatment record**
- View patient history (all hospitals — read only)
- View own hospital's patients and activity
- Hospital reports (daily/weekly/monthly/yearly)
- PDF/Excel export
- Notifications, profile, settings

**Restrictions:**
- Cannot edit or delete records created by other hospitals
- Corrections require audit-trail workflow (Super Admin or formal correction request)

### 5.4 Patient

**Scope:** Own data only

**Capabilities:**
- Register (pending verification)
- Login after verification
- View Unique Patient ID
- View profile and medical summary
- View treatment history, injection history, hospital visit history
- View medical records and emergency information
- Receive notifications
- Change password, settings, help & support

### 5.5 Role-Based Access Control (RBAC) Matrix

| Action | Patient | Hospital Admin | Province Admin | Super Admin |
|--------|---------|----------------|----------------|-------------|
| Register | ✅ | ❌ | ❌ | ❌ |
| Verify patient | ❌ | ❌ | ✅ (own province) | ✅ |
| Search patient by ID | ❌ | ✅ | ✅ (own province) | ✅ |
| Add injection | ❌ | ✅ | ❌ | ✅ |
| Add treatment | ❌ | ✅ | ❌ | ✅ |
| Edit others' records | ❌ | ❌ | ❌ | ✅ (audit) |
| View national reports | ❌ | ❌ | ❌ | ✅ |
| View province reports | ❌ | ❌ | ✅ | ✅ |
| View hospital reports | ❌ | ✅ | ✅ | ✅ |
| Manage factor catalog | ❌ | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ✅ |

---

## 6. Core Workflows

### 6.1 Patient Registration & Verification

```
Patient fills registration form
  → Selects province
  → Uploads diagnosis documents
  → Status: PENDING_VERIFICATION
  → Notification sent to Province Admin
  → Province Admin reviews:
      - Name, DOB, contact, address
      - Hemophilia type (A/B)
      - Severity (Mild/Moderate/Severe)
      - Baseline factor level
      - Lab/diagnosis documents
  → APPROVED:
      - Unique Patient ID assigned (HEM-XXXXXX)
      - Login account activated
      - Patient notified
  → REJECTED:
      - Reason sent to patient
      - Patient can resubmit
```

**Registration fields (required):**

| Field | Type | Notes |
|-------|------|-------|
| Full name | text | |
| Date of birth | date | |
| Gender | enum | |
| Mobile number | text | Primary contact |
| Province | FK | Determines verifying admin |
| District | FK | |
| Local level (municipality/rural municipality) | text | |
| Ward number | number | |
| Full address | text | |
| Blood group | enum | A+, A-, B+, B-, AB+, AB-, O+, O- |
| **Hemophilia type** | enum | **A or B** |
| **Severity** | enum | **Mild / Moderate / Severe** |
| **Baseline factor level** | decimal | Percentage (IU/dL) |
| Primary hospital | FK | Registered care center |
| Emergency contact name | text | |
| Emergency contact phone | text | |
| Diagnosis documents | file[] | Lab reports, referral letters |
| Inhibitor status | enum | None / Past / Current (if known) |

### 6.2 Cross-Hospital Treatment Flow

```
Patient visits any registered hospital
  → Hospital Admin searches Unique Patient ID (HEM-000123)
  → System displays patient profile with type/severity badge
  → Admin verifies patient identity
  → Admin adds injection and/or treatment record
  → Record saved to central database
  → Linked to patient history (all hospitals)
  → Patient receives notification
  → Province Admin & Super Admin can view in reports
```

**Cross-hospital rules:**
- Any registered hospital can **add new records** for any verified patient
- Hospitals **cannot edit or delete** records created by other hospitals
- All corrections go through **audit trail** (correction record + reason + approver)
- Patient history shows records from **all hospitals** chronologically

### 6.3 Injection Entry Flow (Type-Safe)

```
Hospital Admin searches patient
  → System reads patient.hemophilia_type
  → If Type A: product dropdown shows FVIII products only
  → If Type B: product dropdown shows FIX products only
  → If inhibitor_status = Current: show warning + bypassing agents
  → Admin selects: product, dose (IU), indication, date/time, notes
  → System validates type-product compatibility
  → Record saved (immutable)
  → Patient history updated
  → Reports updated
```

---

## 7. Module Specifications

### 7.1 Public Website

**Pages:**
- Home
- About Hemophilia (include A vs B educational content)
- About Nepal Hemophilia Society
- Services
- Hospitals / Care Centers (map or list by province)
- Province Information
- Doctors / Health Professionals
- News & Notices
- Events
- Resources (brochures, guidelines)
- Gallery
- Emergency Information
- Contact
- Patient Login (link to app / portal)

**Rule:** No private patient medical data on the public website.

### 7.2 Patient App (Flutter / Android)

**Features:**
- Login & Registration
- Unique Patient ID display (with QR code for hospital scan)
- Profile (type, severity, emergency info)
- Treatment History
- Injection History (filterable by factor type)
- Hospital Visit History
- Medical Records (uploaded documents)
- Emergency Information Card
- Notifications
- Settings
- Password Change
- Help & Support

**Emergency Card displays:**
- Patient name & ID
- Hemophilia type (A/B) and severity
- Required factor (FVIII / FIX)
- Inhibitor status
- Blood group
- Emergency contact
- Primary hospital

### 7.3 Hospital Admin Panel

**Features:**
- Dashboard (today's activity, recent patients)
- Search Patient (by ID, name, mobile)
- View Patient Profile (medical summary + history)
- Add Injection (type-validated product selection)
- Add Treatment
- Patient History (timeline view)
- Hospital Patients list
- Reports: daily / weekly / monthly / yearly
- PDF / Excel export
- Notifications
- Profile & Settings

### 7.4 Province Admin Panel

**Features:**
- Dashboard (pending verifications, province stats)
- Patient Verification queue
- Patient Management
- Hospital Management
- Hospital Admin Management
- Treatment / Injection Monitoring (read-only)
- Province Reports
- Notifications & Settings

### 7.5 Super Admin Panel

**Features:**
- National Dashboard
- 7 Province Management
- Province Admin Management
- Hospital Management
- Hospital Admin Management
- Patient Management (all Nepal)
- Treatment Management
- Injection Management
- **Factor/Medicine Catalog Management**
- Reports (all types, all filters)
- Audit Logs
- Notifications
- System Settings

---

## 8. Hemophilia A vs B — Differentiation & Management Plan

### 8.1 Patient Medical Profile (Core Classification)

Every verified patient has a fixed medical profile stored on the `patients` table:

```
Patient Medical Profile
├── hemophilia_type:        A | B
├── deficient_factor:       FVIII | FIX          (auto-derived)
├── severity:               Mild | Moderate | Severe
├── baseline_factor_level:  decimal (%)           e.g. 0.5, 3.0, 25.0
├── inhibitor_status:       None | Past | Current
├── diagnosis_date:         date
├── diagnosis_verified:     boolean
├── verified_by:            Province Admin user ID
├── verified_at:            timestamp
└── unique_patient_id:      HEM-XXXXXX
```

**Auto-derivation rule:**
- `hemophilia_type = A` → `deficient_factor = FVIII`
- `hemophilia_type = B` → `deficient_factor = FIX`

**Change policy:**
- Type and severity should **not change** after verification except by Super Admin with mandatory audit log entry and reason.

### 8.2 Factor / Medicine Catalog

Master catalog managed by Super Admin (`factors_medicines` table):

```
factors_medicines
├── id
├── name                    e.g. "Octocog alfa", "Nonacog alfa"
├── brand_name
├── factor_type             FVIII | FIX | Bypassing | Other
├── applicable_type         A | B | Both
├── unit                    IU | mg
├── standard_dose_notes     optional guidance text
├── is_active               boolean
├── created_at
└── updated_at
```

**Example catalog entries:**

| Name | factor_type | applicable_type | Unit |
|------|-------------|-----------------|------|
| Factor VIII Concentrate (Plasma-derived) | FVIII | A | IU |
| Factor VIII Concentrate (Recombinant) | FVIII | A | IU |
| Factor IX Concentrate (Plasma-derived) | FIX | B | IU |
| Factor IX Concentrate (Recombinant) | FIX | B | IU |
| Emicizumab | Bypassing | A | mg |
| FEIBA | Bypassing | Both | IU |
| rFVIIa (NovoSeven) | Bypassing | Both | IU |

### 8.3 Injection Record (Type-Validated)

```
injection_records
├── id
├── patient_id              FK → patients
├── hospital_id             FK → hospitals
├── administered_by         FK → users (hospital admin)
├── factor_medicine_id      FK → factors_medicines
├── factor_type             FVIII | FIX | Bypassing  (snapshot)
├── dose                    decimal
├── unit                    IU | mg
├── indication              Prophylaxis | On-demand | ITI | Surgery | Trauma | Other
├── administered_at         timestamp
├── batch_number            optional
├── bleed_site              optional (e.g. knee, elbow)
├── notes                   text
├── is_correction           boolean (default false)
├── corrects_record_id      FK → injection_records (nullable)
├── created_at              immutable
└── updated_at
```

**Validation rules at API level:**

| Rule | Action |
|------|--------|
| Type A patient + FIX product | ❌ Reject |
| Type B patient + FVIII product | ❌ Reject |
| Inhibitor = Current + standard factor | ⚠️ Warn, allow with flag |
| Dose ≤ 0 | ❌ Reject |
| Missing required fields | ❌ Reject |
| Edit record from another hospital | ❌ Reject (correction workflow only) |

### 8.4 Treatment Record (Broader Care)

Separate from injections — covers non-factor care events:

```
treatment_records
├── id
├── patient_id
├── hospital_id
├── recorded_by
├── treatment_type          Physiotherapy | Surgery | Admission | ITI Program | Counseling | Other
├── description
├── treatment_date
├── notes
├── created_at
└── updated_at
```

### 8.5 UI Differentiation

**Patient profile badge (all admin views):**
```
[ Hemophilia A · Severe · FVIII ]   ← red badge
[ Hemophilia B · Moderate · FIX ]   ← blue badge
```

**Search results columns:**
- Patient ID | Name | Type | Severity | Province | Primary Hospital | Last Visit

**Injection history (patient app):**
- Grouped/filterable by factor type
- Plain-language labels: "Factor VIII — 2000 IU — On-demand — Bir Hospital — Mar 1, 2026"

**Dashboard KPIs (extended):**
- Total Patients → split: Type A / Type B
- Total Injections → split: FVIII doses / FIX doses
- Active Patients → by severity tier

---

## 9. Database Design

### 9.1 Core Tables (from project report)

| Table | Purpose |
|-------|---------|
| `users` | All system users (login credentials) |
| `roles` | Role definitions (patient, hospital_admin, province_admin, super_admin) |
| `provinces` | 7 provinces of Nepal |
| `districts` | Districts per province |
| `hospitals` | Registered care centers |
| `hospital_admins` | Hospital admin user ↔ hospital mapping |
| `province_admins` | Province admin user ↔ province mapping |
| `patients` | Patient profiles and medical classification |
| `patient_documents` | Uploaded diagnosis/medical files |
| `patient_verification` | Verification workflow status and history |
| `treatment_records` | Non-injection treatment events |
| `injection_records` | Factor injection/dose records |
| `hospital_visits` | Visit log when patient attends a hospital |
| `factors_medicines` | Master catalog of factor products |
| `notifications` | System notifications |
| `audit_logs` | All sensitive actions logged |
| `system_settings` | Configurable system parameters |

### 9.2 Key Relationships

```
provinces 1──* districts
provinces 1──* hospitals
provinces 1──* province_admins
hospitals 1──* hospital_admins
patients *──1 provinces
patients *──1 districts
patients *──1 hospitals (primary)
patients 1──* patient_documents
patients 1──* patient_verification
patients 1──* injection_records
patients 1──* treatment_records
patients 1──* hospital_visits
injection_records *──1 factors_medicines
injection_records *──1 hospitals
users 1──1 patients (for patient role)
users 1──1 hospital_admins (for hospital admin role)
users 1──1 province_admins (for province admin role)
```

### 9.3 Patients Table (Extended Schema)

```sql
patients (
  id                  UUID PRIMARY KEY,
  user_id             UUID REFERENCES users(id),
  unique_patient_id   VARCHAR(20) UNIQUE NOT NULL,  -- HEM-000123
  full_name           VARCHAR(255) NOT NULL,
  date_of_birth       DATE NOT NULL,
  gender              VARCHAR(20) NOT NULL,
  mobile              VARCHAR(20) NOT NULL,
  province_id         UUID REFERENCES provinces(id),
  district_id         UUID REFERENCES districts(id),
  local_level         VARCHAR(255),
  ward_number         INT,
  address             TEXT,
  blood_group         VARCHAR(5),
  hemophilia_type     VARCHAR(5) NOT NULL,           -- 'A' or 'B'
  deficient_factor    VARCHAR(10) NOT NULL,           -- 'FVIII' or 'FIX'
  severity            VARCHAR(20) NOT NULL,           -- 'mild','moderate','severe'
  baseline_factor_level DECIMAL(5,2),                  -- e.g. 0.50
  inhibitor_status    VARCHAR(20) DEFAULT 'none',     -- 'none','past','current'
  diagnosis_date      DATE,
  primary_hospital_id UUID REFERENCES hospitals(id),
  emergency_contact_name  VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  verification_status   VARCHAR(30) DEFAULT 'pending', -- pending, approved, rejected
  verified_by         UUID REFERENCES users(id),
  verified_at         TIMESTAMP,
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
)
```

### 9.4 Indexes (Performance)

```sql
CREATE INDEX idx_patients_unique_id ON patients(unique_patient_id);
CREATE INDEX idx_patients_province ON patients(province_id);
CREATE INDEX idx_patients_type ON patients(hemophilia_type);
CREATE INDEX idx_patients_severity ON patients(severity);
CREATE INDEX idx_injection_patient ON injection_records(patient_id);
CREATE INDEX idx_injection_hospital ON injection_records(hospital_id);
CREATE INDEX idx_injection_date ON injection_records(administered_at);
CREATE INDEX idx_injection_factor ON injection_records(factor_type);
```

---

## 10. Reports & Dashboards

### 10.1 Dashboard KPIs

**National (Super Admin):**

| KPI | Breakdown |
|-----|-----------|
| Total Patients | All / Type A / Type B |
| Total Hospitals | By province |
| Total Injections | FVIII / FIX / Bypassing |
| Total Treatments | By type |
| Active Patients | Visited in last 90 days |
| Pending Verifications | By province |

**Province Admin:** Same KPIs scoped to own province.  
**Hospital Admin:** Same KPIs scoped to own hospital.

**Charts:**
- Province-wise patient distribution (bar chart)
- Type A vs Type B ratio (pie chart)
- Monthly injection trend (line chart)
- Severity distribution (donut chart)

### 10.2 Patient Reports

| Report | Filters |
|--------|---------|
| Total registered patients | Date range |
| Province-wise count | All provinces |
| District-wise count | By province |
| Hospital-wise count | By province/district |
| Age group distribution | 0-18, 19-35, 36-50, 50+ |
| Gender distribution | Male / Female |
| **Hemophilia type breakdown** | **A / B** |
| Severity breakdown | Mild / Moderate / Severe |
| Inhibitor patients | None / Past / Current |

### 10.3 Treatment Reports

| Report | Filters |
|--------|---------|
| Daily / Weekly / Monthly / Yearly | Date range |
| Province-wise | By province |
| Hospital-wise | By hospital |
| Patient-wise | By patient ID |
| Treatment type breakdown | Physiotherapy, Surgery, etc. |

### 10.4 Injection Reports (Factor-Wise — Critical)

| Report | Filters |
|--------|---------|
| **Factor-wise total doses** | **FVIII IU / FIX IU / Bypassing** |
| Product/brand-wise usage | By factor_medicine |
| Dose-wise distribution | Dose ranges |
| Hospital-wise injections | By hospital |
| Province-wise injections | By province |
| Date-wise trend | Daily/weekly/monthly |
| Patient-wise injection log | By patient ID |
| Indication breakdown | Prophylaxis vs on-demand vs surgery |

### 10.5 Hospital Reports

| Report | Content |
|--------|---------|
| Patient count | Registered + visited |
| Total injections | By factor type |
| Total treatments | By type |
| Activity summary | Visits, new records, active days |

### 10.6 Export Formats

- PDF (formatted report with Nepal Hemophilia Society header)
- Excel (.xlsx with raw data + summary sheet)
- Print (browser print-friendly layout)

---

## 11. Security, Privacy & Audit

### 11.1 Authentication

- Email/mobile + password login for all roles
- JWT access tokens + refresh tokens
- Strong password policy (min 8 chars, uppercase, number, special char)
- Account lockout after 5 failed attempts
- Password reset via OTP (mobile/email)

### 11.2 Authorization

- Role-based access control (RBAC) on every API endpoint
- Province Admin scoped to own province data
- Hospital Admin scoped to own hospital for write; read patient history nationally
- Patient scoped to own data only

### 11.3 Data Privacy

- Patient medical data **never** exposed on public website
- Sensitive fields (factor level, inhibitor status) visible only to authorized roles
- API responses filtered by role permissions
- HTTPS everywhere (TLS 1.2+)

### 11.4 Audit Trail

Log every sensitive action in `audit_logs`:

| Event | Logged Fields |
|-------|---------------|
| Patient verification (approve/reject) | admin, patient, decision, reason |
| Injection added | admin, hospital, patient, product, dose |
| Treatment added | admin, hospital, patient, type |
| Record correction | admin, original record, new values, reason |
| Profile medical field change | admin, field, old value, new value |
| Login/logout | user, IP, timestamp |
| Admin account created/deactivated | super admin, target user |

### 11.5 Infrastructure Security

- Database backups: daily automated, 30-day retention
- Session management: token expiry, refresh rotation
- Input validation and sanitization on all endpoints
- File upload: type/size restrictions, virus scan
- Environment secrets in `.env` (never committed to git)

---

## 12. Notifications

### 12.1 Patient Notifications

| Event | Channel |
|-------|---------|
| Registration submitted | In-app |
| Registration approved | In-app + SMS |
| Registration rejected (with reason) | In-app + SMS |
| Account created / login credentials | SMS |
| New injection record added | In-app |
| New treatment record added | In-app |
| Important notices from society | In-app + push |

### 12.2 Admin Notifications

| Event | Recipient |
|-------|-----------|
| New patient registration (pending verification) | Province Admin |
| Patient verified | Super Admin (summary) |
| System alerts | All admins |
| Important notices | All admins |
| Unusual activity flags (e.g. inhibitor + standard factor) | Province Admin + Super Admin |

---

## 13. Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Patient App** | Flutter (Android first, iOS later) | Cross-platform, good offline support |
| **Admin Panel** | Next.js + React + Tailwind CSS | Responsive web, shadcn/ui components |
| **Public Website** | Next.js + React + Tailwind CSS | Can share components with admin |
| **Backend API** | Node.js (Express) or Python (FastAPI/Django) | REST API |
| **Database** | PostgreSQL | Preferred for reporting queries |
| **Authentication** | JWT + bcrypt | |
| **File Storage** | AWS S3 / Cloudinary / local (dev) | For patient documents |
| **Reports** | PDF (pdfkit/puppeteer) + Excel (exceljs) | |
| **Hosting** | Vercel (frontend) + Railway/Render/AWS (backend) | Secure cloud |
| **Notifications** | Firebase Cloud Messaging + SMS gateway | Sparrow SMS / Aakash SMS for Nepal |

---

## 14. Detailed Execution Plan (Phased Roadmap)

### Phase 0 — Project Setup & Foundation (Week 1)

**Goal:** Development environment, repo, and project structure ready.

| Task | Deliverable |
|------|-------------|
| Initialize git repository | GitHub repo with README |
| Set up monorepo or multi-repo structure | `/backend`, `/admin-panel`, `/patient-app`, `/website` |
| Configure ESLint, Prettier, TypeScript | Linting rules |
| Set up PostgreSQL locally (Docker) | `docker-compose.yml` |
| Create `.env.example` files | Documented env vars |
| Define Git branching strategy | `main` + `develop` + feature branches |
| Create this `plan.md` | ✅ Done |

**Folder structure (recommended):**

```
nepal_hemophilia_digital_management_system/
├── plan.md
├── README.md
├── docker-compose.yml
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── patients/
│   │   │   ├── hospitals/
│   │   │   ├── provinces/
│   │   │   ├── injections/
│   │   │   ├── treatments/
│   │   │   ├── factors/
│   │   │   ├── reports/
│   │   │   ├── notifications/
│   │   │   └── audit/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── app.ts
│   ├── prisma/ or migrations/
│   └── package.json
├── admin-panel/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
├── website/
│   └── (public pages)
└── patient-app/
    └── (Flutter project)
```

---

### Phase 1 — Database & Backend Core (Weeks 2–4)

**Goal:** Database schema, authentication, and core CRUD APIs.

#### Week 2: Database Schema

| Task | Priority |
|------|----------|
| Design and create all tables (see Section 9) | P0 |
| Seed 7 provinces + all districts of Nepal | P0 |
| Seed default roles | P0 |
| Seed factor/medicine catalog (FVIII, FIX products) | P0 |
| Create Super Admin seed account | P0 |
| Write database migration scripts | P0 |

#### Week 3: Authentication & User Management

| Task | Priority |
|------|----------|
| User registration/login API | P0 |
| JWT token generation & refresh | P0 |
| Role-based middleware | P0 |
| Super Admin: create Province Admin | P0 |
| Super Admin: create Hospital Admin | P0 |
| Province Admin: manage hospitals in province | P0 |
| Password reset flow | P1 |
| Audit log middleware | P0 |

#### Week 4: Patient & Core APIs

| Task | Priority |
|------|----------|
| Patient registration API (with document upload) | P0 |
| Patient verification API (Province Admin) | P0 |
| Unique Patient ID generation (`HEM-XXXXXX`) | P0 |
| Patient profile read API (role-filtered) | P0 |
| Patient search API (by ID, name, mobile) | P0 |
| Hospital CRUD APIs | P0 |
| Province & district read APIs | P0 |

**Phase 1 API Endpoints:**

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/forgot-password

GET    /api/provinces
GET    /api/provinces/:id/districts
GET    /api/hospitals
POST   /api/hospitals
PUT    /api/hospitals/:id

POST   /api/patients/register
GET    /api/patients/:id
GET    /api/patients/search?q=
PUT    /api/patients/:id/verify
PUT    /api/patients/:id/reject

GET    /api/factors
POST   /api/factors          (Super Admin)
PUT    /api/factors/:id      (Super Admin)

GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
```

---

### Phase 2 — Injection, Treatment & Hospital Workflows (Weeks 5–6)

**Goal:** Core clinical workflows — the heart of the system.

#### Week 5: Injection & Treatment APIs

| Task | Priority |
|------|----------|
| Add injection record API with type validation | P0 |
| Add treatment record API | P0 |
| Hospital visit log (auto-created on injection/treatment) | P0 |
| Patient history API (all hospitals, chronological) | P0 |
| Correction/audit trail workflow for records | P1 |
| Inhibitor warning flag on injection entry | P1 |

#### Week 6: Notification System

| Task | Priority |
|------|----------|
| Notification model & API | P0 |
| Trigger notifications on key events | P0 |
| SMS integration (Sparrow SMS or similar) | P1 |
| In-app notification list & mark-as-read | P0 |

**Phase 2 API Endpoints:**

```
POST   /api/injections
GET    /api/injections?patient_id=&hospital_id=&from=&to=
GET    /api/injections/:id

POST   /api/treatments
GET    /api/treatments?patient_id=&hospital_id=

GET    /api/patients/:id/history
GET    /api/patients/:id/injections
GET    /api/patients/:id/treatments
GET    /api/patients/:id/visits

POST   /api/injections/:id/correct   (Super Admin)

GET    /api/notifications
PUT    /api/notifications/:id/read
```

---

### Phase 3 — Admin Panel (Weeks 7–10)

**Goal:** Full web admin panel for all three admin roles.

#### Week 7: Admin Panel Foundation

| Task | Priority |
|------|----------|
| Next.js project setup with Tailwind + shadcn/ui | P0 |
| Login page & auth context | P0 |
| Role-based routing & layout | P0 |
| Sidebar navigation per role | P0 |
| Super Admin dashboard (KPI cards + charts) | P0 |

#### Week 8: Super Admin & Province Admin Screens

| Task | Priority |
|------|----------|
| Province management CRUD | P0 |
| Province Admin management | P0 |
| Hospital management | P0 |
| Hospital Admin management | P0 |
| **Patient verification queue (Province Admin)** | P0 |
| Patient list with filters (type, severity, province) | P0 |
| Factor/medicine catalog management | P0 |

#### Week 9: Hospital Admin Screens

| Task | Priority |
|------|----------|
| Hospital dashboard | P0 |
| Patient search (by ID, name) | P0 |
| Patient profile view with type/severity badge | P0 |
| **Add injection form (type-filtered product dropdown)** | P0 |
| Add treatment form | P0 |
| Patient history timeline | P0 |
| Hospital patients list | P0 |

#### Week 10: Reports Module

| Task | Priority |
|------|----------|
| Patient reports (type, severity, province, district) | P0 |
| Injection reports (factor-wise, dose-wise, date-wise) | P0 |
| Treatment reports | P1 |
| Hospital activity reports | P0 |
| PDF export | P1 |
| Excel export | P1 |
| Print layout | P2 |

---

### Phase 4 — Patient App (Weeks 11–13)

**Goal:** Flutter Android app for patients.

#### Week 11: App Foundation

| Task | Priority |
|------|----------|
| Flutter project setup | P0 |
| Login & registration screens | P0 |
| API integration layer | P0 |
| Auth token storage (secure) | P0 |

#### Week 12: Core Patient Features

| Task | Priority |
|------|----------|
| Profile screen (type, severity, emergency info) | P0 |
| Unique Patient ID display + QR code | P0 |
| Injection history (filterable) | P0 |
| Treatment history | P0 |
| Hospital visit history | P0 |
| Emergency information card | P0 |

#### Week 13: Notifications & Polish

| Task | Priority |
|------|----------|
| Notifications screen | P0 |
| Settings & password change | P0 |
| Help & support | P1 |
| UI polish & Nepali language support | P1 |
| App icon & splash screen | P1 |

---

### Phase 5 — Public Website (Weeks 14–15)

**Goal:** Informational public website.

| Task | Priority |
|------|----------|
| Home page | P0 |
| About Hemophilia (A vs B educational content) | P0 |
| About Nepal Hemophilia Society | P0 |
| Hospitals / Care Centers (by province) | P0 |
| News, Notices, Events | P1 |
| Resources & Gallery | P2 |
| Emergency Information | P0 |
| Contact page | P0 |
| Patient Login link | P0 |
| Mobile responsive design | P0 |

---

### Phase 6 — Testing, Security & Deployment (Weeks 16–18)

**Goal:** Production-ready system.

#### Week 16: Testing

| Task | Priority |
|------|----------|
| Unit tests for API validation rules (type-product check) | P0 |
| Integration tests for registration → verification → injection flow | P0 |
| Test all role permissions (RBAC) | P0 |
| Test report generation accuracy | P0 |
| Manual UAT with sample data (10+ patients, 3 hospitals, 2 provinces) | P0 |

#### Week 17: Security Hardening

| Task | Priority |
|------|----------|
| Security audit (OWASP top 10) | P0 |
| Rate limiting on auth endpoints | P0 |
| Input validation review | P0 |
| File upload security | P0 |
| HTTPS configuration | P0 |
| Database backup automation | P0 |

#### Week 18: Deployment

| Task | Priority |
|------|----------|
| Deploy backend to Railway/Render/AWS | P0 |
| Deploy admin panel to Vercel | P0 |
| Deploy website to Vercel | P0 |
| Configure production database (PostgreSQL) | P0 |
| Configure SMS gateway | P1 |
| Configure file storage (S3/Cloudinary) | P0 |
| Domain setup (nepalhemophilia.org or similar) | P1 |
| SSL certificates | P0 |
| Patient app APK build & distribution | P1 |

---

### Phase 7 — Launch & Post-Launch (Week 19+)

| Task | Priority |
|------|----------|
| Super Admin training | P0 |
| Province Admin training (7 provinces) | P0 |
| Hospital Admin training | P0 |
| Patient registration drive (pilot province) | P0 |
| Monitor system for first 2 weeks | P0 |
| Collect feedback & bug fixes | P0 |
| iOS app (if needed) | P2 |
| Advanced analytics dashboard | P2 |
| Integration with WFH WBDR data standards | P2 |

---

## 15. Pre-Coding Decisions Checklist

Confirm with Nepal Hemophilia Society stakeholders before Phase 1:

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Registration required fields | Minimal vs full medical | **Full** (type, severity, factor level, documents) |
| 2 | Inhibitor tracking in v1 | Yes / Phase 2 | **Yes** — medically important |
| 3 | Official factor product list | Society provides / we seed generic | **Society provides** official Nepal formulary |
| 4 | Type change after verification | Never / Super Admin only | **Super Admin only** with audit |
| 5 | SMS provider for Nepal | Sparrow SMS / Aakash SMS / Other | Confirm with society |
| 6 | Primary language | English / Nepali / Both | **Both** (Nepali for patient app) |
| 7 | Patient ID format | HEM-XXXXXX / other | **HEM-XXXXXX** (as in report) |
| 8 | Backend framework | Node.js / Python Django | Team preference |
| 9 | Pilot province for launch | One province first / all | **One province** (e.g. Bagmati) |
| 10 | Report priority for v1 | Which reports on day one | **Patient count by type + factor-wise injection summary** |

---

## 16. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Wrong factor given to wrong patient type | High (patient safety) | API validation + UI product filtering by type |
| Patient data breach | High (privacy) | RBAC, encryption, audit logs, HTTPS |
| Low hospital admin adoption | Medium | Training, simple UI, SMS notifications |
| Incomplete patient registration in rural areas | Medium | Province Admin assisted registration |
| Factor product catalog outdated | Medium | Super Admin catalog management + periodic review |
| Inhibitor cases not flagged | High | Inhibitor status on profile + warning on injection |
| Cross-hospital record disputes | Medium | Immutable records + correction audit trail |
| Internet connectivity in rural Nepal | Medium | Offline-capable patient app (cache history) |

---

## 17. Success Criteria

### Launch Criteria (MVP)

- [ ] Patient can register with hemophilia type A or B
- [ ] Province Admin can verify/reject registration
- [ ] Verified patient receives Unique Patient ID
- [ ] Hospital Admin can search patient by ID
- [ ] Hospital Admin can add injection with type-validated product
- [ ] Injection record appears in patient history across all hospitals
- [ ] Super Admin can view national dashboard with type-wise patient count
- [ ] Super Admin can generate factor-wise injection report
- [ ] PDF/Excel export works for key reports
- [ ] All sensitive actions logged in audit trail
- [ ] Public website live with no private medical data

### 6-Month Post-Launch Criteria

- [ ] 100+ verified patients registered across all 7 provinces
- [ ] 10+ hospitals actively using the system
- [ ] 500+ injection records logged
- [ ] Monthly factor-wise usage report generated for society planning
- [ ] < 1% error rate on type-product validation rejections (indicates good UX)

---

## Appendix A — Glossary

| Term | Definition |
|------|------------|
| **Hemophilia A** | Clotting disorder caused by Factor VIII deficiency |
| **Hemophilia B** | Clotting disorder caused by Factor IX deficiency |
| **FVIII** | Factor VIII — clotting protein missing in Hemophilia A |
| **FIX** | Factor IX — clotting protein missing in Hemophilia B |
| **IU** | International Unit — standard dose measure for factor products |
| **Inhibitor** | Antibody that neutralizes factor replacement, making treatment harder |
| **ITI** | Immune Tolerance Induction — treatment to eliminate inhibitors |
| **Prophylaxis** | Regular scheduled factor replacement to prevent bleeding |
| **On-demand** | Factor given in response to an active bleeding episode |
| **HTC** | Hemophilia Treatment Center |
| **WBDR** | World Bleeding Disorders Registry (WFH global data standard) |
| **WFH** | World Federation of Hemophilia |

## Appendix B — References

1. WFH Guidelines for the Management of Hemophilia, 3rd edition — https://doi.org/10.1111/hae.14046
2. WFH Comprehensive Care of Hemophilia — https://guidelines.wfh.org/
3. ISTH Clinical Practice Guideline for Hemophilia A and B, 2024 — https://doi.org/10.1016/j.jtha.2024.05.026
4. WFH WBDR Minimal & Extended Data Set, 2019 — https://wfh.org/wp-content/uploads/2021/12/WBDR-DataSets-July2019.pdf
5. NCBI StatPearls — Hemophilia — https://www.ncbi.nlm.nih.gov/books/NBK551607/
6. Nepal Hemophilia Digital Management System Project Report (DOCX, 2026)

---

*This document is the single source of truth for project planning. Update it as decisions are confirmed and phases are completed.*
