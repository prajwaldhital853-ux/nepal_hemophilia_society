"use client";

import { useEffect, useState } from "react";

import { fetchHospitals } from "@/features/hospitals/api";
import type { HospitalOption } from "@/features/hospitals/types";
import { createTreatment, INJECTION_STATUSES } from "@/features/injections/api";
import { isNationalScope, useAuth } from "@/lib/auth";

const fieldClass =
  "mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand";

const TREATMENT_TYPES = ["Physiotherapy", "Surgery", "Admission", "ITI Program", "Counseling", "Other"];

type Props = {
  patientId: string;
  primaryHospital?: string;
  loggingCenter?: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function LogTreatmentDialog({
  patientId,
  primaryHospital = "",
  loggingCenter,
  onClose,
  onSaved,
}: Props) {
  const { user } = useAuth();
  const isSuper = isNationalScope(user);
  const assignedCenter =
    loggingCenter || user?.hospitalStaff?.treatmentCenter || user?.provinceAdmin?.defaultLoggingCenter || primaryHospital;
  const [treatmentCenter, setTreatmentCenter] = useState(assignedCenter);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [treatmentType, setTreatmentType] = useState("Physiotherapy");
  const [status, setStatus] = useState("Completed");
  const [treatmentDate, setTreatmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSuper) return;
    void fetchHospitals()
      .then(setHospitals)
      .catch(() => setHospitals([]));
  }, [isSuper]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createTreatment({
        patientId,
        treatmentType,
        status,
        treatmentDate,
        description,
        notes,
        treatmentCenter: treatmentCenter || primaryHospital,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save treatment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded border border-line bg-card p-5">
        <h2 className="text-[14px] font-semibold text-ink">Log treatment</h2>
        <p className="mt-1 text-[11px] text-muted">Patient {patientId}</p>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <label className="block text-[11px]">
            <span className="font-medium text-muted">Treatment center</span>
            {isSuper ? (
              <select
                value={treatmentCenter}
                onChange={(e) => setTreatmentCenter(e.target.value)}
                className={fieldClass}
              >
                {(hospitals.length ? hospitals.map((h) => h.name) : [primaryHospital].filter(Boolean)).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            ) : (
              <input value={assignedCenter || primaryHospital} className={fieldClass} readOnly />
            )}
            <span className="mt-1 block text-[10px] text-faint">
              Uses the patient&apos;s assigned center unless a visiting center is selected.
            </span>
          </label>
          <label className="block text-[11px]">
            <span className="font-medium text-muted">Treatment type *</span>
            <select value={treatmentType} onChange={(e) => setTreatmentType(e.target.value)} className={fieldClass}>
              {TREATMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[11px]">
              <span className="font-medium text-muted">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
                {INJECTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px]">
              <span className="font-medium text-muted">Date *</span>
              <input type="date" value={treatmentDate} onChange={(e) => setTreatmentDate(e.target.value)} className={fieldClass} required />
            </label>
          </div>
          <label className="block text-[11px]">
            <span className="font-medium text-muted">Description *</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} rows={2} required />
          </label>
          <label className="block text-[11px]">
            <span className="font-medium text-muted">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} rows={2} />
          </label>
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded border border-line py-2 text-[11px] font-semibold text-muted">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 rounded bg-brand py-2 text-[11px] font-semibold text-white">
              {loading ? "Saving…" : "Save treatment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
