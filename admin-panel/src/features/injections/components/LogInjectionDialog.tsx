"use client";

import { useEffect, useState } from "react";

import {
  createInjection,
  fetchFactors,
  INJECTION_INDICATIONS,
  INJECTION_STATUSES,
  type InjectionIndication,
  type InjectionStatus,
} from "@/features/injections/api";

const fieldClass =
  "mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand";

type Props = {
  patientId?: string;
  hemophiliaType?: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function LogInjectionDialog({ patientId: initialPatientId, hemophiliaType: initialType, onClose, onSaved }: Props) {
  const [patientId, setPatientId] = useState(initialPatientId ?? "");
  const [hemophiliaType, setHemophiliaType] = useState(initialType ?? "");
  const [factors, setFactors] = useState<{ id: number; name: string; unit: string }[]>([]);
  const [factorMedicineId, setFactorMedicineId] = useState("");
  const [dose, setDose] = useState("");
  const [indication, setIndication] = useState<InjectionIndication>("Prophylaxis");
  const [status, setStatus] = useState<InjectionStatus>("Completed");
  const [administeredAt, setAdministeredAt] = useState("");
  const [bleedSite, setBleedSite] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsAck, setNeedsAck] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    void fetchFactors(patientId, hemophiliaType).then(setFactors).catch(() => setFactors([]));
  }, [patientId, hemophiliaType]);

  async function submit(acknowledge = false) {
    setError("");
    setLoading(true);
    try {
      await createInjection({
        patientId,
        factorMedicineId: Number(factorMedicineId),
        dose,
        indication,
        status,
        administeredAt: administeredAt || undefined,
        bleedSite,
        notes,
        acknowledgeInhibitorWarning: acknowledge || needsAck,
      });
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save injection";
      if (message.toLowerCase().includes("inhibitor")) {
        setNeedsAck(true);
        setError("Patient has current inhibitors. Click Save again to acknowledge and continue.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded border border-line bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[14px] font-semibold text-ink">Log injection</h2>
          <button type="button" onClick={onClose} className="text-[11px] text-muted hover:text-ink">
            Close
          </button>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          {initialPatientId ? (
            <>
              Patient <span className="font-semibold text-brand">{patientId}</span> — saved to central history and patient app.
            </>
          ) : (
            "Enter the patient HEM-ID — record links to their profile and mobile app history."
          )}
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(needsAck);
          }}
        >
          {!initialPatientId ? (
            <label className="block text-[11px]">
              <span className="font-medium text-muted">Patient ID *</span>
              <input
                value={patientId}
                onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                className={fieldClass}
                placeholder="HEM-0008745"
                required
              />
            </label>
          ) : null}
          <label className="block text-[11px]">
            <span className="font-medium text-muted">Factor / medicine *</span>
            <select value={factorMedicineId} onChange={(e) => setFactorMedicineId(e.target.value)} className={fieldClass} required>
              <option value="">Select factor (filtered by patient type)</option>
              {factors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.unit})
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[11px]">
              <span className="font-medium text-muted">Dose *</span>
              <input value={dose} onChange={(e) => setDose(e.target.value)} className={fieldClass} required />
            </label>
            <label className="block text-[11px]">
              <span className="font-medium text-muted">Type / indication *</span>
              <select value={indication} onChange={(e) => setIndication(e.target.value as InjectionIndication)} className={fieldClass}>
                {INJECTION_INDICATIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[11px]">
              <span className="font-medium text-muted">Status *</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as InjectionStatus)} className={fieldClass}>
                {INJECTION_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px]">
              <span className="font-medium text-muted">Date & time</span>
              <input
                type="datetime-local"
                value={administeredAt}
                onChange={(e) => setAdministeredAt(e.target.value)}
                className={fieldClass}
              />
            </label>
          </div>
          <label className="block text-[11px]">
            <span className="font-medium text-muted">Bleed site</span>
            <input value={bleedSite} onChange={(e) => setBleedSite(e.target.value)} className={fieldClass} placeholder="e.g. knee" />
          </label>
          <label className="block text-[11px]">
            <span className="font-medium text-muted">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} rows={2} />
          </label>
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-brand py-2 text-[11px] font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Saving…" : needsAck ? "Acknowledge & save" : "Save injection"}
          </button>
        </form>
      </div>
    </div>
  );
}
