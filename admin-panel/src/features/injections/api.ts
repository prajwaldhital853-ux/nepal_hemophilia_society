import { apiFetch } from "@/lib/api";

export type InjectionStatus = "Pending" | "Scheduled" | "Completed" | "Cancelled";
export type InjectionIndication = "Prophylaxis" | "On-demand" | "ITI" | "Surgery" | "Trauma" | "Emergency" | "Other";

export type ApiInjection = {
  id: number;
  displayCode: string;
  patientId: string;
  patientName: string;
  hospitalName: string;
  factorMedicineId: number;
  factorMedicineName: string;
  factorType: string;
  dose: string;
  unit: string;
  indication: InjectionIndication;
  type: InjectionIndication;
  status: InjectionStatus;
  administeredAt: string;
  date: string;
  time: string;
  batchNumber?: string;
  bleedSite?: string;
  notes?: string;
  administeredBy: string;
  label: string;
};

export type FactorOption = {
  id: number;
  name: string;
  factorType: string;
  applicableType: string;
  unit: string;
};

export async function fetchInjections(params: {
  patientId?: string;
  status?: string;
  indication?: string;
} = {}) {
  const q = new URLSearchParams();
  if (params.patientId) q.set("patientId", params.patientId);
  if (params.status && params.status !== "All") q.set("status", params.status);
  if (params.indication && params.indication !== "All") q.set("indication", params.indication);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch(`/injections/${suffix}`) as Promise<{ injections: ApiInjection[]; total: number }>;
}

export async function fetchPatientInjections(patientId: string) {
  return apiFetch(`/patients/${encodeURIComponent(patientId)}/injections/`) as Promise<{
    injections: ApiInjection[];
  }>;
}

export async function fetchFactors(patientId?: string, hemophiliaType?: string) {
  const q = new URLSearchParams();
  if (patientId) q.set("patientId", patientId);
  if (hemophiliaType) q.set("hemophiliaType", hemophiliaType);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  const data = await apiFetch(`/factors/${suffix}`);
  return (Array.isArray(data.factors) ? data.factors : []) as FactorOption[];
}

export async function createInjection(payload: Record<string, unknown>) {
  return apiFetch("/injections/", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateInjection(id: number, payload: Record<string, unknown>) {
  return apiFetch(`/injections/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
}

export type ApiTreatment = {
  id: number;
  patientId: string;
  patientName: string;
  hospitalName: string;
  treatmentType: string;
  status: InjectionStatus;
  description: string;
  treatmentDate: string;
  notes?: string;
  recordedBy: string;
  label: string;
};

export async function fetchPatientTreatments(patientId: string) {
  return apiFetch(`/patients/${encodeURIComponent(patientId)}/treatments/`) as Promise<{ treatments: ApiTreatment[] }>;
}

export async function fetchTreatments(params: { patientId?: string; status?: string } = {}) {
  const q = new URLSearchParams();
  if (params.patientId) q.set("patientId", params.patientId);
  if (params.status && params.status !== "All") q.set("status", params.status);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch(`/treatments/${suffix}`) as Promise<{ treatments: ApiTreatment[]; total: number }>;
}

export async function createTreatment(payload: Record<string, unknown>) {
  return apiFetch("/treatments/", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateTreatment(id: number, payload: Record<string, unknown>) {
  return apiFetch(`/treatments/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function statusClass(status: InjectionStatus) {
  if (status === "Completed") return "bg-status-green-soft text-status-green";
  if (status === "Scheduled") return "bg-brand-soft text-brand";
  if (status === "Pending") return "bg-status-amber-soft text-status-amber";
  return "bg-elevated text-muted";
}

export const INJECTION_STATUSES: InjectionStatus[] = ["Pending", "Scheduled", "Completed", "Cancelled"];
export const INJECTION_INDICATIONS: InjectionIndication[] = [
  "Prophylaxis",
  "On-demand",
  "Emergency",
  "ITI",
  "Surgery",
  "Trauma",
  "Other",
];
