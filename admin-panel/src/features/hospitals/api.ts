import { apiFetch } from "@/lib/api";

import type {
  HospitalOption,
  HospitalStaffListResponse,
  HospitalStaffProfile,
  HospitalStaffType,
} from "./types";
import { staffLabels } from "./types";

export async function fetchHospitalStaff(
  staffType: HospitalStaffType,
  params: { province?: string; search?: string; cursor?: string; limit?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.province && params.province !== "All") query.set("province", params.province);
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch(`${staffLabels[staffType].apiPath}${suffix}`) as Promise<HospitalStaffListResponse>;
}

export async function fetchHospitalStaffProfile(staffType: HospitalStaffType, id: string) {
  const data = await apiFetch(`${staffLabels[staffType].apiPath}${encodeURIComponent(id)}/`);
  return data.staff as HospitalStaffProfile;
}

export async function createHospitalStaff(
  staffType: HospitalStaffType,
  payload: Record<string, string>,
) {
  return apiFetch(staffLabels[staffType].apiPath, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateHospitalStaff(
  staffType: HospitalStaffType,
  id: string,
  payload: Record<string, string>,
) {
  return apiFetch(`${staffLabels[staffType].apiPath}${encodeURIComponent(id)}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchHospitals() {
  const hospitals: HospitalOption[] = [];
  let cursor = "";
  for (let page = 0; page < 20; page += 1) {
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const data = await apiFetch(`/hospitals/?${query.toString()}`);
    const rows = Array.isArray(data.hospitals) ? data.hospitals : [];
    hospitals.push(...(rows as HospitalOption[]));
    cursor = typeof data.nextCursor === "string" ? data.nextCursor : "";
    if (!cursor) break;
  }
  return hospitals;
}
