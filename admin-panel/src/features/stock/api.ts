import { apiFetch } from "@/lib/api";
import { fetchFactors, type FactorOption } from "@/features/injections/api";

export type StockLot = {
  id: number;
  hospitalName: string;
  province: string;
  factorMedicineId: number;
  factorMedicineName: string;
  factorType: string;
  batchNumber: string;
  quantity: string;
  unit: string;
  expiryDate: string | null;
  notes?: string;
  createdBy?: { name: string; role: string; username: string } | null;
  updatedBy?: { name: string; role: string; username: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type StockMovementRow = {
  id: number;
  hospitalName: string;
  province: string;
  factorMedicineName: string;
  factorType: string;
  batchNumber: string;
  unit: string;
  movementType: string;
  quantityDelta: string;
  quantityAfter: string;
  reason: string;
  notes?: string;
  recordedBy: { name: string; role: string; username: string };
  recordedAt: string;
  patientId?: string;
  patientName?: string;
  injectionId?: number | null;
};

export async function fetchStock(params: { hospitalName?: string; search?: string; cursor?: string; limit?: number } = {}) {
  const q = new URLSearchParams();
  if (params.hospitalName) q.set("hospitalName", params.hospitalName);
  if (params.search) q.set("search", params.search);
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch(`/stock/${suffix}`) as Promise<{
    stock: StockLot[];
    total: number;
    totalQuantity: string | number;
    emptyLots: number;
    nextCursor?: string | null;
  }>;
}

export async function fetchStockMovements(params: {
  type?: string;
  patientId?: string;
  hospitalName?: string;
  from?: string;
  to?: string;
  search?: string;
  cursor?: string;
  limit?: number;
} = {}) {
  const q = new URLSearchParams();
  if (params.type && params.type !== "All") q.set("type", params.type);
  if (params.patientId) q.set("patientId", params.patientId);
  if (params.hospitalName && params.hospitalName !== "All") q.set("hospitalName", params.hospitalName);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.search) q.set("search", params.search);
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return apiFetch(`/stock/movements/${suffix}`) as Promise<{
    movements: StockMovementRow[];
    total: number;
    nextCursor?: string | null;
  }>;
}

export async function createStockLot(payload: Record<string, unknown>) {
  return apiFetch("/stock/", { method: "POST", body: JSON.stringify(payload) }) as Promise<{ stock: StockLot }>;
}

export async function updateStockLot(id: number, payload: Record<string, unknown>) {
  return apiFetch(`/stock/${id}/`, { method: "PATCH", body: JSON.stringify(payload) }) as Promise<{ stock: StockLot }>;
}

export async function stockIn(id: number, payload: Record<string, unknown>) {
  return apiFetch(`/stock/${id}/in/`, { method: "POST", body: JSON.stringify(payload) }) as Promise<{ stock: StockLot }>;
}

export async function stockOut(id: number, payload: Record<string, unknown>) {
  return apiFetch(`/stock/${id}/out/`, { method: "POST", body: JSON.stringify(payload) }) as Promise<{ stock: StockLot }>;
}

export async function deleteStockLot(id: number) {
  return apiFetch(`/stock/${id}/`, { method: "DELETE" });
}

export async function loadFactorCatalog() {
  return fetchFactors() as Promise<FactorOption[]>;
}

export const MOVEMENT_TYPES = [
  { id: "All", label: "All movements" },
  { id: "stock_in", label: "Stock in" },
  { id: "stock_out", label: "Stock out" },
  { id: "injection", label: "Given to patient" },
  { id: "adjustment", label: "Adjustment" },
  { id: "reversal", label: "Reversal" },
];
