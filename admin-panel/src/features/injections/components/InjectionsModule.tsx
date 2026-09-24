"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarRange,
  ChevronDown,
  Download,
  Eye,
  Plus,
  Search,
  Syringe,
  UserRound,
  X,
} from "lucide-react";
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

import {
  fetchInjections,
  fetchPatientInjections,
  statusClass,
  updateInjection,
  type ApiInjection,
  type InjectionStatus,
} from "@/features/injections/api";
import LogInjectionDialog from "@/features/injections/components/LogInjectionDialog";
import { useShortcutAction } from "@/hooks/useShortcutAction";
import { ActionsMenu, copyText } from "@/components/ui/ActionsMenu";
import { InjectionsSummarySkeleton, TableBodySkeleton } from "@/components/ui/Skeleton";
import { formatNumber } from "@/lib/format";
import { downloadCsv, stampFilename } from "@/lib/exportCsv";
import { CHART_BAR_PROPS, useChartColors } from "@/lib/chartColors";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";

const types: Array<string | "All"> = ["All", "Prophylaxis", "On-demand", "Emergency", "ITI", "Surgery", "Trauma", "Other"];
const statuses: Array<InjectionStatus | "All"> = ["All", "Completed", "Scheduled", "Pending", "Cancelled"];

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, "0");
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

function monthLabel(from: string) {
  const basis = from ? new Date(`${from}T12:00:00`) : new Date();
  return basis.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function typeClass(type: string) {
  if (type === "Emergency") return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
  if (type === "On-demand") return "bg-status-amber-soft text-status-amber";
  return "bg-status-green-soft text-status-green";
}

export default function InjectionsModule() {
  const searchParams = useSearchParams();
  const c = useChartColors();
  const { can } = useAuth();
  const canAdd = can(Perm.injectionsAdd);
  const canUpdate = can(Perm.injectionsUpdate);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | "All">("All");
  const [status, setStatus] = useState<InjectionStatus | "All">("All");
  const [openType, setOpenType] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [selected, setSelected] = useState<ApiInjection | null>(null);
  const [rows, setRows] = useState<ApiInjection[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [relatedInjections, setRelatedInjections] = useState<ApiInjection[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState("");
  const [from, setFrom] = useState(() => monthBounds(currentMonthKey()).from);
  const [to, setTo] = useState(() => monthBounds(currentMonthKey()).to);
  const [openMonth, setOpenMonth] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInjections({
        status: status === "All" ? undefined : status,
        indication: type === "All" ? undefined : type,
        from: from || undefined,
        to: to || undefined,
        limit: 25,
      });
      setRows(data.injections ?? []);
      setNextCursor(data.nextCursor ?? null);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, type, from, to]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchInjections({
        status: status === "All" ? undefined : status,
        indication: type === "All" ? undefined : type,
        from: from || undefined,
        to: to || undefined,
        cursor: nextCursor,
        limit: 25,
      });
      setRows((current) => [...current, ...(data.injections ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  useShortcutAction("page-refresh", () => {
    void load();
  });

  useEffect(() => {
    if (searchParams.get("openLog") === "1" && canAdd) {
      setShowLog(true);
    }
  }, [searchParams, canAdd]);

  useEffect(() => {
    if (!openMonth) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Element;
      if (openMonth && !target.closest("[data-month-picker]")) setOpenMonth(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openMonth]);

  const loadRelated = useCallback(async (patientId: string) => {
    setRelatedLoading(true);
    setRelatedError("");
    try {
      const data = await fetchPatientInjections(patientId);
      setRelatedInjections(data.injections ?? []);
    } catch (err) {
      setRelatedInjections([]);
      setRelatedError(err instanceof Error ? err.message : "Could not load related injections");
    } finally {
      setRelatedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selected?.patientId) {
      setRelatedInjections([]);
      setRelatedError("");
      return;
    }
    void loadRelated(selected.patientId);
  }, [selected?.patientId, loadRelated]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.displayCode.toLowerCase().includes(q) ||
        row.patientName.toLowerCase().includes(q) ||
        row.patientId.toLowerCase().includes(q) ||
        row.factorType.toLowerCase().includes(q),
    );
  }, [query, rows]);

  const liveStats = useMemo(() => {
    const now = new Date();
    const thisMonth = rows.filter((row) => {
      const d = new Date(row.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return {
      total: rows.length,
      thisMonth,
      prophylaxis: rows.filter((r) => r.indication === "Prophylaxis").length,
      onDemand: rows.filter((r) => r.indication === "On-demand").length,
      emergency: rows.filter((r) => r.indication === "Emergency").length,
      scheduled: rows.filter((r) => r.status === "Scheduled").length,
    };
  }, [rows]);

  const monthlyMix = useMemo(() => {
    const buckets = new Map<string, { month: string; prophylaxis: number; onDemand: number; emergency: number }>();
    for (const row of rows) {
      const d = new Date(row.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = d.toLocaleString("en-US", { month: "short" });
      const cur = buckets.get(key) ?? { month: key, prophylaxis: 0, onDemand: 0, emergency: 0 };
      if (row.indication === "Prophylaxis") cur.prophylaxis += 1;
      else if (row.indication === "On-demand") cur.onDemand += 1;
      else if (row.indication === "Emergency") cur.emergency += 1;
      buckets.set(key, cur);
    }
    return Array.from(buckets.values());
  }, [rows]);

  const factorMix = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const key = row.factorType || "Other";
      counts[key] = (counts[key] || 0) + 1;
    }
    const colors = ["#2F6FED", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"];
    return Object.entries(counts).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  }, [rows]);

  async function changeStatus(row: ApiInjection, next: InjectionStatus) {
    await updateInjection(row.id, { status: next });
    void load();
    if (selected?.patientId === row.patientId) void loadRelated(row.patientId);
  }

  const patient = selected
    ? {
        id: selected.patientId,
        name: selected.patientName,
        province: "—",
        center: selected.hospitalName,
        bloodGroup: "—",
        age: 0,
        lastVisit: selected.date,
        status: "Active" as const,
      }
    : null;

  return (
    <div className="admin-page">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Treatment & Injection</h1>
          <p className="text-[11px] text-muted">Home &gt; Treatment & Injection</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" data-month-picker>
            <button
              type="button"
              className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted shadow-none"
              onClick={() => setOpenMonth((value) => !value)}
            >
              <CalendarRange className="size-3.5" />
              {from ? monthLabel(from) : "All time"}
            </button>
            {openMonth ? (
              <div className="absolute right-0 z-30 mt-1 w-52 panel p-2.5 shadow-lg">
                <p className="mb-1.5 text-[10px] font-medium text-muted">Filter by month</p>
                <input
                  type="month"
                  value={from ? from.slice(0, 7) : currentMonthKey()}
                  onChange={(e) => {
                    const bounds = monthBounds(e.target.value);
                    setFrom(bounds.from);
                    setTo(bounds.to);
                    setOpenMonth(false);
                  }}
                  className="w-full rounded border border-line-subtle bg-elevated px-2 py-1.5 text-[11px] text-ink"
                />
                <button
                  type="button"
                  className="mt-2 w-full rounded px-2 py-1.5 text-left text-[11px] text-muted hover:bg-elevated"
                  onClick={() => {
                    setFrom("");
                    setTo("");
                    setOpenMonth(false);
                  }}
                >
                  All time
                </button>
              </div>
            ) : null}
          </div>
          {canAdd ? (
            <button
              type="button"
              data-shortcut-target="page-new injections-log"
              onClick={() => setShowLog(true)}
              className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
            >
              <Plus className="size-3.5" />
              Log Injection
            </button>
          ) : (
            <span className="text-[11px] text-muted">Province monitoring — add injections is hospital/super only</span>
          )}
        </div>
      </div>

      <div className="admin-page-summary admin-page-summary--natural">
      {loading ? (
        <InjectionsSummarySkeleton />
      ) : (
      <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Total logged", formatNumber(liveStats.total)],
          ["This month", String(liveStats.thisMonth)],
          ["Prophylaxis", String(liveStats.prophylaxis)],
          ["On-demand", String(liveStats.onDemand)],
          ["Emergency", String(liveStats.emergency)],
          ["Scheduled", String(liveStats.scheduled)],
        ].map(([label, value]) => (
          <article key={label} className="panel p-2.5">
            <p className="text-[10px] text-muted">{label}</p>
            <p className="mt-0.5 text-[15px] font-semibold text-ink">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-2 lg:grid-cols-[1.4fr_0.8fr]">
        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Monthly mix by treatment type</h2>
          <ResponsiveContainer width="100%" height={188} className="mt-2">
            <BarChart data={monthlyMix} {...CHART_BAR_PROPS}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="month" stroke={c.tick} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={c.tick} fontSize={10} width={28} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: c.tooltipBg,
                  border: `1px solid ${c.tooltipBorder}`,
                  borderRadius: 4,
                  fontSize: 11,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="prophylaxis" name="Prophylaxis" stackId="a" fill="#2F6FED" radius={[0, 0, 0, 0]} />
              <Bar dataKey="onDemand" name="On-demand" stackId="a" fill="#F59E0B" />
              <Bar dataKey="emergency" name="Emergency" stackId="a" fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Factor usage</h2>
          <div className="mt-2 flex items-center gap-3">
            <ResponsiveContainer width="46%" height={140}>
              <PieChart>
                <Pie data={factorMix} dataKey="value" innerRadius={34} outerRadius={56} paddingAngle={2} stroke="none">
                  {factorMix.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex flex-1 flex-col gap-1.5 text-[10px]">
              {factorMix.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="size-2 rounded-full" style={{ background: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-semibold text-ink">{formatNumber(item.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>

      {selected && patient ? (
        <article className="panel p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-md bg-brand-soft text-brand">
                <UserRound className="size-4" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-ink">{patient.name}</p>
                <p className="text-[11px] text-brand">{patient.id}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  patient.status === "Active"
                    ? "bg-status-green-soft text-status-green"
                    : "bg-status-amber-soft text-status-amber"
                }`}
              >
                {patient.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/patients/${patient.id}`}
                className="panel px-2.5 py-1 text-[11px] font-medium text-brand shadow-none"
              >
                Open full profile
              </Link>
              <button
                type="button"
                className="panel p-1.5 text-muted shadow-none"
                aria-label="Close patient detail"
                onClick={() => setSelected(null)}
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Age / Blood", patient.age ? `${patient.age} yrs · ${patient.bloodGroup}` : patient.bloodGroup],
              ["Province", patient.province],
              ["Usual center", patient.center],
              ["Last visit", patient.lastVisit],
            ].map(([label, value]) => (
              <div key={label} className="panel-inset px-2.5 py-2 shadow-none">
                <p className="text-[10px] text-muted">{label}</p>
                <p className="mt-0.5 text-[12px] font-medium text-ink">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-md border border-line-subtle px-3 py-2.5">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-ink">
              <Syringe className="size-3.5 text-brand" />
              Selected injection · {selected.displayCode}
            </div>
            <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-[11px]">
              {[
                ["Factor / Dose", `${selected.factorType} · ${selected.dose} ${selected.unit}`],
                ["Type", selected.indication],
                ["When", `${selected.date} · ${selected.time}`],
                ["Given by", selected.administeredBy],
                ["Status", selected.status],
                ["Center", selected.hospitalName],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 sm:block">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            {selected.notes ? (
              <p className="mt-2 rounded bg-elevated px-2 py-1.5 text-[10px] text-muted">{selected.notes}</p>
            ) : null}
          </div>

          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-ink">Related injection records for this patient</p>
              <span className="text-[10px] text-muted">
                {relatedLoading ? "Loading…" : `${relatedInjections.length} record${relatedInjections.length === 1 ? "" : "s"}`}
              </span>
            </div>
            {relatedError ? <p className="mb-2 text-[11px] text-red-600">{relatedError}</p> : null}
            <div className="overflow-x-auto rounded-md border border-line-subtle">
              <table className="inner-table w-full min-w-[720px] text-left text-sm">
                <thead className="bg-elevated text-[10px] uppercase text-muted">
                  <tr>
                    {["Injection ID", "Factor / Dose", "Type", "When", "Status", "Center"].map((h) => (
                      <th key={h} className="px-2.5 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {relatedLoading ? (
                    <tr>
                      <td colSpan={6} className="px-2.5 py-4 text-center text-[11px] text-muted">
                        Loading related records…
                      </td>
                    </tr>
                  ) : relatedInjections.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-2.5 py-4 text-center text-[11px] text-muted">
                        No other injection records for this patient yet.
                      </td>
                    </tr>
                  ) : (
                    relatedInjections.map((row) => (
                      <tr
                        key={row.id}
                        className={`cursor-pointer hover:bg-elevated/70 ${
                          selected.id === row.id ? "bg-brand-soft/60" : ""
                        }`}
                        onClick={() => setSelected(row)}
                      >
                        <td className="px-2.5 py-2 text-[11px] font-medium text-brand">{row.displayCode}</td>
                        <td className="px-2.5 py-2 text-[11px] text-ink">
                          {row.factorType} · {row.dose} {row.unit}
                        </td>
                        <td className="px-2.5 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeClass(row.indication)}`}>
                            {row.indication}
                          </span>
                        </td>
                        <td className="px-2.5 py-2 text-[11px] text-muted">
                          {row.date}
                          <span className="block text-[10px]">{row.time}</span>
                        </td>
                        <td className="px-2.5 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-2.5 py-2 text-[11px] text-muted">{row.hospitalName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      ) : null}
      </>
      )}
      </div>

      <div className="filter-bar admin-filter-sticky">
            <label className="panel-inset flex h-8 min-w-[180px] flex-1 items-center gap-2 px-2.5 shadow-none">
              <Search className="size-3.5 text-faint" />
              <input
                data-shortcut-target="page-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
                placeholder="Search ID, patient, factor..."
              />
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenType((v) => !v);
                  setOpenStatus(false);
                }}
                className="panel flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
              >
                {type === "All" ? "All types" : type}
                <ChevronDown className="size-3.5" />
              </button>
              {openType ? (
                <div className="absolute z-20 mt-1 w-40 overflow-hidden panel shadow-lg">
                  {types.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`block w-full px-3 py-2 text-left text-[11px] hover:bg-brand-soft ${
                        type === item ? "bg-brand text-white hover:bg-brand" : ""
                      }`}
                      onClick={() => {
                        setType(item);
                        setOpenType(false);
                      }}
                    >
                      {item === "All" ? "All types" : item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenStatus((v) => !v);
                  setOpenType(false);
                }}
                className="panel flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
              >
                {status === "All" ? "All status" : status}
                <ChevronDown className="size-3.5" />
              </button>
              {openStatus ? (
                <div className="absolute z-20 mt-1 w-36 overflow-hidden panel shadow-lg">
                  {statuses.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`block w-full px-3 py-2 text-left text-[11px] hover:bg-brand-soft ${
                        status === item ? "bg-brand text-white hover:bg-brand" : ""
                      }`}
                      onClick={() => {
                        setStatus(item);
                        setOpenStatus(false);
                      }}
                    >
                      {item === "All" ? "All status" : item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {type !== "All" || status !== "All" ? (
              <button
                type="button"
                className="flex items-center gap-1 text-[10px] text-muted"
                onClick={() => {
                  setType("All");
                  setStatus("All");
                }}
              >
                <X className="size-3" /> Clear
              </button>
            ) : null}
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]" />
            <button
              type="button"
              className="panel ml-auto flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
              data-shortcut-target="page-export"
              onClick={() =>
                downloadCsv(
                  stampFilename("injections"),
                  ["ID", "Patient", "Factor", "Dose", "Type", "Status", "When", "Center"],
                  filtered.map((row) => [
                    row.displayCode || row.id,
                    `${row.patientId} ${row.patientName}`,
                    row.factorMedicineName,
                    `${row.dose} ${row.unit}`,
                    row.indication,
                    row.status,
                    row.administeredAt,
                    row.hospitalName,
                  ]),
                )
              }
            >
              <Download className="size-3.5" />
              Export
            </button>
      </div>

      <section className="panel overflow-x-auto">
            <table className="data-table w-full min-w-[920px] text-left text-sm">
              <thead className="bg-elevated text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  {["Injection ID", "Patient", "Factor / Dose", "Type", "When", "Status", ""].map((h) => (
                    <th key={h || "a"} className="px-3 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableBodySkeleton rows={10} columns={7} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-[11px] text-muted">
                      {canAdd
                        ? "No injections yet. Click Log Injection and enter a patient HEM-ID."
                        : "No injections in your scope yet."}
                    </td>
                  </tr>
                ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={`cursor-pointer hover:bg-elevated/70 dark:hover:bg-white/[0.03] ${
                      selected?.id === row.id ? "bg-brand-soft/60" : ""
                    }`}
                    onClick={() => setSelected((cur) => (cur?.id === row.id ? null : row))}
                  >
                    <td className="px-3 py-3 font-medium text-brand">{row.displayCode}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-ink">{row.patientName}</p>
                      <p className="text-[10px] text-muted">{row.patientId}</p>
                    </td>
                    <td className="px-3 py-3 text-ink">
                      {row.factorType} · {row.dose} {row.unit}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${typeClass(row.indication)}`}>
                        {row.indication}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {row.date}
                      <span className="block text-[10px]">{row.time}</span>
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      {canUpdate ? (
                        <select
                          value={row.status}
                          onChange={(e) => void changeStatus(row, e.target.value as InjectionStatus)}
                          className={`rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold outline-none ${statusClass(row.status)}`}
                        >
                          {statuses.filter((s) => s !== "All").map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 text-muted">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-brand hover:bg-brand-soft"
                          aria-label={`View ${row.displayCode}`}
                          onClick={() => setSelected(row)}
                        >
                          <Eye className="size-[15px]" />
                        </button>
                        <ActionsMenu
                          ariaLabel={`More actions for ${row.displayCode}`}
                          items={[
                            {
                              label: "View details",
                              onClick: () => setSelected(row),
                            },
                            {
                              label: "Open patient profile",
                              href: `/dashboard/patients/${row.patientId}`,
                            },
                            {
                              label: "Copy injection ID",
                              onClick: () => void copyText(row.displayCode || String(row.id)),
                            },
                            {
                              label: "Export row",
                              onClick: () =>
                                downloadCsv(
                                  stampFilename(`injection-${row.displayCode || row.id}`),
                                  ["Field", "Value"],
                                  [
                                    ["ID", row.displayCode || String(row.id)],
                                    ["Patient", `${row.patientId} ${row.patientName}`],
                                    ["Factor", row.factorMedicineName],
                                    ["Dose", `${row.dose} ${row.unit}`],
                                    ["Type", row.indication],
                                    ["Status", row.status],
                                    ["When", row.administeredAt],
                                    ["Center", row.hospitalName],
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
            {nextCursor ? (
              <div className="flex justify-end px-3 py-2">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="rounded border border-line px-2 py-1 text-[11px] font-semibold text-brand disabled:opacity-60"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            ) : null}
        </section>
      {showLog ? (
        <LogInjectionDialog
          onClose={() => setShowLog(false)}
          onSaved={() => {
            setShowLog(false);
            void load();
            if (selected?.patientId) void loadRelated(selected.patientId);
          }}
        />
      ) : null}
    </div>
  );
}
