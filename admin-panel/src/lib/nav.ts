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
  { href: "/dashboard/audit", label: "Audit Logs", icon: "audit", badge: 23 },
  { href: "/dashboard/settings", label: "System Settings", icon: "settings" },
];

export function filterNav(items: NavItem[], allowed: string[]) {
  const allow = (href: string) => allowed.some((item) => href === item || href.startsWith(`${item}/`) || item.startsWith(`${href}/`));
  return items
    .map((item) => {
      if (item.children?.length) {
        const children = item.children.filter((child) => allow(child.href));
        if (!children.length && !allow(item.href)) return null;
        return { ...item, children };
      }
      return allow(item.href) ? item : null;
    })
    .filter((item): item is NavItem => Boolean(item));
}

export const websiteNav: NavItem[] = [
  { href: "/dashboard/website", label: "Website Content", icon: "globe" },
  { href: "/dashboard/news", label: "News & Notices", icon: "news" },
  { href: "/dashboard/events", label: "Events", icon: "events" },
  { href: "/dashboard/gallery", label: "Gallery", icon: "gallery" },
  { href: "/dashboard/resources", label: "Resources", icon: "resources" },
];
