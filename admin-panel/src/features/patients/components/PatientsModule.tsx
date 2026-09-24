"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import type { PatientRecord, PatientRow } from "@/features/patients/types";
import { NEPAL_PROVINCES } from "@/lib/constants/provinces";
import { useAuth } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { apiFetch } from "@/lib/api";
import { downloadCsv, stampFilename } from "@/lib/exportCsv";
import { ActionsMenu, copyText } from "@/components/ui/ActionsMenu";
import { TableBodySkeleton } from "@/components/ui/Skeleton";
import { showConfirm } from "@/lib/confirmBus";
import { showToast } from "@/lib/toastBus";
import { useShortcutAction } from "@/hooks/useShortcutAction";
import { Perm } from "@/lib/permissions";

function ageFromDob(dob: string) {
  if (!dob) return 0;
  const born = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

function toRow(record: PatientRecord): PatientRow {
  return {
    id: record.id,
    name: record.fullName,
    province: record.province,
    center: record.primaryHospital,
    bloodGroup: record.bloodGroup,
    age: ageFromDob(record.dateOfBirth),
    lastVisit: new Date(record.updatedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    status: record.status,
    canEdit: record.canEdit,
    canDelete: record.canDelete,
  };
}

function statusClass(status: string) {
  if (status === "Active") return "bg-status-green-soft text-status-green";
  if (status === "Rejected") return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
  return "bg-status-amber-soft text-status-amber";
}

export default function PatientsModule() {
  const router = useRouter();
  const { user, can } = useAuth();
  const lockedProvince = user?.role === "province_admin" ? user.provinceAdmin?.province || "" : "";
  const hideProvinceFilter = user?.role === "hospital_admin" || Boolean(lockedProvince);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [province, setProvince] = useState(lockedProvince || "All");
  const [openProvince, setOpenProvince] = useState(false);
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useShortcutAction("page-refresh", () => setRefreshKey((value) => value + 1));

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (lockedProvince) setProvince(lockedProvince);
  }, [lockedProvince]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debounced.trim()) params.set("search", debounced.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("limit", "25");
    const suffix = `?${params.toString()}`;
    setLoading(true);
    void apiFetch(`/patients/${suffix}`)
      .then((data) => {
        const next = Array.isArray(data.patients) ? data.patients.map(toRow) : [];
        setRows(next);
        setNextCursor(data.nextCursor ?? null);
      })
      .catch((err: Error) => {
        setRows([]);
        setNextCursor(null);
        showToast(err.message || "Failed to load patients");
      })
      .finally(() => setLoading(false));
  }, [debounced, from, to, refreshKey]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const params = new URLSearchParams();
    if (debounced.trim()) params.set("search", debounced.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("limit", "25");
    params.set("cursor", nextCursor);
    try {
      const data = await apiFetch(`/patients/?${params.toString()}`);
      const extra = Array.isArray(data.patients) ? data.patients.map(toRow) : [];
      setRows((current) => [...current, ...extra]);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load more patients");
    } finally {
      setLoadingMore(false);
    }
  }

  const hemIdSearch = useMemo(() => {
    const term = debounced.trim();
    if (!term) return false;
    if (/^hem-/i.test(term)) return true;
    return /^\d{4,}$/.test(term.replace(/\D/g, ""));
  }, [debounced]);

  const visible = useMemo(() => {
    return rows.filter((patient) => {
      if (hemIdSearch) return true;
      const matchProvince = province === "All" || patient.province === province;
      return matchProvince;
    });
  }, [hemIdSearch, province, rows]);

  const canCreate = can(Perm.patientsCreate);
  const scopedSearchHint = user?.role === "hospital_admin" || user?.role === "province_admin";

  return (
    <div className="admin-page admin-page--fill">
      <div className="admin-page-sticky admin-page-sticky--fixed space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">All Patients</h1>
          <p className="text-[11px] text-muted">
            {scopedSearchHint
              ? user?.role === "province_admin"
                ? "Browse patients in your province, or enter a Unique Patient ID (HEM-…) to open any patient for clinical logging."
                : "Search your hospital roster, or enter a Unique Patient ID (HEM-…) for cross-hospital care."
              : "Home > Patients Management > All Patients"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="panel px-2 py-1.5 text-[11px] shadow-none" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="panel px-2 py-1.5 text-[11px] shadow-none" />
          {canCreate ? (
            <button
              type="button"
              data-shortcut-target="page-new"
              className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
              onClick={() => router.push("/dashboard/patients/new")}
            >
              <Plus className="size-3.5" />
              Add New Patient
            </button>
          ) : null}
        </div>
      </div>

        <div className="filter-bar">
          <label className="panel-inset flex h-8 min-w-[200px] flex-1 items-center gap-2 px-2.5 shadow-none">
            <Search className="size-3.5 text-faint" />
            <input
              data-shortcut-target="page-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
              placeholder={
                scopedSearchHint
                  ? "Search Unique Patient ID (HEM-000123)…"
                  : "Search by Patient ID, Name, Blood Group..."
              }
            />
          </label>

          {!hideProvinceFilter ? (
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
          ) : lockedProvince ? (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">
              {lockedProvince} Province
            </span>
          ) : null}

          {province !== "All" && !hideProvinceFilter ? (
            <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">
              {province} Province
              <button type="button" onClick={() => setProvince("All")} aria-label="Clear province">
                <X className="size-3" />
              </button>
            </span>
          ) : null}

          <p className="text-[11px] text-muted">
            Total Patients: <span className="text-[15px] font-semibold text-ink">{formatNumber(visible.length)}</span>
          </p>

          <button
            type="button"
            data-shortcut-target="page-export"
            className="panel ml-auto flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
            onClick={() =>
              downloadCsv(
                stampFilename("patients"),
                ["ID", "Name", "Province", "Center", "Blood group", "Age", "Last visit", "Status"],
                visible.map((row) => [row.id, row.name, row.province, row.center, row.bloodGroup, row.age, row.lastVisit, row.status]),
              )
            }
          >
            <Download className="size-3.5" />
            Export
          </button>
        </div>
      </div>

      <section className="panel admin-list-panel overflow-hidden">
        <div className="admin-table-scroll overflow-x-auto">
          <table className="data-table w-full min-w-[880px] text-left text-sm">
            <thead className="bg-elevated text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {["Patient ID", "Patient Name", "District / Treatment Center", "Blood Group", "Age", "Last Visit", "Status", "Actions"].map(
                  (h) => (
                    <th key={h} className="px-3 py-3 font-medium">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableBodySkeleton rows={10} columns={8} />
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[11px] text-muted">
                    {scopedSearchHint
                      ? user?.role === "province_admin"
                        ? "No patients in your province. Enter a HEM-ID to find a patient from another province."
                        : "No patients at this hospital. Enter a HEM-ID to open a visiting patient’s record."
                      : "No patients in this scope yet."}
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="hover:bg-elevated/70 dark:hover:bg-white/[0.03]">
                    <td className="px-3 py-3 font-medium text-brand">{row.id}</td>
                    <td className="px-3 py-3 font-semibold text-ink">{row.name}</td>
                    <td className="px-3 py-3 text-muted">{row.center}</td>
                    <td className="px-3 py-3 text-ink">{row.bloodGroup}</td>
                    <td className="px-3 py-3 text-ink">{row.age}</td>
                    <td className="px-3 py-3 text-muted">{row.lastVisit}</td>
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
                          aria-label={`View ${row.name}`}
                          onClick={() => router.push(`/dashboard/patients/${row.id}`)}
                        >
                          <Eye className="size-[15px]" />
                        </button>
                        {row.canEdit ? (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 hover:bg-elevated"
                            aria-label="Edit"
                            onClick={() => router.push(`/dashboard/patients/${row.id}/edit`)}
                          >
                            <Pencil className="size-[15px]" />
                          </button>
                        ) : null}
                        {row.canDelete && !user?.viewOnly ? (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                            aria-label={`Delete ${row.name}`}
                            onClick={() => {
                              void showConfirm({
                                message: `Delete patient ${row.id}? This cannot be undone if they have no clinical records.`,
                              }).then((confirmed) => {
                                if (!confirmed) return;
                                void apiFetch(`/patients/${encodeURIComponent(row.id)}/`, { method: "DELETE" })
                                  .then(() => {
                                    setRows((current) => current.filter((item) => item.id !== row.id));
                                    showToast("Patient deleted successfully");
                                  })
                                  .catch((err: Error) => showToast(err.message || "Could not delete patient"));
                              });
                            }}
                          >
                            <Trash2 className="size-[15px]" />
                          </button>
                        ) : null}
                        <ActionsMenu
                          ariaLabel={`More actions for ${row.name}`}
                          items={[
                            {
                              label: "View profile",
                              href: `/dashboard/patients/${row.id}`,
                            },
                            {
                              label: "Edit patient",
                              href: `/dashboard/patients/${row.id}/edit`,
                              hidden: !row.canEdit,
                            },
                            {
                              label: "Copy patient ID",
                              onClick: () => void copyText(row.id),
                            },
                            {
                              label: "Export row",
                              onClick: () =>
                                downloadCsv(
                                  stampFilename(`patient-${row.id}`),
                                  ["Field", "Value"],
                                  [
                                    ["ID", row.id],
                                    ["Name", row.name],
                                    ["Province", row.province],
                                    ["Center", row.center],
                                    ["Blood group", row.bloodGroup],
                                    ["Age", String(row.age)],
                                    ["Last visit", row.lastVisit],
                                    ["Status", row.status],
                                  ],
                                ),
                            },
                            {
                              label: "Delete patient",
                              destructive: true,
                              hidden: !row.canDelete || user?.viewOnly,
                              onClick: () => {
                                void showConfirm({
                                  message: `Delete patient ${row.id}? This cannot be undone if they have no clinical records.`,
                                }).then((confirmed) => {
                                  if (!confirmed) return;
                                  void apiFetch(`/patients/${encodeURIComponent(row.id)}/`, { method: "DELETE" })
                                    .then(() => {
                                      setRows((current) => current.filter((item) => item.id !== row.id));
                                      showToast("Patient deleted successfully");
                                    })
                                    .catch((err: Error) => showToast(err.message || "Could not delete patient"));
                                });
                              },
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <p>
            Showing {visible.length ? 1 : 0} to {visible.length} of {formatNumber(visible.length)} loaded
          </p>
          {nextCursor ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="rounded border border-line px-2 py-1 text-[11px] font-semibold text-brand disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
