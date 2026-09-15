export type DashboardTrendPoint = {
  day: string;
  label: string;
  injections: number;
  treatments: number;
};

export type StockByHospital = {
  hospitalName: string;
  province: string;
  onHand: number;
  used: number;
  stockIn?: number;
};

export type StockUsageTrend = {
  month: string;
  stockIn: number;
  stockOut: number;
};

export type ProvinceStat = {
  province: string;
  patients: number;
  activePatients: number;
  pendingPatients?: number;
  hospitals: number;
  injections: number;
  treatments?: number;
  hemophiliaA?: number;
  hemophiliaB?: number;
  severe?: number;
  stockUnits: number;
  stockIn?: number;
  stockOut?: number;
};

export type SystemOverview = {
  totalUsers: number;
  totalAdmins: number;
  superAdmins: number;
  provinceAdmins: number;
  hospitalAdmins: number;
  activeSessions: number;
  todaysVisits: number;
  totalStockUnits: number;
  totalProvinces: number;
  totalCenters: number;
    totalPatients: number;
    activePatients: number;
    uptime?: string;
};

export type DashboardActivity = {
  id: number;
  actor: string;
  action: string;
  module: string;
  detail: string;
  createdAt: string;
};

export type DashboardData = {
  treatmentTrend: DashboardTrendPoint[];
  stockByHospital: StockByHospital[];
  stockUsageTrend: StockUsageTrend[];
  provinceStats: ProvinceStat[];
  systemOverview: SystemOverview;
  recentActivity: DashboardActivity[];
};
