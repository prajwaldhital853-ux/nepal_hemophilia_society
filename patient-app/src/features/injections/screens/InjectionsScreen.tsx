import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/core/auth/AuthContext";
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
  doctorName?: string;
  administeredBy?: string;
  inhibitorWarning?: boolean;
};

function statusStyle(status: string) {
  switch (status) {
    case "Scheduled":
      return { bg: "#DCFCE7", color: "#15803D", label: "Scheduled" };
    case "Pending":
      return { bg: "#FEF9C3", color: "#A16207", label: "Pending" };
    case "Cancelled":
      return { bg: "#F3F4F6", color: "#6B7280", label: "Cancelled" };
    case "Completed":
    default:
      return { bg: "#FEE2E2", color: "#B91C1C", label: "Completed" };
  }
}

export default function InjectionsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<InjectionItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (cursor?: string) => {
    if (!token) return;
    setError("");
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    try {
      const q = new URLSearchParams({ limit: "25" });
      if (cursor) q.set("cursor", cursor);
      const data = await patientApi(`/me/patient/injections/?${q.toString()}`, { token });
      const rows = Array.isArray(data.injections) ? data.injections : [];
      setItems((current) => (cursor ? [...current, ...rows] : rows));
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load injections");
      if (!cursor) setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

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
        refreshControl={<RefreshControl refreshing={loading && items.length === 0} onRefresh={() => void load()} tintColor={colors.primary} />}
        onEndReached={() => {
          if (nextCursor && !loadingMore) void load(nextCursor);
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} /> : null}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>No injection records yet. Records added by your treatment center will appear here.</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const badge = statusStyle(item.status);
          const doctor = item.doctorName || item.administeredBy || "—";
          return (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.label}>{item.label}</Text>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {item.hospitalName} · {item.factorType} · {item.dose} {item.unit} · {item.indication}
              </Text>
              <Text style={styles.doctor}>Doctor: {doctor}</Text>
              {item.inhibitorWarning ? <Text style={styles.warn}>Recorded with inhibitor caution flag</Text> : null}
            </View>
          );
        }}
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
  cardHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  label: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text, lineHeight: 20 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: "700" },
  meta: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  doctor: { marginTop: 4, fontSize: 11, fontWeight: "600", color: colors.navy },
  warn: { marginTop: 6, fontSize: 11, color: "#B45309" },
});
