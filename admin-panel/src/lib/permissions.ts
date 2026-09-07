/** Permission keys returned by GET /auth/me/ — keep in sync with backend/apps/accounts/rbac.py */

export const Perm = {
  dashboard: "dashboard",
  patientsView: "patients.view",
  patientsSearch: "patients.search",
  patientsCreate: "patients.create",
  patientsUpdate: "patients.update",
  patientsVerify: "patients.verify",
  injectionsView: "injections.view",
  injectionsAdd: "injections.add",
  injectionsUpdate: "injections.update",
  injectionsCorrect: "injections.correct",
  treatmentsView: "treatments.view",
  treatmentsAdd: "treatments.add",
  treatmentsUpdate: "treatments.update",
  hospitalStaffView: "hospitalStaff.view",
  hospitalStaffManage: "hospitalStaff.manage",
  provinceAdminsManage: "provinceAdmins.manage",
  hospitalsManage: "hospitals.manage",
  factorsView: "factors.view",
  factorsManage: "factors.manage",
  auditView: "audit.view",
  reportsNational: "reports.national",
  reportsProvince: "reports.province",
  reportsHospital: "reports.hospital",
  settingsSystem: "settings.system",
  websiteManage: "website.manage",
  usersManage: "users.manage",
  stockView: "stock.view",
  adminsView: "admins.view",
} as const;

export const ACTION_ROUTES: Array<{ test: (pathname: string) => boolean; permission: string }> = [
  { test: (p) => p === "/dashboard/patients/new", permission: Perm.patientsCreate },
  { test: (p) => /^\/dashboard\/patients\/[^/]+\/edit$/.test(p), permission: Perm.patientsUpdate },
];

export function navAllows(pathname: string, nav: string[]) {
  return nav.some((item) => pathname === item || pathname.startsWith(`${item}/`));
}
