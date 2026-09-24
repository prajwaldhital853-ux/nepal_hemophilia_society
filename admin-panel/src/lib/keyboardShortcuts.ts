export type ShortcutCategory =
  | "general"
  | "header"
  | "navigation"
  | "page"
  | "patients"
  | "admins"
  | "hospitals"
  | "stock"
  | "injections"
  | "appointments"
  | "users"
  | "reports"
  | "audit"
  | "settings"
  | "website";

export type ShortcutDef = {
  id: string;
  label: string;
  description: string;
  keys: string[];
  category: ShortcutCategory;
  sequence?: boolean;
};

export const SHORTCUT_EVENT = "nhms-shortcut";

export const GO_NAV: Record<string, { href: string; label: string }> = {
  d: { href: "/dashboard", label: "Dashboard" },
  p: { href: "/dashboard/patients", label: "Patients Management" },
  a: { href: "/dashboard/admins", label: "Admin Management" },
  h: { href: "/dashboard/hospitals/treatment-admins", label: "Treatment Admin" },
  c: { href: "/dashboard/hospitals/center-admins", label: "Center Admin" },
  s: { href: "/dashboard/stock", label: "Stock Management" },
  i: { href: "/dashboard/injections", label: "Treatment & Injection" },
  t: { href: "/dashboard/appointments", label: "Appointments" },
  u: { href: "/dashboard/users", label: "Users Management" },
  r: { href: "/dashboard/reports", label: "Reports & Analytics" },
  x: { href: "/dashboard/audit", label: "Audit Logs" },
  ",": { href: "/dashboard/settings", label: "System Settings" },
  w: { href: "/dashboard/website", label: "App Services" },
  "1": { href: "/dashboard/news", label: "News & Notices" },
  "2": { href: "/dashboard/events", label: "Events" },
  "3": { href: "/dashboard/gallery", label: "Gallery" },
  "4": { href: "/dashboard/resources", label: "Resources" },
  "5": { href: "/dashboard/insights", label: "Health insight tips" },
};

const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  general: "General",
  header: "Header & tools",
  navigation: "Go to page (press G, then key)",
  page: "Current page",
  patients: "Patients",
  admins: "Admins",
  hospitals: "Hospital staff",
  stock: "Stock",
  injections: "Injections",
  appointments: "Appointments",
  users: "Users",
  reports: "Reports",
  audit: "Audit",
  settings: "Settings",
  website: "Website content",
};

export function categoryLabel(category: ShortcutCategory) {
  return CATEGORY_LABELS[category];
}

export function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function modLabel() {
  return isMacPlatform() ? "⌘" : "Ctrl";
}

export function formatShortcutKeys(keys: string[]) {
  const mod = modLabel();
  return keys.map((key) => (key === "Mod" ? mod : key)).join(" + ");
}

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const input = target as HTMLInputElement;
    const type = (input.type || "text").toLowerCase();
    return !["button", "checkbox", "radio", "submit", "reset", "file", "range", "color"].includes(type);
  }
  return false;
}

export function dispatchShortcut(action: string) {
  window.dispatchEvent(new CustomEvent(SHORTCUT_EVENT, { detail: { action } }));
}

export function activateShortcutTarget(target: string) {
  const el = document.querySelector<HTMLElement>(
    `[data-shortcut-target="${target}"]:not([disabled]), [data-shortcut-target~="${target}"]:not([disabled])`,
  );
  if (!el) return false;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    el.focus();
    if (el instanceof HTMLInputElement && ["text", "search", ""].includes(el.type)) {
      el.select();
    }
  } else {
    el.click();
  }
  return true;
}

function mod(): "ctrl" | "meta" {
  return isMacPlatform() ? "meta" : "ctrl";
}

function chord(event: KeyboardEvent, key: string, opts?: { shift?: boolean; alt?: boolean }) {
  const primary = mod() === "meta" ? event.metaKey : event.ctrlKey;
  if (!primary) return false;
  if (opts?.shift === true && !event.shiftKey) return false;
  if (opts?.shift === false && event.shiftKey) return false;
  if (opts?.alt === true && !event.altKey) return false;
  if (opts?.alt === false && event.altKey) return false;
  return event.key.toLowerCase() === key.toLowerCase();
}

export function matchShortcut(event: KeyboardEvent, keys: string[]) {
  if (keys.length === 1) {
    if (keys[0] === "?") return event.key === "?" && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (keys[0] === "/") return event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (keys[0] === "Escape") return event.key === "Escape";
    return event.key.toLowerCase() === keys[0].toLowerCase() && !event.ctrlKey && !event.metaKey && !event.altKey;
  }

  const normalized = keys.map((key) => (key === "Mod" ? mod() : key.toLowerCase()));
  const needsShift = normalized.includes("shift");
  const needsAlt = normalized.includes("alt");
  const mainKey = normalized.find((key) => !["ctrl", "meta", "shift", "alt"].includes(key));
  if (!mainKey) return false;

  const primaryHeld = mod() === "meta" ? event.metaKey : event.ctrlKey;
  if (!primaryHeld) return false;
  if (needsShift && !event.shiftKey) return false;
  if (!needsShift && event.shiftKey && mainKey.length === 1) return false;
  if (needsAlt && !event.altKey) return false;

  if (mainKey === "enter") return event.key === "Enter";
  if (mainKey === ",") return event.key === ",";
  return event.key.toLowerCase() === mainKey;
}

export const SHORTCUTS: ShortcutDef[] = [
  { id: "help", label: "Show shortcuts", description: "Open this keyboard shortcuts reference.", keys: ["?"], category: "general" },
  {
    id: "close",
    label: "Close panel / dialog",
    description: "Close the shortcuts panel, header dropdowns, modals, or blur the active field.",
    keys: ["Escape"],
    category: "general",
  },
  {
    id: "global-search",
    label: "Focus global search",
    description: "Jump to the top search bar to find patients, stock, hospitals, and staff.",
    keys: ["Mod", "Shift", "K"],
    category: "header",
  },
  {
    id: "notifications",
    label: "Toggle notifications",
    description: "Open or close the notifications panel.",
    keys: ["Alt", "Shift", "N"],
    category: "header",
  },
  {
    id: "messages",
    label: "Toggle appointment messages",
    description: "Open or close the appointment messages inbox.",
    keys: ["Alt", "Shift", "M"],
    category: "header",
  },
  {
    id: "theme",
    label: "Toggle dark / light mode",
    description: "Switch the admin panel theme.",
    keys: ["Mod", "Shift", "D"],
    category: "header",
  },
  {
    id: "language",
    label: "Switch language",
    description: "Toggle between English and Nepali.",
    keys: ["Mod", "Shift", "O"],
    category: "header",
  },
  {
    id: "profile",
    label: "Open my profile",
    description: "Go to your admin profile page.",
    keys: ["Mod", "Shift", "P"],
    category: "header",
  },
  {
    id: "sidebar",
    label: "Toggle sidebar menu",
    description: "Open or close the navigation menu on smaller screens.",
    keys: ["Mod", "Shift", "B"],
    category: "header",
  },
  {
    id: "logout",
    label: "Sign out",
    description: "Log out of the admin panel.",
    keys: ["Mod", "Shift", "Q"],
    category: "header",
  },
  ...Object.entries(GO_NAV).map(([key, nav]) => ({
    id: `go-${key}`,
    label: nav.label,
    description: `Navigate to ${nav.label}.`,
    keys: ["G", key === "," ? "," : key.toUpperCase()],
    category: "navigation" as ShortcutCategory,
    sequence: true,
  })),
  {
    id: "page-search",
    label: "Focus page search",
    description: "Focus the search or filter box on the current page.",
    keys: ["/"],
    category: "page",
  },
  {
    id: "page-new",
    label: "Create / add new",
    description: "Trigger the primary “add new” action on the current page (patient, admin, injection, stock, etc.).",
    keys: ["Mod", "Shift", "1"],
    category: "page",
  },
  {
    id: "page-export",
    label: "Export data",
    description: "Export the current list, report, or table where available.",
    keys: ["Mod", "Shift", "E"],
    category: "page",
  },
  {
    id: "page-save",
    label: "Save changes",
    description: "Save the open form or settings on the current page.",
    keys: ["Mod", "Shift", "Enter"],
    category: "page",
  },
  {
    id: "page-refresh",
    label: "Refresh page data",
    description: "Reload the data shown on the current page.",
    keys: ["Mod", "Shift", "Y"],
    category: "page",
  },
  {
    id: "patients-new",
    label: "Add new patient",
    description: "Open the new patient form (Patients page).",
    keys: ["Alt", "Shift", "U"],
    category: "patients",
  },
  {
    id: "injections-log",
    label: "Log injection",
    description: "Open the log injection dialog (Injections page).",
    keys: ["Alt", "Shift", "I"],
    category: "injections",
  },
  {
    id: "appointments-slots",
    label: "Set available times",
    description: "Open the appointment slot manager (Appointments page).",
    keys: ["Alt", "Shift", "J"],
    category: "appointments",
  },
  {
    id: "stock-in",
    label: "Add stock shipment",
    description: "Open stock-in dialog (Stock page).",
    keys: ["Alt", "Shift", "L"],
    category: "stock",
  },
];

function altShiftChord(event: KeyboardEvent, key: string) {
  if (event.ctrlKey || event.metaKey) return false;
  if (!event.altKey || !event.shiftKey) return false;
  if (key === "enter") return event.key === "Enter";
  return event.key.toLowerCase() === key.toLowerCase();
}

export function resolveShortcutAction(event: KeyboardEvent): string | null {
  if (altShiftChord(event, "n")) return "notifications";
  if (altShiftChord(event, "m")) return "messages";
  if (altShiftChord(event, "i")) return "injections-log";
  if (altShiftChord(event, "j")) return "appointments-slots";
  if (altShiftChord(event, "l")) return "stock-in";
  if (altShiftChord(event, "u")) return "patients-new";
  if (chord(event, "k", { shift: true })) return "global-search";
  if (chord(event, "d", { shift: true })) return "theme";
  if (chord(event, "o", { shift: true })) return "language";
  if (chord(event, "p", { shift: true })) return "profile";
  if (chord(event, "b", { shift: true })) return "sidebar";
  if (chord(event, "q", { shift: true })) return "logout";
  if (chord(event, "1", { shift: true })) return "page-new";
  if (chord(event, "e", { shift: true })) return "page-export";
  if (chord(event, "y", { shift: true })) return "page-refresh";
  if (chord(event, "enter", { shift: true })) return "page-save";
  if (event.key === "?" && !event.ctrlKey && !event.metaKey && !event.altKey) return "help";
  if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey) return "page-search";
  if (event.key === "Escape") return "close";
  return null;
}
