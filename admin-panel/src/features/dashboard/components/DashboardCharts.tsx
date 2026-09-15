"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardTrendPoint, StockByHospital, StockUsageTrend } from "@/features/dashboard/types";
import { useTheme } from "@/lib/theme";

const CHART_HEIGHT = 168;

function useChartColors() {
  const { theme, ready } = useTheme();
  const dark = ready && theme === "dark";
  return {
    grid: dark ? "rgba(255, 255, 255, 0.04)" : "#eef1f5",
    tick: dark ? "#9aa09c" : "#5f6368",
    tooltipBg: dark ? "#1c1e1d" : "#ffffff",
    tooltipBorder: dark ? "rgba(255, 255, 255, 0.06)" : "#eef1f5",
    dotFill: dark ? "#1c1e1d" : "#ffffff",
  };
}

const EMPTY_TREND: DashboardTrendPoint[] = [
  { day: "1", label: "May 1", injections: 0, treatments: 0 },
  { day: "5", label: "May 5", injections: 0, treatments: 0 },
  { day: "9", label: "May 9", injections: 0, treatments: 0 },
  { day: "13", label: "May 13", injections: 0, treatments: 0 },
  { day: "16", label: "May 16", injections: 0, treatments: 0 },
];

export function InjectionOverviewChart({ data = [] }: { data?: DashboardTrendPoint[] }) {
  const c = useChartColors();
  const [range, setRange] = useState<"month" | "all">("month");
  const chartData = useMemo(() => {
    const rows = data.length ? data : EMPTY_TREND;
    return range === "all" ? rows : rows.slice(-16);
  }, [data, range]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="size-2 rounded-full bg-[#2F6FED]" />
            Injections
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="size-2 rounded-full bg-[#22C55E]" />
            Treatments
          </span>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as "month" | "all")}
          className="rounded-md border border-line-subtle bg-elevated px-2 py-0.5 text-[10px] text-ink"
        >
          <option value="month">This Month</option>
          <option value="all">Last 16 Days</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="label" stroke={c.tick} fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis stroke={c.tick} fontSize={10} width={32} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: c.tooltipBg,
              border: `1px solid ${c.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
              color: c.tick,
            }}
          />
          <Line
            type="monotone"
            dataKey="injections"
            name="Injections"
            stroke="#2F6FED"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: c.dotFill, stroke: "#2F6FED", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="treatments"
            name="Treatments"
            stroke="#22C55E"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: c.dotFill, stroke: "#22C55E", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StockSummaryChart({
  byHospital,
  usageTrend,
}: {
  byHospital: StockByHospital[];
  usageTrend: StockUsageTrend[];
}) {
  const c = useChartColors();
  const [view, setView] = useState<"centers" | "usage">("usage");
  const topCenters = useMemo(() => [...byHospital].sort((a, b) => b.onHand - a.onHand).slice(0, 6), [byHospital]);
  const rows = view === "centers" ? topCenters : usageTrend;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[10px]">
          {view === "centers" ? (
            <>
              <span className="flex items-center gap-1 text-muted">
                <span className="size-2 rounded-full bg-violet-500" />
                On hand
              </span>
              <span className="flex items-center gap-1 text-muted">
                <span className="size-2 rounded-full bg-orange-500" />
                Used
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 text-muted">
                <span className="size-2 rounded-full bg-emerald-500" />
                Stock in
              </span>
              <span className="flex items-center gap-1 text-muted">
                <span className="size-2 rounded-full bg-red-500" />
                Stock out
              </span>
            </>
          )}
        </div>
        <select
          value={view}
          onChange={(e) => setView(e.target.value as "centers" | "usage")}
          className="rounded-md border border-line-subtle bg-elevated px-2 py-0.5 text-[10px] text-ink"
        >
          <option value="centers">By center</option>
          <option value="usage">Monthly usage</option>
        </select>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[11px] text-muted">No stock records in your scope yet.</p>
      ) : view === "centers" ? (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={topCenters} margin={{ top: 8, right: 4, left: 0, bottom: 20 }}>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="hospitalName" stroke={c.tick} fontSize={9} tickLine={false} axisLine={false} interval={0} angle={-16} textAnchor="end" height={40} />
            <YAxis stroke={c.tick} fontSize={10} width={32} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
              formatter={(value, name) => [
                typeof value === "number" ? value.toLocaleString() : String(value ?? ""),
                name === "onHand" ? "On hand" : "Used",
              ]}
            />
            <Bar dataKey="onHand" name="On hand" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="used" name="Used" fill="#F97316" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={usageTrend} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="month" stroke={c.tick} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke={c.tick} fontSize={10} width={32} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="stockIn" name="Stock in" fill="#22C55E" radius={[3, 3, 0, 0]} />
            <Bar dataKey="stockOut" name="Stock out" fill="#EF4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function CenterStatusChart({ activeCount }: { activeCount: number }) {
  const data = [
    { name: "Active", value: Math.max(activeCount, 0), color: "#22C55E" },
    { name: "Inactive", value: 0, color: "#94A3B8" },
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="relative mx-auto h-[132px] w-[132px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={38} outerRadius={56} paddingAngle={2} stroke="none">
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[9px] text-muted">Active</p>
          <p className="text-[13px] font-semibold text-ink">{activeCount}</p>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-[10px]">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="text-muted">
              {item.name} ({item.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
