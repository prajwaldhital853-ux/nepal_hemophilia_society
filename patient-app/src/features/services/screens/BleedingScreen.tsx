import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import { DonutChart, InteractiveChart } from "@/features/services/components/charts";
import {
  MonthHeader,
  TimelineEntry,
  monthKey,
  monthTitle,
  parseRecordDate,
} from "@/features/services/components/RecordTimeline";
import {
  EmptyNote,
  ErrorNote,
  LoadingScreen,
  Panel,
  ScreenIntro,
  StatStrip,
  StatusTag,
  TabStrip,
  useBottomPadding,
} from "@/features/services/components/ui";
import { useClearTopics } from "@/features/notifications/useClearTopics";
import {
  servicesChartPalette,
  servicesColors,
  servicesSpacing,
  servicesType,
} from "@/features/services/theme/servicesTheme";

type Episode = {
  id: number;
  hospitalName: string;
  episodeDate: string;
  site: string;
  severity: string;
  notes: string;
};

type Row = { kind: "month"; key: string; title: string } | { kind: "entry"; key: string; item: Episode; last: boolean };

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function severityTone(severity: string): "good" | "warn" | "alert" | "neutral" {
  const s = severity.toLowerCase();
  if (s.includes("severe") || s.includes("major") || s.includes("moderate")) return "alert";
  if (s.includes("mild") || s.includes("minor")) return "warn";
  return "neutral";
}

export default function BleedingScreen() {
  useClearTopics("Bleeding");
  const { token } = useAuth();
  const bottomPadding = useBottomPadding();
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
  const year = new Date().getFullYear();
  const monthly = useMemo(
    () =>
      MONTHS.map((_, index) =>
        items.filter((row) => {
          const d = parseRecordDate(row.episodeDate);
          return d?.getFullYear() === year && d.getMonth() === index;
        }).length,
      ),
    [items, year],
  );
  const siteSlices = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((row) => {
      const key = row.site || "Unspecified";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count], i) => ({ label, count, color: servicesChartPalette[i % servicesChartPalette.length] }));
  }, [items]);
  const lastBleed = parseRecordDate(items[0]?.episodeDate);
  const daysQuiet = lastBleed ? Math.max(0, Math.floor((Date.now() - lastBleed.getTime()) / 86400000)) : null;
  const thisYear = monthly.reduce((a, b) => a + b, 0);

  const rows = useMemo(() => {
    const out: Row[] = [];
    let current = "";
    visible.forEach((item, i) => {
      const key = monthKey(item.episodeDate);
      if (key !== current) {
        current = key;
        out.push({ kind: "month", key: `m-${key}`, title: monthTitle(item.episodeDate) });
      }
      const next = visible[i + 1];
      out.push({ kind: "entry", key: String(item.id), item, last: !next || monthKey(next.episodeDate) !== key });
    });
    return out;
  }, [visible]);

  if (loading && items.length === 0) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
        onEndReached={() => {
          if (nextCursor && !loadingMore) void load(nextCursor);
        }}
        ListHeaderComponent={
          <View>
            <ScreenIntro
              eyebrow="Bleeding history"
              title={daysQuiet == null ? "No bleeds on file" : `${daysQuiet} day${daysQuiet === 1 ? "" : "s"} without a bleed`}
              lead={
                daysQuiet == null
                  ? "When your centre records a bleeding episode it will appear here with the site and severity."
                  : "Counted from the most recent episode your centre recorded."
              }
            />
            {error ? <ErrorNote message={error} onRetry={() => void load()} /> : null}
            {items.length ? (
              <>
                <StatStrip
                  items={[
                    { label: `Bleeds in ${year}`, value: String(thisYear) },
                    { label: "On record", value: String(items.length) },
                    { label: "Most affected", value: siteSlices[0]?.label ?? "—" },
                  ]}
                />
                <Panel style={styles.panelTop}>
                  <View style={styles.chartHead}>
                    <Text style={styles.chartTitle}>Bleeds by month</Text>
                    <Text style={servicesType.meta}>{year}</Text>
                  </View>
                  <InteractiveChart labels={MONTHS} series={[{ values: monthly, color: servicesColors.primary, label: "Bleeds" }]} height={128} />
                </Panel>
                {siteSlices.length ? (
                  <Panel style={styles.panelTop}>
                    <Text style={[styles.chartTitle, styles.siteTitle]}>By site</Text>
                    <View style={styles.donutRow}>
                      <DonutChart slices={siteSlices} centerLabel="bleeds" centerValue={String(items.length)} size={112} />
                      <View style={styles.siteList}>
                        {siteSlices.map((row) => (
                          <View key={row.label} style={styles.siteRow}>
                            <View style={[styles.siteSwatch, { backgroundColor: row.color }]} />
                            <Text style={styles.siteName} numberOfLines={1}>
                              {row.label}
                            </Text>
                            <Text style={styles.siteCount}>{row.count}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Panel>
                ) : null}
                {sites.length > 2 ? <TabStrip options={sites} value={site} onChange={setSite} style={styles.tabs} /> : null}
              </>
            ) : null}
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={servicesColors.primary} style={styles.more} /> : null}
        ListEmptyComponent={items.length ? <EmptyNote title="No bleeds at this site" /> : null}
        renderItem={({ item: row }) =>
          row.kind === "month" ? (
            <MonthHeader title={row.title} />
          ) : (
            <TimelineEntry date={row.item.episodeDate} last={row.last}>
              <View style={styles.entryHead}>
                <Text style={styles.entryTitle}>{row.item.site || "Site not recorded"}</Text>
                {row.item.severity ? <StatusTag label={row.item.severity} tone={severityTone(row.item.severity)} /> : null}
              </View>
              {row.item.hospitalName ? <Text style={styles.entryMeta}>{row.item.hospitalName}</Text> : null}
              {row.item.notes ? <Text style={styles.entryBody}>{row.item.notes}</Text> : null}
            </TimelineEntry>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { paddingHorizontal: servicesSpacing.screen, paddingBottom: 48 },
  panelTop: { marginTop: 12 },
  chartHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  chartTitle: { ...servicesType.label, fontSize: 14 },
  siteTitle: { marginBottom: 12 },
  donutRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  siteList: { flex: 1, gap: 8 },
  siteRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  siteSwatch: { width: 8, height: 8, borderRadius: 2 },
  siteName: { flex: 1, fontSize: 13.5, color: servicesColors.text },
  siteCount: { fontSize: 13.5, fontWeight: "700", color: servicesColors.ink, fontVariant: ["tabular-nums"] },
  tabs: { marginTop: 20 },
  more: { marginVertical: 16 },
  entryHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  entryTitle: { ...servicesType.label, flex: 1, fontSize: 15, textTransform: "capitalize" },
  entryMeta: { ...servicesType.meta, marginTop: 3 },
  entryBody: { fontSize: 14, lineHeight: 21, color: servicesColors.text, marginTop: 8 },
});
