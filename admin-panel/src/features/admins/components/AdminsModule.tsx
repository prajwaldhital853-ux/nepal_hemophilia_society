"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, CheckCircle2, ChevronDown, Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import {
  deleteStaffAccount,
  fetchStaffCatalog,
  fetchStaffDirectory,
  updateStaffAccount,
  KIND_LABELS,
  type StaffKind,
  type StaffRecord,
} from "@/features/admins/api";
import StaffAccountForm from "@/features/admins/components/StaffAccountForm";
import { NEPAL_PROVINCES } from "@/lib/constants/provinces";
import { useAuth } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { Perm } from "@/lib/permissions";
import { usePageRbac } from "@/components/rbac/ReadOnlyBanner";

function statusClass(status: string) {
  if (status === "Active") return "bg-status-green-soft text-status-green";
  if (status === "Pending") return "bg-status-amber-soft text-status-amber";
  return "bg-elevated text-muted";
}

const TABS: { id: "" | StaffKind; label: string }[] = [
  { id: "", label: "All" },
  { id: "super_admin", label: "Super Admin" },
  { id: "admin", label: "Admin" },
  { id: "province_admin", label: "Province" },
  { id: "center_admin", label: "Center" },
  { id: "treatment_admin", label: "Treatment" },
  { id: "website_manager", label: "Website" },
];

function profileHref(row: StaffRecord) {
  if (row.kind === "treatment_admin") return `/dashboard/hospitals/treatment-admins/${row.id}`;
  if (row.kind === "center_admin") return `/dashboard/hospitals/center-admins/${row.id}`;
  return `/dashboard/admins/${row.id}`;
}

export default function AdminsModule() {
  const router = useRouter();
  const { can, user } = useAuth();
  const { readOnly } = usePageRbac("admins");
  const canManage = (can(Perm.adminsManage) || can(Perm.provinceAdminsManage) || can(Perm.hospitalStaffManage)) && !user?.viewOnly;
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("All");
  const [kind, setKind] = useState<"" | StaffKind>("");
  const [openProvince, setOpenProvince] = useState(false);
  const [rows, setRows] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roles, setRoles] = useState<StaffKind[]>([]);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchStaffDirectory({ kind: kind || undefined, search: query, province });
      setRows(data.staff);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchStaffCatalog()
      .then((data) => setRoles(data.assignableRoles.map((role) => role.kind)))
      .catch(() => setRoles([]));
  }, []);

  useEffect(() => {
    void load();
  }, [kind, province]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((admin) => {
      const matchQuery =
        !q ||
        admin.id.toLowerCase().includes(q) ||
        admin.fullName.toLowerCase().includes(q) ||
        admin.email.toLowerCase().includes(q) ||
        (admin.phone || "").includes(q);
      return matchQuery;
    });
  }, [query, rows]);

  return (
    <div className="flex flex-col gap-2 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Admin Management</h1>
          <p className="text-[11px] text-muted">
            Home &gt; Admin Management — create and control only the roles your account is allowed to manage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted">
            <CalendarRange className="size-3.5" />
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </button>
          {canManage && !readOnly ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
              onClick={() => setShowForm(true)}
            >
              <Plus className="size-3.5" />
              Add Admin
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-1">
        {TABS.filter((tab) => !tab.id || roles.includes(tab.id)).map((tab) => (
          <button
            key={tab.id || "all"}
            type="button"
            onClick={() => setKind(tab.id)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              kind === tab.id ? "bg-brand text-white" : "bg-elevated text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="panel overflow-hidden">
        <div className="filter-bar">
          <label className="panel-inset flex h-8 min-w-[200px] flex-1 items-center gap-2 px-2.5 shadow-none">
            <Search className="size-3.5 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
              placeholder="Search by name, email, phone or ID..."
            />
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenProvince((v) => !v)}
              className="panel flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
            >
              {province === "All" ? "All Provinces" : `${province} Province`}
              <ChevronDown className="size-3.5" />
            </button>
            {openProvince ? (
              <div className="absolute z-20 mt-1 w-48 overflow-hidden panel shadow-lg">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[11px] hover:bg-elevated"
                  onClick={() => {
                    setProvince("All");
                    setOpenProvince(false);
                  }}
                >
                  All Provinces
                </button>
                {NEPAL_PROVINCES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-[11px] hover:bg-brand-soft ${
                      province === item ? "bg-brand text-white hover:bg-brand" : ""
                    }`}
                    onClick={() => {
                      setProvince(item);
                      setOpenProvince(false);
                    }}
                  >
                    {item} Province
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {province !== "All" ? (
            <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">
              {province} Province
              <button type="button" onClick={() => setProvince("All")} aria-label="Clear province">
                <X className="size-3" />
              </button>
            </span>
          ) : null}

          <p className="text-[11px] text-muted">
            Admins: <span className="text-[15px] font-semibold text-ink">{formatNumber(visible.length)}</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[880px] text-left text-sm">
            <thead className="bg-elevated text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {["Admin ID", "Name", "Email", "Role", "Scope", "Access", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[11px] text-muted">
                    Loading…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[11px] text-muted">
                    No admins in this filter. Add an admin with the roles you are allowed to create.
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="hover:bg-elevated/70 dark:hover:bg-white/[0.03]">
                    <td className="px-3 py-3 font-medium text-brand">{row.id}</td>
                    <td className="px-3 py-3 font-semibold text-ink">{row.fullName}</td>
                    <td className="px-3 py-3 text-muted">{row.email}</td>
                    <td className="px-3 py-3 text-ink">{KIND_LABELS[row.kind] || row.roleLabel}</td>
                    <td className="px-3 py-3 text-ink">{row.treatmentCenter || row.province || "National"}</td>
                    <td className="px-3 py-3 text-[11px] text-muted">{row.viewOnly ? "View only" : "Full"}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 text-muted">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-brand hover:bg-brand-soft"
                          aria-label={`View ${row.fullName}`}
                          onClick={() => router.push(profileHref(row))}
                        >
                          <Eye className="size-[15px]" />
                        </button>
                        {canManage && row.status === "Pending" ? (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-status-green hover:bg-status-green-soft"
                            aria-label={`Mark ${row.fullName} as active`}
                            title="Mark as Active"
                            onClick={() => {
                              void updateStaffAccount(row.id, { status: "Active" })
                                .then(() => void load())
                                .catch((err: Error) => setError(err.message || "Could not activate admin"));
                            }}
                          >
                            <CheckCircle2 className="size-[15px]" />
                          </button>
                        ) : null}
                        {canManage ? (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 hover:bg-elevated"
                            aria-label={`Edit ${row.fullName}`}
                            onClick={() => router.push(profileHref(row))}
                          >
                            <Pencil className="size-[15px]" />
                          </button>
                        ) : null}
                        {row.canDelete ? (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                            aria-label={`Delete ${row.fullName}`}
                            onClick={() => {
                              if (!window.confirm(`Delete admin ${row.id} (${row.fullName})? This cannot be undone.`)) return;
                              void deleteStaffAccount(row.id)
                                .then(() => setRows((current) => current.filter((item) => item.id !== row.id)))
                                .catch((err: Error) => setError(err.message || "Could not delete admin"));
                            }}
                          >
                            <Trash2 className="size-[15px]" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm ? (
        <StaffAccountForm
          takenProvinces={rows.filter((row) => row.kind === "province_admin").map((row) => row.province)}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
