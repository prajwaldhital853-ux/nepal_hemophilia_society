"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarRange,
  ChevronDown,
  Download,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";

import { fetchHospitalStaff } from "@/features/hospitals/api";
import HospitalStaffFormDialog from "@/features/hospitals/components/HospitalStaffFormDialog";
import {
  provinces,
  staffLabels,
  toStaffRow,
  type HospitalStaffRow,
  type HospitalStaffType,
} from "@/features/hospitals/types";
import { formatNumber } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";

function statusClass(status: HospitalStaffRow["status"]) {
  if (status === "Active") return "bg-status-green-soft text-status-green";
  if (status === "Pending") return "bg-status-amber-soft text-status-amber";
  return "bg-elevated text-muted";
}

function paginationPages(total: number, pageSize: number) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 5) return Array.from({ length: pages }, (_, i) => String(i + 1));
  return ["1", "2", "...", String(pages)];
}

export default function HospitalStaffModule({ staffType }: { staffType: HospitalStaffType }) {
  const router = useRouter();
  const { can, user } = useAuth();
  const canManage = can(Perm.hospitalStaffManage);
  const labels = staffLabels[staffType];
  const lockProvince = user?.role === "province_admin" ? user.provinceAdmin?.province || "" : "";
  const hideProvince = user?.role === "hospital_admin" || Boolean(lockProvince);
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState(lockProvince || "All");
  const [openProvince, setOpenProvince] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<HospitalStaffRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalsByProvince, setTotalsByProvince] = useState<Record<string, number>>({ All: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const pageSize = 10;

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchHospitalStaff(staffType, { province, search: query, page, pageSize });
      setRows(data.staff.map(toStaffRow));
      setTotal(data.total);
      setTotalsByProvince(data.totalsByProvince ?? { All: data.total });
    } catch (err) {
      setRows([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (lockProvince) setProvince(lockProvince);
  }, [lockProvince]);

  useEffect(() => {
    void loadData();
  }, [staffType, province, query, page]);

  const pages = useMemo(() => paginationPages(total, pageSize), [total]);
  const provinceTotal = totalsByProvince[province] ?? total;

  return (
    <div className="flex flex-col gap-2 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">{labels.title}</h1>
          <p className="text-[11px] text-muted">
            Home &gt; Hospital Administration &gt; {labels.crumb}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted">
            <CalendarRange className="size-3.5" />
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </button>
          {canManage ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
            >
              <Plus className="size-3.5" />
              Add {labels.singular}
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
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
              placeholder="Search by Name, Email or Treatment Center..."
            />
          </label>

          {hideProvince ? (
            lockProvince ? (
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">
                {lockProvince} Province
              </span>
            ) : null
          ) : (
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
                    setPage(1);
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
                      setPage(1);
                    }}
                  >
                    {item} Province
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          )}

          {province !== "All" && !hideProvince ? (
            <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">
              {province} Province
              <button
                type="button"
                onClick={() => {
                  setProvince("All");
                  setPage(1);
                }}
                aria-label="Clear province"
              >
                <X className="size-3" />
              </button>
            </span>
          ) : null}

          <p className="text-[11px] text-muted">
            Total {labels.singular}s:{" "}
            <span className="text-[15px] font-semibold text-ink">{formatNumber(provinceTotal)}</span>
          </p>

          <button type="button" className="panel ml-auto flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none">
            <Download className="size-3.5" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[960px] text-left text-sm">
            <thead className="bg-elevated text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {[
                  "Admin ID",
                  "Name",
                  "Email",
                  "Treatment Center",
                  "Province",
                  "Joined Date",
                  "Status",
                  "Actions",
                ].map((h) => (
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
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[11px] text-muted">
                    No {labels.singular.toLowerCase()} accounts yet. Add one to manage patient care at a center.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-elevated/70 dark:hover:bg-white/[0.03]">
                    <td className="px-3 py-3 font-medium text-brand">{row.id}</td>
                    <td className="px-3 py-3 font-semibold text-ink">{row.name}</td>
                    <td className="px-3 py-3 text-muted">{row.email}</td>
                    <td className="px-3 py-3 text-ink">{row.treatmentCenter}</td>
                    <td className="px-3 py-3 text-ink">{row.province}</td>
                    <td className="px-3 py-3 text-muted">{row.joinedDate}</td>
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
                          onClick={() => router.push(`${labels.profilePath}/${row.id}`)}
                        >
                          <Eye className="size-[15px]" />
                        </button>
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
            Showing {rows.length ? (page - 1) * pageSize + 1 : 0} to {(page - 1) * pageSize + rows.length} of{" "}
            {formatNumber(total)} entries
          </p>
          <div className="flex items-center gap-1">
            {pages.map((item, index) => (
              <button
                key={`${item}-${index}`}
                type="button"
                disabled={item === "..."}
                onClick={() => {
                  if (item !== "...") setPage(Number(item));
                }}
                className={`flex size-7 items-center justify-center rounded text-[11px] ${
                  String(page) === item ? "bg-brand font-semibold text-white" : "panel shadow-none"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {showForm ? (
        <HospitalStaffFormDialog
          staffType={staffType}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            void loadData();
          }}
        />
      ) : null}
    </div>
  );
}
