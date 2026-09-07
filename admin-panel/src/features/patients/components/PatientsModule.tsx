"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarRange,
  ChevronDown,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";

import { provinces, type PatientRow } from "@/features/patients/data/mockPatients";
import type { PatientRecord } from "@/features/patients/types";
import { useAuth } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { apiFetch } from "@/lib/api";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    const suffix = params.toString() ? `?${params.toString()}` : "";
    setLoading(true);
    setError("");
    void apiFetch(`/patients/${suffix}`)
      .then((data) => {
        const next = Array.isArray(data.patients) ? data.patients.map(toRow) : [];
        setRows(next);
      })
      .catch((err: Error) => {
        setRows([]);
        setError(err.message || "Failed to load patients");
      })
      .finally(() => setLoading(false));
  }, [debounced]);

  const visible = useMemo(() => {
    return rows.filter((patient) => {
      const matchProvince = province === "All" || patient.province === province;
      return matchProvince;
    });
  }, [province, rows]);

  const canCreate = can(Perm.patientsCreate);
  const canUpdate = can(Perm.patientsUpdate);
  const hospitalSearchHint = user?.role === "hospital_admin";

  return (
    <div className="flex flex-col gap-2 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">All Patients</h1>
          <p className="text-[11px] text-muted">
            {hospitalSearchHint
              ? "Search your hospital roster, or enter a Unique Patient ID (HEM-…) for cross-hospital care."
              : "Home > Patients Management > All Patients"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted">
            <CalendarRange className="size-3.5" />
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </button>
          {canCreate ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
              onClick={() => router.push("/dashboard/patients/new")}
            >
              <Plus className="size-3.5" />
              Add New Patient
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}

      <section className="panel overflow-hidden">
        <div className="filter-bar">
          <label className="panel-inset flex h-8 min-w-[200px] flex-1 items-center gap-2 px-2.5 shadow-none">
            <Search className="size-3.5 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
              placeholder={
                hospitalSearchHint
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
                  {provinces.map((item) => (
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

          <button type="button" className="panel ml-auto flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none">
            <Download className="size-3.5" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
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
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[11px] text-muted">
                    Loading…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[11px] text-muted">
                    {hospitalSearchHint
                      ? "No patients at this hospital. Enter a HEM-ID to open a visiting patient’s record."
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
                        {canUpdate ? (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 hover:bg-elevated"
                            aria-label="Edit"
                            onClick={() => router.push(`/dashboard/patients/${row.id}/edit`)}
                          >
                            <Pencil className="size-[15px]" />
                          </button>
                        ) : null}
                        <button type="button" className="rounded-lg p-1.5 hover:bg-elevated" aria-label="More">
                          <MoreHorizontal className="size-[15px]" />
                        </button>
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
            Showing {visible.length ? 1 : 0} to {visible.length} of {formatNumber(visible.length)} entries
          </p>
        </div>
      </section>
    </div>
  );
}
