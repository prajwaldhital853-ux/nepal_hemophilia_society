export type UserRole = "Super Admin" | "Province Admin" | "Hospital Admin" | "Treatment Admin" | "Viewer";
export type UserStatus = "Active" | "Pending" | "Suspended";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  province: string;
  lastActive: string;
  status: UserStatus;
  sessions: number;
};

export const userRoles: Array<UserRole | "All"> = [
  "All",
  "Super Admin",
  "Province Admin",
  "Hospital Admin",
  "Treatment Admin",
  "Viewer",
];

export const allUsers: AppUser[] = [
  {
    id: "USR-001",
    name: "Deepa Shahi",
    email: "deepa.shahi@hemophilia.org.np",
    role: "Super Admin",
    province: "Bagmati",
    lastActive: "2 min ago",
    status: "Active",
    sessions: 3,
  },
  {
    id: "USR-002",
    name: "Ravi Shrestha",
    email: "ravi.shrestha@hemophilia.org.np",
    role: "Province Admin",
    province: "Bagmati",
    lastActive: "18 min ago",
    status: "Active",
    sessions: 1,
  },
  {
    id: "USR-003",
    name: "Sita Magar",
    email: "sita.magar@hemophilia.org.np",
    role: "Hospital Admin",
    province: "Bagmati",
    lastActive: "1 hour ago",
    status: "Active",
    sessions: 2,
  },
  {
    id: "USR-004",
    name: "Bikash Tamang",
    email: "bikash.tamang@hemophilia.org.np",
    role: "Treatment Admin",
    province: "Koshi",
    lastActive: "Yesterday",
    status: "Pending",
    sessions: 0,
  },
  {
    id: "USR-005",
    name: "Priya Gurung",
    email: "priya.gurung@hemophilia.org.np",
    role: "Hospital Admin",
    province: "Gandaki",
    lastActive: "3 hours ago",
    status: "Active",
    sessions: 1,
  },
  {
    id: "USR-006",
    name: "Nabin Rai",
    email: "nabin.rai@hemophilia.org.np",
    role: "Viewer",
    province: "Madhesh",
    lastActive: "May 12, 2025",
    status: "Suspended",
    sessions: 0,
  },
  {
    id: "USR-007",
    name: "Maya Limbu",
    email: "maya.limbu@hemophilia.org.np",
    role: "Treatment Admin",
    province: "Lumbini",
    lastActive: "45 min ago",
    status: "Active",
    sessions: 1,
  },
  {
    id: "USR-008",
    name: "Kiran Thapa",
    email: "kiran.thapa@hemophilia.org.np",
    role: "Province Admin",
    province: "Karnali",
    lastActive: "4 hours ago",
    status: "Pending",
    sessions: 0,
  },
];

export const userStats = {
  total: 1256,
  active: 1184,
  pending: 42,
  suspended: 30,
  sessions: 156,
};

export const roleMix = [
  { name: "Treatment Admin", value: 48, color: "#2F6FED" },
  { name: "Hospital Admin", value: 28, color: "#22C55E" },
  { name: "Province Admin", value: 14, color: "#F59E0B" },
  { name: "Viewer", value: 8, color: "#8B5CF6" },
  { name: "Super Admin", value: 2, color: "#EF4444" },
];

export const loginTrend = [
  { day: "Mon", logins: 118 },
  { day: "Tue", logins: 142 },
  { day: "Wed", logins: 136 },
  { day: "Thu", logins: 158 },
  { day: "Fri", logins: 164 },
  { day: "Sat", logins: 72 },
  { day: "Sun", logins: 54 },
];
