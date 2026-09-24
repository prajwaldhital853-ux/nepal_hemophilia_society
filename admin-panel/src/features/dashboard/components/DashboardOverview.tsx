"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  FileBarChart,
  MapPin,
  Package,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

import { DashboardPageSkeleton } from "@/components/ui/Skeleton";
import { AdminActivityFeed } from "@/features/dashboard/components/AdminActivityFeed";
import {
  CenterStatusChart,
  InjectionOverviewChart,
  StockSummaryChart,
} from "@/features/dashboard/components/DashboardCharts";
import { NepalProvinceMap } from "@/features/dashboard/components/NepalProvinceMap";
import { SystemOverviewSection } from "@/features/dashboard/components/SystemOverviewSection";
import type { DashboardData, DashboardRecentPatient, DashboardTotals } from "@/features/dashboard/types";
import { apiFetch } from "@/lib/api";
import { isNationalScope, useAuth } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { Perm } from "@/lib/permissions";

const actionTone = {
  blue: "bg-blue-500/10 text-blue-500",
  sky: "bg-sky-500/10 text-sky-500",
  orange: "bg-orange-500/10 text-orange-500",
  purple: "bg-violet-500/10 text-violet-500",
  green: "bg-emerald-500/10 text-emerald-500",
  slate: "bg-elevated text-muted",
};

const actionIcons = [UserPlus, Users, Building2, Package, FileBarChart, Settings];

type ReportTotals = DashboardTotals;
type RecentPatient = DashboardRecentPatient;

const EMPTY_DASHBOARD: DashboardData = {
  treatmentTrend: [],
  stockByHospital: [],
  stockUsageTrend: [],
  provinceStats: [],
  systemOverview: {
    totalUsers: 0,
    totalAdmins: 0,
    superAdmins: 0,
    provinceAdmins: 0,
    hospitalAdmins: 0,
    activeSessions: 0,
    todaysVisits: 0,
    totalStockUnits: 0,
    totalProvinces: 7,
    totalCenters: 0,
    totalPatients: 0,
    activePatients: 0,
  },
  recentActivity: [],
};

export default function DashboardOverview() {
  const { user, can } = useAuth();
  const [totals, setTotals] = useState<ReportTotals | null>(null);
  const [recent, setRecent] = useState<RecentPatient[]>([]);
  const [provinceCounts, setProvinceCounts] = useState<Record<string, number>>({});
  const [stockQty, setStockQty] = useState<string | number | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const tasks: Promise<void>[] = [
      apiFetch("/reports/dashboard/")
        .then((data) => {
          const dash = data as DashboardData;
          setDashboard(dash);
          setTotals(dash.totals ?? null);
          setRecent(dash.recentPatients ?? []);
          const counts: Record<string, number> = {};
          for (const row of dash.provinceStats) {
            if (!row.province || !row.patients) continue;
            counts[row.province] = row.patients;
          }
          setProvinceCounts(counts);
        })
        .catch(() => {
          setDashboard(EMPTY_DASHBOARD);
          setTotals(null);
          setRecent([]);
          setProvinceCounts({});
        }),
    ];
    if (user?.permissions?.includes(Perm.stockView)) {
      tasks.push(
        apiFetch("/stock/")
          .then((data) => setStockQty(data.totalQuantity ?? 0))
          .catch(() => setStockQty(0)),
      );
    }
    void Promise.all(tasks).finally(() => setLoading(false));
  }, [user?.permissions]);

  const title =
    user?.role === "super_admin"
      ? "Super Admin Dashboard"
      : user?.role === "admin"
        ? "Admin Dashboard"
        : user?.role === "website_manager"
          ? "Website Dashboard"
          : user?.role === "province_admin"
            ? `Province Dashboard · ${user.provinceAdmin?.province || "Province"}`
            : `Hospital Dashboard · ${user?.hospitalStaff?.treatmentCenter || "Hospital"}`;

  const overview = dashboard.systemOverview;
  const isSuper = isNationalScope(user);

  const topStats = isSuper
    ? [
        {
          label: "Total Patients",
          value: formatNumber(overview.totalPatients || totals?.patients || 0),
          meta: "Active patients across Nepal",
          icon: Users,
          tone: "bg-blue-600",
        },
        {
          label: "Total Admins",
          value: formatNumber(overview.totalAdmins),
          meta: `${overview.superAdmins || 1} Super Admin · ${overview.provinceAdmins || 7} Province Admins`,
          icon: Users,
          tone: "bg-[#2563EB]",
        },
        {
          label: "Total Provinces",
          value: formatNumber(overview.totalProvinces || 7),
          meta: "All 7 provinces covered",
          icon: MapPin,
          tone: "bg-emerald-600",
        },
        {
          label: "Total Treatment Centers",
          value: formatNumber(overview.totalCenters || totals?.hospitals || 0),
          meta: "Active treatment centers",
          icon: Building2,
          tone: "bg-orange-500",
        },
        {
          label: "Total Stock (Units)",
          value: formatNumber(Number(overview.totalStockUnits || stockQty || 0)),
          meta: "Factor & medicines in stock",
          icon: Package,
          tone: "bg-violet-600",
        },
      ]
    : [
        {
          label: "Patients in scope",
          value: formatNumber(totals?.patients ?? overview.totalPatients),
          meta: `${totals?.activePatients ?? overview.activePatients} active`,
          icon: Users,
          tone: "bg-blue-600",
        },
        {
          label: "Hospitals / centers",
          value: formatNumber(totals?.hospitals ?? overview.totalCenters),
          meta: "Your scope",
          icon: Building2,
          tone: "bg-orange-500",
        },
        {
          label: "Injections",
          value: formatNumber(totals?.injections ?? 0),
          meta: "Logged records",
          icon: Activity,
          tone: "bg-sky-600",
        },
        {
          label: "Treatments",
          value: formatNumber(totals?.treatments ?? 0),
          meta: "Clinical notes",
          icon: Activity,
          tone: "bg-emerald-600",
        },
        {
          label: "Stock (Units)",
          value: formatNumber(Number(stockQty ?? overview.totalStockUnits ?? 0)),
          meta: "On hand in scope",
          icon: Package,
          tone: "bg-violet-600",
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

  const totalPatientsForMap = useMemo(
    () => Object.values(provinceCounts).reduce((sum, count) => sum + count, 0),
    [provinceCounts],
  );

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">{title}</h1>
          <p className="mt-0.5 text-[10px] text-muted">Home &gt; Dashboard — counts are scoped to your role</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {topStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="panel flex min-w-0 items-center gap-3 p-2.5">
              <div className={`flex size-12 shrink-0 items-center justify-center rounded-full text-white ${stat.tone}`}>
                <Icon className="size-6" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] text-muted">{stat.label}</p>
                <p className="mt-0.5 text-[18px] font-bold leading-5 text-ink">{stat.value}</p>
                <p className="mt-0.5 line-clamp-2 text-[9px] text-faint">{stat.meta}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {isSuper ? (
          <article className="panel p-2.5">
            <h2 className="text-[12px] font-semibold text-ink">Patients by Province</h2>
            <p className="text-[10px] text-muted">Hover a province for patient, center, and stock details</p>
            {totalPatientsForMap === 0 && dashboard.provinceStats.length === 0 ? (
              <p className="mt-4 text-[11px] text-muted">No registered patients yet. Counts will appear here once patients are added.</p>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <NepalProvinceMap provinceCounts={provinceCounts} provinceStats={dashboard.provinceStats} />
                </div>
                <ul className="w-[118px] shrink-0 flex flex-col gap-1 text-[10px]">
                  {Object.entries(provinceCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => (
                      <li key={name} className="flex items-center justify-between gap-1">
                        <span className="truncate">{name}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-ink">
                          {formatNumber(count)}{" "}
                          <span className="font-normal text-faint">
                            {totalPatientsForMap ? `${Math.round((count / totalPatientsForMap) * 100)}%` : ""}
                          </span>
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </article>
        ) : (
          <article className="panel p-2.5">
            <h2 className="text-[12px] font-semibold text-ink">Your scope</h2>
            <p className="mt-2 text-[11px] text-muted">
              {user?.role === "province_admin"
                ? `Patients, hospitals, and reports are limited to ${user.provinceAdmin?.province || "your province"}. You can also search any patient by HEM-ID nationwide to log clinical records.`
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
          <div className="mt-2 max-h-[260px] overflow-y-auto pr-1">
          <table className="inner-table w-full text-left text-[10px]">
            <thead className="sticky top-0 bg-elevated text-[9px] uppercase text-faint">
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
          </div>
        </article>
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        <article className="panel p-2.5">
          <h2 className="text-[12px] font-semibold text-ink">Treatment & Injection Overview</h2>
          <div className="mt-2">
            <InjectionOverviewChart data={dashboard.treatmentTrend} />
          </div>
        </article>

        <article className="panel p-2.5">
          <h2 className="text-[12px] font-semibold text-ink">Treatment Center Status</h2>
          <div className="mt-1.5">
            {(totals?.hospitals ?? overview.totalCenters ?? 0) === 0 ? (
              <p className="text-[11px] text-muted">No active treatment centers in scope.</p>
            ) : (
              <CenterStatusChart activeCount={totals?.hospitals ?? overview.totalCenters ?? 0} />
            )}
          </div>
        </article>

        {can(Perm.stockView) ? (
          <article className="panel p-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[12px] font-semibold text-ink">Stock Summary</h2>
              <Link href="/dashboard/stock" className="text-[10px] font-semibold text-brand">
                View All
              </Link>
            </div>
            <p className="mt-1 text-[16px] font-semibold text-ink">{stockQty ?? overview.totalStockUnits ?? "—"}</p>
            <StockSummaryChart byHospital={dashboard.stockByHospital} usageTrend={dashboard.stockUsageTrend} />
          </article>
        ) : null}
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        {can(Perm.auditView) ? (
          <AdminActivityFeed items={dashboard.recentActivity} />
        ) : (
          <article className="panel p-3">
            <h2 className="text-[12px] font-semibold text-ink">Activity</h2>
            <p className="mt-2 text-[11px] text-muted">National audit logs are Super Admin only.</p>
          </article>
        )}

        <SystemOverviewSection overview={overview} />

        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Quick Actions</h2>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {actions.length === 0 ? (
              <p className="col-span-full text-[11px] text-muted">No quick actions available for your role.</p>
            ) : (
              actions.map((action, index) => {
                const Icon = actionIcons[index] ?? Activity;
                return (
                  <Link key={action.label} href={action.href} className="flex flex-col items-center gap-1.5 text-center">
                    <span className={`flex size-9 items-center justify-center rounded-full ${actionTone[action.tone as keyof typeof actionTone]}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="text-[9px] font-medium leading-3 text-muted">{action.label}</span>
                  </Link>
                );
              })
            )}
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
