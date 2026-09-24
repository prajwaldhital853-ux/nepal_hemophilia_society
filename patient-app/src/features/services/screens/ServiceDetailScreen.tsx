import { Fragment, useCallback, useEffect, useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/core/auth/AuthContext";
import type { RootStackParamList } from "@/core/navigation/types";
import { fetchPatientService } from "@/features/services/api";
import {
  Divider,
  EmptyNote,
  ErrorNote,
  LinkRow,
  LoadingScreen,
  Panel,
  ServicesStatusBar,
  useBottomPadding,
} from "@/features/services/components/ui";
import { openPatientService } from "@/features/services/navigateService";
import type { AppService } from "@/features/services/types";
import { accentFor, servicesColors, servicesSpacing, servicesType } from "@/features/services/theme/servicesTheme";

type Props = StackScreenProps<RootStackParamList, "ServiceDetail">;

export default function ServiceDetailScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const bottomPadding = useBottomPadding();
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

  if (loading && !service) return <LoadingScreen />;

  if (!service) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          {error ? <ErrorNote message={error} onRetry={() => void load()} /> : null}
          <EmptyNote title="This service isn't available" body="It may have been moved or unpublished by NHS staff." />
        </View>
      </View>
    );
  }

  const accent = accentFor(service.category);
  const hasShortcut =
    service.actionType !== "content" &&
    (Boolean(service.actionValue) || ["news", "events", "resources", "gallery"].includes(service.actionType));
  const paragraphs = (service.body || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const contacts: { icon: keyof typeof Ionicons.glyphMap; label: string; detail?: string; onPress: () => void }[] = [];
  if (service.phone) {
    contacts.push({ icon: "call-outline", label: "Call", detail: service.phone, onPress: () => void Linking.openURL(`tel:${service.phone}`) });
  }
  if (service.email) {
    contacts.push({ icon: "mail-outline", label: "Email", detail: service.email, onPress: () => void Linking.openURL(`mailto:${service.email}`) });
  }
  if (service.websiteUrl) {
    const url = service.websiteUrl;
    contacts.push({
      icon: "globe-outline",
      label: "Website",
      detail: url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      onPress: () => void Linking.openURL(url),
    });
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
    >
      <ServicesStatusBar />
      <View style={styles.header}>
        <View style={styles.kickerRow}>
          <View style={[styles.kickerMark, { backgroundColor: accent.fg }]} />
          <Text style={[servicesType.eyebrow, { color: accent.fg }]}>{service.categoryLabel || service.category}</Text>
        </View>
        <Text style={styles.title}>{service.title}</Text>
        {service.description ? <Text style={styles.standfirst}>{service.description}</Text> : null}
      </View>

      {paragraphs.length ? (
        <View style={styles.article}>
          {paragraphs.map((block, index) => (
            <Text key={index} style={styles.paragraph}>
              {block}
            </Text>
          ))}
        </View>
      ) : null}

      {hasShortcut ? (
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={() => openPatientService(navigation, service)}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Open {service.title}</Text>
          <Ionicons name="arrow-forward" size={18} color={servicesColors.white} />
        </Pressable>
      ) : null}

      {contacts.length || service.address ? (
        <>
          <Text style={styles.groupLabel}>Get in touch</Text>
          <Panel padded={false}>
            {contacts.map((row, i) => (
              <Fragment key={row.label}>
                {i > 0 ? <Divider inset={49} /> : null}
                <LinkRow icon={row.icon} label={row.label} detail={row.detail} onPress={row.onPress} tint={accent.fg} />
              </Fragment>
            ))}
            {service.address ? (
              <>
                {contacts.length ? <Divider inset={49} /> : null}
                <LinkRow
                  icon="location-outline"
                  label="Address"
                  detail={service.address}
                  tint={accent.fg}
                  onPress={() =>
                    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(service.address ?? "")}`)
                  }
                />
              </>
            ) : null}
          </Panel>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { paddingHorizontal: servicesSpacing.screen + 4, paddingBottom: 48 },
  header: {
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: servicesColors.borderStrong,
  },
  kickerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  kickerMark: { width: 14, height: 2, borderRadius: 1 },
  title: { ...servicesType.display, marginTop: 10 },
  standfirst: { ...servicesType.lead, fontSize: 16, lineHeight: 24, marginTop: 10 },
  article: { paddingTop: 20, gap: 16 },
  paragraph: { ...servicesType.body },
  cta: {
    marginTop: 28,
    backgroundColor: servicesColors.ink,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaPressed: { opacity: 0.88 },
  ctaText: { color: servicesColors.white, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  groupLabel: { ...servicesType.eyebrow, marginTop: 32, marginBottom: 10 },
});
