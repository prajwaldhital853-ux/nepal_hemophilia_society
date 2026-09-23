import {
  REFRESH_KEY,
  TOKEN_KEY,
  clearAuthStorage,
  readAuthValue,
  writeAuthValue,
} from "@/lib/authStorage";
import { encodeDeviceSignalsHeader, getAdminDeviceAuth } from "@/lib/deviceId";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

const API_FORM_TIMEOUT_MS = 120_000;

export class ApiClientError extends Error {
  status: number;
  code?: string;
  attemptsRemaining?: number;
  lockedUntil?: string;
  retryAfterSeconds?: number;

  constructor(
    message: string,
    status: number,
    extra?: { code?: string; attemptsRemaining?: number; lockedUntil?: string; retryAfterSeconds?: number },
  ) {
    super(message);
    this.status = status;
    this.code = extra?.code;
    this.attemptsRemaining = extra?.attemptsRemaining;
    this.lockedUntil = extra?.lockedUntil;
    this.retryAfterSeconds = extra?.retryAfterSeconds;
  }
}

async function applyDeviceHeaders(headers: Headers) {
  const { deviceId, deviceSignals } = await getAdminDeviceAuth();
  headers.set("X-Device-Id", deviceId);
  headers.set("X-Device-Signals", encodeDeviceSignalsHeader(deviceSignals));
}

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const origin = API_BASE.replace(/\/api\/v1\/?$/, "");
  return url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`;
}

export function getAccessToken() {
  return readAuthValue(TOKEN_KEY);
}

export function getRefreshToken() {
  return readAuthValue(REFRESH_KEY);
}

export function setAccessToken(token: string) {
  writeAuthValue(TOKEN_KEY, token);
}

export function setRefreshToken(token: string) {
  writeAuthValue(REFRESH_KEY, token);
}

export function setAuthTokens(access: string, refresh?: string) {
  setAccessToken(access);
  if (refresh) setRefreshToken(refresh);
}

export function clearAccessToken() {
  clearAuthStorage();
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const headers = new Headers({ "Content-Type": "application/json" });
    await applyDeviceHeaders(headers);
    const res = await fetch(`${API_BASE}/auth/refresh/`, {
      method: "POST",
      headers,
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

type ApiInit = RequestInit & { skipAuthRedirect?: boolean; _retried?: boolean };

const API_FIELD_LABELS: Record<string, string> = {
  wardNumber: "Ward number",
  fullName: "Full name",
  dateOfBirth: "Date of birth",
  mobile: "Mobile number",
  email: "Email",
  province: "Province",
  district: "District",
  localLevel: "Local level",
  address: "Address",
  bloodGroup: "Blood group",
  baselineFactorLevel: "Baseline factor level",
  primaryHospital: "Primary hospital",
  treatmentPlan: "Treatment plan",
  emergencyContactName: "Emergency contact name",
  emergencyContactPhone: "Emergency contact phone",
  temporaryPassword: "Temporary password",
};

function extractApiMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && value.length) return extractApiMessage(value[0]);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.string === "string" && record.string.trim()) return record.string.trim();
    if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
  }
  return null;
}

function formatApiError(data: unknown, fallback = "Request failed") {
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.error === "string" && record.error) return record.error;
  if (typeof record.detail === "string" && record.detail) return record.detail;
  if (Array.isArray(record.detail) && typeof record.detail[0] === "string") return record.detail[0];
  if (typeof record.detail === "object" && record.detail !== null) {
    const detail = record.detail as Record<string, unknown>;
    const nonField = detail.non_field_errors;
    if (Array.isArray(nonField) && typeof nonField[0] === "string") return nonField[0];
    for (const [key, value] of Object.entries(detail)) {
      if (key === "non_field_errors") continue;
      const message = extractApiMessage(value);
      if (message) {
        const label = API_FIELD_LABELS[key] || key.replace(/_/g, " ");
        return `${label}: ${message}`;
      }
    }
  }
  for (const [key, value] of Object.entries(record)) {
    if (["error", "detail", "code", "attemptsRemaining", "lockedUntil", "retryAfterSeconds"].includes(key)) continue;
    const message = extractApiMessage(value);
    if (message) {
      const label = API_FIELD_LABELS[key] || key.replace(/_/g, " ");
      return `${label}: ${message}`;
    }
  }
  return fallback;
}

export async function apiFetch(path: string, init: ApiInit = {}) {
  const { skipAuthRedirect, _retried, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("Content-Type", "application/json");
  await applyDeviceHeaders(headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  const data = await res.json().catch(() => ({}));
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
    window.location.href = "/login";
    return Promise.reject(new Error("Session expired"));
  }

  if (!res.ok) {
    const record = data as Record<string, unknown>;
    throw new ApiClientError(formatApiError(data), res.status, {
      code: typeof record.code === "string" ? record.code : undefined,
      attemptsRemaining: typeof record.attemptsRemaining === "number" ? record.attemptsRemaining : undefined,
      lockedUntil: typeof record.lockedUntil === "string" ? record.lockedUntil : undefined,
      retryAfterSeconds: typeof record.retryAfterSeconds === "number" ? record.retryAfterSeconds : undefined,
    });
  }
  return data;
}

export async function apiDownload(path: string, filename: string) {
  const headers = new Headers();
  await applyDeviceHeaders(headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let res = await fetch(`${API_BASE}${path}`, { headers });
  if (res.status === 401 && typeof window !== "undefined") {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      headers.set("Authorization", `Bearer ${nextToken}`);
      res = await fetch(`${API_BASE}${path}`, { headers });
    } else {
      clearAccessToken();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiClientError(formatApiError(data, "Download failed"), res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(/\.zip\.enc$/i, ".zip.enc");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function fetchFormOnce(path: string, formData: FormData, method: string, token: string) {
  const headers = new Headers();
  await applyDeviceHeaders(headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_FORM_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      body: formData,
      headers,
      signal: controller.signal,
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    if (text) {
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        data = {};
      }
    }
    return { res, data, raw: text };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Save timed out. The server may be waking up — wait a moment and try again.");
    }
    throw new Error("Could not reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
}

export async function apiForm<T = Record<string, unknown>>(
  path: string,
  formData: FormData,
  method = "POST",
): Promise<T> {
  const token = getAccessToken();
  let { res, data, raw } = await fetchFormOnce(path, formData, method, token);

  if (res.status === 401 && typeof window !== "undefined") {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      ({ res, data, raw } = await fetchFormOnce(path, formData, method, nextToken));
    } else {
      clearAccessToken();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const message = formatApiError(data, raw.trim().startsWith("<") ? `Server error (${res.status})` : "Request failed");
    throw new Error(message);
  }
  return data as T;
}
