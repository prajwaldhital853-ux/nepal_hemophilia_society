export const dashboardStats = [
  {
    label: "Total Patients",
    value: "8,742",
    meta: "+12.5%",
    trend: "up" as const,
    tone: "blue" as const,
  },
  {
    label: "Total Admins",
    value: "8",
    meta: "1 Super Admin, 7 Province Admins",
    tone: "sky" as const,
  },
  {
    label: "Total Provinces",
    value: "7",
    meta: "All provinces covered",
    tone: "green" as const,
  },
  {
    label: "Total Treatment Centers",
    value: "28",
    meta: "+7.1%",
    trend: "up" as const,
    tone: "orange" as const,
  },
  {
    label: "Total Stock (Units)",
    value: "18,560",
    meta: "+10.3%",
    trend: "up" as const,
    tone: "purple" as const,
  },
];

export const provinceStats = [
  { name: "Koshi", count: 1428, percent: "16.34%", color: "#93C5FD" },
  { name: "Madhesh", count: 1256, percent: "14.37%", color: "#60A5FA" },
  { name: "Bagmati", count: 2102, percent: "24.06%", color: "#1D4ED8" },
  { name: "Gandaki", count: 986, percent: "11.28%", color: "#7DD3FC" },
  { name: "Lumbini", count: 1124, percent: "12.86%", color: "#38BDF8" },
  { name: "Karnali", count: 654, percent: "7.48%", color: "#BAE6FD" },
  { name: "Sudurpashchim", count: 1192, percent: "13.63%", color: "#0284C7" },
];

export const recentRegistrations = [
  { id: "HEM-0008742", name: "Aarav Shrestha", province: "Bagmati", date: "May 16, 2025", status: "Verified" },
  { id: "HEM-0008741", name: "Sita Magar", province: "Gandaki", date: "May 16, 2025", status: "Pending" },
  { id: "HEM-0008740", name: "Bikash Tamang", province: "Koshi", date: "May 16, 2025", status: "Verified" },
  { id: "HEM-0008739", name: "Anjali KC", province: "Lumbini", date: "May 16, 2025", status: "Verified" },
  { id: "HEM-0008738", name: "Nabin Rai", province: "Madhesh", date: "May 16, 2025", status: "Pending" },
];

export const injectionTrend = [
  { day: "May 1", injections: 42, treatments: 28 },
  { day: "May 4", injections: 55, treatments: 31 },
  { day: "May 10", injections: 70, treatments: 40 },
  { day: "May 16", injections: 78, treatments: 52 },
];

export const centerStatus = [
  { name: "Active", value: 20, color: "#22C55E" },
  { name: "Inactive", value: 5, color: "#F59E0B" },
  { name: "Under Maintenance", value: 3, color: "#EF4444" },
];

export const stockSummary = [
  { name: "Factor VIII", category: "Clotting Factor", units: "8,420", status: "In Stock" },
  { name: "Factor IX", category: "Clotting Factor", units: "5,160", status: "In Stock" },
  { name: "Emicizumab", category: "Bypassing Agent", units: "180", status: "Low Stock" },
  { name: "Tranexamic Acid", category: "Supportive", units: "2,400", status: "In Stock" },
  { name: "Desmopressin", category: "Supportive", units: "2,400", status: "In Stock" },
];

export const adminActivity = [
  { title: "Super Admin logged in", time: "May 16, 2025 10:30 AM", tone: "green" as const },
  { title: "Patient verification approved: HEM-0008735", time: "May 16, 2025 09:45 AM", tone: "green" as const },
  { title: "Stock updated at NHS Central Store", time: "May 16, 2025 08:15 AM", tone: "blue" as const },
  { title: "New treatment center added: Pokhara Hemophilia Center", time: "May 15, 2025 04:30 PM", tone: "green" as const },
];

export const systemOverview = [
  { label: "Total Users", value: "1,256", tone: "blue" as const },
  { label: "Active Sessions", value: "156", tone: "green" as const },
  { label: "Today's Visits", value: "542", tone: "blue" as const },
  { label: "System Uptime", value: "99.8%", tone: "red" as const },
];

export const quickActions = [
  { label: "Add New Patient", tone: "blue" },
  { label: "Add Admin", tone: "sky" },
  { label: "Add Treatment Center", tone: "orange" },
  { label: "Add Stock", tone: "purple" },
  { label: "Generate Report", tone: "green" },
  { label: "System Settings", tone: "slate" },
];
