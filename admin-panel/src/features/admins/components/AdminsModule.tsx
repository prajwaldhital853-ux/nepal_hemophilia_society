"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, ChevronDown, Download, Eye, Plus, Search, X } from "lucide-react";

import { fetchProvinceAdmins, type ProvinceAdminRecord } from "@/features/admins/api";
import AdminFormDialog from "@/features/admins/components/AdminFormDialog";
import { provinces } from "@/features/admins/data/mockAdmins";
import { useAuth } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { Perm } from "@/lib/permissions";

function statusClass(status: string) {
  if (status === "Active") return "bg-status-green-soft text-status-green";
  return "bg-elevated text-muted";
}

export default function AdminsModule() {
  const router = useRouter();
  const { can } = useAuth();
  const canManage = can(Perm.provinceAdminsManage);
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("All");
  const [openProvince, setOpenProvince] = useState(false);
  const [rows, setRows] = useState<ProvinceAdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchProvinceAdmins();
      setRows(data.admins);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load province admins");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((admin) => {
      const matchProvince = province === "All" || admin.province === province;
      const matchQuery =
        !q ||
        admin.id.toLowerCase().includes(q) ||
        admin.fullName.toLowerCase().includes(q) ||
        admin.email.toLowerCase().includes(q) ||
        (admin.phone || "").toLowerCase().includes(q);
      return matchProvince && matchQuery;
    });
  }, [province, query, rows]);

  return (
    <div className="flex flex-col gap-2 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Province Admins</h1>
          <p className="text-[11px] text-muted">Home &gt; Admin Management — Super Admin configures one admin per province</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted">
            <CalendarRange className="size-3.5" />
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </button>
          {canManage ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
              onClick={() => setShowForm(true)}
            >
              <Plus className="size-3.5" />
              Add Province Admin
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
              placeholder="Search by Name, Email or Phone..."
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
            Province Admins: <span className="text-[15px] font-semibold text-ink">{formatNumber(visible.length)}</span>
            <span className="ml-1 text-faint">/ 7</span>
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
                {["Admin ID", "Name", "Email", "Role", "Province", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[11px] text-muted">
                    Loading…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[11px] text-muted">
                    No Province Admins yet. Super Admin can add one for each of Nepal’s 7 provinces.
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="hover:bg-elevated/70 dark:hover:bg-white/[0.03]">
                    <td className="px-3 py-3 font-medium text-brand">{row.id}</td>
                    <td className="px-3 py-3 font-semibold text-ink">{row.fullName}</td>
                    <td className="px-3 py-3 text-muted">{row.email}</td>
                    <td className="px-3 py-3 text-ink">Province Admin</td>
                    <td className="px-3 py-3 text-ink">{row.province}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-brand hover:bg-brand-soft"
                        aria-label={`View ${row.fullName}`}
                        onClick={() => router.push(`/dashboard/admins/${row.id}`)}
                      >
                        <Eye className="size-[15px]" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm ? (
        <AdminFormDialog
          takenProvinces={rows.map((row) => row.province)}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
