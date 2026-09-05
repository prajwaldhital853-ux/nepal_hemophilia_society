export const factorTabs = ["Overview", "Usage History", "Reports", "Stock Details"] as const;

export const factorDateRange = "Jan 2025 - Dec 2025";

export const factorStockCards = [
  {
    id: "viii",
    name: "Factor VIII",
    subtitle: "Recombinant Factor VIII",
    status: "Available",
    currentStock: "5,000 IU",
    totalReceived: "50,000 IU",
    totalUsed: "45,000 IU",
    percent: 75,
    footerLeft: "75% Available",
    footerRight: "Needs Reorder Soon",
    footerTone: "warn" as const,
  },
  {
    id: "ix",
    name: "Factor IX",
    subtitle: "Recombinant Factor IX",
    status: "Available",
    currentStock: "3,200 IU",
    totalReceived: "16,000 IU",
    totalUsed: "12,800 IU",
    percent: 88,
    footerLeft: "88% Available",
    footerRight: "Sufficient Stock",
    footerTone: "ok" as const,
  },
];

export const usageSummary = [
  {
    id: "injections",
    icon: "needle" as const,
    value: "48",
    label: "Total Injections",
    trend: "↑ 12% from last year",
    trendUp: true,
  },
  {
    id: "bleeds",
    icon: "water" as const,
    value: "2",
    label: "Bleeding Episodes",
    trend: "↓ 50% from last year",
    trendUp: true,
  },
  {
    id: "used",
    icon: "account-group" as const,
    value: "12,000 IU",
    label: "Total Factor Used",
    trend: "↑ 8% from last year",
    trendUp: true,
  },
  {
    id: "adherence",
    icon: "target" as const,
    value: "100%",
    label: "Treatment Adherence",
    trend: "Great Progress!",
    trendUp: true,
  },
];

export const monthlyUsage = [
  { month: "Jan", viii: 1800, ix: 700 },
  { month: "Feb", viii: 1600, ix: 650 },
  { month: "Mar", viii: 2000, ix: 800 },
  { month: "Apr", viii: 1750, ix: 720 },
  { month: "May", viii: 2100, ix: 850 },
  { month: "Jun", viii: 1900, ix: 780 },
  { month: "Jul", viii: 2300, ix: 900 },
  { month: "Aug", viii: 2500, ix: 1000 },
  { month: "Sep", viii: 2000, ix: 820 },
  { month: "Oct", viii: 1850, ix: 750 },
  { month: "Nov", viii: 1700, ix: 700 },
  { month: "Dec", viii: 1550, ix: 650 },
];

export const factorDistribution = {
  viiiPercent: 75,
  ixPercent: 25,
  viiiIu: "9,000 IU",
  ixIu: "3,000 IU",
  totalUsed: "12,000 IU",
};

export const recentTransactions = [
  {
    id: "1",
    date: "12 Aug 2025",
    type: "Used" as const,
    factor: "Factor VIII",
    dose: "500 IU",
    purpose: "Prophylaxis",
    facility: "TU Teaching Hospital",
  },
  {
    id: "2",
    date: "04 Aug 2025",
    type: "Received" as const,
    factor: "Factor VIII",
    dose: "10,000 IU",
    purpose: "Donation",
    facility: "NHS Central Store",
  },
  {
    id: "3",
    date: "28 Jul 2025",
    type: "Used" as const,
    factor: "Factor IX",
    dose: "1,000 IU",
    purpose: "Bleeding Treatment",
    facility: "Bir Hospital",
  },
  {
    id: "4",
    date: "15 Jul 2025",
    type: "Used" as const,
    factor: "Factor VIII",
    dose: "2,000 IU",
    purpose: "Surgery",
    facility: "TU Teaching Hospital",
  },
];
