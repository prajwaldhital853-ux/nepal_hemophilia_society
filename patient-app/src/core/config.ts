import Constants from "expo-constants";
import { Platform } from "react-native";

/** Fix common .env typos like 192.168.1.3.8000/qpi/v1 */
export function normalizeApiBaseUrl(raw: string) {
  let url = raw.trim().replace(/\/$/, "");
  url = url.replace(/(\d+\.\d+\.\d+\.\d+)\.(\d{2,5})(?=\/|$)/, "$1:$2");
  url = url.replace(/\/qpi\b/i, "/api");
  return url;
}

function resolveApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return normalizeApiBaseUrl(fromEnv);

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

export const AppConfig = {
  appName: "NHMS Patient",
  apiBaseUrl: resolveApiBaseUrl(),
};
