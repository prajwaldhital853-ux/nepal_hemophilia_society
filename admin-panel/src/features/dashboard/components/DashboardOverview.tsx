"use client";

import {
  Activity,
  BarChart3,
  Building2,
  CalendarRange,
  ChevronDown,
  Eye,
  FileBarChart,
  MapPin,
  Package,
  Settings,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { CenterStatusChart, InjectionOverviewChart } from "@/features/dashboard/components/DashboardCharts";
import { NepalProvinceMap } from "@/features/dashboard/components/NepalProvinceMap";
import {
  adminActivity,
  provinceStats,
  stockSummary,
  systemOverview,
} from "@/features/dashboard/data/mockDashboard";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { Perm } from "@/lib/permissions";
import { useEffect, useState } from "react";
import Link from "next/link";

const statIcons = [Users, Users, MapPin, Building2, Package];
const statWrap = {
  blue: "bg-violet-500/10 text-violet-500",
  sky: "bg-sky-500/10 text-sky-500",
  green: "bg-emerald-500/10 text-emerald-500",
  orange: "bg-orange-500/10 text-orange-500",
  purple: "bg-violet-500/10 text-violet-500",
};

const actionTone = {
  blue: "bg-blue-500/10 text-blue-500",
  sky: "bg-sky-500/10 text-sky-500",
  orange: "bg-orange-500/10 text-orange-500",
  purple: "bg-violet-500/10 text-violet-500",
  green: "bg-emerald-500/10 text-emerald-500",
  slate: "bg-elevated text-muted",
};

const actionIcons = [UserPlus, Users, Building2, Package, FileBarChart, Settings];

const activityTone = {
  green: "bg-emerald-500 text-white",
  blue: "bg-brand text-white",
};

const overviewTone = {
  blue: "bg-blue-500/10 text-blue-500",
  green: "bg-emerald-500/10 text-emerald-500",
  red: "bg-red-500/10 text-red-500",
};

const overviewIconMap = {
  "Total Users": Users,
  "Active Sessions": BarChart3,
  "Today's Visits": Eye,
  "System Uptime": Activity,
} as const;

type ReportTotals = {
  patients: number;
  hospitals: number;
  injections: number;
  treatments: number;
  activePatients: number;
};

type RecentPatient = { id: string; fullName: string; province: string; status: string; updatedAt: string };

export default function DashboardOverview() {
  const { user, can } = useAuth();
  const [totals, setTotals] = useState<ReportTotals | null>(null);
  const [recent, setRecent] = useState<RecentPatient[]>([]);

  useEffect(() => {
    void apiFetch("/reports/")
      .then((data) => setTotals(data.totals as ReportTotals))
      .catch(() => setTotals(null));
    void apiFetch("/patients/")
      .then((data) => setRecent((data.patients ?? []).slice(0, 5)))
      .catch(() => setRecent([]));
  }, []);

  const title =
    user?.role === "super_admin"
      ? "Super Admin Dashboard"
      : user?.role === "province_admin"
        ? `Province Dashboard · ${user.provinceAdmin?.province || "Province"}`
        : `Hospital Dashboard · ${user?.hospitalStaff?.treatmentCenter || "Hospital"}`;

  const scopedStats = [
    { label: "Patients in scope", value: formatNumber(totals?.patients ?? 0), meta: `${totals?.activePatients ?? 0} active`, tone: "blue" as const },
    { label: "Hospitals / centers", value: formatNumber(totals?.hospitals ?? 0), meta: user?.role === "super_admin" ? "Nationwide" : "Your scope", tone: "orange" as const },
    { label: "Injections", value: formatNumber(totals?.injections ?? 0), meta: "Logged records", tone: "sky" as const },
    { label: "Treatments", value: formatNumber(totals?.treatments ?? 0), meta: "Clinical notes", tone: "green" as const },
    {
      label: user?.role === "super_admin" ? "Provinces" : "Scope",
      value: user?.role === "super_admin" ? "7" : "1",
      meta: user?.role === "super_admin" ? "All Nepal" : user?.provinceAdmin?.province || user?.hospitalStaff?.province || "Assigned",
      tone: "purple" as const,
    },
  ];

  const actions = [
    { label: "Add New Patient", perm: Perm.patientsCreate, href: "/dashboard/patients/new", tone: "blue" },
    { label: "Province Admins", perm: Perm.provinceAdminsManage, href: "/dashboard/admins", tone: "sky" },
    { label: "Hospital Staff", perm: Perm.hospitalStaffView, href: "/dashboard/hospitals/treatment-admins", tone: "orange" },
    { label: "Log Injection", perm: Perm.injectionsAdd, href: "/dashboard/injections", tone: "purple" },
    { label: "Reports", perm: Perm.reportsHospital, href: "/dashboard/reports", tone: "green" },
    { label: "System Settings", perm: Perm.settingsSystem, href: "/dashboard/settings", tone: "slate" },
  ].filter((action) => can(action.perm));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">{title}</h1>
          <p className="mt-0.5 text-[10px] text-muted">Home &gt; Dashboard — counts are scoped to your role</p>
        </div>
        <button
          type="button"
          className="panel flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted"
        >
          <CalendarRange className="size-3" />
          May 16, 2025 - May 16, 2025
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {scopedStats.map((stat, index) => {
          const Icon = statIcons[index];
          return (
            <article key={stat.label} className="panel flex min-w-0 gap-2 p-2.5">
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${statWrap[stat.tone]}`}>
                <Icon className="size-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className="truncate text-[10px] text-muted">{stat.label}</p>
                  {stat.trend ? (
                    <span className="flex shrink-0 items-center gap-0.5 text-[9px] font-semibold text-status-green">
                      <TrendingUp className="size-2.5" />
                      {stat.meta}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[15px] font-semibold leading-4 text-ink">{stat.value}</p>
                {!stat.trend ? <p className="mt-0.5 truncate text-[9px] text-faint">{stat.meta}</p> : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {user?.role === "super_admin" ? (
        <article className="panel p-2.5">
          <h2 className="text-[12px] font-semibold text-ink">Patients by Province</h2>
          <div className="mt-2 grid items-center gap-2 lg:grid-cols-[1.2fr_0.8fr]">
            <NepalProvinceMap />
            <ul className="flex flex-col gap-1 text-[10px]">
              {provinceStats.map((province) => (
                <li key={province.name} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="size-1.5 shrink-0 rounded-sm" style={{ background: province.color }} />
                    <span className="truncate">{province.name} Province</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">
                    {formatNumber(province.count)}{" "}
                    <span className="font-normal text-faint">{province.percent}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>
        ) : (
          <article className="panel p-2.5">
            <h2 className="text-[12px] font-semibold text-ink">Your scope</h2>
            <p className="mt-2 text-[11px] text-muted">
              {user?.role === "province_admin"
                ? `Patients, hospitals, and reports are limited to ${user.provinceAdmin?.province || "your province"}. Injection entry is hospital/super only.`
                : `You can search any HEM-ID and add injections for visiting patients. Registry create/verify stays with Super and Province Admin.`}
            </p>
          </article>
        )}

        <article className="panel p-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-semibold text-ink">Recent Patients</h2>
            <Link href="/dashboard/patients" className="text-[10px] font-semibold text-brand">
              View All
            </Link>
          </div>
          <table className="inner-table mt-2 w-full text-left text-[10px]">
            <thead className="text-[9px] uppercase text-faint">
              <tr>
                {["Patient ID", "Patient Name", "Province", "Date", "Status"].map((h) => (
                  <th key={h} className="pb-1 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-muted">
                    No patients in your scope yet.
                  </td>
                </tr>
              ) : (
                recent.map((row) => (
                  <tr key={row.id}>
                    <td className="py-1.5 font-medium text-brand">{row.id}</td>
                    <td className="font-medium">{row.fullName}</td>
                    <td>{row.province}</td>
                    <td className="text-muted">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "—"}</td>
                    <td className={row.status === "Active" ? "font-semibold text-status-green" : "font-semibold text-status-amber"}>
                      {row.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        <article className="panel p-2.5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[12px] font-semibold text-ink">Treatment & Injection Overview</h2>
            <button type="button" className="panel-inset flex items-center gap-1 px-1.5 py-0.5 text-[9px] text-muted">
              This Month
              <ChevronDown className="size-2.5" />
            </button>
          </div>
          <div className="mb-1 flex gap-3 text-[9px] text-muted">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-brand" /> Injections
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Treatments
            </span>
          </div>
          {user?.role === "super_admin" ? (
            <InjectionOverviewChart />
          ) : (
            <p className="mt-4 text-[12px] text-muted">
              {totals?.injections ?? 0} injections and {totals?.treatments ?? 0} treatments in your scope.
            </p>
          )}
        </article>

        <article className="panel p-2.5">
          <h2 className="text-[12px] font-semibold text-ink">Treatment Center Status</h2>
          <div className="mt-1.5">
            {user?.role === "super_admin" ? (
              <CenterStatusChart />
            ) : (
              <p className="text-[12px] text-muted">{totals?.hospitals ?? 0} active center(s) you can manage or view.</p>
            )}
          </div>
        </article>

        {can(Perm.stockView) ? (
        <article className="panel p-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-semibold text-ink">Stock Summary</h2>
            <button type="button" className="text-[10px] font-semibold text-brand">
              View All
            </button>
          </div>
          <table className="inner-table mt-2 w-full text-left text-[10px]">
            <thead className="text-[9px] uppercase text-faint">
              <tr>
                <th className="pb-1">Item Name</th>
                <th className="pb-1">Category</th>
                <th className="pb-1">Stock (Units)</th>
                <th className="pb-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {stockSummary.map((row) => (
                <tr key={row.name}>
                  <td className="py-1 font-medium">{row.name}</td>
                  <td className="text-muted">{row.category}</td>
                  <td>{row.units}</td>
                  <td className={row.status === "Low Stock" ? "font-semibold text-status-amber" : "font-semibold text-status-green"}>
                    {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
        ) : null}
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        {can(Perm.auditView) ? (
        <article className="panel p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-semibold text-ink">Admin Activity</h2>
            <Link href="/dashboard/audit" className="text-[10px] font-semibold text-brand">
              View All
            </Link>
          </div>
          <ul className="mt-2 flex flex-col gap-2.5">
            {adminActivity.map((item) => (
              <li key={item.title} className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full ${activityTone[item.tone]}`}
                  >
                    <Activity className="size-3" />
                  </span>
                  <p className="text-[10px] font-medium leading-4 text-ink">{item.title}</p>
                </div>
                <span className="shrink-0 text-[9px] text-faint">{item.time}</span>
              </li>
            ))}
          </ul>
        </article>
        ) : (
          <article className="panel p-3">
            <h2 className="text-[12px] font-semibold text-ink">Activity</h2>
            <p className="mt-2 text-[11px] text-muted">National audit logs are Super Admin only (plan.md §5.5).</p>
          </article>
        )}

        {can(Perm.settingsSystem) ? (
        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">System Overview</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {systemOverview.map((item) => {
              const Icon = overviewIconMap[item.label as keyof typeof overviewIconMap] ?? Users;
              return (
                <div key={item.label} className="panel-inset flex items-start gap-2 p-2 shadow-none">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-md ${overviewTone[item.tone]}`}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] text-muted">{item.label}</p>
                    <p className="mt-0.5 text-[14px] font-semibold text-ink">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
        ) : (
          <article className="panel p-3">
            <h2 className="text-[12px] font-semibold text-ink">Signed in as</h2>
            <p className="mt-2 text-[12px] font-semibold text-ink">{user?.fullName || user?.username}</p>
            <p className="text-[11px] text-muted">{title}</p>
          </article>
        )}

        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Quick Actions</h2>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {actions.map((action, index) => {
              const Icon = actionIcons[index] ?? Activity;
              return (
                <Link key={action.label} href={action.href} className="flex flex-col items-center gap-1.5 text-center">
                  <span
                    className={`flex size-9 items-center justify-center rounded-full ${actionTone[action.tone as keyof typeof actionTone]}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-[9px] font-medium leading-3 text-muted">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </article>
      </div>

      <footer className="dashboard-footer relative text-[10px] text-faint">
        <p className="text-center">© 2025 Nepal Hemophilia Digital Management System. All rights reserved.</p>
        <p className="absolute right-0 top-3">Version 2.0.0</p>
      </footer>
    </div>
  );
}
