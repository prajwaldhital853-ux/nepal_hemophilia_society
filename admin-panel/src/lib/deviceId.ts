/** Hardware fingerprint — same PC/laptop yields the same id in Chrome, Firefox, Edge, etc. */

export type DeviceSignals = {
  platform: string;
  screenW: number;
  screenH: number;
  colorDepth: number;
  pixelRatio: number;
  cores: number;
  memory: number;
  touch: number;
  timezone: string;
  locale: string;
};

let cachedId: string | null = null;
let cachedSignals: DeviceSignals | null = null;
let pending: Promise<{ deviceId: string; deviceSignals: DeviceSignals }> | null = null;

export function collectDeviceSignals(): DeviceSignals {
  if (typeof window === "undefined") {
    return {
      platform: "server",
      screenW: 0,
      screenH: 0,
      colorDepth: 0,
      pixelRatio: 1,
      cores: 0,
      memory: 0,
      touch: 0,
      timezone: "UTC",
      locale: "en",
    };
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    platform: navigator.platform || "",
    screenW: screen.width,
    screenH: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
    cores: navigator.hardwareConcurrency || 0,
    memory: nav.deviceMemory || 0,
    touch: navigator.maxTouchPoints || 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: Intl.DateTimeFormat().resolvedOptions().locale,
  };
}

async function hashSignals(signals: DeviceSignals): Promise<string> {
  const parts = [
    signals.platform,
    String(signals.screenW),
    String(signals.screenH),
    String(signals.colorDepth),
    String(signals.pixelRatio),
    String(signals.cores),
    String(signals.memory),
    String(signals.touch),
    signals.timezone,
    signals.locale,
  ].join("|");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(parts));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function encodeDeviceSignalsHeader(signals: DeviceSignals): string {
  const json = JSON.stringify(signals);
  if (typeof btoa === "function") return btoa(json);
  return Buffer.from(json, "utf-8").toString("base64");
}

export async function getAdminDeviceAuth(): Promise<{ deviceId: string; deviceSignals: DeviceSignals }> {
  if (cachedId && cachedSignals) return { deviceId: cachedId, deviceSignals: cachedSignals };
  if (!pending) {
    pending = (async () => {
      const deviceSignals = collectDeviceSignals();
      const deviceId = await hashSignals(deviceSignals);
      cachedId = deviceId;
      cachedSignals = deviceSignals;
      return { deviceId, deviceSignals };
    })();
  }
  return pending;
}

export async function getAdminDeviceId(): Promise<string> {
  const { deviceId } = await getAdminDeviceAuth();
  return deviceId;
}

export async function ensureAdminDeviceId(): Promise<string> {
  return getAdminDeviceId();
}
