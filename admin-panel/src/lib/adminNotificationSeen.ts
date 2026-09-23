export const ADMIN_ALERT_SEEN_KEY = "nhms-admin-alert-ids";

const recentPopups = new Map<number, number>();
const POPUP_DEDUPE_MS = 30_000;

export function loadAdminAlertSeenIds(): Set<number> {
  if (typeof window === "undefined") return new Set<number>();
  try {
    const raw = sessionStorage.getItem(ADMIN_ALERT_SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as number[]) : [];
    return new Set(parsed.filter((id) => Number.isFinite(id)));
  } catch {
    return new Set<number>();
  }
}

export function saveAdminAlertSeenIds(ids: Set<number>) {
  sessionStorage.setItem(ADMIN_ALERT_SEEN_KEY, JSON.stringify(Array.from(ids).slice(-500)));
}

export function markAdminAlertSeen(id: number) {
  if (!Number.isFinite(id)) return;
  const ids = loadAdminAlertSeenIds();
  ids.add(id);
  saveAdminAlertSeenIds(ids);
}

export function shouldShowAdminAlertPopup(id: number) {
  if (!Number.isFinite(id)) return true;
  const last = recentPopups.get(id);
  if (last && Date.now() - last < POPUP_DEDUPE_MS) return false;
  recentPopups.set(id, Date.now());
  return true;
}
