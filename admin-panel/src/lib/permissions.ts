/** Permission keys returned by GET /auth/me/ — keep in sync with backend/apps/accounts/rbac.py */

export const Perm = {
  dashboard: "dashboard",
  patientsView: "patients.view",
  patientsSearch: "patients.search",
  patientsCreate: "patients.create",
  patientsUpdate: "patients.update",
  patientsVerify: "patients.verify",
  patientsDelete: "patients.delete",
  injectionsView: "injections.view",
  injectionsAdd: "injections.add",
  injectionsUpdate: "injections.update",
  injectionsCorrect: "injections.correct",
  injectionsDelete: "injections.delete",
  treatmentsView: "treatments.view",
  treatmentsAdd: "treatments.add",
  treatmentsUpdate: "treatments.update",
  treatmentsDelete: "treatments.delete",
  hospitalStaffView: "hospitalStaff.view",
  hospitalStaffManage: "hospitalStaff.manage",
  hospitalStaffDelete: "hospitalStaff.delete",
  provinceAdminsManage: "provinceAdmins.manage",
  hospitalsManage: "hospitals.manage",
  hospitalsDelete: "hospitals.delete",
  factorsView: "factors.view",
  factorsManage: "factors.manage",
  factorsDelete: "factors.delete",
  auditView: "audit.view",
  reportsNational: "reports.national",
  reportsProvince: "reports.province",
  reportsHospital: "reports.hospital",
  settingsSystem: "settings.system",
  websiteView: "website.view",
  websiteManage: "website.manage",
  websiteDelete: "website.delete",
  usersManage: "users.manage",
  usersView: "users.view",
  usersDelete: "users.delete",
  stockView: "stock.view",
  stockManage: "stock.manage",
  stockDelete: "stock.delete",
  documentsAdd: "documents.add",
  documentsDelete: "documents.delete",
  adminsView: "admins.view",
  adminsManage: "admins.manage",
  adminsDelete: "admins.delete",
} as const;

export const PERM_LABELS: Record<string, string> = {
  dashboard: "View dashboard",
  "patients.view": "View patients",
  "patients.search": "Search by ID",
  "patients.create": "Add patients",
  "patients.update": "Update patients",
  "patients.verify": "Verify patients",
  "patients.delete": "Delete patients",
  "injections.view": "View injections",
  "injections.add": "Add injections",
  "injections.update": "Update injections",
  "injections.correct": "Correct injections",
  "injections.delete": "Delete injections",
  "treatments.view": "View treatments",
  "treatments.add": "Add treatments",
  "treatments.update": "Update treatments",
  "treatments.delete": "Delete treatments",
  "hospitalStaff.view": "View hospital staff",
  "hospitalStaff.manage": "Add and update hospital staff",
  "hospitalStaff.delete": "Delete hospital staff",
  "admins.view": "View admin directory",
  "admins.manage": "Add and update admins",
  "admins.delete": "Delete admins",
  "provinceAdmins.manage": "Manage Province Admins",
  "hospitals.manage": "Add and update hospitals",
  "hospitals.delete": "Delete hospitals",
  "stock.view": "View stock",
  "stock.manage": "Add and update stock",
  "stock.delete": "Delete stock",
  "factors.view": "View factor catalog",
  "factors.manage": "Add and update factor catalog",
  "factors.delete": "Delete factor catalog",
  "documents.add": "Add patient documents",
  "documents.delete": "Delete patient documents",
  "reports.hospital": "Hospital reports",
  "reports.province": "Province reports",
  "reports.national": "National reports",
  "audit.view": "View audit logs",
  "users.view": "View users directory",
  "users.manage": "Add and update users",
  "users.delete": "Delete users",
  "settings.system": "Change system settings",
  "website.view": "View website content",
  "website.manage": "Add and update website content",
  "website.delete": "Delete website content",
};

export const ACTION_ROUTES: Array<{ test: (pathname: string) => boolean; permission: string }> = [
  { test: (p) => p === "/dashboard/patients/new", permission: Perm.patientsCreate },
  { test: (p) => /^\/dashboard\/patients\/[^/]+\/edit$/.test(p), permission: Perm.patientsView },
];

/** Parent nav entries that may expose a fixed subtree (never treat `/dashboard` as a parent). */
const NAV_PARENT_PREFIXES: Record<string, string> = {
  "/dashboard/hospitals": "/dashboard/hospitals/",
};

export function navHrefAllowed(href: string, allowed: string[]) {
  if (allowed.includes(href)) return true;
  for (const [parent, prefix] of Object.entries(NAV_PARENT_PREFIXES)) {
    if (allowed.includes(parent) && href.startsWith(prefix)) return true;
  }
  return false;
}

export function navAllows(pathname: string, nav: string[]) {
  return navHrefAllowed(pathname, nav);
}

export const WEBSITE_ROUTES = [
  "/dashboard/website",
  "/dashboard/news",
  "/dashboard/events",
  "/dashboard/gallery",
  "/dashboard/resources",
] as const;

export function isWebsiteRoute(pathname: string) {
  return WEBSITE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
