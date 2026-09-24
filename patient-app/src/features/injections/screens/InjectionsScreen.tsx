import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import { invalidatePatientData } from "@/core/patientDataEvents";
import { useLocale } from "@/core/i18n";
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

type Row =
  | { kind: "month"; key: string; title: string }
  | { kind: "entry"; key: string; item: InjectionItem; last: boolean };

const FILTERS = ["All", "Completed", "Scheduled", "Pending", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function statusOf(item: InjectionItem) {
  return item.status || "Completed";
}

function statusTone(status: string): "good" | "warn" | "alert" | "neutral" {
  if (status === "Completed") return "good";
  if (status === "Scheduled" || status === "Pending") return "warn";
  return "neutral";
}

export default function InjectionsScreen() {
  useClearTopics("Injections");
  const { token } = useAuth();
  const { t, l } = useLocale();
  const bottomPadding = useBottomPadding();
  const [items, setItems] = useState<InjectionItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const load = useCallback(
    async (cursor?: string) => {
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
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visible = useMemo(
    () => (filter === "All" ? items : items.filter((row) => statusOf(row) === filter)),
    [filter, items],
  );

  const year = new Date().getFullYear();
  const completed = useMemo(() => items.filter((row) => statusOf(row) === "Completed"), [items]);
  const monthly = useMemo(
    () =>
      MONTHS.map((_, index) =>
        completed.filter((row) => {
          const d = parseRecordDate(row.administeredAt);
          return d?.getFullYear() === year && d.getMonth() === index;
        }).length,
      ),
    [completed, year],
  );
  const iuThisYear = useMemo(
    () =>
      completed
        .filter((row) => parseRecordDate(row.administeredAt)?.getFullYear() === year)
        .reduce((sum, row) => sum + (parseFloat(String(row.dose)) || 0), 0),
    [completed, year],
  );
  const lastDose = completed[0]?.administeredAt;

  const rows = useMemo(() => {
    const out: Row[] = [];
    let current = "";
    visible.forEach((item, i) => {
      const key = monthKey(item.administeredAt);
      if (key !== current) {
        current = key;
        out.push({ kind: "month", key: `m-${key}`, title: monthTitle(item.administeredAt) });
      }
      const next = visible[i + 1];
      out.push({ kind: "entry", key: String(item.id), item, last: !next || monthKey(next.administeredAt) !== key });
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
        refreshControl={
          <RefreshControl
            refreshing={loading}
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
            <ScreenIntro eyebrow={t("injections.eyebrow")} title={t("injections.title")} lead={t("injections.lead")} />
            {error ? <ErrorNote message={error} onRetry={() => void load()} /> : null}
            <StatStrip
              items={[
                { label: t("injections.records"), value: String(items.length) },
                { label: t("injections.iuThisYear"), value: Math.round(iuThisYear).toLocaleString() },
                { label: t("injections.lastDose"), value: lastDose ? shortDate(lastDose).replace(/ \d{4}$/, "") : "—" },
              ]}
            />
            <Panel style={styles.chart}>
              <View style={styles.chartHead}>
                <Text style={styles.chartTitle}>{t("injections.chartTitle")}</Text>
                <Text style={servicesType.meta}>{year}</Text>
              </View>
              <InteractiveChart
                labels={MONTHS}
                series={[{ values: monthly, color: servicesColors.primary, label: t("injections.chartTitle") }]}
                height={128}
              />
            </Panel>
            <TabStrip
              options={FILTERS}
              value={filter}
              onChange={setFilter}
              labelFor={(option) => (option === "All" ? t("common.all") : l(option))}
              style={styles.tabs}
            />
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={servicesColors.primary} style={styles.more} /> : null}
        ListEmptyComponent={<EmptyNote title={t("injections.emptyTitle")} body={t("injections.empty")} />}
        renderItem={({ item: row }) => {
          if (row.kind === "month") return <MonthHeader title={row.title} />;
          const item = row.item;
          const status = statusOf(item);
          const doctor = item.doctorName || item.administeredBy;
          return (
            <TimelineEntry date={item.administeredAt} last={row.last}>
              <View style={styles.entryHead}>
                <Text style={styles.entryTitle}>
                  {[item.factorType, item.dose ? `${item.dose} ${item.unit}` : ""].filter(Boolean).join("  ·  ") ||
                    item.label}
                </Text>
                <StatusTag label={l(status)} tone={statusTone(status)} />
              </View>
              <Text style={styles.entryMeta}>{[item.indication, item.hospitalName].filter(Boolean).join("  ·  ")}</Text>
              {doctor ? (
                <Text style={styles.entryBody}>
                  {t("injections.doctor")}: {doctor}
                </Text>
              ) : null}
              {item.inhibitorWarning ? <Text style={styles.entryWarn}>{t("injections.inhibitorWarn")}</Text> : null}
            </TimelineEntry>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { paddingHorizontal: servicesSpacing.screen },
  chart: { marginTop: 12 },
  chartHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  chartTitle: { ...servicesType.label, fontSize: 14 },
  tabs: { marginTop: 20 },
  more: { marginVertical: 16 },
  entryHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  entryTitle: { ...servicesType.label, flex: 1, fontSize: 15 },
  entryMeta: { ...servicesType.meta, marginTop: 3 },
  entryBody: { fontSize: 13, lineHeight: 19, color: servicesColors.text, marginTop: 6 },
  entryWarn: {
    ...servicesType.meta,
    marginTop: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: servicesColors.warn,
    color: servicesColors.warn,
  },
});
