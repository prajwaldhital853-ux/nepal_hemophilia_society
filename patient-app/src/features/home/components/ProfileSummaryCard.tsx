import { Ionicons } from "@expo/vector-icons";
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

function patientAgeYears(dob: string) {
  if (!dob) return "—";
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const m = now.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age -= 1;
  return `${age} years old`;
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
  const { totalInjections, totalIuLabel } = usePatientClinicalStats();

  const name = patient?.fullName ?? "Patient";
  const id = patient?.id ?? "—";
  const status = patient?.status ?? "—";
  const ageLabel = patient?.dateOfBirth ? patientAgeYears(patient.dateOfBirth) : "—";
  const factorType = patient
    ? `${patient.deficientFactor} · ${patient.severity}${patient.treatmentPlan ? ` · ${patient.treatmentPlan}` : ""}`
    : "—";
  const location = patient?.province ? `${patient.district || "—"}, ${patient.province}` : "—";
  const treatmentCenter = patient?.primaryHospital || "—";
  const bloodGroup = patient?.bloodGroup ?? "—";

  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.leftCol}>
            <View style={styles.avatarOuter}>
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
            <Text style={styles.metaId}>{id}</Text>
            <Text style={styles.metaBlood}>{bloodGroup}</Text>
            <Text style={styles.metaAge}>{ageLabel}</Text>
          </View>

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
            <InfoRow icon="water" label="Factor Type" value={factorType} />
            <InfoRow icon="location-outline" label="Location" value={location} />
            <InfoRow icon="business-outline" label="Treatment Center" value={treatmentCenter} />
          </View>

          <StatsSidebar injections={totalInjections} iuUsed={totalIuLabel} />
        </View>
      </View>
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
    backgroundColor: homeColors.white,
    borderRadius: homeRadii.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: homeColors.border,
  },
  row: { flexDirection: "row", alignItems: "flex-start", padding: 10, gap: 6 },
  leftCol: { alignItems: "center", width: 86 },
  avatarOuter: { position: "relative" },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: homeColors.white,
    backgroundColor: "#FEE2E2",
  },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 22, fontWeight: "800", color: homeColors.primary },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: homeColors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: homeColors.white,
  },
  metaId: {
    marginTop: 4,
    fontSize: 9.5,
    fontWeight: "700",
    color: homeColors.primary,
    textAlign: "center",
  },
  metaBlood: {
    marginTop: 2,
    fontSize: 9.5,
    fontWeight: "700",
    color: homeColors.navy,
    textAlign: "center",
  },
  metaAge: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "600",
    color: homeColors.textMuted,
    textAlign: "center",
  },
  midCol: { flex: 1, minWidth: 0, paddingTop: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4, marginBottom: 2 },
  name: { fontSize: 15, fontWeight: "800", color: homeColors.navy, flexShrink: 1 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: homeColors.greenBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: homeRadii.pill,
  },
  activeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: homeColors.green },
  activeText: { fontSize: 8.5, fontWeight: "600", color: homeColors.green },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 5, marginTop: 3 },
  infoIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  infoTextWrap: { flex: 1, minWidth: 0 },
  infoLabel: { fontSize: 8, color: homeColors.textMuted, lineHeight: 10 },
  infoValue: { fontSize: 10.5, fontWeight: "700", color: homeColors.navy, lineHeight: 13 },
  statsCard: {
    width: 104,
    minHeight: 132,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignSelf: "flex-start",
    backgroundColor: homeColors.primary,
    justifyContent: "space-between",
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
    fontSize: 26,
    fontWeight: "800",
    color: homeColors.white,
    lineHeight: 28,
    textAlign: "center",
    marginTop: 2,
  },
  statsSub: { fontSize: 7.5, color: "rgba(255,255,255,0.75)", textAlign: "center" },
  statsDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.25)", marginVertical: 4 },
  statsIuLabel: { fontSize: 7.5, color: "rgba(255,255,255,0.85)", textAlign: "center" },
  statsIu: { fontSize: 11, fontWeight: "800", color: homeColors.white, textAlign: "center", marginTop: 1 },
});
