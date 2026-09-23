/** No-op stub used in Expo Go / local dev so expo-notifications never initializes. */

export const AndroidImportance = {
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
  MAX: 5,
};

export function setNotificationHandler(_handler: unknown) {}

export async function getPermissionsAsync() {
  return { status: "denied" as const, granted: false, canAskAgain: false };
}

export async function requestPermissionsAsync() {
  return { status: "denied" as const, granted: false, canAskAgain: false };
}

export async function setNotificationChannelAsync(_id: string, _channel: unknown) {}

export async function getExpoPushTokenAsync(_options?: unknown) {
  return { data: "" };
}

export async function getDevicePushTokenAsync() {
  return { data: "" };
}

export function addNotificationReceivedListener(_listener: unknown) {
  return { remove: () => undefined };
}

export function addNotificationResponseReceivedListener(_listener: unknown) {
  return { remove: () => undefined };
}
