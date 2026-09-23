import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/core/auth/AuthContext";
import { useClearTopics } from "@/features/notifications/useClearTopics";
import { servicesColors } from "@/features/services/theme/servicesTheme";

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
  useClearTopics("EmergencyId");
  const { patient } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.badge}>EMERGENCY ID</Text>
        <Text style={styles.name}>{patient?.fullName || "Patient"}</Text>
        <Text style={styles.id}>{patient?.id || "—"}</Text>
        <Row label="Hemophilia" value={patient?.hemophiliaType ? `Type ${patient.hemophiliaType}` : undefined} />
        <Row label="Severity" value={patient?.severity} />
        <Row label="Factor" value={patient?.deficientFactor} />
        <Row label="Baseline" value={patient?.baselineFactorLevel ? `${patient.baselineFactorLevel}%` : undefined} />
        <Row label="Blood group" value={patient?.bloodGroup} />
        <Row label="Hospital" value={patient?.primaryHospital} />
        <Row label="Plan" value={patient?.treatmentPlan} />
        <Row label="Patient mobile" value={patient?.mobile} />
        <Row label="Emergency contact" value={patient?.emergencyContactName} />
        <Row label="Relation" value={patient?.emergencyContactRelation} />
        <Text style={styles.hint}>Show this card to emergency staff. Data comes from your verified NHMS profile.</Text>
      </View>
      {patient?.emergencyContactPhone ? (
        <Pressable style={styles.call} onPress={() => void Linking.openURL(`tel:${patient.emergencyContactPhone}`)}>
          <Text style={styles.callText}>Call emergency contact</Text>
        </Pressable>
      ) : null}
      {patient?.mobile ? (
        <Pressable style={styles.callAlt} onPress={() => void Linking.openURL(`tel:${patient.mobile}`)}>
          <Text style={styles.callAltText}>Call patient mobile</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#111827" },
  content: { padding: 16, paddingBottom: 40, justifyContent: "center", flexGrow: 1 },
  card: {
    backgroundColor: "#7F1D1D",
    borderRadius: 22,
    padding: 22,
  },
  badge: { color: "#FECACA", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  name: { marginTop: 8, color: "#fff", fontSize: 26, fontWeight: "800" },
  id: { marginTop: 2, color: "#FECACA", fontSize: 14, fontWeight: "700", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 8 },
  label: { color: "#FECACA", fontSize: 12 },
  value: { color: "#fff", fontSize: 13, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  hint: { marginTop: 16, color: "#FECACA", fontSize: 12, lineHeight: 18 },
  call: { marginTop: 14, backgroundColor: "#fff", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  callText: { color: "#7F1D1D", fontWeight: "800" },
  callAlt: { marginTop: 8, borderWidth: 1, borderColor: "#FECACA", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  callAltText: { color: "#FECACA", fontWeight: "800" },
});
