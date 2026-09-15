export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const origin = API_BASE.replace(/\/api\/v1\/?$/, "");
  return url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`;
}

const TOKEN_KEY = "nhms-access-token";
const REFRESH_KEY = "nhms-refresh-token";

export function getAccessToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function getRefreshToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(REFRESH_KEY) ?? "";
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_KEY, token);
}

export function setAuthTokens(access: string, refresh?: string) {
  setAccessToken(access);
  if (refresh) setRefreshToken(refresh);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

type ApiInit = RequestInit & { skipAuthRedirect?: boolean; _retried?: boolean };

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access) return null;
    setAuthTokens(data.access, typeof data.refresh === "string" ? data.refresh : refresh);
    return data.access as string;
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, init: ApiInit = {}) {
  const { skipAuthRedirect, _retried, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  let data = await res.json().catch(() => ({}));
  const isLogin = path.startsWith("/auth/login");
  const isRefresh = path.startsWith("/auth/refresh");

  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    !skipAuthRedirect &&
    !isLogin &&
    !isRefresh &&
    !_retried
  ) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      return apiFetch(path, { ...init, _retried: true });
    }
    clearAccessToken();
    localStorage.removeItem("nhms-admin-user");
    window.location.href = "/login";
    return Promise.reject(new Error("Session expired"));
  }

  if (!res.ok) {
    const detail = data.detail;
    const message =
      (typeof data.error === "string" && data.error) ||
      (typeof detail === "string" && detail) ||
      (Array.isArray(detail) && typeof detail[0] === "string" && detail[0]) ||
      (typeof detail === "object" && detail !== null && typeof (detail as { non_field_errors?: string[] }).non_field_errors?.[0] === "string"
        ? (detail as { non_field_errors: string[] }).non_field_errors[0]
        : null) ||
      "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function apiForm(path: string, formData: FormData, method = "POST") {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let res = await fetch(`${API_BASE}${path}`, { method, body: formData, headers });
  let data = await res.json().catch(() => ({}));

  if (res.status === 401 && typeof window !== "undefined") {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      const retryHeaders = new Headers();
      retryHeaders.set("Authorization", `Bearer ${nextToken}`);
      res = await fetch(`${API_BASE}${path}`, { method, body: formData, headers: retryHeaders });
      data = await res.json().catch(() => ({}));
    } else {
      clearAccessToken();
      localStorage.removeItem("nhms-admin-user");
      window.location.href = "/login";
    }
  }

  if (!res.ok) {
    const message =
      (typeof data.error === "string" && data.error) ||
      (typeof data.detail === "string" && data.detail) ||
      "Request failed";
    throw new Error(message);
  }
  return data;
}
