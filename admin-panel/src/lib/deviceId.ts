const STORAGE_KEY = "nhms-admin-device-id";

export function getAdminDeviceId() {
  if (typeof window === "undefined") return "server-device-placeholder";
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = window.crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `fallback-${Date.now()}`;
  }
}
