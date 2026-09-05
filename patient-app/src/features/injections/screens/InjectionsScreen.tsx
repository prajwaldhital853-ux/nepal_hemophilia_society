import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/core/theme";

export default function InjectionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.empty}>
        Injection records will load from the API once the patient backend is connected.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
    justifyContent: "center",
  },
  empty: {
    textAlign: "center",
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
