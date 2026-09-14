"use client";

import { useEffect, useState } from "react";
import { FileBarChart } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";

const kpiTone = {
  blue: "bg-blue-500/10 text-blue-500",
  green: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  purple: "bg-violet-500/10 text-violet-500",
};

export default function ReportsModule() {
  const { user, can } = useAuth();
  const [totals, setTotals] = useState({ patients: 0, hospitals: 0, injections: 0, treatments: 0, activePatients: 0 });

  useEffect(() => {
    void apiFetch("/reports/")
      .then((data) => setTotals(data.totals ?? { patients: 0, hospitals: 0, injections: 0, treatments: 0, activePatients: 0 }))
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

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h1 className="text-[15px] font-semibold text-ink">Reports & Analytics</h1>
        <p className="text-[11px] text-muted">Home &gt; Reports & Analytics — scoped to {scopeLabel.toLowerCase()}</p>
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
        <article className="panel p-6 text-center">
          <h2 className="text-[13px] font-semibold text-ink">Advanced analytics coming soon</h2>
          <p className="mx-auto mt-2 max-w-lg text-[12px] leading-5 text-muted">
            Province comparison charts, factor mix trends, and saved report packs will populate from live data once
            enough records exist. Totals above reflect your current database.
          </p>
        </article>
      ) : (
        <article className="panel p-3 text-[11px] text-muted">
          These totals are limited to {scopeLabel}. National comparison charts are Super Admin only.
        </article>
      )}
    </div>
  );
}
