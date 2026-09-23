"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Search, Users } from "lucide-react";

import { PaginatedScroll } from "@/components/ui/PaginatedScroll";
import { StatCardsSkeleton, TableBodySkeleton, TablePanelSkeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import { downloadCsv, stampFilename } from "@/lib/exportCsv";
import { useAuth } from "@/lib/auth";
import { showToast } from "@/lib/toastBus";
import { useVisibleSlice } from "@/lib/useVisibleSlice";

type DirectoryUser = {
  id: string;
  userId?: number | null;
  kind: string;
  role: string;
  roleLabel: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  province: string;
  treatmentCenter: string;
  status: string;
  lastLogin?: string;
  joinedDate?: string;
  isPatient: boolean;
};

type LoginRow = {
  name: string;
  username: string;
  role: string;
  lastLogin: string;
  active: boolean;
};

type DeviceRow = {
  deviceId?: string;
  identifier: string;
  user: string;
  failedAttempts: number;
  lockedUntil?: string;
};

function hrefFor(row: DirectoryUser) {
  if (row.isPatient || row.kind === "patient") return `/dashboard/patients/${row.id}`;
  if (row.kind === "center_admin") return `/dashboard/hospitals/center-admins/${row.id}`;
  if (row.kind === "treatment_admin") return `/dashboard/hospitals/treatment-admins/${row.id}`;
  return `/dashboard/admins/${row.id}`;
}

function when(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusClass(status: string) {
  const value = status.toLowerCase();
  if (value === "active") return "bg-emerald-50 text-emerald-700";
  if (value === "pending") return "bg-amber-50 text-amber-700";
  if (value === "rejected" || value === "inactive") return "bg-red-50 text-red-700";
  return "bg-elevated text-muted";
}

export default function UsersModule() {
  const { user } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<DirectoryUser[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loginTracking, setLoginTracking] = useState<LoginRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [counts, setCounts] = useState({ total: 0, admins: 0, patients: 0, active: 0 });
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("All");
  const [status, setStatus] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search.trim()) q.set("search", search.trim());
    if (kind !== "All") q.set("kind", kind);
    if (status !== "All") q.set("status", status);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    q.set("limit", "25");
    try {
      const data = await apiFetch(`/users/${q.toString() ? `?${q}` : ""}`);
      setRows(data.users ?? []);
      setNextCursor(data.nextCursor ?? null);
      setCounts(data.counts ?? { total: 0, admins: 0, patients: 0, active: 0 });
      setLoginTracking(data.loginTracking ?? []);
      setDevices(data.devices ?? []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not load users");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search, kind, status, from, to]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const q = new URLSearchParams();
    if (search.trim()) q.set("search", search.trim());
    if (kind !== "All") q.set("kind", kind);
    if (status !== "All") q.set("status", status);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    q.set("limit", "25");
    q.set("cursor", nextCursor);
    try {
      const data = await apiFetch(`/users/?${q.toString()}`);
      setRows((current) => [...current, ...(data.users ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not load more users");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  const scope =
    user?.role === "super_admin" || user?.role === "admin"
      ? "national directory"
      : user?.role === "province_admin"
        ? `${user.provinceAdmin?.province || "province"} accounts`
        : `${user?.hospitalStaff?.treatmentCenter || "center"} accounts`;

  const kinds = useMemo(() => {
    const all = [
      { id: "All", label: "All accounts" },
      { id: "patient", label: "Patients" },
      { id: "province_admin", label: "Province admins" },
      { id: "center_admin", label: "Center admins" },
      { id: "treatment_admin", label: "Treatment admins" },
      { id: "admin", label: "National admins" },
    ];
    if (user?.role === "super_admin") return all;
    if (user?.role === "admin") return all;
    if (user?.role === "province_admin") {
      return all.filter((item) => ["All", "patient", "province_admin", "center_admin", "treatment_admin"].includes(item.id));
    }
    return all.filter((item) => ["All", "patient", "center_admin", "treatment_admin"].includes(item.id));
  }, [user?.role]);

  const usersPage = useVisibleSlice(rows, 10);
  const loginPage = useVisibleSlice(loginTracking, 10);
  const devicePage = useVisibleSlice(devices, 10);

  async function loadMoreUsers() {
    if (usersPage.hasMore) {
      usersPage.loadMore();
      return;
    }
    await loadMore();
  }

  return (
    <div className="admin-page">
      <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Users Management</h1>
          <p className="text-[11px] text-muted">Home &gt; Users — {scope}. Super Admin records stay hidden from Admin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="panel flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
            onClick={() =>
              downloadCsv(
                stampFilename("users"),
                ["ID", "Name", "Role", "Email", "Phone", "Province", "Center", "Status", "Last login"],
                rows.map((row) => [
                  row.id,
                  row.fullName,
                  row.roleLabel,
                  row.email,
                  row.phone,
                  row.province,
                  row.treatmentCenter,
                  row.status,
                  row.lastLogin || "",
                ]),
              )
            }
          >
            <Download className="size-3.5" />
            Export
          </button>
          <button
            type="button"
            className="panel flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
            onClick={() =>
              downloadCsv(
                stampFilename("user-logins"),
                ["Name", "Username", "Role", "Last login", "Active"],
                loginTracking.map((row) => [row.name, row.username, row.role, row.lastLogin, row.active ? "Yes" : "No"]),
              )
            }
          >
            <Download className="size-3.5" />
            Export logins
          </button>
        </div>
      </div>

      {loading ? (
        <StatCardsSkeleton count={4} />
      ) : (
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          ["Total in scope", counts.total],
          ["Admins / staff", counts.admins],
          ["Patients", counts.patients],
          ["Active", counts.active],
        ].map(([label, value]) => (
          <article key={String(label)} className="panel p-2.5">
            <p className="text-[10px] uppercase text-faint">{label}</p>
            <p className="text-[18px] font-semibold text-ink">{value}</p>
          </article>
        ))}
      </div>
      )}

      </div>

      <div className="filter-bar admin-filter-sticky">
        <label className="panel-inset flex h-8 min-w-[180px] flex-1 items-center gap-2 px-2.5 shadow-none">
          <Search className="size-3.5 text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
            placeholder="Search name, email, ID…"
          />
        </label>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]">
          {kinds.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]">
          {["All", "Active", "Pending", "Inactive", "Rejected"].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]" />
      </div>

      <section className="panel p-3">
        {loading ? (
          <TablePanelSkeleton rows={10} columns={7} />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Users className="size-6" />
            </span>
            <p className="text-[13px] font-semibold text-ink">No accounts in this filter</p>
          </div>
        ) : (
          <PaginatedScroll
            showing={usersPage.showing}
            total={rows.length}
            hasMore={usersPage.hasMore || Boolean(nextCursor)}
            onLoadMore={() => void loadMoreUsers()}
            loading={loadingMore}
            label="users"
            className="admin-panel-scroll--rows-10"
          >
            <table className="data-table w-full min-w-[960px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-elevated text-[11px] uppercase text-muted">
                <tr>
                  {["ID", "Name", "Role", "Email", "Province / Center", "Status", "Last login"].map((h) => (
                    <th key={h} className="px-3 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersPage.visible.map((row) => (
                  <tr
                    key={`${row.kind}-${row.id}`}
                    className="cursor-pointer hover:bg-elevated/70"
                    onClick={() => router.push(hrefFor(row))}
                  >
                    <td className="px-3 py-2 text-[11px] font-medium text-brand">
                      <Link href={hrefFor(row)} onClick={(e) => e.stopPropagation()}>
                        {row.id}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-[11px] font-semibold text-ink">
                      {row.fullName}
                      <span className="block text-[10px] text-muted">{row.username}</span>
                    </td>
                    <td className="px-3 py-2 text-[11px]">{row.roleLabel}</td>
                    <td className="px-3 py-2 text-[11px]">{row.email}</td>
                    <td className="px-3 py-2 text-[11px]">
                      {row.province || "—"}
                      <span className="block text-[10px] text-muted">{row.treatmentCenter || "—"}</span>
                    </td>
                    <td className="px-3 py-2 text-[11px]">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-muted">{when(row.lastLogin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PaginatedScroll>
        )}
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Login tracking</h2>
          <PaginatedScroll
            showing={loginPage.showing}
            total={loginPage.total}
            hasMore={loginPage.hasMore}
            onLoadMore={loginPage.loadMore}
            label="logins"
            className="mt-2 admin-panel-scroll--rows-10"
          >
            <table className="inner-table w-full text-left">
              <thead className="sticky top-0 z-10 bg-card text-[10px] uppercase text-faint">
                <tr>
                  {["User", "Role", "Last login", "Active"].map((h) => (
                    <th key={h} className="px-2 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableBodySkeleton rows={10} columns={4} />
                ) : loginTracking.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-4 text-[11px] text-muted">
                      No login history yet.
                    </td>
                  </tr>
                ) : (
                  loginPage.visible.map((row) => (
                    <tr key={row.username}>
                      <td className="px-2 py-2 text-[11px]">
                        {row.name}
                        <span className="block text-[10px] text-muted">{row.username}</span>
                      </td>
                      <td className="px-2 py-2 text-[11px]">{row.role}</td>
                      <td className="px-2 py-2 text-[10px]">{when(row.lastLogin)}</td>
                      <td className="px-2 py-2 text-[11px]">{row.active ? "Yes" : "No"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </PaginatedScroll>
        </article>
        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Device / lock tracking</h2>
          <PaginatedScroll
            showing={devicePage.showing}
            total={devicePage.total}
            hasMore={devicePage.hasMore}
            onLoadMore={devicePage.loadMore}
            label="devices"
            className="mt-2 admin-panel-scroll--rows-10"
          >
            <table className="inner-table w-full text-left">
              <thead className="sticky top-0 z-10 bg-card text-[10px] uppercase text-faint">
                <tr>
                  {["Identifier", "User", "Failed tries", "Locked until"].map((h) => (
                    <th key={h} className="px-2 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableBodySkeleton rows={10} columns={4} />
                ) : devices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-4 text-[11px] text-muted">
                      No device lock events.
                    </td>
                  </tr>
                ) : (
                  devicePage.visible.map((row, index) => (
                    <tr key={`${row.identifier}-${index}`}>
                      <td className="px-2 py-2 text-[11px]">{row.identifier}</td>
                      <td className="px-2 py-2 text-[11px]">{row.user || "—"}</td>
                      <td className="px-2 py-2 text-[11px]">{row.failedAttempts}</td>
                      <td className="px-2 py-2 text-[10px]">{when(row.lockedUntil)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </PaginatedScroll>
        </article>
      </div>
    </div>
  );
}
