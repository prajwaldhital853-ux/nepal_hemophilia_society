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

export const AUDIT_MODULES = ["All", "Patients", "Stock", "Injections", "Admins", "Settings", "Auth"] as const;
