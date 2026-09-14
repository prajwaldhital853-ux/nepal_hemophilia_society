import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/core/theme";

export function FactorEmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

export function FactorLoading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  title: { fontSize: 14, fontWeight: "700", color: colors.text },
  message: { marginTop: 6, fontSize: 12, lineHeight: 18, color: colors.textMuted },
  center: { paddingVertical: spacing.xl, alignItems: "center" },
});
