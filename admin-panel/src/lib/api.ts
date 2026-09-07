const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

const TOKEN_KEY = "nhms-access-token";

export function getAccessToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type ApiInit = RequestInit & { skipAuthRedirect?: boolean };

export async function apiFetch(path: string, init: ApiInit = {}) {
  const { skipAuthRedirect, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  const data = await res.json().catch(() => ({}));
  const isLogin = path.startsWith("/auth/login");
  if (res.status === 401 && typeof window !== "undefined" && !skipAuthRedirect && !isLogin) {
    clearAccessToken();
    window.location.href = "/login";
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

export async function apiForm(path: string, formData: FormData, method = "POST") {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { method, body: formData, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== "undefined") {
    clearAccessToken();
    window.location.href = "/login";
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
