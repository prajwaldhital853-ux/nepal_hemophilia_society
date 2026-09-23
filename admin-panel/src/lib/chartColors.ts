"use client";

import { useTheme } from "@/lib/theme";

/** Keeps bars narrow even when the chart has only one or two categories. */
export const CHART_BAR_PROPS = {
  maxBarSize: 44,
  barCategoryGap: "32%",
} as const;

export function useChartColors() {
  const { theme, ready } = useTheme();
  const dark = ready && theme === "dark";
  return {
    grid: dark ? "rgba(255, 255, 255, 0.04)" : "#eef1f5",
    tick: dark ? "#9aa09c" : "#5f6368",
    tooltipBg: dark ? "#1c1e1d" : "#ffffff",
    tooltipBorder: dark ? "rgba(255, 255, 255, 0.06)" : "#eef1f5",
  };
}
