import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import { colors, spacing } from "@/core/theme";

type Episode = {
  id: number;
  hospitalName: string;
  episodeDate: string;
  site: string;
  severity: string;
  notes: string;
};

export default function BleedingScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Episode[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (cursor?: string) => {
      if (!token) return;
      setError("");
      if (cursor) setLoadingMore(true);
      else setLoading(true);
      try {
        const q = new URLSearchParams({ limit: "25" });
        if (cursor) q.set("cursor", cursor);
        const data = await patientApi(`/me/patient/bleeding-episodes/?${q.toString()}`, { token });
        const rows = Array.isArray(data.episodes) ? data.episodes : [];
        setItems((current) => (cursor ? [...current, ...rows] : rows));
        setNextCursor(data.nextCursor ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load bleeding history");
        if (!cursor) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token],
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
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.primary} />}
        onEndReached={() => {
          if (nextCursor && !loadingMore) void load(nextCursor);
        }}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} /> : null}
        ListEmptyComponent={<Text style={styles.empty}>No bleeding episodes recorded yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.label}>{item.episodeDate}</Text>
            <Text style={styles.meta}>
              {item.hospitalName}
              {item.site ? ` · ${item.site}` : ""}
              {item.severity ? ` · ${item.severity}` : ""}
            </Text>
            {item.notes ? <Text style={styles.body}>{item.notes}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  error: { color: colors.primary, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 15, fontWeight: "700", color: colors.navy },
  meta: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  body: { marginTop: 8, fontSize: 13, color: colors.text },
});
