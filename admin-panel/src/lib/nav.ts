import { navHrefAllowed } from "@/lib/permissions";

export type NavIconName =
  | "layout"
  | "patients"
  | "admin"
  | "hospital"
  | "stock"
  | "treatment"
  | "users"
  | "reports"
  | "audit"
  | "settings"
  | "globe"
  | "news"
  | "events"
  | "gallery"
  | "resources";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  badge?: number;
  children?: { href: string; label: string }[];
};

export const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "layout" },
  { href: "/dashboard/patients", label: "Patients Management", icon: "patients" },
  { href: "/dashboard/admins", label: "Admin Management", icon: "admin" },
  {
    href: "/dashboard/hospitals",
    label: "Hospital Administration",
    icon: "hospital",
    children: [
      { href: "/dashboard/hospitals/treatment-admins", label: "Treatment Admin" },
      { href: "/dashboard/hospitals/center-admins", label: "Center Admin" },
    ],
  },
  { href: "/dashboard/stock", label: "Stock Management", icon: "stock" },
  { href: "/dashboard/injections", label: "Treatment & Injection", icon: "treatment" },
  { href: "/dashboard/users", label: "Users Management", icon: "users" },
  { href: "/dashboard/reports", label: "Reports & Analytics", icon: "reports" },
  { href: "/dashboard/audit", label: "Audit Logs", icon: "audit" },
  { href: "/dashboard/settings", label: "System Settings", icon: "settings" },
];

export function filterNav(items: NavItem[], allowed: string[]) {
  return items
    .map((item) => {
      if (item.children?.length) {
        const children = item.children.filter((child) => navHrefAllowed(child.href, allowed));
        if (!children.length && !navHrefAllowed(item.href, allowed)) return null;
        return { ...item, children };
      }
      return navHrefAllowed(item.href, allowed) ? item : null;
    })
    .filter((item): item is NavItem => Boolean(item));
}

export const websiteNav: NavItem[] = [
  { href: "/dashboard/website", label: "App Services", icon: "globe" },
  { href: "/dashboard/news", label: "News & Notices", icon: "news" },
  { href: "/dashboard/events", label: "Events", icon: "events" },
  { href: "/dashboard/gallery", label: "Gallery", icon: "gallery" },
  { href: "/dashboard/resources", label: "Resources", icon: "resources" },
  { href: "/dashboard/insights", label: "Health insight tips", icon: "reports" },
];
