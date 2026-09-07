import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const ACCESS = "nhms-patient-access";
const REFRESH = "nhms-patient-refresh";
const DEVICE = "nhms-patient-device-id";

let memoryDeviceId = "";

export async function getDeviceId() {
  try {
    let id = await SecureStore.getItemAsync(DEVICE);
    if (!id) {
      id = Crypto.randomUUID();
      await SecureStore.setItemAsync(DEVICE, id);
    }
    return id;
  } catch {
    if (!memoryDeviceId) memoryDeviceId = Crypto.randomUUID();
    return memoryDeviceId;
  }
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
