import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import { InteractiveChart } from "@/features/services/components/charts";
import { useClearTopics } from "@/features/notifications/useClearTopics";
import { servicesColors } from "@/features/services/theme/servicesTheme";

type TreatmentItem = {
  id: number;
  label: string;
  hospitalName: string;
  treatmentType: string;
  status: string;
  description: string;
  treatmentDate: string;
  notes?: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function TreatmentsScreen() {
  useClearTopics("Treatments");
  const { token } = useAuth();
  const [items, setItems] = useState<TreatmentItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const load = useCallback(
    async (cursor?: string) => {
      if (!token) return;
      setError("");
      if (cursor) setLoadingMore(true);
      else setLoading(true);
      try {
        const q = new URLSearchParams({ limit: "50" });
        if (cursor) q.set("cursor", cursor);
        const data = await patientApi(`/me/patient/treatments/?${q.toString()}`, { token });
        const rows = Array.isArray(data.treatments) ? data.treatments : [];
        setItems((current) => (cursor ? [...current, ...rows] : rows));
        setNextCursor(data.nextCursor ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load treatments");
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

  const types = useMemo(() => ["All", ...Array.from(new Set(items.map((row) => row.treatmentType).filter(Boolean)))], [items]);
  const visible = useMemo(
    () => (typeFilter === "All" ? items : items.filter((row) => row.treatmentType === typeFilter)),
    [items, typeFilter],
  );
  const monthly = useMemo(() => {
    const year = new Date().getFullYear();
    return MONTHS.map((_, index) =>
      items.filter((row) => {
        const d = new Date(row.treatmentDate);
        return d.getFullYear() === year && d.getMonth() === index;
      }).length,
    );
  }, [items]);

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={servicesColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
        onEndReached={() => {
          if (nextCursor && !loadingMore) void load(nextCursor);
        }}
        ListHeaderComponent={
          <View>
            <Text style={styles.hero}>Treatment visits</Text>
            <Text style={styles.lead}>Physiotherapy, admissions, ITI and other centre visits — compared across this year.</Text>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Visits by month · {new Date().getFullYear()}</Text>
              <InteractiveChart labels={MONTHS} series={[{ values: monthly, color: "#001D3D", label: "Treatments" }]} height={140} />
            </View>
            <View style={styles.filters}>
              {types.map((item) => (
                <Pressable key={item} onPress={() => setTypeFilter(item)} style={[styles.chip, typeFilter === item && styles.chipOn]}>
                  <Text style={[styles.chipText, typeFilter === item && styles.chipTextOn]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={servicesColors.primary} /> : null}
        ListEmptyComponent={
          <Text style={styles.empty}>No treatment records yet. Your centre will add physiotherapy, dental, and other visits here.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.label}>{item.label || item.treatmentType}</Text>
              <Text style={styles.badge}>{item.status}</Text>
            </View>
            <Text style={styles.meta}>
              {item.hospitalName} · {item.treatmentDate}
            </Text>
            {item.description ? <Text style={styles.body}>{item.description}</Text> : null}
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: servicesColors.pageBg, paddingHorizontal: 12, paddingTop: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { fontSize: 20, fontWeight: "800", color: servicesColors.navy },
  lead: { marginTop: 4, marginBottom: 10, fontSize: 13, color: servicesColors.textMuted, lineHeight: 18 },
  chartCard: { backgroundColor: "#fff", borderRadius: 14, padding: 10, borderWidth: 1, borderColor: servicesColors.border, marginBottom: 10 },
  chartTitle: { fontSize: 12, fontWeight: "700", color: servicesColors.navy, marginBottom: 4 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: servicesColors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#fff" },
  chipOn: { backgroundColor: servicesColors.primary, borderColor: servicesColors.primary },
  chipText: { fontSize: 11, fontWeight: "700", color: servicesColors.navy },
  chipTextOn: { color: "#fff" },
  empty: { textAlign: "center", color: servicesColors.textMuted, lineHeight: 22, marginTop: 24 },
  error: { color: servicesColors.primary, marginBottom: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: servicesColors.border,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  label: { flex: 1, fontSize: 15, fontWeight: "700", color: servicesColors.navy },
  badge: { fontSize: 11, fontWeight: "700", color: servicesColors.primary },
  meta: { marginTop: 4, fontSize: 12, color: servicesColors.textMuted },
  body: { marginTop: 8, fontSize: 13, color: servicesColors.text, lineHeight: 18 },
  notes: { marginTop: 6, fontSize: 12, color: servicesColors.textMuted },
});
