export const provinces = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
];

export type TreatmentAdminStatus = "Active" | "Pending" | "Inactive";

export type TreatmentAdminRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  treatmentCenter: string;
  province: string;
  status: TreatmentAdminStatus;
  joinedDate: string;
};

export const treatmentAdminTotals: Record<string, number> = {
  All: 42,
  Koshi: 5,
  Madhesh: 4,
  Bagmati: 12,
  Gandaki: 4,
  Lumbini: 6,
  Karnali: 3,
  Sudurpashchim: 8,
};

export const allTreatmentAdmins: TreatmentAdminRow[] = [
  {
    id: "TADM-00156",
    name: "Ravi Shrestha",
    email: "ravi.shrestha@hemophilia.org.np",
    phone: "+977 9841234567",
    treatmentCenter: "Kathmandu Hemophilia Center",
    province: "Bagmati",
    status: "Active",
    joinedDate: "Jan 12, 2024",
  },
  {
    id: "TADM-00155",
    name: "Sita Magar",
    email: "sita.magar@hemophilia.org.np",
    phone: "+977 9842345678",
    treatmentCenter: "TU Teaching Hospital",
    province: "Bagmati",
    status: "Active",
    joinedDate: "Feb 3, 2024",
  },
  {
    id: "TADM-00154",
    name: "Bikash Tamang",
    email: "bikash.tamang@hemophilia.org.np",
    phone: "+977 9843456789",
    treatmentCenter: "Biratnagar Hemophilia Center",
    province: "Koshi",
    status: "Pending",
    joinedDate: "Mar 8, 2024",
  },
  {
    id: "TADM-00153",
    name: "Anjali KC",
    email: "anjali.kc@hemophilia.org.np",
    phone: "+977 9844567890",
    treatmentCenter: "Bhaktapur Treatment Center",
    province: "Bagmati",
    status: "Active",
    joinedDate: "Apr 15, 2024",
  },
  {
    id: "TADM-00152",
    name: "Nabin Rai",
    email: "nabin.rai@hemophilia.org.np",
    phone: "+977 9845678901",
    treatmentCenter: "Janakpur Hemophilia Clinic",
    province: "Madhesh",
    status: "Inactive",
    joinedDate: "May 20, 2024",
  },
  {
    id: "TADM-00151",
    name: "Priya Gurung",
    email: "priya.gurung@hemophilia.org.np",
    phone: "+977 9846789012",
    treatmentCenter: "Pokhara Hemophilia Center",
    province: "Gandaki",
    status: "Active",
    joinedDate: "Jun 2, 2024",
  },
  {
    id: "TADM-00150",
    name: "Kiran Thapa",
    email: "kiran.thapa@hemophilia.org.np",
    phone: "+977 9847890123",
    treatmentCenter: "Lalitpur Hemophilia Clinic",
    province: "Bagmati",
    status: "Pending",
    joinedDate: "Jul 11, 2024",
  },
  {
    id: "TADM-00149",
    name: "Maya Limbu",
    email: "maya.limbu@hemophilia.org.np",
    phone: "+977 9848901234",
    treatmentCenter: "Butwal Treatment Center",
    province: "Lumbini",
    status: "Active",
    joinedDate: "Aug 19, 2024",
  },
  {
    id: "TADM-00148",
    name: "Suresh Bhandari",
    email: "suresh.bhandari@hemophilia.org.np",
    phone: "+977 9849012345",
    treatmentCenter: "Hetauda Hemophilia Center",
    province: "Bagmati",
    status: "Active",
    joinedDate: "Sep 5, 2024",
  },
  {
    id: "TADM-00147",
    name: "Deepa Shahi",
    email: "deepa.shahi@hemophilia.org.np",
    phone: "+977 9850123456",
    treatmentCenter: "Nepalgunj Hemophilia Center",
    province: "Sudurpashchim",
    status: "Active",
    joinedDate: "Oct 22, 2024",
  },
];

export const treatmentAdminProfile = {
  id: "TADM-00156",
  name: "Ravi Shrestha",
  role: "Treatment Admin",
  province: "Bagmati",
  status: "Active" as TreatmentAdminStatus,
  email: "ravi.shrestha@hemophilia.org.np",
  phone: "+977 9841234567",
  joinedDate: "Jan 12, 2024",
  dob: "Mar 15, 1988",
  gender: "Male",
  address: "Kathmandu, Bagmati Province, Nepal",
  treatmentCenter: "Kathmandu Hemophilia Center",
  recentActivities: [
    { title: "Logged in", time: "2 minutes ago" },
    { title: "Updated patient record", time: "1 hour ago" },
    { title: "Approved injection request", time: "Yesterday" },
    { title: "Exported center report", time: "May 14, 2025" },
  ],
  permissions: [
    "Manage Patients",
    "View Treatment Records",
    "Manage Injections",
    "View Stock Levels",
    "Generate Center Reports",
  ],
  security: {
    twoFactor: "Enabled",
    passwordChanged: "Apr 2, 2025",
    lastLogin: "May 16, 2025 10:30 AM",
    loginAttempts: "0 (Last 30 days)",
  },
  documents: [
    { name: "Appointment Letter.pdf", date: "Jan 12, 2024" },
    { name: "ID Verification.pdf", date: "Jan 15, 2024" },
    { name: "Training Certificate.pdf", date: "Feb 20, 2024" },
  ],
};
