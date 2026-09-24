import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import { invalidatePatientData } from "@/core/patientDataEvents";
import { useLocale } from "@/core/i18n";
import { InteractiveChart } from "@/features/services/components/charts";
import { useClearTopics } from "@/features/notifications/useClearTopics";
import { servicesColors } from "@/features/services/theme/servicesTheme";

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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function InjectionsScreen() {
  useClearTopics("Injections");
  const { token } = useAuth();
  const { t, l } = useLocale();
  const [items, setItems] = useState<InjectionItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  const load = useCallback(async (cursor?: string) => {
    if (!token) return;
    setError("");
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    try {
      const q = new URLSearchParams({ limit: "50" });
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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visible = useMemo(
    () => (filter === "All" ? items : items.filter((row) => (row.status || "Completed") === filter)),
    [filter, items],
  );

  const monthly = useMemo(() => {
    const year = new Date().getFullYear();
    const values = MONTHS.map((_, index) =>
      items.filter((row) => {
        const d = new Date(row.administeredAt);
        return d.getFullYear() === year && d.getMonth() === index && (row.status || "Completed") === "Completed";
      }).length,
    );
    return { labels: MONTHS, values };
  }, [items]);

  const iuTotal = useMemo(
    () =>
      items
        .filter((row) => (row.status || "Completed") === "Completed")
        .reduce((sum, row) => sum + (parseFloat(String(row.dose)) || 0), 0),
    [items],
  );

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
      <View style={styles.filters}>
        {["All", "Completed", "Scheduled", "Pending", "Cancelled"].map((item) => (
          <Pressable key={item} onPress={() => setFilter(item)} style={[styles.chip, filter === item && styles.chipOn]}>
            <Text style={[styles.chipText, filter === item && styles.chipTextOn]}>{item === "All" ? t("common.all") : l(item)}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading && items.length === 0}
            onRefresh={() => {
              invalidatePatientData(["injection", "schedule", "treatment"]);
              void load();
            }}
            tintColor={servicesColors.primary}
          />
        }
        onEndReached={() => {
          if (nextCursor && !loadingMore) void load(nextCursor);
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View>
            <Text style={styles.hero}>{t("injections.title")}</Text>
            <Text style={styles.lead}>{t("injections.lead")}</Text>
            <View style={styles.stats}>
              <Stat label={t("injections.records")} value={String(items.length)} />
              <Stat label={t("injections.iuThisYear")} value={Math.round(iuTotal).toLocaleString()} />
              <Stat label={t("injections.showing")} value={String(visible.length)} />
            </View>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t("injections.chartTitle")} · {new Date().getFullYear()}</Text>
              <InteractiveChart labels={monthly.labels} series={[{ values: monthly.values, color: servicesColors.primary, label: "Injections" }]} height={140} />
            </View>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={servicesColors.primary} /> : null}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>{t("injections.empty")}</Text>
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
                  <Text style={[styles.statusText, { color: badge.color }]}>{l(badge.label)}</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {item.hospitalName} · {item.factorType} · {item.dose} {item.unit} · {item.indication}
              </Text>
              <Text style={styles.doctor}>{t("injections.doctor")}: {doctor}</Text>
              {item.inhibitorWarning ? <Text style={styles.warn}>{t("injections.inhibitorWarn")}</Text> : null}
            </View>
          );
        }}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: servicesColors.pageBg },
  list: { flex: 1, paddingHorizontal: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: servicesColors.pageBg },
  hero: { marginTop: 8, fontSize: 20, fontWeight: "800", color: servicesColors.navy },
  lead: { marginTop: 4, marginBottom: 10, fontSize: 13, color: servicesColors.textMuted, lineHeight: 18 },
  stats: { flexDirection: "row", gap: 8, marginBottom: 10 },
  stat: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: servicesColors.border },
  statValue: { fontSize: 16, fontWeight: "800", color: servicesColors.navy },
  statLabel: { fontSize: 10, color: servicesColors.textMuted, marginTop: 2, fontWeight: "600" },
  chartCard: { backgroundColor: "#fff", borderRadius: 14, padding: 10, borderWidth: 1, borderColor: servicesColors.border, marginBottom: 10 },
  chartTitle: { fontSize: 12, fontWeight: "700", color: servicesColors.navy, marginBottom: 4 },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: servicesColors.pageBg,
    borderBottomWidth: 1,
    borderBottomColor: servicesColors.border,
  },
  chip: { borderWidth: 1, borderColor: servicesColors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#fff" },
  chipOn: { backgroundColor: servicesColors.primary, borderColor: servicesColors.primary },
  chipText: { fontSize: 11, fontWeight: "700", color: servicesColors.navy },
  chipTextOn: { color: "#fff" },
  empty: { textAlign: "center", fontSize: 15, color: servicesColors.textMuted, lineHeight: 22, marginTop: 24 },
  error: { color: servicesColors.primary, fontSize: 13, marginBottom: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: servicesColors.border,
  },
  cardHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  label: { flex: 1, fontSize: 14, fontWeight: "700", color: servicesColors.text, lineHeight: 20 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: "700" },
  meta: { marginTop: 4, fontSize: 12, color: servicesColors.textMuted },
  doctor: { marginTop: 4, fontSize: 11, fontWeight: "600", color: servicesColors.navy },
  warn: { marginTop: 6, fontSize: 11, color: "#B45309" },
});
