import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  // Expo Go on a physical phone: reuse the Metro host IP for Django on port 8000.
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
