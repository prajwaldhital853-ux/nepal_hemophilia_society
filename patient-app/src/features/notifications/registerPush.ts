import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { patientApi } from "@/core/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function saveToken(authToken: string, pushToken: string) {
  await patientApi("/notifications/push-token/", {
    method: "POST",
    token: authToken,
    body: JSON.stringify({ token: pushToken, platform: Platform.OS, app: "patient" }),
  });
}

/** Register Expo (works in Expo Go) and native FCM tokens (after Firebase is configured). */
export async function registerPatientPush(authToken: string) {
  if (!Device.isDevice) return;
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
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  try {
    const expoToken = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (expoToken.data) await saveToken(authToken, expoToken.data);
  } catch {
    // Expo push needs the EAS project. In-app alerts still work.
  }

  try {
    const device = await Notifications.getDevicePushTokenAsync();
    const native = typeof device.data === "string" ? device.data : "";
    if (native && !native.startsWith("ExponentPushToken")) {
      await saveToken(authToken, native);
    }
  } catch {
    // Native FCM token appears after google-services.json is added to a release/dev build.
  }
}
