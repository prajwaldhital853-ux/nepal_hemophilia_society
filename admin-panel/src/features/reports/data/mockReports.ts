export const reportKpis = [
  { label: "Injections (MTD)", value: "412", meta: "+8.4% vs April", tone: "blue" as const },
  { label: "Factor units used", value: "96,420 IU", meta: "VIII 62% · IX 28%", tone: "green" as const },
  { label: "New registrations", value: "128", meta: "7 provinces", tone: "amber" as const },
  { label: "Stock coverage", value: "41 days", meta: "Central + provincial", tone: "purple" as const },
];

export const injectionsByProvince = [
  { province: "Koshi", injections: 58, patients: 1428 },
  { province: "Madhesh", injections: 44, patients: 1256 },
  { province: "Bagmati", injections: 126, patients: 2102 },
  { province: "Gandaki", injections: 39, patients: 986 },
  { province: "Lumbini", injections: 51, patients: 1124 },
  { province: "Karnali", injections: 22, patients: 654 },
  { province: "Sudurpashchim", injections: 72, patients: 1192 },
];

export const factorMixTrend = [
  { month: "Jan", viii: 14800, ix: 6200, emi: 2100 },
  { month: "Feb", viii: 15200, ix: 6400, emi: 2300 },
  { month: "Mar", viii: 16100, ix: 7100, emi: 2500 },
  { month: "Apr", viii: 15700, ix: 6800, emi: 2400 },
  { month: "May", viii: 16420, ix: 7200, emi: 2680 },
];

export const savedReports = [
  { name: "Monthly injection summary", owner: "Super Admin", updated: "May 16, 2025", format: "PDF" },
  { name: "Province patient census", owner: "Ravi Shrestha", updated: "May 15, 2025", format: "XLSX" },
  { name: "Factor expiry watchlist", owner: "Stock Officer", updated: "May 14, 2025", format: "CSV" },
  { name: "Emergency bleed response", owner: "Clinical Lead", updated: "May 10, 2025", format: "PDF" },
];
