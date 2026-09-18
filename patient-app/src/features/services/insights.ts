import { patientApi } from "@/core/api";

export type InsightSlice = { label: string; count: number };
export type InsightGuidance = { title: string; summary: string; body?: string; slug?: string; source?: string };

export type PatientInsights = {
  generatedAt: string;
  profile: {
    hemophiliaType: string;
    severity: string;
    baselineFactorLevel: string;
    treatmentPlan: string;
    inhibitorStatus: string;
    deficientFactor: string;
    hospital: string;
    prescribedFactor: string;
  };
  status: { score: number; label: string; tone: "good" | "watch" | "alert" | string; summary: string };
  totals: {
    injections12m: number;
    bleeds12m: number;
    treatments12m: number;
    iu12m: number;
    iuUnit: string;
    bleeds30d: number;
    injections30d: number;
    daysSinceBleed: number | null;
    daysSinceInjection: number | null;
    lastBleedOn: string | null;
    lastInjectionAt: string | null;
    nextScheduledAt: string | null;
  };
  comparison: {
    thisMonth: { injections: number; bleeds: number; iu: number };
    lastMonth: { injections: number; bleeds: number; iu: number };
    thisYear: { injections: number; bleeds: number };
    lastYear: { injections: number; bleeds: number };
    injectionChangePct: number | null;
    bleedChangePct: number | null;
    iuChangePct: number | null;
    yearInjectionChangePct: number | null;
    yearBleedChangePct: number | null;
  };
  monthly: {
    labels: string[];
    keys: string[];
    injections: number[];
    bleeds: number[];
    treatments: number[];
    iu: number[];
  };
  bleedSites: InsightSlice[];
  indications: InsightSlice[];
  guidance: InsightGuidance[];
};

export async function fetchPatientInsights(token: string) {
  const data = await patientApi("/me/patient/insights/", { token });
  return data.insights as PatientInsights;
}
