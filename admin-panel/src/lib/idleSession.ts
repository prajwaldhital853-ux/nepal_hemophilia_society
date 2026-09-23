export const ADMIN_IDLE_MS = 5 * 60 * 60 * 1000;
const ACTIVITY_KEY = "nhms-admin-last-activity";

export function touchAdminActivity() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
}

export function adminIdleMs() {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(ACTIVITY_KEY);
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Date.now() - parsed : 0;
}

export function adminIdleExceeded() {
  return adminIdleMs() >= ADMIN_IDLE_MS;
}
