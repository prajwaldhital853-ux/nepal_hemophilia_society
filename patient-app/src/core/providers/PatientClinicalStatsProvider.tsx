import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";

export type PatientInjection = {
  id: number;
  dose: string | number;
  unit: string;
  administeredAt: string;
  factorType?: string;
  indication?: string;
  label?: string;
  date?: string;
  hospitalName?: string;
  status?: string;
  doctorName?: string;
  administeredBy?: string;
};

export type BleedingEpisode = {
  id: number;
  episodeDate: string;
  site?: string;
  severity?: string;
  hospitalName?: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDose(value: string | number) {
  const n = parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatIu(total: number) {
  return `${total.toLocaleString()} IU`;
}

export function formatPatientDob(dob: string) {
  if (!dob) return "—";
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return dob;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const m = now.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age -= 1;
  return `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} (${age} yrs)`;
}

type ClinicalStatsValue = {
  injections: PatientInjection[];
  completedInjections: PatientInjection[];
  scheduledInjections: PatientInjection[];
  bleedingEpisodes: BleedingEpisode[];
  bleedingCount: number;
  loading: boolean;
  totalInjections: number;
  totalIu: number;
  totalIuLabel: string;
  lastInjection?: PatientInjection;
  nextScheduledInjection?: PatientInjection;
  monthlyTrends: {
    year: number;
    subtitle: string;
    currentMonthIndex: number;
    months: string[];
    values: number[];
    yMax: number;
  };
  refresh: () => Promise<void>;
  formatDob: (dob: string) => string;
};

const PatientClinicalStatsContext = createContext<ClinicalStatsValue | null>(null);

export function PatientClinicalStatsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [injections, setInjections] = useState<PatientInjection[]>([]);
  const [bleedingEpisodes, setBleedingEpisodes] = useState<BleedingEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setInjections([]);
      setBleedingEpisodes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [injData, bleedData] = await Promise.all([
        patientApi("/me/patient/injections/", { token }),
        patientApi("/me/patient/bleeding-episodes/", { token }).catch(() => ({ episodes: [] })),
      ]);
      setInjections(Array.isArray(injData.injections) ? injData.injections : []);
      setBleedingEpisodes(Array.isArray(bleedData.episodes) ? bleedData.episodes : []);
    } catch {
      setInjections([]);
      setBleedingEpisodes([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  const sorted = useMemo(
    () => [...injections].sort((a, b) => new Date(b.administeredAt).getTime() - new Date(a.administeredAt).getTime()),
    [injections],
  );

  const completedInjections = useMemo(
    () => injections.filter((row) => (row.status ?? "Completed") === "Completed"),
    [injections],
  );

  const scheduledInjections = useMemo(
    () =>
      injections
        .filter((row) => row.status === "Scheduled" || row.status === "Pending")
        .sort((a, b) => new Date(a.administeredAt).getTime() - new Date(b.administeredAt).getTime()),
    [injections],
  );

  const totalInjections = completedInjections.length;
  const totalIu = useMemo(
    () => completedInjections.reduce((sum, row) => sum + parseDose(row.dose), 0),
    [completedInjections],
  );

  const lastInjection = useMemo(
    () =>
      completedInjections.sort(
        (a, b) => new Date(b.administeredAt).getTime() - new Date(a.administeredAt).getTime(),
      )[0],
    [completedInjections],
  );

  const nextScheduledInjection = scheduledInjections[0];

  const monthlyTrends = useMemo(() => {
    const year = new Date().getFullYear();
    const values = MONTHS.map((_, index) => {
      return injections.filter((row) => {
        const d = new Date(row.administeredAt);
        return d.getFullYear() === year && d.getMonth() === index;
      }).length;
    });
    const max = Math.max(5, ...values);
    return {
      year,
      subtitle: "From your treatment records",
      currentMonthIndex: new Date().getMonth(),
      months: MONTHS,
      values,
      yMax: max <= 5 ? 5 : Math.ceil(max / 5) * 5,
    };
  }, [injections]);

  const value = useMemo<ClinicalStatsValue>(
    () => ({
      injections: sorted,
      completedInjections,
      scheduledInjections,
      bleedingEpisodes,
      bleedingCount: bleedingEpisodes.length,
      loading,
      totalInjections,
      totalIu,
      totalIuLabel: formatIu(totalIu),
      lastInjection,
      nextScheduledInjection,
      monthlyTrends,
      refresh: load,
      formatDob: formatPatientDob,
    }),
    [
      sorted,
      completedInjections,
      scheduledInjections,
      bleedingEpisodes,
      loading,
      totalInjections,
      totalIu,
      lastInjection,
      nextScheduledInjection,
      monthlyTrends,
      load,
    ],
  );

  return <PatientClinicalStatsContext.Provider value={value}>{children}</PatientClinicalStatsContext.Provider>;
}

export function usePatientClinicalStats() {
  const ctx = useContext(PatientClinicalStatsContext);
  if (!ctx) {
    throw new Error("usePatientClinicalStats must be used within PatientClinicalStatsProvider");
  }
  return ctx;
}
