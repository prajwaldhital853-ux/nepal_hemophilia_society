import { Platform, Vibration } from "react-native";

import { isExpoGo } from "@/features/notifications/expoGo";

export async function playPatientAlertSound() {
  if (Platform.OS === "web") return;
  try {
    Vibration.vibrate([0, 80, 40, 120]);
    if (isExpoGo()) return;
    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "NHMS",
        body: "You have a new update",
        sound: "default",
      },
      trigger: null,
    });
  } catch {
    // Alerts still appear in the notifications list without sound.
  }
}
