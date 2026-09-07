export type AuditSeverity = "Info" | "Warning" | "Critical";

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  module: string;
  ip: string;
  time: string;
  severity: AuditSeverity;
  detail: string;
};

export const auditModules = ["All", "Patients", "Stock", "Injections", "Admins", "Settings", "Auth"];

export const allAuditLogs: AuditLog[] = [
  {
    id: "AUD-88421",
    actor: "Deepa Shahi",
    action: "Exported patient registry",
    module: "Patients",
    ip: "103.90.12.44",
    time: "May 16, 2025 10:42 AM",
    severity: "Warning",
    detail: "CSV export of 8,742 records from Bagmati filter.",
  },
  {
    id: "AUD-88420",
    actor: "Ravi Shrestha",
    action: "Approved injection INJ-2025-1543",
    module: "Injections",
    ip: "27.34.18.9",
    time: "May 16, 2025 10:31 AM",
    severity: "Info",
    detail: "Factor VIII 2500 IU recorded for HEM-0008742.",
  },
  {
    id: "AUD-88419",
    actor: "System",
    action: "Low stock threshold breached",
    module: "Stock",
    ip: "internal",
    time: "May 16, 2025 09:12 AM",
    severity: "Critical",
    detail: "Emicizumab dropped to 180 mg at NHS Central Store.",
  },
  {
    id: "AUD-88418",
    actor: "Sita Magar",
    action: "Updated hospital admin profile",
    module: "Admins",
    ip: "113.199.4.21",
    time: "May 16, 2025 08:55 AM",
    severity: "Info",
    detail: "Phone number changed for ADM-00155.",
  },
  {
    id: "AUD-88417",
    actor: "Unknown",
    action: "Failed login (3 attempts)",
    module: "Auth",
    ip: "45.112.88.3",
    time: "May 16, 2025 07:04 AM",
    severity: "Critical",
    detail: "Blocked after threshold. Account: nabin.rai@hemophilia.org.np",
  },
  {
    id: "AUD-88416",
    actor: "Deepa Shahi",
    action: "Changed backup schedule",
    module: "Settings",
    ip: "103.90.12.44",
    time: "May 15, 2025 06:20 PM",
    severity: "Warning",
    detail: "Nightly backup moved from 01:00 to 02:30 NPT.",
  },
  {
    id: "AUD-88415",
    actor: "Priya Gurung",
    action: "Issued stock to Pokhara HC",
    module: "Stock",
    ip: "202.52.11.77",
    time: "May 15, 2025 04:10 PM",
    severity: "Info",
    detail: "Factor IX 800 IU transferred from central store.",
  },
  {
    id: "AUD-88414",
    actor: "Maya Limbu",
    action: "Verified patient HEM-0008735",
    module: "Patients",
    ip: "110.44.116.8",
    time: "May 15, 2025 02:48 PM",
    severity: "Info",
    detail: "KYC documents accepted.",
  },
];

export const auditStats = {
  today: 23,
  warnings: 8,
  critical: 2,
  uniqueActors: 14,
};

export const auditTrend = [
  { hour: "06", events: 4 },
  { hour: "08", events: 12 },
  { hour: "10", events: 23 },
  { hour: "12", events: 18 },
  { hour: "14", events: 21 },
  { hour: "16", events: 15 },
  { hour: "18", events: 9 },
];
