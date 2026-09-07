import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/core/auth/context";
import { patientApi } from "@/core/api";
import { colors, spacing } from "@/core/theme";

type InjectionItem = {
  id: number;
  label: string;
  hospitalName: string;
  factorType: string;
  dose: string;
  unit: string;
  indication: string;
  administeredAt: string;
  status: string;
  inhibitorWarning?: boolean;
};

export default function InjectionsScreen() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<InjectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError("");
    setLoading(true);
    try {
      const data = await patientApi("/me/patient/injections/", { token: accessToken });
      setItems(Array.isArray(data.injections) ? data.injections : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load injections");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>No injection records yet. Records added by your treatment center will appear here.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.meta}>
              {item.hospitalName} · {item.factorType} · {item.dose} {item.unit} · {item.indication}
            </Text>
            <Text style={styles.status}>{item.status}</Text>
            {item.inhibitorWarning ? <Text style={styles.warn}>Recorded with inhibitor caution flag</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  empty: { textAlign: "center", fontSize: 15, color: colors.textMuted, lineHeight: 22, marginTop: spacing.xl },
  error: { color: colors.primary, fontSize: 13, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 14, fontWeight: "600", color: colors.text, lineHeight: 20 },
  meta: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  status: { marginTop: 4, fontSize: 11, fontWeight: "600", color: colors.navy },
  warn: { marginTop: 6, fontSize: 11, color: "#B45309" },
});
