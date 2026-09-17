import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuth } from "@/core/auth/AuthContext";
import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { colors, spacing } from "@/core/theme";
import { fetchPatientService } from "@/features/services/api";
import { openPatientService } from "@/features/services/navigateService";
import type { AppService } from "@/features/services/types";

type Props = NativeStackScreenProps<RootStackParamList, "ServiceDetail">;

export default function ServiceDetailScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const { slug } = route.params;
  const [service, setService] = useState<AppService | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setService(await fetchPatientService(token, slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this service");
      setService(null);
    } finally {
      setLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (service?.title) navigation.setOptions({ title: service.title });
  }, [navigation, service?.title]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Service not found."}</Text>
      </View>
    );
  }

  const hasShortcut =
    service.actionType !== "content" &&
    (Boolean(service.actionValue) || ["news", "events", "resources", "gallery"].includes(service.actionType));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>{service.categoryLabel || service.category}</Text>
      <Text style={styles.title}>{service.title}</Text>
      <Text style={styles.summary}>{service.description}</Text>
      {service.body ? <Text style={styles.body}>{service.body}</Text> : null}

      {service.phone ? (
        <Pressable onPress={() => void Linking.openURL(`tel:${service.phone}`)}>
          <Text style={styles.link}>Call {service.phone}</Text>
        </Pressable>
      ) : null}
      {service.email ? (
        <Pressable onPress={() => void Linking.openURL(`mailto:${service.email}`)}>
          <Text style={styles.link}>{service.email}</Text>
        </Pressable>
      ) : null}
      {service.websiteUrl ? (
        <Pressable onPress={() => void Linking.openURL(service.websiteUrl!)}>
          <Text style={styles.link}>{service.websiteUrl}</Text>
        </Pressable>
      ) : null}
      {service.address ? <Text style={styles.meta}>{service.address}</Text> : null}

      {hasShortcut ? (
        <Pressable style={styles.cta} onPress={() => openPatientService(navigation, { ...service, actionType: service.actionType === "content" ? "content" : service.actionType })}>
          <Text style={styles.ctaText}>Open related page</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  kicker: { fontSize: 11, fontWeight: "700", color: colors.primary, textTransform: "uppercase" },
  title: { marginTop: 6, fontSize: 22, fontWeight: "800", color: colors.navy },
  summary: { marginTop: 8, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  body: { marginTop: 16, fontSize: 15, color: colors.text, lineHeight: 22 },
  link: { marginTop: 12, fontSize: 14, fontWeight: "700", color: colors.primary },
  meta: { marginTop: 8, fontSize: 13, color: colors.textMuted },
  error: { color: colors.primary, textAlign: "center" },
  cta: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "700" },
});
