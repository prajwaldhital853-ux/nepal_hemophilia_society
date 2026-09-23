import { fetchStaffDirectory } from "@/features/admins/api";
import { fetchHospitals } from "@/features/hospitals/api";
import { apiFetch } from "@/lib/api";
import { Perm } from "@/lib/permissions";

export type GlobalSearchHit = {
  id: string;
  label: string;
  meta: string;
  href: string;
  kind: "patient" | "admin" | "stock" | "hospital";
};

function staffProfileHref(kind: string, id: string) {
  if (kind === "treatment_admin") return `/dashboard/hospitals/treatment-admins/${id}`;
  if (kind === "center_admin") return `/dashboard/hospitals/center-admins/${id}`;
  return `/dashboard/admins/${id}`;
}

export async function runGlobalSearch(
  query: string,
  can: (perm: string) => boolean,
): Promise<GlobalSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const tasks: Promise<GlobalSearchHit[]>[] = [];

  if (can(Perm.patientsView) || can(Perm.patientsSearch)) {
    tasks.push(
      apiFetch(`/patients/?search=${encodeURIComponent(q)}&limit=6`)
        .then((data) => {
          const patients = Array.isArray(data.patients) ? data.patients : [];
          return patients.map(
            (row: { id: string; fullName: string; province?: string; primaryHospital?: string }) => ({
              id: row.id,
              label: row.fullName || row.id,
              meta: [row.id, row.primaryHospital, row.province].filter(Boolean).join(" · "),
              href: `/dashboard/patients/${row.id}`,
              kind: "patient" as const,
            }),
          );
        })
        .catch(() => []),
    );
  }

  if (can(Perm.stockView)) {
    tasks.push(
      apiFetch(`/stock/?search=${encodeURIComponent(q)}&limit=6`)
        .then((data) => {
          const stock = Array.isArray(data.stock) ? data.stock : [];
          return stock.map(
            (row: { id: number; factorMedicineName: string; hospitalName?: string; quantity?: string | number; unit?: string }) => ({
              id: String(row.id),
              label: row.factorMedicineName,
              meta: `${row.hospitalName || "Center"} · ${row.quantity ?? 0} ${row.unit || "units"}`,
              href: "/dashboard/stock",
              kind: "stock" as const,
            }),
          );
        })
        .catch(() => []),
    );
  }

  if (can(Perm.adminsView)) {
    tasks.push(
      fetchStaffDirectory({ search: q, limit: 6 })
        .then((data) =>
          data.staff.map((row) => ({
            id: row.id,
            label: row.fullName,
            meta: [row.roleLabel, row.province || row.treatmentCenter || "National"].filter(Boolean).join(" · "),
            href: staffProfileHref(row.kind, row.id),
            kind: "admin" as const,
          })),
        )
        .catch(() => []),
    );
  }

  if (can(Perm.hospitalsManage) || can(Perm.patientsView)) {
    tasks.push(
      fetchHospitals()
        .then((hospitals) => {
          const needle = q.toLowerCase();
          return hospitals
            .filter((h) => h.name.toLowerCase().includes(needle) || h.province.toLowerCase().includes(needle))
            .slice(0, 6)
            .map((row) => ({
              id: String(row.id),
              label: row.name,
              meta: row.province,
              href: "/dashboard/hospitals",
              kind: "hospital" as const,
            }));
        })
        .catch(() => []),
    );
  }

  const groups = await Promise.all(tasks);
  const seen = new Set<string>();
  const hits: GlobalSearchHit[] = [];
  for (const group of groups) {
    for (const hit of group) {
      const key = `${hit.kind}:${hit.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push(hit);
    }
  }
  return hits.slice(0, 12);
}
