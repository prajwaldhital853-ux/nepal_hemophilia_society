/** Admin auth uses sessionStorage by default; localStorage when "Remember me" is enabled. */

export const TOKEN_KEY = "nhms-access-token";
export const REFRESH_KEY = "nhms-refresh-token";
export const USER_KEY = "nhms-admin-user";
export const REMEMBER_KEY = "nhms-admin-remember";
export const REMEMBER_USERNAME_KEY = "nhms-admin-remember-username";

const AUTH_KEYS = [TOKEN_KEY, REFRESH_KEY, USER_KEY] as const;

export function isRememberMe() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(REMEMBER_KEY) === "1";
}

export function setRememberMe(remember: boolean, username?: string) {
  if (typeof window === "undefined") return;
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, "1");
    if (username) localStorage.setItem(REMEMBER_USERNAME_KEY, username);
    for (const key of AUTH_KEYS) sessionStorage.removeItem(key);
  } else {
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(REMEMBER_USERNAME_KEY);
    for (const key of AUTH_KEYS) localStorage.removeItem(key);
  }
}

export function readRememberedUsername() {
  if (typeof window === "undefined") return "";
  return isRememberMe() ? localStorage.getItem(REMEMBER_USERNAME_KEY) ?? "" : "";
}

function storage() {
  if (typeof window === "undefined") return null;
  return isRememberMe() ? window.localStorage : window.sessionStorage;
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

/** Drop tokens cached in localStorage from older builds unless remember-me is on. */
export function migrateLegacyAuthStorage() {
  if (typeof window === "undefined") return;
  if (isRememberMe()) return;
  for (const key of AUTH_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, legacy);
    }
    localStorage.removeItem(key);
  }
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  for (const key of AUTH_KEYS) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
}
