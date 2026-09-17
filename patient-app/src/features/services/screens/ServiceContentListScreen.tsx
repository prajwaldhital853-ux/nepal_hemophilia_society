import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuth } from "@/core/auth/AuthContext";
import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { colors, spacing } from "@/core/theme";
import { fetchCmsArticles } from "@/features/services/api";
import type { CmsArticle } from "@/features/services/types";

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
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.primary} />}
        onEndReached={() => {
          if (nextCursor && !loadingMore) void load(nextCursor);
        }}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} /> : null}
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
            <Text style={styles.title}>{item.title}</Text>
            {item.summary ? <Text style={styles.summary}>{item.summary}</Text> : null}
            {item.location || item.startsAt ? (
              <Text style={styles.meta}>
                {[item.startsAt ? new Date(item.startsAt).toLocaleString() : "", item.location].filter(Boolean).join(" · ")}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: colors.primary, marginBottom: 8 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  title: { fontSize: 16, fontWeight: "700", color: colors.navy },
  summary: { marginTop: 4, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  meta: { marginTop: 6, fontSize: 12, color: colors.primary, fontWeight: "600" },
});
