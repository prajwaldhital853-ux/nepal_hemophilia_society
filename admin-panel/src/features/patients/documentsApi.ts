import { apiFetch, apiForm } from "@/lib/api";

export type PatientDocumentRow = {
  id: number;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  uploadedByRole?: string;
  hospitalName?: string;
  center?: string;
};

export async function fetchPatientDocuments(
  patientId: string,
  params: { center?: string; search?: string; from?: string; to?: string } = {},
) {
  const q = new URLSearchParams();
  if (params.center && params.center !== "All") q.set("center", params.center);
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch(`/patients/${encodeURIComponent(patientId)}/documents/${suffix}`) as Promise<{
    documents: PatientDocumentRow[];
    total: number;
  }>;
}

export async function uploadPatientDocuments(patientId: string, files: File[], treatmentCenter?: string) {
  const body = new FormData();
  files.forEach((file) => body.append("documents", file));
  if (treatmentCenter) body.append("treatmentCenter", treatmentCenter);
  return apiForm(`/patients/${encodeURIComponent(patientId)}/documents/`, body, "POST") as Promise<{
    documents: PatientDocumentRow[];
    total: number;
  }>;
}
