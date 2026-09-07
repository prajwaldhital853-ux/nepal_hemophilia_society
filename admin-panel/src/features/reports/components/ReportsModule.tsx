"use client";

import { useEffect, useState } from "react";
import { Download, FileBarChart, Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { factorMixTrend, injectionsByProvince, savedReports } from "@/features/reports/data/mockReports";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useChartColors } from "@/lib/chartColors";
import { Perm } from "@/lib/permissions";

const ranges = ["This month", "Last 90 days", "Year to date"];

const kpiTone = {
  blue: "bg-blue-500/10 text-blue-500",
  green: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  purple: "bg-violet-500/10 text-violet-500",
};

export default function ReportsModule() {
  const c = useChartColors();
  const { user, can } = useAuth();
  const [range, setRange] = useState("This month");
  const [insight, setInsight] = useState(0);
  const [totals, setTotals] = useState({ patients: 0, hospitals: 0, injections: 0, treatments: 0, activePatients: 0 });

  useEffect(() => {
    void apiFetch("/reports/")
      .then((data) => setTotals(data.totals ?? totals))
      .catch(() => undefined);
  }, []);

  const scopeLabel =
    user?.role === "super_admin"
      ? "National"
      : user?.role === "province_admin"
        ? `${user.provinceAdmin?.province || "Province"} only`
        : `${user?.hospitalStaff?.treatmentCenter || "Hospital"} only`;

  const liveKpis = [
    { label: "Patients", value: String(totals.patients), meta: `${totals.activePatients} active · ${scopeLabel}`, tone: "blue" as const },
    { label: "Hospitals", value: String(totals.hospitals), meta: scopeLabel, tone: "green" as const },
    { label: "Injections", value: String(totals.injections), meta: scopeLabel, tone: "amber" as const },
    { label: "Treatments", value: String(totals.treatments), meta: scopeLabel, tone: "purple" as const },
  ];

  const insights = [
    "Bagmati accounts for 31% of May injections while holding 24% of registered patients — capacity is concentrated in Kathmandu centers.",
    "Emergency bleeds stayed under 6% of total shots this month. Peak windows are 8–11 PM on weekends.",
    "Emicizumab usage rose 11% vs April. Pair this with the low-stock alert on batch EMI-2024-012.",
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Reports & Analytics</h1>
          <p className="text-[11px] text-muted">Home &gt; Reports & Analytics</p>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-elevated p-0.5">
          {ranges.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`rounded px-2.5 py-1 text-[11px] ${
                range === item ? "bg-brand font-semibold text-white" : "text-muted hover:text-ink"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {liveKpis.map((kpi) => (
          <article key={kpi.label} className="panel p-2.5">
            <span className={`inline-flex size-7 items-center justify-center rounded-md ${kpiTone[kpi.tone]}`}>
              <FileBarChart className="size-3.5" />
            </span>
            <p className="mt-2 text-[10px] text-muted">{kpi.label}</p>
            <p className="text-[16px] font-semibold text-ink">{kpi.value}</p>
            <p className="text-[10px] text-faint">{kpi.meta}</p>
          </article>
        ))}
      </div>

      {can(Perm.reportsNational) ? (
      <article className="panel flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="flex min-w-0 items-start gap-2">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
          <div>
            <p className="text-[11px] font-semibold text-ink">Pulse insight · {range}</p>
            <p className="mt-1 max-w-3xl text-[11px] leading-5 text-muted">{insights[insight]}</p>
          </div>
        </div>
        <button
          type="button"
          className="panel shrink-0 px-2.5 py-1.5 text-[11px] text-ink shadow-none"
          onClick={() => setInsight((n) => (n + 1) % insights.length)}
        >
          Next insight
        </button>
      </article>
      ) : (
        <article className="panel p-3 text-[11px] text-muted">
          These totals are limited to {scopeLabel}. National comparison charts are Super Admin only.
        </article>
      )}

      {can(Perm.reportsNational) ? (
      <div className="grid gap-2 lg:grid-cols-2">
        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Injections vs registered patients</h2>
          <ResponsiveContainer width="100%" height={210} className="mt-2">
            <BarChart
              data={injectionsByProvince.map((row) => ({
                ...row,
                patientsScaled: Math.round(row.patients / 20),
              }))}
            >
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="province" stroke={c.tick} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={c.tick} fontSize={10} width={32} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: c.tooltipBg,
                  border: `1px solid ${c.tooltipBorder}`,
                  borderRadius: 4,
                  fontSize: 11,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="injections" name="Injections" fill="#2F6FED" radius={[3, 3, 0, 0]} />
              <Bar dataKey="patientsScaled" name="Patients ÷ 20" fill="#94A3B8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Factor mix over time</h2>
          <ResponsiveContainer width="100%" height={210} className="mt-2">
            <LineChart data={factorMixTrend}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="month" stroke={c.tick} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={c.tick} fontSize={10} width={36} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: c.tooltipBg,
                  border: `1px solid ${c.tooltipBorder}`,
                  borderRadius: 4,
                  fontSize: 11,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="viii" name="Factor VIII" stroke="#2F6FED" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ix" name="Factor IX" stroke="#22C55E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="emi" name="Emicizumab" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </article>
      </div>
      ) : null}

      {can(Perm.reportsNational) ? (
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-line-subtle px-3 py-2.5">
          <h2 className="text-[12px] font-semibold text-ink">Saved report packs</h2>
          <button type="button" className="flex items-center gap-1.5 text-[11px] font-medium text-brand">
            <Download className="size-3.5" />
            Download selected
          </button>
        </div>
        <table className="data-table w-full text-left text-sm">
          <thead className="bg-elevated text-[11px] uppercase tracking-wide text-muted">
            <tr>
              {["Report", "Owner", "Updated", "Format"].map((h) => (
                <th key={h} className="px-3 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {savedReports.map((row) => (
              <tr key={row.name} className="hover:bg-elevated/70 dark:hover:bg-white/[0.03]">
                <td className="px-3 py-3 font-semibold text-ink">{row.name}</td>
                <td className="px-3 py-3 text-muted">{row.owner}</td>
                <td className="px-3 py-3 text-muted">{row.updated}</td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">{row.format}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      ) : null}
    </div>
  );
}
