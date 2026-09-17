import Constants from "expo-constants";
import { Platform } from "react-native";

/** Live API on Render — used by Expo Go unless you override in .env */
export const PRODUCTION_API_URL = "https://nepal-hemophilia-society.onrender.com/api/v1";

/** Fix common .env typos like 192.168.1.3.8000/qpi/v1 */
export function normalizeApiBaseUrl(raw: string) {
  let url = raw.trim().replace(/\/$/, "");
  url = url.replace(/(\d+\.\d+\.\d+\.\d+)\.(\d{2,5})(?=\/|$)/, "$1:$2");
  url = url.replace(/\/qpi\b/i, "/api");
  return url;
}

function resolveLocalDevApiUrl() {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost?.split(":")[0] ??
    Constants.expoConfig?.hostUri?.split(":")[0];

  if (debuggerHost && !["localhost", "127.0.0.1"].includes(debuggerHost)) {
    return `http://${debuggerHost}:8000/api/v1`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000/api/v1";
  }

  return "http://127.0.0.1:8000/api/v1";
}

function resolveApiBaseUrl() {
  const useLocal = process.env.EXPO_PUBLIC_USE_LOCAL_API === "true";
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (useLocal) {
    if (fromEnv) return normalizeApiBaseUrl(fromEnv);
    return resolveLocalDevApiUrl();
  }

  // Expo Go default: Render. Ignore stale local http:// URLs in .env unless USE_LOCAL_API=true.
  if (fromEnv && isRemoteApiUrl(fromEnv)) return normalizeApiBaseUrl(fromEnv);

  return PRODUCTION_API_URL;
}

const apiBaseUrl = resolveApiBaseUrl();

export function isRemoteApiUrl(url = apiBaseUrl) {
  return url.startsWith("https://") || url.includes("onrender.com");
}

export function networkHelpForApi(url = apiBaseUrl) {
  if (isRemoteApiUrl(url)) {
    return "The NHS server may take up to a minute to wake up on first use. Check mobile data/Wi‑Fi and try again.";
  }
  return "Start Django with: python manage.py runserver 0.0.0.0:8000 (not 127.0.0.1). Phone and PC must be on the same Wi‑Fi.";
}

export const AppConfig = {
  appName: "NHMS Patient",
  apiBaseUrl,
};
