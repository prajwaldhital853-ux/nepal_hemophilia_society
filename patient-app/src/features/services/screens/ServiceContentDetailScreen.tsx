import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";

import { useAuth } from "@/core/auth/AuthContext";
import type { RootStackParamList } from "@/core/navigation/types";
import { fetchCmsArticle } from "@/features/services/api";
import { parseRecordDate } from "@/features/services/components/RecordTimeline";
import { EmptyNote, ErrorNote, LoadingScreen, ServicesStatusBar, useBottomPadding } from "@/features/services/components/ui";
import type { CmsArticle } from "@/features/services/types";
import { servicesColors, servicesSpacing, servicesType } from "@/features/services/theme/servicesTheme";

type Props = StackScreenProps<RootStackParamList, "ServiceContentDetail">;

const KIND_LABEL: Record<string, string> = {
  news: "News",
  events: "Event",
  resources: "Resource",
  gallery: "Gallery",
};

function formatWhen(start?: string | null, end?: string | null) {
  const s = parseRecordDate(start);
  if (!s) return "";
  const day = s.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const hasTime = (start ?? "").length > 10;
  const time = hasTime ? s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
  const e = parseRecordDate(end);
  const endTime = e && hasTime ? e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
  return [day, [time, endTime].filter(Boolean).join(" – ")].filter(Boolean).join(", ");
}

export default function ServiceContentDetailScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const bottomPadding = useBottomPadding();
  const { kind, slug, title } = route.params;
  const [article, setArticle] = useState<CmsArticle | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: title || KIND_LABEL[kind] || "Details" });
  }, [navigation, title, kind]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const row = await fetchCmsArticle(token, kind, slug);
      setArticle(row);
      navigation.setOptions({ title: row.title });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load details");
    } finally {
      setLoading(false);
    }
  }, [kind, navigation, slug, token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !article) return <LoadingScreen />;

  if (!article) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          {error ? <ErrorNote message={error} onRetry={() => void load()} /> : null}
          <EmptyNote title="This item isn't available" body="It may have been removed by NHS staff." />
        </View>
      </View>
    );
  }

  const when = formatWhen(article.startsAt, article.endsAt);
  const paragraphs = (article.body || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
    >
      <ServicesStatusBar />
      {article.imageUrl ? <Image source={{ uri: article.imageUrl }} style={styles.image} /> : null}
      <View style={styles.content}>
        <Text style={[servicesType.eyebrow, styles.kind]}>{KIND_LABEL[article.kind] ?? article.kind}</Text>
        <Text style={styles.title}>{article.title}</Text>
        {article.summary ? <Text style={styles.standfirst}>{article.summary}</Text> : null}

        {when || article.location ? (
          <View style={styles.facts}>
            {when ? (
              <View style={styles.fact}>
                <Ionicons name="calendar-outline" size={16} color={servicesColors.inkSoft} />
                <Text style={styles.factText}>{when}</Text>
              </View>
            ) : null}
            {article.location ? (
              <View style={styles.fact}>
                <Ionicons name="location-outline" size={16} color={servicesColors.inkSoft} />
                <Text style={styles.factText}>{article.location}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {paragraphs.length ? (
          <View style={styles.article}>
            {paragraphs.map((block, index) => (
              <Text key={index} style={styles.paragraph}>
                {block}
              </Text>
            ))}
          </View>
        ) : null}

        {article.fileUrl ? (
          <Pressable
            style={({ pressed }) => [styles.download, pressed && styles.downloadPressed]}
            onPress={() => void Linking.openURL(article.fileUrl!)}
            accessibilityRole="button"
          >
            <Ionicons name="document-text-outline" size={20} color={servicesColors.ink} />
            <View style={styles.downloadText}>
              <Text style={servicesType.label}>Open attached file</Text>
              <Text style={servicesType.meta}>Opens in your browser</Text>
            </View>
            <Ionicons name="arrow-down" size={18} color={servicesColors.primary} />
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: servicesColors.pageBg },
  scrollContent: { paddingBottom: 48 },
  content: { paddingHorizontal: servicesSpacing.screen + 4 },
  image: { width: "100%", aspectRatio: 16 / 9, backgroundColor: servicesColors.paperDeep },
  kind: { marginTop: 24, color: servicesColors.primary },
  title: { ...servicesType.display, marginTop: 8 },
  standfirst: { ...servicesType.lead, fontSize: 16, lineHeight: 24, marginTop: 10 },
  facts: {
    marginTop: 18,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: servicesColors.borderStrong,
  },
  fact: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  factText: { flex: 1, fontSize: 14, lineHeight: 20, color: servicesColors.text },
  article: { marginTop: 20, gap: 16 },
  paragraph: { ...servicesType.body },
  download: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: servicesColors.borderStrong,
    backgroundColor: servicesColors.white,
  },
  downloadPressed: { backgroundColor: servicesColors.paperDeep },
  downloadText: { flex: 1, gap: 2 },
});
