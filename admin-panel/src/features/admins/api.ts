import { apiFetch } from "@/lib/api";

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
