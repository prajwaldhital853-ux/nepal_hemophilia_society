import { AppConfig, isRemoteApiUrl, networkHelpForApi } from "@/core/config";

/** Render free tier can cold-start 30–60s; allow extra time for remote API. */
export const API_TIMEOUT_MS = isRemoteApiUrl() ? 45000 : 12000;
export const AUTH_TIMEOUT_MS = isRemoteApiUrl() ? 45000 : 8000;

export class ApiError extends Error {
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

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

type ApiOptions = RequestInit & { token?: string; timeoutMs?: number; _retried?: boolean };

async function refreshPatientAccessToken(): Promise<string | null> {
  const { loadSession, saveSession } = await import("@/core/auth/storage");
  const session = await loadSession();
  if (!session.refresh) return null;
  try {
    const res = await fetch(`${AppConfig.apiBaseUrl}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: session.refresh }),
    });
    const data = await parseJsonSafe(res);
    if (!res.ok || !data.access) return null;
    await saveSession(data.access, typeof data.refresh === "string" ? data.refresh : session.refresh);
    return data.access as string;
  } catch {
    return null;
  }
}

export async function patientApi(path: string, init: ApiOptions = {}) {
  const { timeoutMs = API_TIMEOUT_MS, token, _retried, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (!(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const { encodePatientSignalsHeader, getPatientDeviceAuth } = await import("@/core/auth/storage");
  const { deviceId, deviceSignals } = await getPatientDeviceAuth();
  headers.set("X-Device-Id", deviceId);
  headers.set("X-Device-Signals", encodePatientSignalsHeader(deviceSignals));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${AppConfig.apiBaseUrl}${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
    });
    const data = await parseJsonSafe(res);
    const isRefresh = path.startsWith("/auth/refresh");
    const isLogin = path.startsWith("/auth/patient/login");
    if (res.status === 401 && token && !isRefresh && !isLogin && !_retried) {
      const nextToken = await refreshPatientAccessToken();
      if (nextToken) {
        return patientApi(path, { ...init, token: nextToken, _retried: true });
      }
    }
    if (!res.ok) {
      throw new ApiError(
        typeof data.error === "string" ? data.error : "Request failed",
        res.status,
        {
          code: data.code,
          attemptsRemaining: data.attemptsRemaining,
          lockedUntil: data.lockedUntil,
          retryAfterSeconds: data.retryAfterSeconds,
        },
      );
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(`Cannot reach server (${AppConfig.apiBaseUrl}). ${networkHelpForApi()}`, 0);
    }
    const message = error instanceof Error ? error.message : "Network error";
    throw new ApiError(`Network error: ${message}. ${networkHelpForApi()}`, 0);
  } finally {
    clearTimeout(timer);
  }
}

/** Quick ping used on the login screen so users see connectivity issues before submitting. */
export async function checkApiReachable(timeoutMs = 5000) {
  return patientApi("/health/", { method: "GET", timeoutMs });
}
