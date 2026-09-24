import { Ionicons } from "@expo/vector-icons";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { APP_LOGO } from "@/core/assets";
import { useAuth } from "@/core/auth/AuthContext";
import { useLocale } from "@/core/i18n";
import { useClearTopics } from "@/features/notifications/useClearTopics";
import { Divider, Panel, ScreenIntro, useBottomPadding } from "@/features/services/components/ui";
import { servicesColors, servicesRadii, servicesSpacing, servicesType } from "@/features/services/theme/servicesTheme";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function CallButton({
  label,
  hint,
  onPress,
  primary = false,
}: {
  label: string;
  hint?: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.callBtn, primary ? styles.callBtnPrimary : styles.callBtnOutline, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Ionicons name="call-outline" size={18} color={primary ? servicesColors.white : servicesColors.primary} />
      <View style={styles.callTextWrap}>
        <Text style={[styles.callLabel, primary && styles.callLabelPrimary]}>{label}</Text>
        {hint ? <Text style={[styles.callHint, primary && styles.callHintPrimary]}>{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={primary ? "rgba(255,255,255,0.8)" : servicesColors.textMuted} />
    </Pressable>
  );
}

export default function EmergencyIdScreen() {
  useClearTopics("EmergencyId");
  const { patient } = useAuth();
  const { t } = useLocale();
  const bottomPadding = useBottomPadding();

  const name = patient?.fullName || t("emergencyId.patientFallback");
  const typeLabel = patient?.hemophiliaType ? `Hemophilia ${patient.hemophiliaType}` : undefined;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenIntro eyebrow={t("emergencyId.eyebrow")} title={t("emergencyId.title")} lead={t("emergencyId.lead")} />

      <Panel style={styles.idCard} padded={false}>
        <View style={styles.cardHeader}>
          <Image source={APP_LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="Nepal Hemophilia Society" />
          <View style={styles.cardHeaderText}>
            <Text style={styles.orgName}>{t("emergencyId.orgName")}</Text>
            <View style={styles.emergencyBadge}>
              <Ionicons name="medkit" size={11} color={servicesColors.primary} />
              <Text style={styles.emergencyBadgeText}>{t("emergencyId.badge")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.identity}>
          <View style={styles.avatarRing}>
            {patient?.photoUrl ? (
              <Image source={{ uri: patient.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials(name)}</Text>
              </View>
            )}
          </View>
          <View style={styles.identityText}>
            <Text style={styles.patientName}>{name}</Text>
            <Text style={styles.patientId}>{patient?.id || "—"}</Text>
            {patient?.bloodGroup ? (
              <View style={styles.bloodChip}>
                <Ionicons name="water" size={12} color={servicesColors.primary} />
                <Text style={styles.bloodChipText}>{patient.bloodGroup}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Divider />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("emergencyId.medicalSection")}</Text>
          <InfoRow label={t("emergencyId.hemophilia")} value={typeLabel} />
          <InfoRow label={t("emergencyId.severity")} value={patient?.severity} />
          <InfoRow label={t("emergencyId.factor")} value={patient?.deficientFactor} />
          <InfoRow
            label={t("emergencyId.baseline")}
            value={patient?.baselineFactorLevel ? `${patient.baselineFactorLevel}%` : undefined}
          />
          <InfoRow label={t("emergencyId.plan")} value={patient?.treatmentPlan} />
          <InfoRow label={t("emergencyId.hospital")} value={patient?.primaryHospital} />
        </View>

        <Divider />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("emergencyId.contactSection")}</Text>
          <InfoRow label={t("emergencyId.patientMobile")} value={patient?.mobile} />
          <InfoRow label={t("emergencyId.emergencyName")} value={patient?.emergencyContactName} />
          <InfoRow label={t("emergencyId.emergencyRelation")} value={patient?.emergencyContactRelation} />
          <InfoRow label={t("emergencyId.emergencyPhone")} value={patient?.emergencyContactPhone} />
        </View>

        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={servicesColors.good} />
          <Text style={styles.footerText}>{t("emergencyId.hint")}</Text>
        </View>
      </Panel>

      {patient?.emergencyContactPhone ? (
        <CallButton
          primary
          label={t("emergencyId.callEmergency")}
          hint={patient.emergencyContactPhone}
          onPress={() => void Linking.openURL(`tel:${patient.emergencyContactPhone}`)}
        />
      ) : null}
      {patient?.mobile ? (
        <CallButton
          label={t("emergencyId.callPatient")}
          hint={patient.mobile}
          onPress={() => void Linking.openURL(`tel:${patient.mobile}`)}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { paddingHorizontal: servicesSpacing.screen },
  idCard: {
    marginTop: 4,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: servicesColors.borderStrong,
    borderLeftWidth: 4,
    borderLeftColor: servicesColors.primary,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: servicesColors.paperDeep,
  },
  logo: { width: 44, height: 44 },
  cardHeaderText: { flex: 1, gap: 6 },
  orgName: { ...servicesType.label, fontSize: 13, color: servicesColors.ink },
  emergencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: servicesColors.primaryTint,
  },
  emergencyBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: servicesColors.primary,
    textTransform: "uppercase",
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: servicesColors.primaryTint,
    backgroundColor: servicesColors.white,
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: servicesColors.primaryTint,
  },
  avatarInitials: { fontSize: 22, fontWeight: "800", color: servicesColors.primary },
  identityText: { flex: 1, gap: 4 },
  patientName: { ...servicesType.display, fontSize: 22, lineHeight: 26 },
  patientId: { ...servicesType.meta, fontSize: 13, color: servicesColors.primary, fontWeight: "700" },
  bloodChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: servicesRadii.icon,
    backgroundColor: servicesColors.primaryTint,
  },
  bloodChipText: { fontSize: 11, fontWeight: "700", color: servicesColors.primary },
  section: { paddingHorizontal: 18, paddingVertical: 14, gap: 2 },
  sectionTitle: { ...servicesType.eyebrow, marginBottom: 8, color: servicesColors.inkSoft },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 7,
  },
  infoLabel: { ...servicesType.meta, flex: 1 },
  infoValue: { ...servicesType.label, flex: 1.2, textAlign: "right", fontSize: 13 },
  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    margin: 14,
    marginTop: 4,
    padding: 12,
    borderRadius: servicesRadii.card,
    backgroundColor: servicesColors.goodTint,
  },
  footerText: { flex: 1, fontSize: 12, lineHeight: 18, color: servicesColors.good },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: servicesRadii.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  callBtnPrimary: { backgroundColor: servicesColors.primary, borderColor: servicesColors.primary },
  callBtnOutline: { backgroundColor: servicesColors.white, borderColor: servicesColors.borderStrong },
  callTextWrap: { flex: 1, gap: 2 },
  callLabel: { ...servicesType.label, fontSize: 14 },
  callLabelPrimary: { color: servicesColors.white },
  callHint: { ...servicesType.meta, fontSize: 12 },
  callHintPrimary: { color: "rgba(255,255,255,0.85)" },
  pressed: { opacity: 0.85 },
});
