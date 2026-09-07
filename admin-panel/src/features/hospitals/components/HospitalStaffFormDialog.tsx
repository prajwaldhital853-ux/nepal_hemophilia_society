"use client";

import { useEffect, useState } from "react";

import { createHospitalStaff, fetchHospitals } from "@/features/hospitals/api";
import { staffLabels, type HospitalOption, type HospitalStaffType } from "@/features/hospitals/types";

const fieldClass =
  "mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand";

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => chars[n % chars.length]).join("");
}

type Props = {
  staffType: HospitalStaffType;
  onClose: () => void;
  onCreated: () => void;
};

export default function HospitalStaffFormDialog({ staffType, onClose, onCreated }: Props) {
  const labels = staffLabels[staffType];
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [treatmentCenter, setTreatmentCenter] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState(generateTempPassword());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{
    adminId: string;
    username: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);

  useEffect(() => {
    void fetchHospitals()
      .then(setHospitals)
      .catch(() => setHospitals([]));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await createHospitalStaff(staffType, {
        fullName,
        email,
        phone,
        treatmentCenter,
        temporaryPassword,
      });
      if (data.credentials) {
        setCredentials(data.credentials);
      } else {
        onCreated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  if (credentials) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded border border-line bg-card p-5">
          <h2 className="text-[14px] font-semibold text-ink">{labels.singular} created</h2>
          <p className="mt-1 text-[11px] text-muted">
            Share these credentials for first admin-panel login. They must change the password after signing in.
          </p>
          <dl className="mt-4 space-y-2 text-[11px]">
            {[
              ["Admin ID", credentials.adminId],
              ["Username", credentials.username],
              ["Email", credentials.email],
              ["Temporary password", credentials.temporaryPassword],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[10px] text-muted">
            This account can search patients by HEM-ID and add injections/treatments at their assigned center. Patients
            use the mobile app separately with their own HEM-ID login.
          </p>
          <button
            type="button"
            onClick={onCreated}
            className="mt-4 w-full rounded bg-brand py-2 text-[11px] font-semibold text-white"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded border border-line bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[14px] font-semibold text-ink">Add {labels.singular}</h2>
          <button type="button" onClick={onClose} className="text-[11px] text-muted hover:text-ink">
            Close
          </button>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          Creates a hospital staff login scoped to one treatment center (plan.md Hospital Admin role).
        </p>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <label className="block text-[11px]">
            <span className="font-medium text-muted">Full name *</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={fieldClass} required />
          </label>
          <label className="block text-[11px]">
            <span className="font-medium text-muted">Email *</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} required />
          </label>
          <label className="block text-[11px]">
            <span className="font-medium text-muted">Mobile</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} placeholder="9841234567" />
          </label>
          <label className="block text-[11px]">
            <span className="font-medium text-muted">Treatment center *</span>
            <select
              value={treatmentCenter}
              onChange={(e) => setTreatmentCenter(e.target.value)}
              className={fieldClass}
              required
            >
              <option value="">Select center</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.name}>
                  {h.name} ({h.province})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px]">
            <span className="font-medium text-muted">Temporary password *</span>
            <div className="mt-1 flex gap-2">
              <input
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
                className={fieldClass}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setTemporaryPassword(generateTempPassword())}
                className="shrink-0 rounded border border-line px-2 text-[10px] text-muted"
              >
                Generate
              </button>
            </div>
          </label>
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-brand py-2 text-[11px] font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Creating…" : `Create ${labels.singular}`}
          </button>
        </form>
      </div>
    </div>
  );
}
