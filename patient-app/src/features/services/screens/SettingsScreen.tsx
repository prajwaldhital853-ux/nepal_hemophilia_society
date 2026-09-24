import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { APP_LOGO } from "@/core/assets";
import { useAuth } from "@/core/auth/AuthContext";
import { useLocale } from "@/core/i18n";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { Divider, Panel, ScreenIntro, SectionHeading, useBottomPadding } from "@/features/services/components/ui";
import { servicesColors, servicesRadii, servicesSpacing, servicesType } from "@/features/services/theme/servicesTheme";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function ProfileFact({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.fact}>
      <View style={styles.factIcon}>
        <Ionicons name={icon} size={15} color={servicesColors.primary} />
      </View>
      <View style={styles.factText}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { changePassword, patient } = useAuth();
  const { t } = useLocale();
  const bottomPadding = useBottomPadding();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const name = patient?.fullName || t("settings.patientFallback");

  async function onSubmit() {
    setError("");
    setOk("");
    if (newPassword.length < 8) {
      setError(t("settings.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("settings.passwordMismatch"));
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOk(t("settings.passwordUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.passwordError"));
    } finally {
      setSaving(false);
    }
  }

  const clinicalLine = patient
    ? [patient.hemophiliaType ? `Type ${patient.hemophiliaType}` : "", patient.severity, patient.treatmentPlan]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenIntro eyebrow={t("settings.eyebrow")} title={t("settings.title")} lead={t("settings.lead")} />

      <Panel style={styles.profileCard} padded={false}>
        <Image source={APP_LOGO} style={styles.watermark} resizeMode="contain" accessibilityElementsHidden />
        <View style={styles.profileTop}>
          <View style={styles.avatarWrap}>
            {patient?.photoUrl ? (
              <Image source={{ uri: patient.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials(name)}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileId}>{patient?.id || "—"}</Text>
            {patient?.email ? <Text style={styles.profileEmail}>{patient.email}</Text> : null}
            {patient?.status ? (
              <View style={styles.statusChip}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{patient.status}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Divider />
        <View style={styles.facts}>
          <ProfileFact icon="business-outline" label={t("settings.centre")} value={patient?.primaryHospital} />
          <ProfileFact icon="medkit-outline" label={t("settings.clinical")} value={clinicalLine} />
          <ProfileFact icon="call-outline" label={t("settings.mobile")} value={patient?.mobile} />
          <ProfileFact icon="location-outline" label={t("settings.location")} value={patient?.province ? `${patient.district || ""}, ${patient.province}`.replace(/^, /, "") : undefined} />
        </View>
      </Panel>

      <Panel style={styles.securityCard}>
        <SectionHeading index={1} title={t("settings.securityTitle")} meta={t("settings.securityMeta")} />
        <View style={styles.form}>
          <AuthTextField
            icon="lock-closed-outline"
            placeholder={t("settings.currentPassword")}
            secureTextEntry={!showCurrentPassword}
            showToggle
            onToggleSecure={() => setShowCurrentPassword((value) => !value)}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            textContentType="password"
            autoComplete="password"
          />
          <AuthTextField
            icon="lock-closed-outline"
            placeholder={t("settings.newPassword")}
            secureTextEntry={!showNewPassword}
            showToggle
            onToggleSecure={() => setShowNewPassword((value) => !value)}
            value={newPassword}
            onChangeText={setNewPassword}
            textContentType="newPassword"
            autoComplete="password-new"
          />
          <AuthTextField
            icon="lock-closed-outline"
            placeholder={t("settings.confirmPassword")}
            secureTextEntry={!showConfirmPassword}
            showToggle
            onToggleSecure={() => setShowConfirmPassword((value) => !value)}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            textContentType="newPassword"
            autoComplete="password-new"
          />
        </View>
        {error ? (
          <View style={styles.messageRow}>
            <Ionicons name="alert-circle-outline" size={16} color={servicesColors.primary} />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}
        {ok ? (
          <View style={styles.messageRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={servicesColors.good} />
            <Text style={styles.ok}>{ok}</Text>
          </View>
        ) : null}
        <Pressable
          style={({ pressed }) => [styles.btn, (saving || pressed) && styles.btnPressed]}
          onPress={() => void onSubmit()}
          disabled={saving}
        >
          <Text style={styles.btnText}>{saving ? t("settings.saving") : t("settings.updatePassword")}</Text>
        </Pressable>
        <Text style={styles.passwordHint}>{t("settings.passwordHint")}</Text>
      </Panel>

      <View style={styles.brandFooter}>
        <Image source={APP_LOGO} style={styles.footerLogo} resizeMode="contain" />
        <Text style={styles.footerText}>{t("settings.footer")}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { paddingHorizontal: servicesSpacing.screen },
  profileCard: { marginTop: 4, overflow: "hidden" },
  watermark: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 56,
    height: 56,
    opacity: 0.12,
  },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18 },
  avatarWrap: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: servicesColors.primaryTint,
  },
  avatar: { width: 68, height: 68, borderRadius: 34 },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: servicesColors.primaryTint,
  },
  avatarInitials: { fontSize: 20, fontWeight: "800", color: servicesColors.primary },
  profileMeta: { flex: 1, gap: 3 },
  profileName: { ...servicesType.display, fontSize: 20, lineHeight: 24 },
  profileId: { ...servicesType.meta, color: servicesColors.primary, fontWeight: "700" },
  profileEmail: { fontSize: 12, color: servicesColors.textMuted },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: servicesColors.goodTint,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: servicesColors.good },
  statusText: { fontSize: 10, fontWeight: "700", color: servicesColors.good },
  facts: { paddingHorizontal: 14, paddingBottom: 14, gap: 4 },
  fact: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8 },
  factIcon: {
    width: 30,
    height: 30,
    borderRadius: servicesRadii.icon,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: servicesColors.primaryTint,
  },
  factText: { flex: 1, gap: 2 },
  factLabel: { ...servicesType.meta, fontSize: 10 },
  factValue: { ...servicesType.label, fontSize: 13, lineHeight: 18 },
  securityCard: { marginTop: 16 },
  form: { gap: 10, marginTop: 12 },
  messageRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 10 },
  error: { flex: 1, fontSize: 12, lineHeight: 17, color: servicesColors.primary },
  ok: { flex: 1, fontSize: 12, lineHeight: 17, color: servicesColors.good, fontWeight: "600" },
  btn: {
    marginTop: 14,
    backgroundColor: servicesColors.primary,
    borderRadius: servicesRadii.card,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnPressed: { opacity: 0.88 },
  btnText: { color: servicesColors.white, fontWeight: "700", fontSize: 14 },
  passwordHint: { marginTop: 10, fontSize: 11, lineHeight: 16, color: servicesColors.textMuted, textAlign: "center" },
  brandFooter: { alignItems: "center", gap: 8, marginTop: 24, marginBottom: 8 },
  footerLogo: { width: 36, height: 36, opacity: 0.55 },
  footerText: { ...servicesType.meta, fontSize: 11, textAlign: "center", maxWidth: 280 },
});
