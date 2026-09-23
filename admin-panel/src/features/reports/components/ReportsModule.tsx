"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileBarChart } from "lucide-react";

import { InjectionOverviewChart, StockSummaryChart } from "@/features/dashboard/components/DashboardCharts";
import type { DashboardTrendPoint, ProvinceStat, StockByHospital, StockUsageTrend, SystemOverview } from "@/features/dashboard/types";
import { PaginatedScroll } from "@/components/ui/PaginatedScroll";
import { ReportsPageSkeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import { downloadCsv, stampFilename } from "@/lib/exportCsv";
import { useAuth } from "@/lib/auth";
import { CHART_BAR_PROPS, useChartColors } from "@/lib/chartColors";
import { showToast } from "@/lib/toastBus";
import { useVisibleSlice } from "@/lib/useVisibleSlice";

const PIE = ["#2F6FED", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

type MixRow = { name: string; value: number };
type CenterRow = {
  hospitalName: string;
  province: string;
  patients: number;
  injections: number;
  treatments: number;
  visits: number;
  stockOnHand: number;
};
type LoginRow = { name: string; username: string; role: string; lastLogin: string; active: boolean };
type ActivityRow = { id: number; actor: string; action: string; module: string; detail: string; ip?: string; createdAt: string };
type DeviceRow = { identifier: string; user: string; failedAttempts: number; locked: boolean };

const EMPTY_OVERVIEW: SystemOverview = {
  totalUsers: 0,
  totalAdmins: 0,
  superAdmins: 0,
  provinceAdmins: 0,
  hospitalAdmins: 0,
  activeSessions: 0,
  todaysVisits: 0,
  totalStockUnits: 0,
  totalProvinces: 0,
  totalCenters: 0,
  totalPatients: 0,
  activePatients: 0,
};

export default function ReportsModule() {
  const { user } = useAuth();
  const c = useChartColors();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [scopeLabel, setScopeLabel] = useState("");
  const [totals, setTotals] = useState({ patients: 0, hospitals: 0, injections: 0, treatments: 0, activePatients: 0 });
  const [rangeTotals, setRangeTotals] = useState({
    injections: 0,
    treatments: 0,
    visits: 0,
    stockMoves: 0,
    bleeding: 0,
    loginsTracked: 0,
  });
  const [trend, setTrend] = useState<DashboardTrendPoint[]>([]);
  const [stockByHospital, setStockByHospital] = useState<StockByHospital[]>([]);
  const [usage, setUsage] = useState<StockUsageTrend[]>([]);
  const [provinces, setProvinces] = useState<ProvinceStat[]>([]);
  const [centers, setCenters] = useState<CenterRow[]>([]);
  const [indicationMix, setIndicationMix] = useState<MixRow[]>([]);
  const [severityMix, setSeverityMix] = useState<MixRow[]>([]);
  const [typeMix, setTypeMix] = useState<MixRow[]>([]);
  const [bleedingMix, setBleedingMix] = useState<MixRow[]>([]);
  const [movementByType, setMovementByType] = useState<MixRow[]>([]);
  const [adminRoleMix, setAdminRoleMix] = useState<MixRow[]>([]);
  const [loginTracking, setLoginTracking] = useState<LoginRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [movement, setMovement] = useState({ stockIn: 0, stockOut: 0, adjustments: 0, injections: 0 });
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [overview, setOverview] = useState<SystemOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    try {
      const data = await apiFetch(`/reports/full/${q.toString() ? `?${q}` : ""}`);
      setScopeLabel(data.scopeLabel || user?.role || "");
      setTotals(data.totals ?? { patients: 0, hospitals: 0, injections: 0, treatments: 0, activePatients: 0 });
      setRangeTotals(
        data.rangeTotals ?? { injections: 0, treatments: 0, visits: 0, stockMoves: 0, bleeding: 0, loginsTracked: 0 },
      );
      setTrend(data.treatmentTrend ?? []);
      setStockByHospital(data.stockByHospital ?? []);
      setUsage(data.stockUsageTrend ?? []);
      setProvinces(data.provinceStats ?? []);
      setCenters(data.centerTable ?? []);
      setIndicationMix(data.indicationMix ?? []);
      setSeverityMix(data.severityMix ?? []);
      setTypeMix(data.typeMix ?? []);
      setBleedingMix(data.bleedingMix ?? []);
      setMovementByType(data.movementByType ?? []);
      setAdminRoleMix(data.adminRoleMix ?? []);
      setLoginTracking(data.loginTracking ?? []);
      setActivity(data.activityLogs ?? []);
      setMovement(data.movementSummary ?? { stockIn: 0, stockOut: 0, adjustments: 0, injections: 0 });
      setDevices(data.devices ?? []);
      setOverview(data.systemOverview ?? EMPTY_OVERVIEW);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load reports";
      showToast(message);
    } finally {
      setLoading(false);
    }
  }, [from, to, user?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  const activityPage = useVisibleSlice(activity, 15);
  const loginPage = useVisibleSlice(loginTracking, 15);
  const devicePage = useVisibleSlice(devices, 15);

  const kpis = [
    { label: "Patients", value: totals.patients, meta: `${totals.activePatients} active` },
    { label: "Centers", value: totals.hospitals, meta: scopeLabel },
    { label: "Injections (range)", value: rangeTotals.injections, meta: `${totals.injections} all time` },
    { label: "Treatments (range)", value: rangeTotals.treatments, meta: `${totals.treatments} all time` },
    { label: "Visits (range)", value: rangeTotals.visits, meta: `${rangeTotals.bleeding || 0} bleeds` },
    { label: "Stock in", value: Math.round(movement.stockIn), meta: "units" },
    { label: "Stock out / used", value: Math.round(movement.stockOut), meta: "units" },
    { label: "Stock moves", value: rangeTotals.stockMoves, meta: `${movement.adjustments} adjustments` },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-sticky admin-page-sticky--fixed space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-[15px] font-semibold text-ink">Reports & Analytics</h1>
            <p className="text-[11px] text-muted">
              Home &gt; Reports — {scopeLabel || "your scope"}. Super Admin sees national data; Admin sees the system except Super Admin accounts; others see their province or center only.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]" />
            <button
              type="button"
              className="panel flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
              onClick={() =>
                downloadCsv(
                  stampFilename("nhms-report"),
                  ["Center", "Province", "Patients", "Injections", "Treatments", "Visits", "Stock"],
                  centers.map((row) => [
                    row.hospitalName,
                    row.province,
                    row.patients,
                    row.injections,
                    row.treatments,
                    row.visits,
                    row.stockOnHand,
                  ]),
                )
              }
            >
              <Download className="size-3.5" />
              Export centers
            </button>
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-3 pb-6">
      {loading ? (
        <ReportsPageSkeleton />
      ) : (
      <>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="panel p-2.5">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
              <FileBarChart className="size-3.5" />
            </span>
            <p className="mt-2 text-[10px] text-muted">{kpi.label}</p>
            <p className="text-[16px] font-semibold text-ink">{kpi.value}</p>
            <p className="text-[10px] text-faint">{kpi.meta}</p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
        {[
          ["Users in scope", overview.totalUsers],
          ["Admins", overview.totalAdmins],
          ["Active sessions", overview.activeSessions],
          ["Today visits", overview.todaysVisits],
          ["Stock units", Math.round(overview.totalStockUnits)],
          ["Logins tracked", rangeTotals.loginsTracked || loginTracking.length],
        ].map(([label, value]) => (
          <article key={String(label)} className="panel p-2.5">
            <p className="text-[10px] uppercase text-faint">{label}</p>
            <p className="text-[16px] font-semibold text-ink">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="panel p-3">
          <h2 className="mb-2 text-[12px] font-semibold text-ink">Injections vs treatments</h2>
          <InjectionOverviewChart data={trend} />
        </article>
        <article className="panel p-3">
          <h2 className="mb-2 text-[12px] font-semibold text-ink">Stock in / out by month</h2>
          <StockSummaryChart usageTrend={usage} byHospital={stockByHospital} />
        </article>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="panel p-3">
          <h2 className="mb-2 text-[12px] font-semibold text-ink">Stock movement mix</h2>
          {movementByType.length === 0 ? (
            <p className="mt-6 text-center text-[11px] text-muted">No stock movement in this range.</p>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementByType} {...CHART_BAR_PROPS}>
                  <CartesianGrid stroke={c.grid} vertical={false} />
                  <XAxis dataKey="name" stroke={c.tick} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={c.tick} fontSize={10} width={32} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2F6FED" name="Moves" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
        <MixChart title="Admin roles in scope" data={adminRoleMix} colors={PIE} />
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <MixChart title="Injection types" data={indicationMix} colors={PIE} />
        <MixChart title="Severity mix" data={severityMix} colors={PIE} />
        <MixChart title="Hemophilia type" data={typeMix} colors={PIE} />
        <MixChart title="Bleeding severity" data={bleedingMix} colors={PIE} />
      </div>

      <article className="panel overflow-x-auto p-3">
        <h2 className="text-[12px] font-semibold text-ink">Center comparison</h2>
        <table className="inner-table mt-2 w-full min-w-[720px] text-left">
          <thead className="text-[10px] uppercase text-faint">
            <tr>
              {["Center", "Province", "Patients", "Injections", "Treatments", "Visits", "Stock on hand"].map((h) => (
                <th key={h} className="px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {centers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-[11px] text-muted">
                  No center activity in this scope.
                </td>
              </tr>
            ) : (
              centers.map((row) => (
                <tr key={row.hospitalName}>
                  <td className="px-2 py-2 text-[11px] font-medium">{row.hospitalName}</td>
                  <td className="px-2 py-2 text-[11px]">{row.province}</td>
                  <td className="px-2 py-2 text-[11px]">{row.patients}</td>
                  <td className="px-2 py-2 text-[11px]">{row.injections}</td>
                  <td className="px-2 py-2 text-[11px]">{row.treatments}</td>
                  <td className="px-2 py-2 text-[11px]">{row.visits}</td>
                  <td className="px-2 py-2 text-[11px]">{row.stockOnHand}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>

      {provinces.length > 0 ? (
        <article className="panel overflow-x-auto p-3">
          <h2 className="text-[12px] font-semibold text-ink">Province comparison</h2>
          <div className="mt-2 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={provinces} {...CHART_BAR_PROPS}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis dataKey="province" stroke={c.tick} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={c.tick} fontSize={10} width={32} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="patients" fill="#2F6FED" name="Patients" />
                <Bar dataKey="injections" fill="#22C55E" name="Injections" />
                <Bar dataKey="treatments" fill="#F59E0B" name="Treatments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="inner-table mt-3 w-full min-w-[720px] text-left">
            <thead className="text-[10px] uppercase text-faint">
              <tr>
                {["Province", "Patients", "Active", "Centers", "Injections", "Treatments", "Stock"].map((h) => (
                  <th key={h} className="px-2 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {provinces.map((row) => (
                <tr key={row.province}>
                  <td className="px-2 py-2 text-[11px] font-medium">{row.province}</td>
                  <td className="px-2 py-2 text-[11px]">{row.patients}</td>
                  <td className="px-2 py-2 text-[11px]">{row.activePatients}</td>
                  <td className="px-2 py-2 text-[11px]">{row.hospitals}</td>
                  <td className="px-2 py-2 text-[11px]">{row.injections}</td>
                  <td className="px-2 py-2 text-[11px]">{row.treatments ?? 0}</td>
                  <td className="px-2 py-2 text-[11px]">{row.stockUnits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="panel overflow-x-auto p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-semibold text-ink">Activity / system logs</h2>
            <button
              type="button"
              className="text-[10px] font-semibold text-brand"
              onClick={() =>
                downloadCsv(
                  stampFilename("activity-logs"),
                  ["When", "Actor", "Module", "Action", "Detail", "IP"],
                  activity.map((row) => [row.createdAt, row.actor, row.module, row.action, row.detail, row.ip || ""]),
                )
              }
            >
              Export log
            </button>
          </div>
          <PaginatedScroll
            showing={activityPage.showing}
            total={activityPage.total}
            hasMore={activityPage.hasMore}
            onLoadMore={activityPage.loadMore}
            label="entries"
            className="admin-panel-scroll--15 mt-2"
          >
            <ul className="divide-y divide-line-subtle">
              {activityPage.visible.map((row) => (
                <li key={row.id} className="py-2 text-[11px]">
                  <p className="font-medium text-ink">{row.action}</p>
                  <p className="text-[10px] text-muted">
                    {row.actor} · {row.module} · {row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}
                    {row.ip ? ` · ${row.ip}` : ""}
                  </p>
                  {row.detail ? <p className="text-[10px] text-faint">{row.detail}</p> : null}
                </li>
              ))}
              {activity.length === 0 ? <li className="py-4 text-[11px] text-muted">No activity in this scope.</li> : null}
            </ul>
          </PaginatedScroll>
        </article>
        <article className="panel overflow-x-auto p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-semibold text-ink">Admin / login tracking</h2>
            <button
              type="button"
              className="text-[10px] font-semibold text-brand"
              onClick={() =>
                downloadCsv(
                  stampFilename("login-tracking"),
                  ["Name", "Username", "Role", "Last login", "Active"],
                  loginTracking.map((row) => [row.name, row.username, row.role, row.lastLogin, row.active ? "Yes" : "No"]),
                )
              }
            >
              Export logins
            </button>
          </div>
          <PaginatedScroll
            showing={loginPage.showing}
            total={loginPage.total}
            hasMore={loginPage.hasMore}
            onLoadMore={loginPage.loadMore}
            label="logins"
            className="admin-panel-scroll--15 mt-2"
          >
            <table className="inner-table w-full text-left">
              <thead className="sticky top-0 bg-card text-[10px] uppercase text-faint">
                <tr>
                  {["Admin", "Role", "Last login", "Active"].map((h) => (
                    <th key={h} className="px-2 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loginTracking.length === 0 ? (
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
                      <td className="px-2 py-2 text-[10px]">{row.lastLogin ? new Date(row.lastLogin).toLocaleString() : "Never"}</td>
                      <td className="px-2 py-2 text-[11px]">{row.active ? "Yes" : "No"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </PaginatedScroll>
        </article>
      </div>

      <article className="panel overflow-x-auto p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-semibold text-ink">Device / lock tracking</h2>
          <button
            type="button"
            className="text-[10px] font-semibold text-brand"
            onClick={() =>
              downloadCsv(
                stampFilename("device-locks"),
                ["Identifier", "User", "Failed attempts", "Locked"],
                devices.map((row) => [row.identifier, row.user, row.failedAttempts, row.locked ? "Yes" : "No"]),
              )
            }
          >
            Export devices
          </button>
        </div>
        <PaginatedScroll
          showing={devicePage.showing}
          total={devicePage.total}
          hasMore={devicePage.hasMore}
          onLoadMore={devicePage.loadMore}
          label="devices"
          className="admin-panel-scroll--15 mt-2"
        >
          <table className="inner-table w-full text-left">
            <thead className="sticky top-0 bg-card text-[10px] uppercase text-faint">
              <tr>
                {["Identifier", "User", "Failed tries", "Locked"].map((h) => (
                  <th key={h} className="px-2 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-[11px] text-muted">
                    No device lock events in this scope.
                  </td>
                </tr>
              ) : (
                devicePage.visible.map((row, index) => (
                  <tr key={`${row.identifier}-${index}`}>
                    <td className="px-2 py-2 text-[11px]">{row.identifier}</td>
                    <td className="px-2 py-2 text-[11px]">{row.user || "—"}</td>
                    <td className="px-2 py-2 text-[11px]">{row.failedAttempts}</td>
                    <td className="px-2 py-2 text-[11px]">{row.locked ? "Locked" : "Open"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </PaginatedScroll>
      </article>
      </>
      )}
      </div>
    </div>
  );
}

function MixChart({
  title,
  data,
  colors,
}: {
  title: string;
  data: MixRow[];
  colors: string[];
}) {
  return (
    <article className="panel p-3">
      <h2 className="text-[12px] font-semibold text-ink">{title}</h2>
      {data.length === 0 ? (
        <p className="mt-6 text-center text-[11px] text-muted">No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
              {data.map((_, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </article>
  );
}
