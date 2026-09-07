import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useAuth } from "@/core/auth/AuthContext";
import { mockPatient } from "@/features/home/data/mockPatientData";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

const PATIENT_PHOTO = require("../../../../assets/images/mock-patient-photo.jpg");

function SaferTomorrowSlogan() {
  return (
    <View style={styles.sloganWrap}>
      <View style={styles.sloganTextCol}>
        <Text style={styles.sloganLine}>Together</Text>
        <Text style={styles.sloganLine}>
          for a <Text style={styles.sloganBold}>Safer</Text>
        </Text>
        <Text style={styles.sloganLine}>Tomorrow</Text>
        <Text style={styles.sloganSub}>SUPPORT • TREAT • AWARE</Text>
      </View>
      <Svg width={34} height={36} viewBox="0 0 34 36" style={styles.sloganPulse}>
        <Path
          d="M2 18 H8 L10 14 L12 22 L14 18 H18 L20 10 L22 26 L24 18 H30"
          stroke={homeColors.primary}
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M30 18 C30 15 32 13 34 15 C34 18 32 20 30 18 Z"
          stroke={homeColors.primary}
          strokeWidth={1.3}
          fill="none"
        />
      </Svg>
    </View>
  );
}

function StatsSidebar({ injections, iuUsed }: { injections: number; iuUsed: string }) {
  return (
    <LinearGradient colors={["#C1121F", "#8B0E18", "#6B0E16"]} style={styles.statsCard}>
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
      <View style={styles.statsFooterBox}>
        <Ionicons name="people" size={14} color={homeColors.primary} />
        <Text style={styles.statsFooterText}>EVERY INJECTION BUILDS A BRIGHTER TOMORROW</Text>
      </View>
    </LinearGradient>
  );
}

export function ProfileSummaryCard() {
  const { patient } = useAuth();
  const p = {
    name: patient?.fullName ?? mockPatient.name,
    id: patient?.id ?? mockPatient.id,
    status: (patient?.status as "Active") ?? mockPatient.status,
    dob: patient?.dateOfBirth ?? mockPatient.dob,
    factorType: patient ? `${patient.deficientFactor} · ${patient.severity}` : mockPatient.factorType,
    location: patient ? `${patient.district}, ${patient.province}` : mockPatient.location,
    bloodGroup: patient?.bloodGroup ?? mockPatient.bloodGroup,
    totalInjections: mockPatient.totalInjections,
    totalIuUsed: mockPatient.totalIuUsed,
    photoUrl: patient?.photoUrl,
  };

  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.leftCol}>
            <View style={styles.avatarOuter}>
              <Image source={p.photoUrl ? { uri: p.photoUrl } : PATIENT_PHOTO} style={styles.avatar} />
              <View style={styles.avatarBadge}>
                <Ionicons name="water" size={10} color={homeColors.white} />
              </View>
            </View>
            <SaferTomorrowSlogan />
          </View>

          <View style={styles.midCol}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{p.name}</Text>
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>{p.status}</Text>
              </View>
            </View>
            <View style={styles.idRow}>
              <Text style={styles.idText}>ID: {p.id}</Text>
              <Pressable hitSlop={6}>
                <Ionicons name="copy-outline" size={14} color={homeColors.primary} />
              </Pressable>
            </View>
            <InfoRow icon="calendar-outline" label="Date of Birth" value={p.dob} />
            <InfoRow icon="water" label="Factor Type" value={p.factorType} />
            <InfoRow icon="location-outline" label="Location" value={p.location} />
            <InfoRow icon="water" label="Blood Group" value={p.bloodGroup} />
          </View>

          <StatsSidebar injections={p.totalInjections} iuUsed={p.totalIuUsed} />
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
        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: homeSpacing.screen,
  },
  card: {
    backgroundColor: homeColors.white,
    borderRadius: homeRadii.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: homeColors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    paddingBottom: 14,
  },
  leftCol: {
    alignItems: "center",
    width: 96,
  },
  avatarOuter: {
    position: "relative",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: homeColors.white,
    backgroundColor: "#FEE2E2",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: homeColors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: homeColors.white,
  },
  sloganWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 2,
  },
  sloganTextCol: {
    flexShrink: 1,
  },
  sloganLine: {
    fontSize: 8.5,
    color: homeColors.navy,
    lineHeight: 11,
  },
  sloganBold: {
    fontWeight: "800",
    color: homeColors.primary,
  },
  sloganSub: {
    fontSize: 6,
    color: homeColors.textMuted,
    letterSpacing: 0.8,
    marginTop: 3,
  },
  sloganPulse: {
    marginTop: -4,
  },
  midCol: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: homeColors.navy,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: homeColors.greenBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: homeRadii.pill,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: homeColors.green,
  },
  activeText: {
    fontSize: 9,
    fontWeight: "600",
    color: homeColors.green,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: homeRadii.pill,
  },
  idText: {
    fontSize: 11,
    fontWeight: "700",
    color: homeColors.primary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 4,
  },
  infoIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  infoTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: 8.5,
    color: homeColors.textMuted,
    lineHeight: 11,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: "700",
    color: homeColors.navy,
    lineHeight: 14,
  },
  statsCard: {
    width: 118,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    alignSelf: "stretch",
    justifyContent: "space-between",
  },
  statsTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statsDropWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  statsValue: {
    fontSize: 30,
    fontWeight: "800",
    color: homeColors.white,
    lineHeight: 32,
    textAlign: "center",
    marginTop: 2,
  },
  statsSub: {
    fontSize: 8,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: -2,
  },
  statsDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginVertical: 6,
  },
  statsIuLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  statsIu: {
    fontSize: 12,
    fontWeight: "800",
    color: homeColors.white,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 6,
  },
  statsFooterBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  statsFooterText: {
    flex: 1,
    fontSize: 5.5,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 7,
    letterSpacing: 0.15,
    fontWeight: "600",
  },
});
