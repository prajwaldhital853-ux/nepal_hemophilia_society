import { AppConfig } from "@/core/config";

export const API_TIMEOUT_MS = 12000;
export const AUTH_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  status: number;
  code?: string;
  attemptsRemaining?: number;

  constructor(message: string, status: number, extra?: { code?: string; attemptsRemaining?: number }) {
    super(message);
    this.status = status;
    this.code = extra?.code;
    this.attemptsRemaining = extra?.attemptsRemaining;
  }
}

const NETWORK_HELP =
  "Start Django with: python manage.py runserver 0.0.0.0:8000 (not 127.0.0.1). Phone and PC must be on the same Wi‑Fi.";

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

type ApiOptions = RequestInit & { token?: string; timeoutMs?: number };

export async function patientApi(path: string, init: ApiOptions = {}) {
  const { timeoutMs = API_TIMEOUT_MS, token, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (!(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${AppConfig.apiBaseUrl}${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) {
      throw new ApiError(
        typeof data.error === "string" ? data.error : "Request failed",
        res.status,
        { code: data.code, attemptsRemaining: data.attemptsRemaining },
      );
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(`Cannot reach server (${AppConfig.apiBaseUrl}). ${NETWORK_HELP}`, 0);
    }
    const message = error instanceof Error ? error.message : "Network error";
    throw new ApiError(`Network error: ${message}. ${NETWORK_HELP}`, 0);
  } finally {
    clearTimeout(timer);
  }
}

/** Quick ping used on the login screen so users see connectivity issues before submitting. */
export async function checkApiReachable(timeoutMs = 5000) {
  return patientApi("/health/", { method: "GET", timeoutMs });
}
