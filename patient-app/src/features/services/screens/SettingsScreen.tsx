import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/core/auth/AuthContext";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { servicesColors } from "@/features/services/theme/servicesTheme";

export default function SettingsScreen() {
  const { changePassword, patient } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit() {
    setError("");
    setOk("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOk("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Account</Text>
        <Text style={styles.name}>{patient?.fullName || "Patient"}</Text>
        <Text style={styles.meta}>{patient?.id} · {patient?.email}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Your profile snapshot</Text>
        <Text style={styles.line}>Centre: {patient?.primaryHospital || "—"}</Text>
        <Text style={styles.line}>Plan: {patient?.treatmentPlan || "—"}</Text>
        <Text style={styles.line}>Type {patient?.hemophiliaType || "—"} · {patient?.severity || "—"}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Change password</Text>
        <View style={styles.form}>
          <AuthTextField
            icon="lock-closed-outline"
            placeholder="Current password"
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
            placeholder="New password"
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
            placeholder="Confirm new password"
            secureTextEntry={!showConfirmPassword}
            showToggle
            onToggleSecure={() => setShowConfirmPassword((value) => !value)}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            textContentType="newPassword"
            autoComplete="password-new"
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {ok ? <Text style={styles.ok}>{ok}</Text> : null}
        <Pressable style={styles.btn} onPress={() => void onSubmit()} disabled={saving}>
          <Text style={styles.btnText}>{saving ? "Saving…" : "Update password"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { padding: 16, paddingBottom: 40 },
  hero: { backgroundColor: servicesColors.navy, borderRadius: 18, padding: 18, marginBottom: 12 },
  kicker: { color: "#FCA5A5", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  name: { marginTop: 4, color: "#fff", fontSize: 22, fontWeight: "800" },
  meta: { marginTop: 4, color: "#E5E7EB", fontSize: 12 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: servicesColors.border },
  section: { fontWeight: "800", color: servicesColors.navy, marginBottom: 10 },
  line: { fontSize: 13, color: servicesColors.text, marginBottom: 4 },
  form: { gap: 10 },
  error: { color: servicesColors.primary, marginBottom: 8 },
  ok: { color: "#15803D", marginBottom: 8, fontWeight: "600" },
  btn: { backgroundColor: servicesColors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700" },
});
