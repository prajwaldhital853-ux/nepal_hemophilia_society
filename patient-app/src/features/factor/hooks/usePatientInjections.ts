import { useMemo } from "react";

import { usePatientClinicalStats } from "@/features/home/hooks/usePatientClinicalStats";
import { useFactorFilterOptional } from "@/features/factor/context/FactorFilterContext";

function parseDose(value: string | number) {
  const n = parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function usePatientInjections() {
  const { injections, loading, refresh } = usePatientClinicalStats();
  const factorFilter = useFactorFilterOptional();
  const filtered = useMemo(
    () => (factorFilter ? factorFilter.filterInjections(injections) : injections),
    [factorFilter, injections],
  );
  const totalIu = filtered.reduce((sum, row) => sum + parseDose(row.dose), 0);

  return {
    injections: filtered,
    allInjections: injections,
    loading,
    error: "",
    totalIu,
    dateLabel: factorFilter?.dateLabel ?? "All time",
    refresh,
  };
}
