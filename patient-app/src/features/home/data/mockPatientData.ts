export const mockPatient = {
  name: "Manish Sapkota",
  id: "NHS-2026-00025",
  status: "Active" as const,
  dob: "20 May 2012 (12 Yrs)",
  factorType: "Factor VIII",
  location: "Kathmandu, Bagmati",
  bloodGroup: "O+",
  totalInjections: 48,
  totalIuUsed: "24,000 IU",
};

export const mockOverview = {
  totalRecords: 48,
  lastInjection: { date: "12 Aug 2025", dose: "500 IU" },
  nextInjection: { date: "26 Aug 2025", inDays: "In 14 days" },
  bleedingEpisodes: { count: 2, label: "This Year" },
  alerts: { count: 1 },
};

export const mockBleeding = {
  joints: ["Right Knee", "Left Ankle", "Elbow"],
  mostAffected: "Right Knee",
  severity: "Moderate",
  totalEpisodes: 2,
  lastBleed: "10 Aug 2025",
};

export const mockFactorStock = {
  factorName: "Factor VIII",
  status: "Available" as const,
  stockIu: "5,000 IU",
  stockPercent: 75,
  patientUsed: "24,000 IU",
};

export const mockMonthlyTrends = {
  year: 2026,
  subtitle: "Progress & Dosage Tracking",
  currentMonthIndex: 7,
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  values: [6, 8, 7, 10, 6, 11, 9, 12, 8, 7, 9, 6],
  yMax: 20,
};

export const mockQuickActions = [
  { key: "history", label: "Injection\nHistory", icon: "medical" as const, color: "#C1121F", bg: "#FEE2E2" },
  { key: "report", label: "Treatment\nReport", icon: "document-text" as const, color: "#16A34A", bg: "#DCFCE7" },
  { key: "emergency", label: "Emergency\nCard", icon: "id-card" as const, color: "#C1121F", bg: "#FEE2E2" },
  { key: "hospital", label: "Find\nHospital", icon: "business" as const, color: "#7C3AED", bg: "#EDE9FE" },
  { key: "helpline", label: "Help\nLine", icon: "call" as const, color: "#EA580C", bg: "#FFEDD5" },
];
