import { Platform, Vibration } from "react-native";

/** Vibrate only — never post a local system notification (that caused tray spam). */
export async function playPatientAlertSound() {
  if (Platform.OS === "web") return;
  try {
    Vibration.vibrate([0, 80, 40, 120]);
  } catch {
    // Optional haptic feedback only.
  }
}
