import { StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/core/auth/AuthContext";
import { colors, spacing } from "@/core/theme";

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function EmergencyIdScreen() {
  const { patient } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.badge}>EMERGENCY ID</Text>
        <Text style={styles.name}>{patient?.fullName || "Patient"}</Text>
        <Text style={styles.id}>{patient?.id || "—"}</Text>
        <Row label="Hemophilia" value={patient?.hemophiliaType ? `Type ${patient.hemophiliaType}` : undefined} />
        <Row label="Severity" value={patient?.severity} />
        <Row label="Factor" value={patient?.deficientFactor} />
        <Row label="Blood group" value={patient?.bloodGroup} />
        <Row label="Hospital" value={patient?.primaryHospital} />
        <Row label="Mobile" value={patient?.mobile} />
        <Text style={styles.hint}>Show this card to emergency staff. Data comes from your verified NHMS profile.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#111827", padding: spacing.lg, justifyContent: "center" },
  card: {
    backgroundColor: "#7F1D1D",
    borderRadius: 20,
    padding: 22,
  },
  badge: { color: "#FECACA", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  name: { marginTop: 8, color: "#fff", fontSize: 24, fontWeight: "800" },
  id: { marginTop: 2, color: "#FECACA", fontSize: 14, fontWeight: "700", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 8 },
  label: { color: "#FECACA", fontSize: 12 },
  value: { color: "#fff", fontSize: 13, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  hint: { marginTop: 16, color: "#FECACA", fontSize: 12, lineHeight: 18 },
});
