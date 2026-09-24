import * as Device from "expo-device";
import { Platform } from "react-native";

import { patientApi } from "@/core/api";
import { invalidatePatientData, requestPatientNotificationRefresh } from "@/core/patientDataEvents";
import { isExpoGo } from "@/features/notifications/expoGo";

export { isExpoGo };

let pushReady = false;
let receivedListener: { remove: () => void } | null = null;

async function saveToken(authToken: string, pushToken: string) {
  await patientApi("/notifications/push-token/", {
    method: "POST",
    token: authToken,
    body: JSON.stringify({ token: pushToken, platform: Platform.OS, app: "patient" }),
  });
}

async function registerNativeToken(authToken: string) {
  const Notifications = await import("expo-notifications");
  try {
    const device = await Notifications.getDevicePushTokenAsync();
    const native = typeof device.data === "string" ? device.data : "";
    if (native && !native.startsWith("ExponentPushToken")) {
      await saveToken(authToken, native);
    }
  } catch {
    // Native FCM token appears after google-services.json is added.
  }
}

/**
 * Register device push tokens for standalone / dev-client builds only.
 * Skipped in Expo Go — push is unreliable there and crashes Android on startup.
 * In-app notification bell still works via API polling.
 */
export async function registerPatientPush(authToken: string) {
  if (isExpoGo() || !Device.isDevice) return;

  try {
    const Notifications = await import("expo-notifications");

    if (!pushReady) {
      Notifications.setNotificationHandler({
        // App is open: update the in-app bell via polling/refresh — do not flood the tray.
        handleNotification: async () => ({
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: true,
          shouldShowBanner: false,
          shouldShowList: false,
        }),
      });

      const existing = await Notifications.getPermissionsAsync();
      let status = existing.status;
      if (status !== "granted") {
        status = (await Notifications.requestPermissionsAsync()).status;
      }
      if (status !== "granted") return;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "NHMS alerts",
          importance: Notifications.AndroidImportance.HIGH,
          sound: "default",
          vibrationPattern: [0, 250, 120, 250],
          enableVibrate: true,
        });
      }

      receivedListener?.remove();
      receivedListener = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data as Record<string, unknown> | undefined;
        const category = String(data?.category || data?.relatedType || "all");
        invalidatePatientData([category]);
        requestPatientNotificationRefresh();
      });

      pushReady = true;
    }

    await registerNativeToken(authToken);
  } catch {
    // Push module unavailable — in-app alerts still work.
  }
}
