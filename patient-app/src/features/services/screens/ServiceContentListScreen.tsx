import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuth } from "@/core/auth/AuthContext";
import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { fetchCmsArticles } from "@/features/services/api";
import type { CmsArticle } from "@/features/services/types";
import { servicesColors } from "@/features/services/theme/servicesTheme";

type Props = NativeStackScreenProps<RootStackParamList, "ServiceContentList">;

export default function ServiceContentListScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const { kind, title } = route.params;
  const [items, setItems] = useState<CmsArticle[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    navigation.setOptions({ title: title || "Updates" });
  }, [navigation, title]);

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

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={servicesColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
        onEndReached={() => {
          if (nextCursor && !loadingMore) void load(nextCursor);
        }}
        ListHeaderComponent={
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroLead}>
              {items.length} published {kind} item{items.length === 1 ? "" : "s"}. NHS website managers update this list from the admin panel.
            </Text>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={servicesColors.primary} /> : null}
        ListEmptyComponent={<Text style={styles.empty}>Nothing published yet. NHS will add items from the admin panel.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => {
              if (item.fileUrl && !item.body) {
                void Linking.openURL(item.fileUrl);
                return;
              }
              navigation.navigate("ServiceContentDetail", { kind, slug: item.slug, title: item.title });
            }}
          >
            <Text style={styles.kind}>{kind}</Text>
            <Text style={styles.title}>{item.title}</Text>
            {item.summary ? <Text style={styles.summary}>{item.summary}</Text> : null}
            {item.location || item.startsAt ? (
              <Text style={styles.meta}>
                {[item.startsAt ? new Date(item.startsAt).toLocaleString() : "", item.location].filter(Boolean).join(" · ")}
              </Text>
            ) : null}
            <Text style={styles.open}>Read more</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: servicesColors.pageBg, paddingHorizontal: 12, paddingTop: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { backgroundColor: servicesColors.navy, borderRadius: 16, padding: 16, marginBottom: 12 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  heroLead: { marginTop: 6, color: "#E5E7EB", fontSize: 13, lineHeight: 18 },
  error: { color: servicesColors.primary, marginBottom: 8 },
  empty: { textAlign: "center", color: servicesColors.textMuted, marginTop: 40, lineHeight: 20 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: servicesColors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  kind: { fontSize: 10, fontWeight: "800", color: servicesColors.primary, textTransform: "uppercase" },
  title: { marginTop: 4, fontSize: 16, fontWeight: "800", color: servicesColors.navy },
  summary: { marginTop: 4, fontSize: 13, color: servicesColors.textMuted, lineHeight: 18 },
  meta: { marginTop: 6, fontSize: 12, color: servicesColors.primary, fontWeight: "600" },
  open: { marginTop: 10, fontSize: 12, fontWeight: "800", color: servicesColors.navy },
});
