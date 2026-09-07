export const provinces = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
];

export const roles = ["Super Admin", "Province Admin", "Hospital Admin"] as const;

export type AdminRole = (typeof roles)[number];
export type AdminStatus = "Active" | "Pending" | "Inactive";

export type AdminRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  province: string;
  status: AdminStatus;
  joinedDate: string;
};

export const adminTotals: Record<string, number> = {
  All: 156,
  Koshi: 18,
  Madhesh: 16,
  Bagmati: 42,
  Gandaki: 14,
  Lumbini: 22,
  Karnali: 12,
  Sudurpashchim: 32,
};

export const allAdmins: AdminRow[] = [
  {
    id: "ADM-00156",
    name: "Ravi Shrestha",
    email: "ravi.shrestha@hemophilia.org.np",
    phone: "+977 9841234567",
    role: "Province Admin",
    province: "Bagmati",
    status: "Active",
    joinedDate: "Jan 12, 2024",
  },
  {
    id: "ADM-00155",
    name: "Sita Magar",
    email: "sita.magar@hemophilia.org.np",
    phone: "+977 9842345678",
    role: "Hospital Admin",
    province: "Bagmati",
    status: "Active",
    joinedDate: "Feb 3, 2024",
  },
  {
    id: "ADM-00154",
    name: "Bikash Tamang",
    email: "bikash.tamang@hemophilia.org.np",
    phone: "+977 9843456789",
    role: "Province Admin",
    province: "Koshi",
    status: "Pending",
    joinedDate: "Mar 8, 2024",
  },
  {
    id: "ADM-00153",
    name: "Anjali KC",
    email: "anjali.kc@hemophilia.org.np",
    phone: "+977 9844567890",
    role: "Hospital Admin",
    province: "Bagmati",
    status: "Active",
    joinedDate: "Apr 15, 2024",
  },
  {
    id: "ADM-00152",
    name: "Nabin Rai",
    email: "nabin.rai@hemophilia.org.np",
    phone: "+977 9845678901",
    role: "Province Admin",
    province: "Madhesh",
    status: "Inactive",
    joinedDate: "May 20, 2024",
  },
  {
    id: "ADM-00151",
    name: "Priya Gurung",
    email: "priya.gurung@hemophilia.org.np",
    phone: "+977 9846789012",
    role: "Hospital Admin",
    province: "Gandaki",
    status: "Active",
    joinedDate: "Jun 2, 2024",
  },
  {
    id: "ADM-00150",
    name: "Kiran Thapa",
    email: "kiran.thapa@hemophilia.org.np",
    phone: "+977 9847890123",
    role: "Hospital Admin",
    province: "Bagmati",
    status: "Pending",
    joinedDate: "Jul 11, 2024",
  },
  {
    id: "ADM-00149",
    name: "Maya Limbu",
    email: "maya.limbu@hemophilia.org.np",
    phone: "+977 9848901234",
    role: "Province Admin",
    province: "Lumbini",
    status: "Active",
    joinedDate: "Aug 19, 2024",
  },
  {
    id: "ADM-00148",
    name: "Suresh Bhandari",
    email: "suresh.bhandari@hemophilia.org.np",
    phone: "+977 9849012345",
    role: "Hospital Admin",
    province: "Bagmati",
    status: "Active",
    joinedDate: "Sep 5, 2024",
  },
  {
    id: "ADM-00147",
    name: "Deepa Shahi",
    email: "deepa.shahi@hemophilia.org.np",
    phone: "+977 9850123456",
    role: "Super Admin",
    province: "Bagmati",
    status: "Active",
    joinedDate: "Oct 22, 2024",
  },
];

export const adminProfile = {
  id: "ADM-00156",
  name: "Ravi Shrestha",
  role: "Province Admin",
  province: "Bagmati",
  status: "Active" as AdminStatus,
  email: "ravi.shrestha@hemophilia.org.np",
  phone: "+977 9841234567",
  joinedDate: "Jan 12, 2024",
  dob: "Mar 15, 1988",
  gender: "Male",
  address: "Kathmandu, Bagmati Province, Nepal",
  recentActivities: [
    { title: "Logged in", time: "2 minutes ago" },
    { title: "Updated admin profile", time: "1 hour ago" },
    { title: "Approved patient verification", time: "Yesterday" },
    { title: "Exported province report", time: "May 14, 2025" },
  ],
  treatmentCenters: [
    "Kathmandu Hemophilia Center",
    "TU Teaching Hospital",
    "Bhaktapur Treatment Center",
    "Lalitpur Hemophilia Clinic",
    "Hetauda Hemophilia Center",
  ],
  permissions: [
    "Manage Treatment Centers",
    "View Reports",
    "Verify Patients",
    "Manage Hospital Admins",
    "View Province Dashboard",
  ],
  security: {
    twoFactor: "Enabled",
    passwordChanged: "Apr 2, 2025",
    loginAttempts: "0 (Last 30 days)",
  },
};
