"use client";

import { useEffect, useState } from "react";

import PatientFormWizard from "@/features/patients/components/PatientFormWizard";
import type { PatientRecord } from "@/features/patients/types";
import { apiFetch } from "@/lib/api";

export default function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void params.then(({ id: nextId }) => {
      setId(nextId);
      void apiFetch(`/patients/${nextId}/`)
        .then((data) => setPatient(data.patient))
        .catch((err: Error) => setError(err.message));
    });
  }, [params]);

  if (error) return <p className="p-4 text-[12px] text-red-600">{error}</p>;
  if (!patient) return <p className="p-4 text-[12px] text-muted">Loading patient {id}…</p>;
  return <PatientFormWizard mode="edit" initial={patient} />;
}
