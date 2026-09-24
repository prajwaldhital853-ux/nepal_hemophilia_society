import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { patientApi } from "@/core/api";
import { invalidatePatientData } from "@/core/patientDataEvents";
import { playPatientAlertSound } from "@/features/notifications/alertSound";
import { isExpoGo } from "@/features/notifications/expoGo";

export { isExpoGo };

async function saveToken(authToken: string, pushToken: string) {
  await patientApi("/notifications/push-token/", {
    method: "POST",
    token: authToken,
    body: JSON.stringify({ token: pushToken, platform: Platform.OS, app: "patient" }),
  });
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

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
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

    Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      const category = String(data?.category || data?.relatedType || "all");
      void playPatientAlertSound();
      invalidatePatientData([category]);
    });

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

    try {
      const expoToken = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      if (expoToken.data) await saveToken(authToken, expoToken.data);
    } catch {
      // EAS project or FCM may not be configured yet.
    }

    try {
      const device = await Notifications.getDevicePushTokenAsync();
      const native = typeof device.data === "string" ? device.data : "";
      if (native && !native.startsWith("ExponentPushToken")) {
        await saveToken(authToken, native);
      }
    } catch {
      // Native FCM token appears after google-services.json is added.
    }
  } catch {
    // Push module unavailable — in-app alerts still work.
  }
}
