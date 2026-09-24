import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import { InteractiveChart } from "@/features/services/components/charts";
import {
  MonthHeader,
  TimelineEntry,
  monthKey,
  monthTitle,
  parseRecordDate,
  shortDate,
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
import { servicesColors, servicesSpacing, servicesType } from "@/features/services/theme/servicesTheme";

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

type Row = { kind: "month"; key: string; title: string } | { kind: "entry"; key: string; item: TreatmentItem; last: boolean };

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function statusTone(status: string): "good" | "warn" | "alert" | "neutral" {
  const s = status.toLowerCase();
  if (s.includes("complete") || s.includes("done")) return "good";
  if (s.includes("schedul") || s.includes("pending") || s.includes("progress") || s.includes("active")) return "warn";
  if (s.includes("miss") || s.includes("fail")) return "alert";
  return "neutral";
}

export default function TreatmentsScreen() {
  useClearTopics("Treatments");
  const { token } = useAuth();
  const bottomPadding = useBottomPadding();
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
  const year = new Date().getFullYear();
  const monthly = useMemo(
    () =>
      MONTHS.map((_, index) =>
        items.filter((row) => {
          const d = parseRecordDate(row.treatmentDate);
          return d?.getFullYear() === year && d.getMonth() === index;
        }).length,
      ),
    [items, year],
  );
  const thisYearTotal = monthly.reduce((a, b) => a + b, 0);
  const commonType = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((row) => row.treatmentType && counts.set(row.treatmentType, (counts.get(row.treatmentType) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  }, [items]);

  const rows = useMemo(() => {
    const out: Row[] = [];
    let current = "";
    visible.forEach((item, i) => {
      const key = monthKey(item.treatmentDate);
      if (key !== current) {
        current = key;
        out.push({ kind: "month", key: `m-${key}`, title: monthTitle(item.treatmentDate) });
      }
      const next = visible[i + 1];
      out.push({ kind: "entry", key: String(item.id), item, last: !next || monthKey(next.treatmentDate) !== key });
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
              eyebrow="Treatment history"
              title="Visits to your centre"
              lead="Physiotherapy, admissions, ITI and other visits recorded by your treatment centre."
            />
            {error ? <ErrorNote message={error} onRetry={() => void load()} /> : null}
            <StatStrip
              items={[
                { label: `Visits in ${year}`, value: String(thisYearTotal) },
                { label: "Most common", value: commonType },
                { label: "Last visit", value: items[0] ? shortDate(items[0].treatmentDate).replace(/ \d{4}$/, "") : "—" },
              ]}
            />
            <Panel style={styles.chart}>
              <View style={styles.chartHead}>
                <Text style={styles.chartTitle}>Visits by month</Text>
                <Text style={servicesType.meta}>{year}</Text>
              </View>
              <InteractiveChart labels={MONTHS} series={[{ values: monthly, color: servicesColors.ink, label: "Visits" }]} height={128} />
            </Panel>
            {types.length > 2 ? <TabStrip options={types} value={typeFilter} onChange={setTypeFilter} style={styles.tabs} /> : null}
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={servicesColors.primary} style={styles.more} /> : null}
        ListEmptyComponent={
          <EmptyNote
            title="No visits recorded yet"
            body="Your centre will add physiotherapy, dental and other visits here after each appointment."
          />
        }
        renderItem={({ item: row }) =>
          row.kind === "month" ? (
            <MonthHeader title={row.title} />
          ) : (
            <TimelineEntry date={row.item.treatmentDate} last={row.last}>
              <View style={styles.entryHead}>
                <Text style={styles.entryTitle}>{row.item.label || row.item.treatmentType || "Visit"}</Text>
                {row.item.status ? <StatusTag label={row.item.status} tone={statusTone(row.item.status)} /> : null}
              </View>
              <Text style={styles.entryMeta}>
                {[row.item.label && row.item.treatmentType !== row.item.label ? row.item.treatmentType : "", row.item.hospitalName]
                  .filter(Boolean)
                  .join("  ·  ")}
              </Text>
              {row.item.description ? <Text style={styles.entryBody}>{row.item.description}</Text> : null}
              {row.item.notes ? <Text style={styles.entryNotes}>{row.item.notes}</Text> : null}
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
  chart: { marginTop: 12 },
  chartHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  chartTitle: { ...servicesType.label, fontSize: 14 },
  tabs: { marginTop: 20 },
  more: { marginVertical: 16 },
  entryHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  entryTitle: { ...servicesType.label, flex: 1, fontSize: 15 },
  entryMeta: { ...servicesType.meta, marginTop: 3 },
  entryBody: { fontSize: 14, lineHeight: 21, color: servicesColors.text, marginTop: 8 },
  entryNotes: {
    ...servicesType.meta,
    marginTop: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: servicesColors.border,
  },
});
