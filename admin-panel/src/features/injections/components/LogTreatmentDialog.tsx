"use client";

import { useState } from "react";

import { createTreatment, INJECTION_STATUSES } from "@/features/injections/api";

const fieldClass =
  "mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand";

const TREATMENT_TYPES = ["Physiotherapy", "Surgery", "Admission", "ITI Program", "Counseling", "Other"];

type Props = {
  patientId: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function LogTreatmentDialog({ patientId, onClose, onSaved }: Props) {
  const [treatmentType, setTreatmentType] = useState("Physiotherapy");
  const [status, setStatus] = useState("Completed");
  const [treatmentDate, setTreatmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createTreatment({ patientId, treatmentType, status, treatmentDate, description, notes });
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
          <button type="submit" disabled={loading} className="w-full rounded bg-brand py-2 text-[11px] font-semibold text-white">
            {loading ? "Saving…" : "Save treatment"}
          </button>
        </form>
      </div>
    </div>
  );
}
