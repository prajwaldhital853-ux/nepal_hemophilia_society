import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { PatientInjection } from "@/features/home/hooks/usePatientClinicalStats";

export type FactorTab = "Overview" | "Usage History" | "Reports" | "Stock Details";
export type FactorDateRange = "all" | "30d" | "90d" | "1y" | "ytd";

type FactorFilterValue = {
  activeTab: FactorTab;
  setActiveTab: (tab: FactorTab) => void;
  dateRange: FactorDateRange;
  setDateRange: (range: FactorDateRange) => void;
  dateLabel: string;
  filterInjections: (rows: PatientInjection[]) => PatientInjection[];
};

const DATE_LABELS: Record<FactorDateRange, string> = {
  all: "All time",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "1y": "Last 12 months",
  ytd: "This year",
};

const FactorFilterContext = createContext<FactorFilterValue | null>(null);

function startForRange(range: FactorDateRange): Date | null {
  const now = new Date();
  if (range === "all") return null;
  if (range === "ytd") return new Date(now.getFullYear(), 0, 1);
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 365;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return start;
}

export function filterInjectionsByRange(rows: PatientInjection[], range: FactorDateRange) {
  const start = startForRange(range);
  if (!start) return rows;
  const cutoff = start.getTime();
  return rows.filter((row) => {
    const stamp = new Date(row.administeredAt || row.date || "").getTime();
    return Number.isFinite(stamp) && stamp >= cutoff;
  });
}

export function FactorFilterProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<FactorTab>("Overview");
  const [dateRange, setDateRange] = useState<FactorDateRange>("all");

  const value = useMemo<FactorFilterValue>(
    () => ({
      activeTab,
      setActiveTab,
      dateRange,
      setDateRange,
      dateLabel: DATE_LABELS[dateRange],
      filterInjections: (rows) => filterInjectionsByRange(rows, dateRange),
    }),
    [activeTab, dateRange],
  );

  return <FactorFilterContext.Provider value={value}>{children}</FactorFilterContext.Provider>;
}

export function useFactorFilter() {
  const ctx = useContext(FactorFilterContext);
  if (!ctx) throw new Error("useFactorFilter must be used within FactorFilterProvider");
  return ctx;
}

export function useFactorFilterOptional() {
  return useContext(FactorFilterContext);
}
