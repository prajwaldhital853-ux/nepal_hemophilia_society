"use client";

import { useEffect, useState } from "react";
import {
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

import { centerStatus, injectionTrend } from "@/features/dashboard/data/mockDashboard";
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

export function InjectionOverviewChart() {
  const c = useChartColors();
  const [data, setData] = useState(injectionTrend.map((row) => ({ ...row, injections: 0, treatments: 0 })));

  useEffect(() => {
    const timer = window.setTimeout(() => setData(injectionTrend), 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="day" stroke={c.tick} fontSize={10} tickLine={false} axisLine={false} />
        <YAxis
          stroke={c.tick}
          fontSize={10}
          width={28}
          tickLine={false}
          axisLine={false}
          domain={[0, 80]}
          ticks={[0, 20, 40, 60, 80]}
        />
        <Tooltip
          contentStyle={{
            background: c.tooltipBg,
            border: `1px solid ${c.tooltipBorder}`,
            borderRadius: 4,
            fontSize: 12,
            color: c.tick,
          }}
        />
        <Line
          type="monotone"
          dataKey="injections"
          name="Injections"
          stroke="#2F6FED"
          strokeWidth={2}
          dot={{ r: 3, fill: c.dotFill, stroke: "#2F6FED", strokeWidth: 2 }}
          activeDot={{ r: 4, fill: c.dotFill, stroke: "#2F6FED", strokeWidth: 2 }}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
        />
        <Line
          type="monotone"
          dataKey="treatments"
          name="Treatments"
          stroke="#22C55E"
          strokeWidth={2}
          dot={{ r: 3, fill: c.dotFill, stroke: "#22C55E", strokeWidth: 2 }}
          activeDot={{ r: 4, fill: c.dotFill, stroke: "#22C55E", strokeWidth: 2 }}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CenterStatusChart() {
  const [data, setData] = useState(centerStatus.map((row) => ({ ...row, value: 0 })));

  useEffect(() => {
    const timer = window.setTimeout(() => setData(centerStatus), 80);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center gap-4">
      <div className="relative mx-auto h-[132px] w-[132px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={38}
              outerRadius={56}
              paddingAngle={2}
              stroke="none"
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            >
              {centerStatus.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[9px] text-muted">Total</p>
          <p className="text-[13px] font-semibold text-ink">28</p>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-[10px]">
        {centerStatus.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="text-muted">
              {item.name} ({item.value}, {((item.value / 28) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
