"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  HeartPulse,
  MapPin,
  Shield,
  UserRound,
} from "lucide-react";

import { fetchHospitals } from "@/features/hospitals/api";
import { showToast } from "@/lib/toastBus";
import type { HospitalOption } from "@/features/hospitals/types";
import { fetchFactors, type FactorOption } from "@/features/injections/api";
import { bloodGroups, provinceDistricts } from "@/features/patients/data/geo";
import { deriveFactor, normalizePatientForm, type PatientPayload, type PatientRecord } from "@/features/patients/types";
import { apiForm } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";

const steps = [
  { id: 1, label: "Identity", icon: UserRound },
  { id: 2, label: "Address", icon: MapPin },
  { id: 3, label: "Clinical", icon: HeartPulse },
  { id: 4, label: "Emergency", icon: Shield },
  { id: 5, label: "Review", icon: Check },
];

const fieldClass =
  "mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" aria-invalid={error ? true : undefined}>
      <span className="text-[11px] font-medium text-muted">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => chars[n % chars.length]).join("");
}

function validateStep(step: number, form: PatientPayload, mode: "create" | "edit") {
  const fieldErrors: Record<string, string> = {};
  if (step === 1) {
    if (!form.fullName.trim()) fieldErrors.fullName = "Full name is required";
    if (!form.dateOfBirth) fieldErrors.dateOfBirth = "Date of birth is required";
    if (!form.mobile.trim()) fieldErrors.mobile = "Mobile number is required";
    const mobile = form.mobile.replace(/\s/g, "").replace(/^\+977/, "");
    if (form.mobile && !/^(97|98)\d{8}$/.test(mobile)) {
      fieldErrors.mobile = "Use a Nepal mobile: 98 or 97 followed by 8 digits";
    }
    if (!form.email.trim()) fieldErrors.email = "Email is required for patient app login";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      fieldErrors.email = "Enter a valid email address";
    }
    if (mode === "create" && !(form.temporaryPassword || "").trim()) {
      fieldErrors.temporaryPassword = "Create a temporary password for first-time app login";
    }
    if ((form.temporaryPassword || "").trim() && (form.temporaryPassword || "").length < 8) {
      fieldErrors.temporaryPassword = "Temporary password must be at least 8 characters";
    }
  }
  if (step === 2) {
    if (!form.province) fieldErrors.province = "Province is required";
    if (!form.district) fieldErrors.district = "District is required";
    if (!form.localLevel.trim()) fieldErrors.localLevel = "Local level is required";
    if (!form.wardNumber.trim()) fieldErrors.wardNumber = "Ward number is required";
    else if (!/^\d+$/.test(form.wardNumber.trim())) fieldErrors.wardNumber = "Ward number must be a number";
    if (!form.address.trim()) fieldErrors.address = "Full address is required";
  }
  if (step === 3) {
    if (!form.bloodGroup?.trim()) fieldErrors.bloodGroup = "Blood group is required";
    if (!form.baselineFactorLevel.trim()) fieldErrors.baselineFactorLevel = "Baseline factor level is required";
    const level = Number(form.baselineFactorLevel);
    if (form.baselineFactorLevel && (Number.isNaN(level) || level < 0 || level > 40)) {
      fieldErrors.baselineFactorLevel = "Factor level should be 0–40 IU/dL";
    }
    if (!form.primaryHospital) fieldErrors.primaryHospital = "Primary hospital is required";
    if (!form.treatmentPlan) fieldErrors.treatmentPlan = "Treatment plan is required";
    if (mode === "create" && !form.prescribedFactorMedicineId) {
      fieldErrors.prescribedFactorMedicineId = "Select the factor product this patient will use (for stock tracking)";
    }
    if (form.treatmentPlan === "Bypassing / Specialist" && form.inhibitorStatus !== "Current") {
      fieldErrors.treatmentPlan = "Bypassing plan is only for patients with current inhibitors";
    }
  }
  if (step === 4) {
    if (!form.emergencyContactName.trim()) fieldErrors.emergencyContactName = "Emergency contact name is required";
    if (!form.emergencyContactPhone.trim()) fieldErrors.emergencyContactPhone = "Emergency contact phone is required";
    const emergency = form.emergencyContactPhone.replace(/\s/g, "").replace(/^\+977/, "");
    if (form.emergencyContactPhone && !/^(97|98)\d{8}$/.test(emergency)) {
      fieldErrors.emergencyContactPhone = "Use a Nepal mobile: 98 or 97 followed by 8 digits";
    }
  }
  return fieldErrors;
}

function appendUniqueFiles(existing: File[], incoming: File[]) {
  const seen = new Set(existing.map((file) => `${file.name}:${file.size}`));
  const next = [...existing];
  for (const file of incoming) {
    const key = `${file.name}:${file.size}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(file);
  }
  return next;
}

function typeBadge(type: "A" | "B", severity: string) {
  const factor = deriveFactor(type);
  return type === "A"
    ? `Hemophilia A · ${severity} · ${factor}`
    : `Hemophilia B · ${severity} · ${factor}`;
}

export default function PatientFormWizard({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: PatientRecord;
}) {
  const router = useRouter();
  const { user, can } = useAuth();
  const lockedProvince = user?.role === "province_admin" ? user.provinceAdmin?.province || "" : "";
  const [step, setStep] = useState(1);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [credentials, setCredentials] = useState<{
    patientId: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [factors, setFactors] = useState<FactorOption[]>([]);
  const [form, setForm] = useState<PatientPayload>(() => normalizePatientForm(initial));

  useEffect(() => {
    if (mode === "create" && !can(Perm.patientsCreate)) {
      router.replace("/dashboard/patients");
      return;
    }
    const mayEdit = Boolean(initial?.canEdit) || can(Perm.patientsUpdate);
    if (mode === "edit" && !mayEdit) {
      router.replace(initial?.id ? `/dashboard/patients/${initial.id}` : "/dashboard/patients");
    }
  }, [can, initial?.canEdit, initial?.id, mode, router]);

  useEffect(() => {
    if (lockedProvince) {
      setForm((current) => ({
        ...current,
        province: lockedProvince,
        district: current.province === lockedProvince ? current.district : (provinceDistricts[lockedProvince]?.[0] ?? ""),
      }));
    }
  }, [lockedProvince]);

  useEffect(() => {
    void fetchFactors(undefined, form.hemophiliaType)
      .then(setFactors)
      .catch(() => setFactors([]));
  }, [form.hemophiliaType]);

  useEffect(() => {
    if (form.treatmentPlan === "Bypassing / Specialist" && form.inhibitorStatus !== "Current") {
      setForm((current) => ({ ...current, treatmentPlan: "Regular Prophylaxis" }));
    }
  }, [form.inhibitorStatus, form.treatmentPlan]);

  useEffect(() => {
    void fetchHospitals()
      .then((rows) => {
        setHospitals(rows);
        setForm((current) => {
          if (rows.some((h) => h.name === current.primaryHospital)) return current;
          return { ...current, primaryHospital: rows[0]?.name || current.primaryHospital };
        });
      })
      .catch(() => setHospitals([]));
  }, []);

  const districts = provinceDistricts[form.province] ?? [];
  const factor = deriveFactor(form.hemophiliaType);
  const progress = ((step - 1) / (steps.length - 1)) * 100;

  const severityHint = useMemo(() => {
    const level = Number(form.baselineFactorLevel);
    if (Number.isNaN(level) || form.baselineFactorLevel === "") return "";
    if (level < 1) return "Typical for Severe (<1%)";
    if (level <= 5) return "Typical for Moderate (1–5%)";
    return "Typical for Mild (5–40%)";
  }, [form.baselineFactorLevel]);

  function patch(partial: Partial<PatientPayload>) {
    setForm((current) => {
      const next = { ...current, ...partial };
      if (partial.inhibitorStatus === "Current" && next.treatmentPlan === "Regular Prophylaxis") {
        next.treatmentPlan = "Bypassing / Specialist";
      }
      if (partial.inhibitorStatus === "None" && next.treatmentPlan === "Bypassing / Specialist") {
        next.treatmentPlan = "Regular Prophylaxis";
      }
      if (partial.hemophiliaType && partial.hemophiliaType !== current.hemophiliaType) {
        next.prescribedFactorMedicineId = null;
      }
      return next;
    });
    setFieldErrors({});
  }

  function goNext() {
    const nextErrors = validateStep(step, form, mode);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      showToast(Object.values(nextErrors)[0]);
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  }

  function showServerError(message: string) {
    showToast(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    const firstInvalid = [1, 2, 3, 4].find((s) => Object.keys(validateStep(s, form, mode)).length);
    const allErrors = [1, 2, 3, 4].reduce<Record<string, string>>((acc, s) => ({ ...acc, ...validateStep(s, form, mode) }), {});
    setFieldErrors(allErrors);
    if (firstInvalid) {
      setStep(firstInvalid);
      showToast(Object.values(allErrors)[0]);
      return;
    }
    setSaving(true);
    try {
      const body = new FormData();
      const skip = new Set([
        "documents",
        "createdBy",
        "photoUrl",
        "mustChangePassword",
        "id",
        "deficientFactor",
        "prescribedFactorMedicineName",
      ]);
      const optionalEmpty = new Set(["prescribedFactorMedicineId", "diagnosisDate", "notes", "emergencyContactRelation"]);
      Object.entries(form).forEach(([key, value]) => {
        if (skip.has(key) || value === undefined) return;
        if (key === "temporaryPassword") return;
        if (optionalEmpty.has(key) && (value === null || value === "")) return;
        body.append(key, String(value));
      });
      if (mode === "create") body.append("temporaryPassword", form.temporaryPassword || "");
      if (mode === "edit" && (form.temporaryPassword || "").trim()) {
        body.append("resetTemporaryPassword", form.temporaryPassword || "");
      }
      if (photoFile) body.append("photo", photoFile);
      documentFiles.forEach((file) => body.append("documents", file));
      const data = await apiForm<{
        patient: { id: string };
        credentials?: { patientId: string; email: string; temporaryPassword: string };
      }>(
        mode === "edit" && initial ? `/patients/${initial.id}/` : "/patients/",
        body,
        mode === "edit" ? "PUT" : "POST",
      );
      const id = data.patient.id;
      if (mode === "create" && data.credentials) {
        setCredentials(data.credentials);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      router.push(`/dashboard/patients/${id}`);
    } catch (error) {
      showServerError(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page admin-page--fill">
      <div className="admin-profile-sticky space-y-2">
      <div>
        <h1 className="text-[16px] font-semibold text-ink">
          {mode === "edit" ? "Edit Patient Profile" : "Add New Patient"}
        </h1>
        <p className="text-[11px] text-muted">
          Home &gt; Patients Management &gt; {mode === "edit" ? "Edit Patient" : "Add New Patient"}
        </p>
        <p className="mt-1 text-[11px] text-faint">
          Patients cannot self-register. Only authorized admins create and update records. A Unique Patient ID is
          assigned on save.
        </p>
      </div>

      <div className="panel p-3">
        <div className="relative mb-4 h-1 rounded-full bg-elevated">
          <div className="absolute inset-y-0 left-0 rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
        </div>
        <ol className="grid grid-cols-5 gap-1">
          {steps.map((item) => {
            const Icon = item.icon;
            const active = step === item.id;
            const done = step > item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={`flex w-full flex-col items-center gap-1 rounded-md px-1 py-1 text-[10px] ${
                    active ? "text-brand" : done ? "text-status-green" : "text-muted"
                  }`}
                >
                  <span
                    className={`flex size-7 items-center justify-center rounded-full ${
                      active ? "bg-brand text-white" : done ? "bg-status-green-soft text-status-green" : "bg-elevated"
                    }`}
                  >
                    {done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      </div>

      <div className="admin-page-body">
      {credentials ? (
        <section className="panel p-4">
          <h2 className="text-[14px] font-semibold text-ink">Patient created — share these login details once</h2>
          <p className="mt-1 text-[11px] text-muted">
            The patient signs into the app with email or Unique Patient ID plus this temporary password, then must
            create a new password. After that, this temporary password will not work.
          </p>
          <dl className="mt-3 space-y-1.5 text-[12px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Patient ID</dt>
              <dd className="font-semibold text-ink">{credentials.patientId}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Email</dt>
              <dd className="font-semibold text-ink">{credentials.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Temporary password</dt>
              <dd className="font-semibold text-ink">{credentials.temporaryPassword}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="mt-4 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white"
            onClick={() => router.push(`/dashboard/patients/${credentials.patientId}`)}
          >
            Open patient profile
          </button>
        </section>
      ) : null}
      {!credentials ? (
      <section className="panel p-4">
        {step === 1 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" required>
              <input className={fieldClass} value={form.fullName} onChange={(e) => patch({ fullName: e.target.value })} />
            </Field>
            <Field label="Date of birth" required>
              <input type="date" className={fieldClass} value={form.dateOfBirth ?? ""} onChange={(e) => patch({ dateOfBirth: e.target.value })} />
            </Field>
            <Field label="Gender" required>
              <select className={fieldClass} value={form.gender} onChange={(e) => patch({ gender: e.target.value as PatientPayload["gender"] })}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Mobile number" required error={fieldErrors.mobile}>
              <input className={fieldClass} placeholder="98XXXXXXXX" value={form.mobile} onChange={(e) => patch({ mobile: e.target.value })} />
            </Field>
            <Field label="Email" required error={fieldErrors.email}>
              <input type="email" className={fieldClass} value={form.email} onChange={(e) => patch({ email: e.target.value })} />
            </Field>
            <Field label={mode === "create" ? "Temporary app password" : "Reset temporary app password (optional)"} error={fieldErrors.temporaryPassword}>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  className={fieldClass + " mt-0"}
                  value={form.temporaryPassword || ""}
                  onChange={(e) => patch({ temporaryPassword: e.target.value })}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="shrink-0 rounded border border-line px-2 text-[10px] font-semibold text-ink"
                  onClick={() => patch({ temporaryPassword: generateTempPassword() })}
                >
                  Generate
                </button>
              </div>
              <p className="mt-1 text-[10px] text-faint">
                {mode === "create"
                  ? "Give this password to the patient. They must change it on first app login. The temporary password then stops working."
                  : "Leave blank to keep the current password. Filling this forces the patient to change password again."}
              </p>
            </Field>
            <Field label="Record status">
              <select className={fieldClass} value={form.status} onChange={(e) => patch({ status: e.target.value as PatientPayload["status"] })}>
                <option value="Active">Active (ID assigned now)</option>
                <option value="Pending">Pending province review</option>
              </select>
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Province" required error={fieldErrors.province}>
              <select
                className={fieldClass}
                value={form.province}
                disabled={Boolean(lockedProvince)}
                onChange={(e) => {
                  const province = e.target.value;
                  patch({ province, district: provinceDistricts[province]?.[0] ?? "" });
                }}
              >
                {Object.keys(provinceDistricts).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="District" required error={fieldErrors.district}>
              <select className={fieldClass} value={form.district} onChange={(e) => patch({ district: e.target.value })}>
                {districts.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Local level (municipality / rural municipality)" required error={fieldErrors.localLevel}>
              <input className={fieldClass} value={form.localLevel} onChange={(e) => patch({ localLevel: e.target.value })} />
            </Field>
            <Field label="Ward number" required error={fieldErrors.wardNumber}>
              <input className={fieldClass} inputMode="numeric" value={form.wardNumber} onChange={(e) => patch({ wardNumber: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Full address" required error={fieldErrors.address}>
                <textarea className={`${fieldClass} min-h-[72px]`} value={form.address} onChange={(e) => patch({ address: e.target.value })} />
              </Field>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  form.hemophiliaType === "A" ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" : "bg-brand-soft text-brand"
                }`}
              >
                {typeBadge(form.hemophiliaType, form.severity)}
              </span>
            </div>
            <Field label="Blood group" required error={fieldErrors.bloodGroup}>
              <select className={fieldClass} value={form.bloodGroup ?? ""} onChange={(e) => patch({ bloodGroup: e.target.value })}>
                <option value="">Select blood group</option>
                {bloodGroups.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Hemophilia type" required>
              <select
                className={fieldClass}
                value={form.hemophiliaType}
                onChange={(e) => patch({ hemophiliaType: e.target.value as "A" | "B" })}
              >
                <option value="A">A — Factor VIII deficiency</option>
                <option value="B">B — Factor IX deficiency</option>
              </select>
            </Field>
            <Field label="Severity" required>
              <select className={fieldClass} value={form.severity} onChange={(e) => patch({ severity: e.target.value as PatientPayload["severity"] })}>
                <option>Severe</option>
                <option>Moderate</option>
                <option>Mild</option>
              </select>
            </Field>
            <Field label="Baseline factor level (IU/dL %)" required error={fieldErrors.baselineFactorLevel}>
              <input
                className={fieldClass}
                placeholder="e.g. 0.5"
                value={form.baselineFactorLevel}
                onChange={(e) => patch({ baselineFactorLevel: e.target.value })}
              />
              {severityHint ? <p className="mt-1 text-[10px] text-faint">{severityHint}</p> : null}
            </Field>
            <Field label="Inhibitor status">
              <select
                className={fieldClass}
                value={form.inhibitorStatus}
                onChange={(e) => patch({ inhibitorStatus: e.target.value as PatientPayload["inhibitorStatus"] })}
              >
                <option>None</option>
                <option>Past</option>
                <option>Current</option>
              </select>
            </Field>
            <Field label="Diagnosis date">
              <input type="date" className={fieldClass} value={form.diagnosisDate ?? ""} onChange={(e) => patch({ diagnosisDate: e.target.value })} />
            </Field>
            <Field label="Treatment plan" required error={fieldErrors.treatmentPlan}>
              <select
                className={fieldClass}
                value={form.treatmentPlan ?? "Regular Prophylaxis"}
                onChange={(e) => patch({ treatmentPlan: e.target.value as PatientPayload["treatmentPlan"] })}
              >
                <option value="Regular Prophylaxis">Regular Prophylaxis</option>
                <option value="On-demand">On-demand</option>
                <option value="ITI">ITI</option>
                <option value="Bypassing / Specialist" disabled={form.inhibitorStatus !== "Current"}>
                  Bypassing / Specialist (current inhibitors only)
                </option>
                <option value="Other">Other</option>
              </select>
              {form.inhibitorStatus !== "Current" ? (
                <p className="mt-1 text-[10px] text-faint">
                  Set inhibitor status to <span className="font-semibold">Current</span> to use a bypassing plan.
                </p>
              ) : null}
            </Field>
            <Field
              label="Prescribed factor product (for stock & injections)"
              required={mode === "create"}
              error={fieldErrors.prescribedFactorMedicineId}
            >
              <select
                className={fieldClass}
                value={form.prescribedFactorMedicineId ?? ""}
                onChange={(e) => patch({ prescribedFactorMedicineId: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Select factor product</option>
                {factors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.factorType} · {item.unit})
                  </option>
                ))}
              </select>
              {mode === "edit" && !form.prescribedFactorMedicineId ? (
                <p className="mt-1 text-[10px] text-amber-700">
                  Recommended: select the factor product this patient uses so stock and injections stay linked.
                </p>
              ) : null}
            </Field>
            <Field label="Primary hospital / HTC" required error={fieldErrors.primaryHospital}>
              <select className={fieldClass} value={form.primaryHospital ?? ""} onChange={(e) => patch({ primaryHospital: e.target.value })}>
                {(hospitals.length ? hospitals.map((h) => h.name) : [form.primaryHospital]).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <p className="sm:col-span-2 text-[11px] text-muted">
              Deficient factor is auto-set to <span className="font-semibold text-ink">{factor}</span> from hemophilia type.
              The prescribed product above is what your center should stock and log for this patient.
              Bypassing / Specialist is only for patients with <span className="font-semibold text-ink">current inhibitors</span> — not for all Type A or B patients.
            </p>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Emergency contact name" required error={fieldErrors.emergencyContactName}>
              <input className={fieldClass} value={form.emergencyContactName} onChange={(e) => patch({ emergencyContactName: e.target.value })} />
            </Field>
            <Field label="Emergency contact phone" required error={fieldErrors.emergencyContactPhone}>
              <input className={fieldClass} value={form.emergencyContactPhone} onChange={(e) => patch({ emergencyContactPhone: e.target.value })} />
            </Field>
            <Field label="Relationship">
              <input className={fieldClass} placeholder="Parent, spouse, guardian..." value={form.emergencyContactRelation} onChange={(e) => patch({ emergencyContactRelation: e.target.value })} />
            </Field>
            <Field label="Patient profile photo">
              <input
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                className={`${fieldClass} file:mr-2 file:rounded file:border-0 file:bg-brand file:px-2 file:py-1 file:text-[10px] file:text-white`}
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
              {(photoFile || initial?.photoUrl) ? (
                <p className="mt-1 text-[10px] text-muted">{photoFile?.name || "Current photo on file"}</p>
              ) : null}
            </Field>
            <Field label="Diagnosis documents">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className={`${fieldClass} file:mr-2 file:rounded file:border-0 file:bg-brand file:px-2 file:py-1 file:text-[10px] file:text-white`}
                onChange={(e) => {
                  const incoming = Array.from(e.target.files ?? []);
                  if (!incoming.length) return;
                  setDocumentFiles((prev) => {
                    const next = appendUniqueFiles(prev, incoming);
                    patch({
                      documents: [
                        ...(form.documents || []).filter((doc) => doc.url),
                        ...next.map((file) => ({ name: file.name, size: file.size, type: file.type })),
                      ],
                    });
                    return next;
                  });
                  e.target.value = "";
                }}
              />
              <p className="mt-1 text-[10px] text-faint">Choose files one at a time or in a batch — each selection is added to the list.</p>
            </Field>
            {(form.documents.some((doc) => doc.url) || documentFiles.length) ? (
              <ul className="sm:col-span-2 space-y-1">
                {form.documents
                  .filter((doc) => doc.url)
                  .map((doc) => (
                    <li key={doc.url || doc.name} className="panel-inset flex items-center gap-2 px-2.5 py-1.5 text-[11px] shadow-none">
                      <FileText className="size-3.5 text-[#B9020A]" />
                      {doc.name}
                      <span className="text-[10px] text-faint">(saved)</span>
                    </li>
                  ))}
                {documentFiles.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="panel-inset flex items-center gap-2 px-2.5 py-1.5 text-[11px] shadow-none">
                    <FileText className="size-3.5 text-[#B9020A]" />
                    {file.name}
                    <button
                      type="button"
                      className="ml-auto text-[10px] text-red-600"
                      onClick={() => {
                        setDocumentFiles((prev) => {
                          const next = prev.filter((item) => !(item.name === file.name && item.size === file.size));
                          patch({
                            documents: [
                              ...(form.documents || []).filter((doc) => doc.url),
                              ...next.map((item) => ({ name: item.name, size: item.size, type: item.type })),
                            ],
                          });
                          return next;
                        });
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="sm:col-span-2">
              <Field label="Admin notes">
                <textarea className={`${fieldClass} min-h-[72px]`} value={form.notes} onChange={(e) => patch({ notes: e.target.value })} />
              </Field>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <article className="panel-inset p-3 shadow-none">
              <h3 className="text-[12px] font-semibold text-ink">Identity & address</h3>
              <dl className="mt-2 space-y-1.5 text-[11px]">
                {[
                  ["Name", form.fullName],
                  ["DOB", form.dateOfBirth],
                  ["Gender", form.gender],
                  ["Email", form.email],
                  ["App password", form.temporaryPassword ? "Temporary password set" : "—"],
                  ["Location", `${form.localLevel}, Ward ${form.wardNumber}, ${form.district}, ${form.province}`],
                  ["Address", form.address],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right font-medium text-ink">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </article>
            <article className="panel-inset p-3 shadow-none">
              <h3 className="text-[12px] font-semibold text-ink">Clinical & emergency</h3>
              <p className="mt-2 text-[11px] font-semibold text-ink">{typeBadge(form.hemophiliaType, form.severity)}</p>
              <dl className="mt-2 space-y-1.5 text-[11px]">
                {[
                  ["Blood group", form.bloodGroup],
                  ["Factor level", `${form.baselineFactorLevel || "—"} IU/dL`],
                  ["Inhibitor", form.inhibitorStatus],
                  ["Treatment plan", form.treatmentPlan],
                  ["Prescribed factor", factors.find((f) => f.id === form.prescribedFactorMedicineId)?.name || "—"],
                  ["Hospital", form.primaryHospital],
                  ["Emergency", `${form.emergencyContactName} · ${form.emergencyContactPhone}`],
                  ["Documents", String(documentFiles.length + (form.documents?.filter((d) => d.url).length || 0))],
                  ["Status", form.status],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="panel flex items-center gap-1 px-3 py-1.5 text-[11px] text-ink shadow-none disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />
            Back
          </button>
          {step < 5 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
            >
              Continue
              <ChevronRight className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => void submit()}
              className="rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
            >
              {saving ? "Saving…" : mode === "edit" ? "Update patient record" : "Create patient & assign ID"}
            </button>
          )}
        </div>
      </section>
      ) : null}
      </div>
    </div>
  );
}
