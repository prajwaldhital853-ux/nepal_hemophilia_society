import { StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { colors, spacing } from "@/core/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.lead}>
        Register with hemophilia type, severity, province, and diagnosis documents.
      </Text>
      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Mobile Number" keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Hemophilia Type (A or B)" placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.input} placeholder="Severity (Mild / Moderate / Severe)" placeholderTextColor={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  lead: {
    marginBottom: spacing.lg,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  input: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.text,
  },
});
