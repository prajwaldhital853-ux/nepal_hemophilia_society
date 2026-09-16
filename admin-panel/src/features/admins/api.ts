import { apiFetch, apiForm } from "@/lib/api";

export type StaffKind =
  | "super_admin"
  | "admin"
  | "province_admin"
  | "center_admin"
  | "treatment_admin"
  | "website_manager";

export type StaffRecord = {
  id: string;
  userId: number;
  kind: StaffKind;
  role: string;
  roleLabel: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  designation?: string;
  employeeId?: string;
  nationalId?: string;
  officeAddress?: string;
  notes?: string;
  province: string;
  treatmentCenter: string;
  hospitalId?: number | null;
  status: "Active" | "Pending" | "Inactive";
  viewOnly: boolean;
  permissions: string[];
  effectivePermissions: string[];
  permissionLabels?: { code: string; label: string }[];
  mustChangePassword: boolean;
  photoUrl?: string;
  lastLogin?: string;
  joinedDate?: string;
  canDelete?: boolean;
  canEdit?: boolean;
};

export type PermissionItem = {
  code: string;
  action: string;
  label: string;
};

export type PermissionGroup = {
  page: string;
  label: string;
  permissions: PermissionItem[];
};

export type AssignableRole = {
  kind: StaffKind;
  label: string;
  requiresProvince: boolean;
  requiresHospital: boolean;
  defaults: string[];
};

export type StaffCatalog = {
  assignableRoles: AssignableRole[];
  permissionGroups: PermissionGroup[];
  takenProvinces: string[];
  actorKind: StaffKind | string | null;
};

export type ProvinceAdminRecord = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  province: string;
  status: "Active" | "Inactive";
  mustChangePassword: boolean;
};

export async function fetchStaffCatalog(kind?: string) {
  const suffix = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  return apiFetch(`/admins/catalog/${suffix}`) as Promise<StaffCatalog>;
}

export async function fetchStaffDirectory(
  params: { kind?: string; search?: string; province?: string; cursor?: string; limit?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.kind) query.set("kind", params.kind);
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.province && params.province !== "All") query.set("province", params.province);
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await apiFetch(`/admins/staff/${suffix}`);
  return {
    staff: (data.staff ?? []) as StaffRecord[],
    total: Number(data.total ?? 0),
    nextCursor: (data.nextCursor as string | null) ?? null,
  };
}

export async function fetchStaffAccount(id: string) {
  const data = await apiFetch(`/admins/staff/${encodeURIComponent(id)}/`);
  return (data.admin ?? data.staff) as StaffRecord;
}

function toStaffFormData(payload: Record<string, unknown>, photo?: File | null) {
  const body = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) body.append(key, JSON.stringify(value));
    else if (typeof value === "boolean") body.append(key, value ? "true" : "false");
    else body.append(key, String(value));
  }
  if (photo) body.append("photo", photo);
  return body;
}

export async function createStaffAccount(payload: Record<string, unknown>, photo?: File | null) {
  if (photo) {
    return apiForm("/admins/staff/", toStaffFormData(payload, photo), "POST");
  }
  return apiFetch("/admins/staff/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteStaffAccount(id: string) {
  return apiFetch(`/admins/staff/${encodeURIComponent(id)}/`, { method: "DELETE" });
}

export async function updateStaffAccount(id: string, payload: Record<string, unknown>, photo?: File | null) {
  if (photo) {
    return apiForm(`/admins/staff/${encodeURIComponent(id)}/`, toStaffFormData(payload, photo), "PUT");
  }
  return apiFetch(`/admins/staff/${encodeURIComponent(id)}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchProvinceAdmins() {
  const data = await apiFetch("/provinces/admins/");
  return {
    admins: (data.admins ?? []) as ProvinceAdminRecord[],
    total: Number(data.total ?? 0),
  };
}

export async function fetchProvinceAdmin(id: string) {
  const data = await apiFetch(`/provinces/admins/${encodeURIComponent(id)}/`);
  return data.admin as ProvinceAdminRecord;
}

export async function createProvinceAdmin(payload: Record<string, string>) {
  return apiFetch("/provinces/admins/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProvinceAdmin(id: string, payload: Record<string, string>) {
  return apiFetch(`/provinces/admins/${encodeURIComponent(id)}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export const KIND_LABELS: Record<StaffKind, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  province_admin: "Province Admin",
  center_admin: "Center Admin",
  treatment_admin: "Treatment Admin",
  website_manager: "Website Manager",
};

/** Short guidance shown when picking a role preset during admin creation. */
export const KIND_DESCRIPTIONS: Record<StaffKind, string> = {
  super_admin: "Full system control — settings, audit, national reports, and all modules.",
  admin: "National oversight — patients, hospitals, and reports without system settings.",
  province_admin: "One province — patients, hospitals, center staff, and province reports.",
  center_admin: "Treatment center lead — stock, staff, injections, and patient search.",
  treatment_admin: "Clinical staff — log injections and treatments, view patients at their center.",
  website_manager: "Public website only — news, events, and gallery content.",
};
