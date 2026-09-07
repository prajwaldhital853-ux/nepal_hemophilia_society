"use client";

import { useTheme } from "@/lib/theme";

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
