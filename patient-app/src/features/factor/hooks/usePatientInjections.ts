import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/core/auth/AuthContext";
import { patientApi } from "@/core/api";

import type { PatientInjection } from "@/features/home/hooks/usePatientClinicalStats";

function parseDose(value: string | number) {
  const n = parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function usePatientInjections() {
  const { token } = useAuth();
  const [injections, setInjections] = useState<PatientInjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setInjections([]);
      setLoading(false);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await patientApi("/me/patient/injections/", { token });
      const rows = Array.isArray(data.injections) ? data.injections : [];
      setInjections(
        [...rows].sort((a, b) => new Date(b.administeredAt).getTime() - new Date(a.administeredAt).getTime()),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load injections");
      setInjections([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalIu = injections.reduce((sum, row) => sum + parseDose(row.dose), 0);

  return { injections, loading, error, totalIu, refresh: load };
}
