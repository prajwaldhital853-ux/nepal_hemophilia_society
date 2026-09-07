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
  params: { province?: string; search?: string; page?: number; pageSize?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.province && params.province !== "All") query.set("province", params.province);
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
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
  const data = await apiFetch("/hospitals/");
  return (Array.isArray(data.hospitals) ? data.hospitals : []) as HospitalOption[];
}
