import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/core/auth/AuthContext";
import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { fetchPatientService } from "@/features/services/api";
import { openPatientService } from "@/features/services/navigateService";
import type { AppService } from "@/features/services/types";
import { servicesColors } from "@/features/services/theme/servicesTheme";

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
        <ActivityIndicator color={servicesColors.primary} />
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

  const paragraphs = (service.body || "").split(/\n{2,}/).filter(Boolean);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{service.categoryLabel || service.category}</Text>
        <Text style={styles.title}>{service.title}</Text>
        <Text style={styles.summary}>{service.description}</Text>
        <Text style={styles.adminNote}>Copy on this page is published from the NHS admin panel.</Text>
      </View>

      {paragraphs.map((block, index) => (
        <View key={index} style={styles.block}>
          <Text style={styles.body}>{block}</Text>
        </View>
      ))}

      <View style={styles.actions}>
        {service.phone ? (
          <Pressable style={styles.action} onPress={() => void Linking.openURL(`tel:${service.phone}`)}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.actionText}>Call {service.phone}</Text>
          </Pressable>
        ) : null}
        {service.email ? (
          <Pressable style={[styles.action, styles.actionAlt]} onPress={() => void Linking.openURL(`mailto:${service.email}`)}>
            <Ionicons name="mail" size={18} color={servicesColors.primary} />
            <Text style={styles.actionAltText}>{service.email}</Text>
          </Pressable>
        ) : null}
        {service.websiteUrl ? (
          <Pressable style={[styles.action, styles.actionAlt]} onPress={() => void Linking.openURL(service.websiteUrl!)}>
            <Ionicons name="open-outline" size={18} color={servicesColors.primary} />
            <Text style={styles.actionAltText}>Open website</Text>
          </Pressable>
        ) : null}
      </View>
      {service.address ? (
        <View style={styles.block}>
          <Text style={styles.addrLabel}>Address</Text>
          <Text style={styles.body}>{service.address}</Text>
        </View>
      ) : null}

      {hasShortcut ? (
        <Pressable style={styles.cta} onPress={() => openPatientService(navigation, service)}>
          <Text style={styles.ctaText}>Open related page</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  hero: { backgroundColor: servicesColors.navy, borderRadius: 18, padding: 18, marginBottom: 12 },
  kicker: { fontSize: 11, fontWeight: "800", color: "#FECACA", textTransform: "uppercase" },
  title: { marginTop: 6, fontSize: 24, fontWeight: "800", color: "#fff" },
  summary: { marginTop: 8, fontSize: 14, color: "#E5E7EB", lineHeight: 20 },
  adminNote: { marginTop: 10, fontSize: 11, color: "#FCA5A5" },
  block: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: servicesColors.border },
  body: { fontSize: 15, color: servicesColors.text, lineHeight: 22 },
  addrLabel: { fontSize: 11, fontWeight: "800", color: servicesColors.primary, marginBottom: 4, textTransform: "uppercase" },
  actions: { gap: 8, marginTop: 4 },
  action: {
    backgroundColor: servicesColors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionAlt: { backgroundColor: "#fff", borderWidth: 1, borderColor: servicesColors.border },
  actionText: { color: "#fff", fontWeight: "700" },
  actionAltText: { color: servicesColors.primary, fontWeight: "700", flexShrink: 1 },
  error: { color: servicesColors.primary, textAlign: "center" },
  cta: {
    marginTop: 8,
    backgroundColor: servicesColors.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "800" },
});
