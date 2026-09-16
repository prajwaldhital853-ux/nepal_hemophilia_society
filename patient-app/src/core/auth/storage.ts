import { Platform } from "react-native";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";

const ACCESS = "nhms-patient-access";
const REFRESH = "nhms-patient-refresh";
const DEVICE_FP = "nhms-patient-device-fp";

let memoryFingerprint = "";
let memorySignals: Record<string, string | number> | null = null;

async function installId(): Promise<string> {
  if (Platform.OS === "android") {
    return Application.androidId || "";
  }
  if (Platform.OS === "ios") {
    return (await Application.getIosIdForVendorAsync()) || "";
  }
  return Application.applicationId || "unknown-install";
}

export type PatientDeviceSignals = {
  brand: string;
  model: string;
  osName: string;
  osVersion: string;
  memory: number;
  installId: string;
};

export async function collectPatientDeviceSignals(): Promise<PatientDeviceSignals> {
  const install = await installId();
  return {
    brand: Device.brand || "",
    model: Device.modelName || "",
    osName: Device.osName || Platform.OS,
    osVersion: Device.osVersion || "",
    memory: Device.totalMemory || 0,
    installId: install,
  };
}

async function hashPatientSignals(signals: PatientDeviceSignals): Promise<string> {
  const parts = [
    signals.brand,
    signals.model,
    signals.osName,
    signals.osVersion,
    String(signals.memory),
    signals.installId,
  ].join("|");
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, parts);
}

export function encodePatientSignalsHeader(signals: PatientDeviceSignals): string {
  const bytes = new TextEncoder().encode(JSON.stringify(signals));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(binary);
  }
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    out += alphabet[a >> 2];
    out += alphabet[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : "=";
    out += i + 2 < bytes.length ? alphabet[c & 63] : "=";
  }
  return out;
}

export async function getPatientDeviceAuth(): Promise<{ deviceId: string; deviceSignals: PatientDeviceSignals }> {
  if (memoryFingerprint && memorySignals) {
    return { deviceId: memoryFingerprint, deviceSignals: memorySignals as PatientDeviceSignals };
  }
  try {
    const cached = await SecureStore.getItemAsync(DEVICE_FP);
    if (cached) {
      const parsed = JSON.parse(cached) as { deviceId: string; deviceSignals: PatientDeviceSignals };
      if (parsed.deviceId && parsed.deviceSignals?.installId) {
        memoryFingerprint = parsed.deviceId;
        memorySignals = parsed.deviceSignals;
        return parsed;
      }
    }
  } catch {
    // continue to compute
  }
  const deviceSignals = await collectPatientDeviceSignals();
  const deviceId = await hashPatientSignals(deviceSignals);
  memoryFingerprint = deviceId;
  memorySignals = deviceSignals;
  try {
    await SecureStore.setItemAsync(DEVICE_FP, JSON.stringify({ deviceId, deviceSignals }));
  } catch {
    // in-memory only for this session
  }
  return { deviceId, deviceSignals };
}

export async function getDeviceId() {
  const { deviceId } = await getPatientDeviceAuth();
  return deviceId;
}

export async function saveSession(access: string, refresh: string) {
  try {
    await SecureStore.setItemAsync(ACCESS, access);
    await SecureStore.setItemAsync(REFRESH, refresh);
  } catch {
    // Session still works for this app session via in-memory token in AuthContext.
  }
}

export async function loadSession() {
  try {
    const access = (await SecureStore.getItemAsync(ACCESS)) ?? "";
    const refresh = (await SecureStore.getItemAsync(REFRESH)) ?? "";
    return { access, refresh };
  } catch {
    return { access: "", refresh: "" };
  }
}

export async function clearSession() {
  try {
    await SecureStore.deleteItemAsync(ACCESS);
    await SecureStore.deleteItemAsync(REFRESH);
  } catch {
    // ignore
  }
}
