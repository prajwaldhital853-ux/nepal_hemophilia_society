import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

import { APP_LOGO } from "@/core/assets";
import { AppConfig } from "@/core/config";
import { colors, spacing } from "@/core/theme";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="NHMS logo" />
      <Text style={styles.title}>{AppConfig.appName}</Text>
      <Text style={styles.subtitle}>Nepal Hemophilia Society</Text>
      <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.lg,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  loader: {
    marginTop: spacing.xl,
  },
});
