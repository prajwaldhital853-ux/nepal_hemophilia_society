import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";

import { useAuth } from "@/core/auth/AuthContext";
import type { RootStackParamList } from "@/core/navigation/types";
import { fetchCmsArticles } from "@/features/services/api";
import { parseRecordDate, shortDate } from "@/features/services/components/RecordTimeline";
import { EmptyNote, ErrorNote, LoadingScreen, ScreenIntro, useBottomPadding } from "@/features/services/components/ui";
import type { CmsArticle } from "@/features/services/types";
import { servicesColors, servicesSpacing, servicesType } from "@/features/services/theme/servicesTheme";

type Props = StackScreenProps<RootStackParamList, "ServiceContentList">;

const KIND_COPY: Record<string, { eyebrow: string; lead: string; empty: string }> = {
  news: {
    eyebrow: "News",
    lead: "Announcements and stories from the Nepal Hemophilia Society.",
    empty: "No news has been published yet.",
  },
  events: {
    eyebrow: "Events",
    lead: "Camps, workshops and awareness programmes you can join.",
    empty: "No upcoming events right now.",
  },
  resources: {
    eyebrow: "Resources",
    lead: "Guides, forms and reading material reviewed by NHS.",
    empty: "No resources have been added yet.",
  },
  gallery: {
    eyebrow: "Gallery",
    lead: "Photos from recent NHS programmes and gatherings.",
    empty: "No albums have been shared yet.",
  },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function timeOf(value?: string | null) {
  const d = parseRecordDate(value);
  if (!d) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ServiceContentListScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const bottomPadding = useBottomPadding();
  const { kind, title } = route.params;
  const copy = KIND_COPY[kind] ?? { eyebrow: "Updates", lead: "", empty: "Nothing has been published yet." };
  const [items, setItems] = useState<CmsArticle[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    navigation.setOptions({ title: title || copy.eyebrow });
  }, [navigation, title, copy.eyebrow]);

  const load = useCallback(
    async (cursor?: string) => {
      if (!token) return;
      setError("");
      if (cursor) setLoadingMore(true);
      else setLoading(true);
      try {
        const data = await fetchCmsArticles(token, kind, cursor);
        setItems((current) => (cursor ? [...current, ...data.articles] : data.articles));
        setNextCursor(data.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load content");
        if (!cursor) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [kind, token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const open = (item: CmsArticle) => {
    if (item.fileUrl && !item.body) {
      void Linking.openURL(item.fileUrl);
      return;
    }
    navigation.navigate("ServiceContentDetail", { kind, slug: item.slug, title: item.title });
  };

  if (loading && items.length === 0) return <LoadingScreen />;

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
        onEndReached={() => {
          if (nextCursor && !loadingMore) void load(nextCursor);
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenIntro eyebrow={copy.eyebrow} title={title || copy.eyebrow} lead={copy.lead} />
            {error ? <ErrorNote message={error} onRetry={() => void load()} /> : null}
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={servicesColors.primary} style={styles.more} /> : null}
        ListEmptyComponent={<EmptyNote title={copy.empty} body="Pull down to check again later." />}
        renderItem={({ item }) => {
          if (kind === "events") {
            const d = parseRecordDate(item.startsAt);
            return (
              <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dateMon}>{d ? MONTHS[d.getMonth()] : "TBA"}</Text>
                  <Text style={styles.dateDay}>{d ? d.getDate() : "—"}</Text>
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[timeOf(item.startsAt), item.location].filter(Boolean).join("  ·  ") || "Details to follow"}
                  </Text>
                  {item.summary ? (
                    <Text style={styles.summary} numberOfLines={2}>
                      {item.summary}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }

          if (kind === "gallery" && item.imageUrl) {
            return (
              <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.galleryItem, pressed && styles.pressedFade]}>
                <Image source={{ uri: item.imageUrl }} style={styles.galleryImage} />
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.summary ? (
                  <Text style={styles.summary} numberOfLines={2}>
                    {item.summary}
                  </Text>
                ) : null}
              </Pressable>
            );
          }

          const isFile = Boolean(item.fileUrl && !item.body);
          return (
            <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.rowText}>
                <Text style={styles.title} numberOfLines={3}>
                  {item.title}
                </Text>
                {item.summary ? (
                  <Text style={styles.summary} numberOfLines={2}>
                    {item.summary}
                  </Text>
                ) : null}
                <View style={styles.metaRow}>
                  {isFile ? (
                    <>
                      <Ionicons name="document-text-outline" size={13} color={servicesColors.primary} />
                      <Text style={[styles.meta, styles.fileMeta]}>Download</Text>
                    </>
                  ) : item.startsAt ? (
                    <Text style={styles.meta}>{shortDate(item.startsAt)}</Text>
                  ) : null}
                </View>
              </View>
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.thumb} /> : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { paddingHorizontal: servicesSpacing.screen, paddingBottom: 48 },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: servicesColors.borderStrong,
    marginBottom: 4,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: servicesColors.border },
  row: { flexDirection: "row", gap: 14, paddingVertical: 16 },
  pressed: { opacity: 0.7 },
  pressedFade: { opacity: 0.85 },
  rowText: { flex: 1 },
  title: { ...servicesType.title, fontSize: 17, lineHeight: 23 },
  summary: { ...servicesType.meta, fontSize: 13.5, lineHeight: 20, marginTop: 5, color: servicesColors.inkSoft },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  meta: { ...servicesType.meta, marginTop: 4 },
  fileMeta: { marginTop: 0, color: servicesColors.primary, fontWeight: "600" },
  thumb: { width: 76, height: 76, borderRadius: 8, backgroundColor: servicesColors.paperDeep },
  dateBlock: {
    width: 52,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: servicesColors.borderStrong,
    backgroundColor: servicesColors.white,
    alignSelf: "flex-start",
  },
  dateMon: { fontSize: 11, fontWeight: "700", color: servicesColors.primary, textTransform: "uppercase", letterSpacing: 0.6 },
  dateDay: { ...servicesType.figure, fontSize: 22, lineHeight: 26 },
  galleryItem: { paddingVertical: 16 },
  galleryImage: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: servicesColors.paperDeep,
  },
  more: { marginVertical: 16 },
});
