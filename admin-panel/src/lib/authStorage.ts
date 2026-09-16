/** Admin auth lives in sessionStorage — ends when the tab/browser closes or the user logs out. */

export const TOKEN_KEY = "nhms-access-token";
export const REFRESH_KEY = "nhms-refresh-token";
export const USER_KEY = "nhms-admin-user";

const AUTH_KEYS = [TOKEN_KEY, REFRESH_KEY, USER_KEY] as const;

function storage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function readAuthValue(key: string) {
  return storage()?.getItem(key) ?? "";
}

export function writeAuthValue(key: string, value: string) {
  storage()?.setItem(key, value);
}

export function removeAuthValue(key: string) {
  storage()?.removeItem(key);
}

/** Drop tokens cached in localStorage from older builds. */
export function migrateLegacyAuthStorage() {
  if (typeof window === "undefined") return;
  for (const key of AUTH_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, legacy);
    }
    localStorage.removeItem(key);
  }
}

export function clearAuthStorage() {
  const store = storage();
  if (store) {
    for (const key of AUTH_KEYS) store.removeItem(key);
  }
  if (typeof window !== "undefined") {
    for (const key of AUTH_KEYS) localStorage.removeItem(key);
  }
}
