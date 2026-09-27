export type CookieOptions = {
  maxAge?: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
};

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 365;

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }
  return null;
}

export function setCookie(name: string, value: string, options: CookieOptions = {}) {
  if (typeof document === "undefined") return;
  const segments = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  segments.push(`path=${options.path ?? "/"}`);
  segments.push(`max-age=${options.maxAge ?? DEFAULT_MAX_AGE}`);
  segments.push(`SameSite=${options.sameSite ?? "Lax"}`);
  if (options.secure ?? (typeof location !== "undefined" && location.protocol === "https:")) {
    segments.push("Secure");
  }
  document.cookie = segments.join("; ");
}

export function deleteCookie(name: string, path = "/") {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0; SameSite=Lax`;
}
