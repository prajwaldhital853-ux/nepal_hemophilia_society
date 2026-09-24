import { apiFetch } from "@/lib/api";
import { fetchStock } from "@/features/stock/api";

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
  doctorName?: string;
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
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
} = {}) {
  const q = new URLSearchParams();
  if (params.patientId) q.set("patientId", params.patientId);
  if (params.status && params.status !== "All") q.set("status", params.status);
  if (params.indication && params.indication !== "All") q.set("indication", params.indication);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch(`/injections/${suffix}`) as Promise<{
    injections: ApiInjection[];
    total: number;
    nextCursor?: string | null;
  }>;
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

/** Returns an error message when the centre cannot fulfil the dose, or null when stock is OK. */
export async function verifyInjectionStock(params: {
  factorMedicineId: number;
  dose: string | number;
  hospitalName?: string;
  factorName?: string;
}): Promise<string | null> {
  const needed = parseFloat(String(params.dose));
  if (!params.factorMedicineId || Number.isNaN(needed) || needed <= 0) return null;
  try {
    const data = await fetchStock({
      hospitalName: params.hospitalName || undefined,
      factorMedicineId: params.factorMedicineId,
      limit: 100,
    });
    const available = Number(data.totalQuantity) || 0;
    if (available >= needed) return null;
    const product = params.factorName || "This factor";
    const centre = params.hospitalName ? ` at ${params.hospitalName}` : " at the logging centre";
    return `Out of stock: ${product}${centre}. Only ${available.toLocaleString()} available for a ${needed.toLocaleString()} dose.`;
  } catch {
    return null;
  }
}

export function isOutOfStockError(message: string) {
  return /out of stock|insufficient_stock/i.test(message);
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
