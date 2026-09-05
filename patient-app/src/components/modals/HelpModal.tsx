import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/core/theme";

type HelpModalProps = {
  onClose: () => void;
};

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Login Help</Text>
          <Text style={styles.body}>
            Contact your Province Admin if you need account access. After registration
            is verified, you will receive your Unique Patient ID and login credentials.
          </Text>
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  body: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  button: {
    marginTop: spacing.lg,
    alignSelf: "flex-end",
    backgroundColor: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
