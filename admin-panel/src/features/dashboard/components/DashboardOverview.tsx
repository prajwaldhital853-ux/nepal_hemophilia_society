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

import { CenterStatusChart, InjectionOverviewChart } from "@/features/dashboard/components/DashboardCharts";
import { NepalProvinceMap } from "@/features/dashboard/components/NepalProvinceMap";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { Perm } from "@/lib/permissions";

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
  const [provinceCounts, setProvinceCounts] = useState<Record<string, number>>({});

  const [stockQty, setStockQty] = useState<string | number | null>(null);

  useEffect(() => {
    void apiFetch("/reports/")
      .then((data) => setTotals(data.totals as ReportTotals))
      .catch(() => setTotals(null));
    void apiFetch("/patients/")
      .then((data) => {
        const patients = (data.patients ?? []) as RecentPatient[];
        setRecent(patients.slice(0, 5));
        const counts: Record<string, number> = {};
        for (const row of patients) {
          if (!row.province) continue;
          counts[row.province] = (counts[row.province] ?? 0) + 1;
        }
        setProvinceCounts(counts);
      })
      .catch(() => {
        setRecent([]);
        setProvinceCounts({});
      });
    if (user?.permissions?.includes(Perm.stockView)) {
      void apiFetch("/stock/")
        .then((data) => setStockQty(data.totalQuantity ?? 0))
        .catch(() => setStockQty(0));
    }
  }, [user?.permissions]);

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

  const totalPatientsForMap = useMemo(
    () => Object.values(provinceCounts).reduce((sum, count) => sum + count, 0),
    [provinceCounts],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">{title}</h1>
          <p className="mt-0.5 text-[10px] text-muted">Home &gt; Dashboard — counts are scoped to your role</p>
        </div>
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
                <p className="truncate text-[10px] text-muted">{stat.label}</p>
                <p className="mt-0.5 text-[15px] font-semibold leading-4 text-ink">{stat.value}</p>
                <p className="mt-0.5 truncate text-[9px] text-faint">{stat.meta}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {user?.role === "super_admin" ? (
          <article className="panel p-2.5">
            <h2 className="text-[12px] font-semibold text-ink">Patients by Province</h2>
            {totalPatientsForMap === 0 ? (
              <p className="mt-4 text-[11px] text-muted">No registered patients yet. Counts will appear here once patients are added.</p>
            ) : (
              <div className="mt-2 grid items-center gap-2 lg:grid-cols-[1.2fr_0.8fr]">
                <NepalProvinceMap provinceCounts={provinceCounts} />
                <ul className="flex flex-col gap-1 text-[10px]">
                  {Object.entries(provinceCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => (
                      <li key={name} className="flex items-center justify-between gap-2">
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
          <h2 className="text-[12px] font-semibold text-ink">Treatment & Injection Overview</h2>
          {(totals?.injections ?? 0) === 0 && (totals?.treatments ?? 0) === 0 ? (
            <p className="mt-4 text-[11px] text-muted">No injection or treatment records in your scope yet.</p>
          ) : user?.role === "super_admin" ? (
            <div className="mt-2">
              <InjectionOverviewChart />
            </div>
          ) : (
            <p className="mt-4 text-[12px] text-muted">
              {totals?.injections ?? 0} injections and {totals?.treatments ?? 0} treatments in your scope.
            </p>
          )}
        </article>

        <article className="panel p-2.5">
          <h2 className="text-[12px] font-semibold text-ink">Treatment Center Status</h2>
          <div className="mt-1.5">
            {(totals?.hospitals ?? 0) === 0 ? (
              <p className="text-[11px] text-muted">No active treatment centers in scope.</p>
            ) : user?.role === "super_admin" ? (
              <CenterStatusChart activeCount={totals?.hospitals ?? 0} />
            ) : (
              <p className="text-[12px] text-muted">{totals?.hospitals ?? 0} active center(s) you can manage or view.</p>
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
            <p className="mt-4 text-[18px] font-semibold text-ink">{stockQty ?? "—"}</p>
            <p className="mt-1 text-[11px] text-muted">Units on hand in your scope. Doses given to patients decrement this automatically.</p>
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
            <p className="mt-2 text-[11px] text-muted">Recent audit events load on the Audit Logs page.</p>
          </article>
        ) : (
          <article className="panel p-3">
            <h2 className="text-[12px] font-semibold text-ink">Activity</h2>
            <p className="mt-2 text-[11px] text-muted">National audit logs are Super Admin only (plan.md §5.5).</p>
          </article>
        )}

        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Signed in as</h2>
          <p className="mt-2 text-[12px] font-semibold text-ink">{user?.fullName || user?.username}</p>
          <p className="text-[11px] text-muted">{title}</p>
        </article>

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
                    <span
                      className={`flex size-9 items-center justify-center rounded-full ${actionTone[action.tone as keyof typeof actionTone]}`}
                    >
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
