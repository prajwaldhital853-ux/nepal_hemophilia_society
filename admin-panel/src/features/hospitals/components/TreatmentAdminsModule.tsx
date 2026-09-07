"use client";

import { useMemo, useState } from "react";
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

import {
  allTreatmentAdmins,
  provinces,
  treatmentAdminTotals,
  type TreatmentAdminStatus,
} from "@/features/hospitals/data/mockTreatmentAdmins";
import { formatNumber } from "@/lib/format";

function statusClass(status: TreatmentAdminStatus) {
  if (status === "Active") return "bg-status-green-soft text-status-green";
  if (status === "Pending") return "bg-status-amber-soft text-status-amber";
  return "bg-elevated text-muted";
}

function paginationPages(total: number) {
  const pages = Math.max(1, Math.ceil(total / 10));
  if (pages <= 5) return Array.from({ length: pages }, (_, i) => String(i + 1));
  return ["1", "2", "...", String(pages)];
}

export default function TreatmentAdminsModule() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("All");
  const [openProvince, setOpenProvince] = useState(false);

  const rows = useMemo(() => {
    return allTreatmentAdmins.filter((admin) => {
      const matchProvince = province === "All" || admin.province === province;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        admin.id.toLowerCase().includes(q) ||
        admin.name.toLowerCase().includes(q) ||
        admin.email.toLowerCase().includes(q) ||
        admin.treatmentCenter.toLowerCase().includes(q);
      return matchProvince && matchQuery;
    });
  }, [province, query]);

  const total = treatmentAdminTotals[province] ?? rows.length;
  const pages = paginationPages(total);

  return (
    <div className="flex flex-col gap-2 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">All Treatment Admins</h1>
          <p className="text-[11px] text-muted">Home &gt; Hospital Administration &gt; Treatment Admin</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted">
            <CalendarRange className="size-3.5" />
            May 16, 2025 - May 16, 2025
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
          >
            <Plus className="size-3.5" />
            Add Treatment Admin
          </button>
        </div>
      </div>

      <section className="panel overflow-hidden">
        <div className="filter-bar">
          <label className="panel-inset flex h-8 min-w-[200px] flex-1 items-center gap-2 px-2.5 shadow-none">
            <Search className="size-3.5 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
              placeholder="Search by Name, Email or Treatment Center..."
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

          {province !== "All" ? (
            <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">
              {province} Province
              <button type="button" onClick={() => setProvince("All")} aria-label="Clear province">
                <X className="size-3" />
              </button>
            </span>
          ) : null}

          <p className="text-[11px] text-muted">
            Total Treatment Admins:{" "}
            <span className="text-[15px] font-semibold text-ink">{formatNumber(total)}</span>
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
              {rows.map((row) => (
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
                        onClick={() => router.push(`/dashboard/hospitals/treatment-admins/${row.id}`)}
                      >
                        <Eye className="size-[15px]" />
                      </button>
                      <button type="button" className="rounded-lg p-1.5 hover:bg-elevated" aria-label="More">
                        <MoreHorizontal className="size-[15px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <p>
            Showing 1 to {Math.min(rows.length, 10)} of {formatNumber(total)} entries
          </p>
          <div className="flex items-center gap-1">
            {pages.map((item, index) => (
              <span
                key={`${item}-${index}`}
                className={`flex size-7 items-center justify-center rounded text-[11px] ${
                  item === "1" ? "bg-brand font-semibold text-white" : "panel shadow-none"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
