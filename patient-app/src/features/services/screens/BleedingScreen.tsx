import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import { DonutChart, InteractiveChart } from "@/features/services/components/charts";
import { servicesColors } from "@/features/services/theme/servicesTheme";

type Episode = {
  id: number;
  hospitalName: string;
  episodeDate: string;
  site: string;
  severity: string;
  notes: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["#C1121F", "#001D3D", "#F59E0B", "#0F766E", "#7C3AED"];

export default function BleedingScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Episode[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [site, setSite] = useState("All");

  const load = useCallback(
    async (cursor?: string) => {
      if (!token) return;
      setError("");
      if (cursor) setLoadingMore(true);
      else setLoading(true);
      try {
        const q = new URLSearchParams({ limit: "50" });
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

  const sites = useMemo(() => ["All", ...Array.from(new Set(items.map((row) => row.site).filter(Boolean)))], [items]);
  const visible = useMemo(() => (site === "All" ? items : items.filter((row) => row.site === site)), [items, site]);
  const monthly = useMemo(() => {
    const year = new Date().getFullYear();
    return MONTHS.map((_, index) =>
      items.filter((row) => {
        const d = new Date(row.episodeDate);
        return d.getFullYear() === year && d.getMonth() === index;
      }).length,
    );
  }, [items]);
  const siteSlices = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((row) => {
      const key = row.site || "Unspecified";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([label, count], i) => ({ label, count, color: COLORS[i % COLORS.length] }));
  }, [items]);
  const lastBleed = items[0]?.episodeDate;
  const daysQuiet = lastBleed ? Math.max(0, Math.round((Date.now() - new Date(lastBleed).getTime()) / 86400000)) : null;

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
            <Text style={styles.hero}>Bleeding history</Text>
            <Text style={styles.lead}>
              {daysQuiet == null ? "No bleeds on file yet." : `${daysQuiet} day(s) since the most recent recorded bleed.`}
            </Text>
            <View style={styles.row}>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Bleeds this year</Text>
                <InteractiveChart labels={MONTHS} series={[{ values: monthly, color: servicesColors.primary, label: "Bleeds" }]} height={132} />
              </View>
            </View>
            {siteSlices.length ? (
              <View style={styles.donutCard}>
                <DonutChart slices={siteSlices} centerLabel="bleeds" centerValue={String(items.length)} />
                <View style={{ flex: 1 }}>
                  {siteSlices.map((row) => (
                    <Text key={row.label} style={styles.siteLine}>
                      <Text style={{ color: row.color }}>● </Text>
                      {row.label} · {row.count}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}
            <View style={styles.filters}>
              {sites.map((item) => (
                <Pressable key={item} onPress={() => setSite(item)} style={[styles.chip, site === item && styles.chipOn]}>
                  <Text style={[styles.chipText, site === item && styles.chipTextOn]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={servicesColors.primary} /> : null}
        ListEmptyComponent={<Text style={styles.empty}>No bleeding episodes recorded yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.label}>{item.episodeDate}</Text>
              <Text style={styles.sev}>{item.severity || "—"}</Text>
            </View>
            <Text style={styles.meta}>
              {item.hospitalName}
              {item.site ? ` · ${item.site}` : ""}
            </Text>
            {item.notes ? <Text style={styles.body}>{item.notes}</Text> : null}
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
  row: { marginBottom: 8 },
  chartCard: { backgroundColor: "#fff", borderRadius: 14, padding: 10, borderWidth: 1, borderColor: servicesColors.border },
  chartTitle: { fontSize: 12, fontWeight: "700", color: servicesColors.navy, marginBottom: 4 },
  donutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: servicesColors.border,
    marginBottom: 10,
  },
  siteLine: { fontSize: 12, color: servicesColors.text, marginBottom: 4, fontWeight: "600" },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: servicesColors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#fff" },
  chipOn: { backgroundColor: servicesColors.primary, borderColor: servicesColors.primary },
  chipText: { fontSize: 11, fontWeight: "700", color: servicesColors.navy },
  chipTextOn: { color: "#fff" },
  empty: { textAlign: "center", color: servicesColors.textMuted, marginTop: 24 },
  error: { color: servicesColors.primary, marginBottom: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: servicesColors.border,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 15, fontWeight: "700", color: servicesColors.navy },
  sev: { fontSize: 12, fontWeight: "800", color: servicesColors.primary },
  meta: { marginTop: 4, fontSize: 12, color: servicesColors.textMuted },
  body: { marginTop: 8, fontSize: 13, color: servicesColors.text },
});
