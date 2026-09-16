import { Perm } from "@/lib/permissions";

type AccessUser = { permissions?: string[]; viewOnly?: boolean } | null | undefined;

export type PageKey =
  | "patients"
  | "injections"
  | "treatments"
  | "stock"
  | "admins"
  | "hospitalStaff"
  | "reports"
  | "audit"
  | "settings"
  | "website"
  | "users"
  | "dashboard";

const PAGE_ACTIONS: Record<PageKey, { view?: string; create?: string; update?: string; delete?: string }> = {
  dashboard: { view: Perm.dashboard },
  patients: { view: Perm.patientsView, create: Perm.patientsCreate, update: Perm.patientsUpdate, delete: Perm.patientsDelete },
  injections: { view: Perm.injectionsView, create: Perm.injectionsAdd, update: Perm.injectionsUpdate, delete: Perm.injectionsDelete },
  treatments: { view: Perm.treatmentsView, create: Perm.treatmentsAdd, update: Perm.treatmentsUpdate, delete: Perm.treatmentsDelete },
  stock: { view: Perm.stockView, create: Perm.stockManage, update: Perm.stockManage, delete: Perm.stockDelete },
  admins: { view: Perm.adminsView, create: Perm.adminsManage, update: Perm.adminsManage, delete: Perm.adminsDelete },
  hospitalStaff: { view: Perm.hospitalStaffView, create: Perm.hospitalStaffManage, update: Perm.hospitalStaffManage, delete: Perm.hospitalStaffDelete },
  reports: { view: Perm.reportsHospital },
  audit: { view: Perm.auditView },
  settings: { view: Perm.settingsSystem, update: Perm.settingsSystem },
  website: { view: Perm.websiteView, create: Perm.websiteManage, update: Perm.websiteManage, delete: Perm.websiteDelete },
  users: { view: Perm.usersView, create: Perm.usersManage, update: Perm.usersManage, delete: Perm.usersDelete },
};

export function pageRbac(user: AccessUser, page: PageKey) {
  const perms = PAGE_ACTIONS[page];
  const has = (code?: string) => Boolean(code && user?.permissions?.includes(code));
  const canCreate = !user?.viewOnly && has(perms.create);
  const canUpdate = !user?.viewOnly && has(perms.update);
  const canDelete = !user?.viewOnly && has(perms.delete);
  return {
    canView: has(perms.view),
    canCreate,
    canUpdate,
    canDelete,
    readOnly: Boolean(user?.viewOnly) || (has(perms.view) && !canCreate && !canUpdate && !canDelete),
  };
}
