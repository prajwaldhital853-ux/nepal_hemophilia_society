import { StyleSheet, Text, View } from "react-native";

import { AppConfig } from "@/core/config";
import { colors, spacing } from "@/core/theme";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🩸</Text>
      <Text style={styles.title}>{AppConfig.appName}</Text>
      <Text style={styles.subtitle}>Nepal Hemophilia Society</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    marginTop: spacing.md,
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textMuted,
  },
});
