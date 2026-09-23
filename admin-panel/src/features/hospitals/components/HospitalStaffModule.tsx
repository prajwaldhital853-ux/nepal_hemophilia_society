"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarRange,
  ChevronDown,
  Download,
  Eye,
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
import { downloadCsv, stampFilename } from "@/lib/exportCsv";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";
import { usePageRbac } from "@/components/rbac/ReadOnlyBanner";
import { ActionsMenu, copyText } from "@/components/ui/ActionsMenu";

function statusClass(status: HospitalStaffRow["status"]) {
  if (status === "Active") return "bg-status-green-soft text-status-green";
  if (status === "Pending") return "bg-status-amber-soft text-status-amber";
  return "bg-elevated text-muted";
}

export default function HospitalStaffModule({ staffType }: { staffType: HospitalStaffType }) {
  const router = useRouter();
  const { can, user } = useAuth();
  const { readOnly } = usePageRbac("hospitalStaff");
  const canManage = can(Perm.hospitalStaffManage) && !readOnly && !user?.viewOnly;
  const labels = staffLabels[staffType];
  const lockProvince = user?.role === "province_admin" ? user.provinceAdmin?.province || "" : "";
  const hideProvince = user?.role === "hospital_admin" || Boolean(lockProvince);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [province, setProvince] = useState(lockProvince || "All");
  const [openProvince, setOpenProvince] = useState(false);
  const [rows, setRows] = useState<HospitalStaffRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalsByProvince, setTotalsByProvince] = useState<Record<string, number>>({ All: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchHospitalStaff(staffType, { province, search: debounced, limit: 10 });
      setRows(data.staff.map(toStaffRow));
      setNextCursor(data.nextCursor ?? null);
      setTotal(data.total);
      setTotalsByProvince(data.totalsByProvince ?? { All: data.total });
    } catch (err) {
      setRows([]);
      setNextCursor(null);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchHospitalStaff(staffType, {
        province,
        search: debounced,
        cursor: nextCursor,
        limit: 10,
      });
      setRows((current) => [...current, ...data.staff.map(toStaffRow)]);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more staff");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (lockProvince) setProvince(lockProvince);
  }, [lockProvince]);

  useEffect(() => {
    void loadData();
  }, [staffType, province, debounced]);

  const provinceTotal = totalsByProvince[province] ?? total;

  return (
    <div className="admin-page admin-page--fill">
      <div className="admin-page-sticky admin-page-sticky--fixed space-y-2">
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

        <div className="filter-bar">
          <label className="panel-inset flex h-8 min-w-[200px] flex-1 items-center gap-2 px-2.5 shadow-none">
            <Search className="size-3.5 text-faint" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
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
          )}

          {province !== "All" && !hideProvince ? (
            <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">
              {province} Province
              <button
                type="button"
                onClick={() => {
                  setProvince("All");
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

          <button
            type="button"
            className="panel ml-auto flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
            onClick={() =>
              downloadCsv(
                stampFilename(labels.singular.replaceAll(" ", "-").toLowerCase()),
                ["ID", "Name", "Email", "Phone", "Center", "Province", "Status", "Joined"],
                rows.map((row) => [row.id, row.name, row.email, row.phone, row.treatmentCenter, row.province, row.status, row.joinedDate]),
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
                        <ActionsMenu
                          ariaLabel={`More actions for ${row.name}`}
                          items={[
                            {
                              label: "View profile",
                              href: `${labels.profilePath}/${row.id}`,
                            },
                            {
                              label: "Copy staff ID",
                              onClick: () => void copyText(row.id),
                            },
                            {
                              label: "Copy email",
                              onClick: () => void copyText(row.email),
                            },
                            {
                              label: "Export row",
                              onClick: () =>
                                downloadCsv(
                                  stampFilename(`${labels.singular.replaceAll(" ", "-").toLowerCase()}-${row.id}`),
                                  ["Field", "Value"],
                                  [
                                    ["ID", row.id],
                                    ["Name", row.name],
                                    ["Email", row.email],
                                    ["Phone", row.phone],
                                    ["Center", row.treatmentCenter],
                                    ["Province", row.province],
                                    ["Status", row.status],
                                    ["Joined", row.joinedDate],
                                  ],
                                ),
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
            Showing {rows.length ? 1 : 0} to {rows.length} of {formatNumber(total)} entries
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
