import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "@/core/auth/AuthContext";
import { colors, spacing } from "@/core/theme";
import { fetchTreatmentCenters } from "@/features/services/api";

type Center = { id: number; name: string; province: string; district: string };

export default function CentersScreen() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setItems(await fetchTreatmentCenters(token, search));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load centres");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, token]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  return (
    <View style={styles.container}>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search centre name…"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && items.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No treatment centres listed yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {[item.district, item.province].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: colors.text,
  },
  error: { color: colors.primary, marginBottom: 8 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 32 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  name: { fontSize: 15, fontWeight: "700", color: colors.navy },
  meta: { marginTop: 4, fontSize: 12, color: colors.textMuted },
});
