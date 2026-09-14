import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/core/auth/AuthContext";
import { usePatientClinicalStats } from "@/features/home/hooks/usePatientClinicalStats";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function StatsSidebar({ injections, iuUsed }: { injections: number; iuUsed: string }) {
  return (
    <View style={styles.statsCard}>
      <View style={styles.statsTopRow}>
        <View style={styles.statsDropWrap}>
          <Ionicons name="water" size={10} color={homeColors.white} />
        </View>
        <Text style={styles.statsLabel}>Total Injections</Text>
      </View>
      <Text style={styles.statsValue}>{injections}</Text>
      <Text style={styles.statsSub}>All Time</Text>
      <View style={styles.statsDivider} />
      <Text style={styles.statsIuLabel}>Total IU Used</Text>
      <Text style={styles.statsIu}>{iuUsed}</Text>
    </View>
  );
}

export function ProfileSummaryCard() {
  const { patient } = useAuth();
  const { totalInjections, totalIuLabel, formatDob } = usePatientClinicalStats();

  const name = patient?.fullName ?? "Patient";
  const id = patient?.id ?? "—";
  const status = patient?.status ?? "—";
  const dob = patient?.dateOfBirth ? formatDob(patient.dateOfBirth) : "—";
  const factorType = patient
    ? `${patient.deficientFactor} · ${patient.severity}${patient.treatmentPlan ? ` · ${patient.treatmentPlan}` : ""}`
    : "—";
  const location = patient?.province ? `${patient.district || "—"}, ${patient.province}` : "—";
  const treatmentCenter = patient?.primaryHospital || "—";
  const bloodGroup = patient?.bloodGroup ?? "—";

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={["#0A0A0A", "#1A0508", "#3A060C", "#7A1018", "#961018"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.card}
      >
        <View style={styles.row}>
          <View style={styles.midCol}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{name}</Text>
              {patient?.status ? (
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeText}>{status}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.idRow}>
              <Text style={styles.idText}>ID: {id}</Text>
            </View>
            <InfoRow icon="calendar-outline" label="Date of Birth" value={dob} />
            <InfoRow icon="water" label="Factor Type" value={factorType} />
            <InfoRow icon="location-outline" label="Location" value={location} />
            <InfoRow icon="business-outline" label="Treatment Center" value={treatmentCenter} />
            <InfoRow icon="water" label="Blood Group" value={bloodGroup} />
          </View>

          <View style={styles.rightCol}>
            <View style={styles.avatarFrame}>
              {patient?.photoUrl ? (
                <Image source={{ uri: patient.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{initials(name)}</Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="water" size={10} color={homeColors.white} />
              </View>
            </View>
            <Text style={styles.taglineTop}>Together for a</Text>
            <Text style={styles.taglineAccent}>Safer Tomorrow</Text>
            <Text style={styles.taglineSub}>SUPPORT • TREAT • AWARE</Text>
            <StatsSidebar injections={totalInjections} iuUsed={totalIuLabel} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={12} color={homeColors.primary} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { marginHorizontal: homeSpacing.screen },
  card: {
    borderRadius: homeRadii.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#5C0A12",
  },
  row: { flexDirection: "row", alignItems: "flex-start", padding: 12, gap: 8 },
  midCol: { flex: 1, minWidth: 0 },
  rightCol: { width: 118, alignItems: "center" },
  avatarFrame: {
    width: 78,
    height: 78,
    borderRadius: 14,
    backgroundColor: "#C1121F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: homeColors.white,
    backgroundColor: "#FEE2E2",
  },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 22, fontWeight: "800", color: homeColors.primary },
  avatarBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: homeColors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: homeColors.white,
  },
  taglineTop: { marginTop: 8, fontSize: 9, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  taglineAccent: { fontSize: 11, fontWeight: "800", color: homeColors.white, textAlign: "center" },
  taglineSub: { marginTop: 2, fontSize: 7.5, letterSpacing: 0.5, color: "rgba(255,255,255,0.55)", fontWeight: "600" },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  name: { fontSize: 15, fontWeight: "800", color: homeColors.white, flexShrink: 1 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(22,163,74,0.25)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: homeRadii.pill,
  },
  activeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: homeColors.green },
  activeText: { fontSize: 8.5, fontWeight: "600", color: "#86EFAC" },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 3,
    marginBottom: 4,
    backgroundColor: "rgba(193,18,31,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: homeRadii.pill,
  },
  idText: { fontSize: 10, fontWeight: "700", color: "#FECACA" },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 5, marginTop: 2 },
  infoIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  infoTextWrap: { flex: 1, minWidth: 0 },
  infoLabel: { fontSize: 8, color: "rgba(255,255,255,0.55)", lineHeight: 10 },
  infoValue: { fontSize: 10.5, fontWeight: "700", color: homeColors.white, lineHeight: 13 },
  statsCard: {
    width: "100%",
    marginTop: 10,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  statsTopRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statsDropWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsLabel: { fontSize: 7.5, color: "rgba(255,255,255,0.9)", fontWeight: "600", flexShrink: 1 },
  statsValue: {
    fontSize: 22,
    fontWeight: "800",
    color: homeColors.white,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 2,
  },
  statsSub: { fontSize: 7.5, color: "rgba(255,255,255,0.75)", textAlign: "center" },
  statsDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.25)", marginVertical: 4 },
  statsIuLabel: { fontSize: 7.5, color: "rgba(255,255,255,0.85)", textAlign: "center" },
  statsIu: { fontSize: 11, fontWeight: "800", color: homeColors.white, textAlign: "center", marginTop: 1 },
});
