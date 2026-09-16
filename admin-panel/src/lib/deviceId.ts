const STORAGE_KEY = "nhms-admin-device-id";
const MIN_LENGTH = 8;

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function isValid(id: string) {
  return id.trim().length >= MIN_LENGTH;
}

export function getAdminDeviceId() {
  if (typeof window === "undefined") return randomId();
  try {
    let id = window.localStorage.getItem(STORAGE_KEY)?.trim() || "";
    if (!isValid(id)) {
      id = randomId();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

/** Call on login screen mount so a device id exists before the first submit. */
export function ensureAdminDeviceId() {
  return getAdminDeviceId();
}
