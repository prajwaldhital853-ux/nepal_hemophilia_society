import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";

import { useAuth } from "@/core/auth/AuthContext";
import { useClearTopics } from "@/features/notifications/useClearTopics";
import type { RootStackParamList } from "@/core/navigation/types";
import { DonutChart, InteractiveChart } from "@/features/services/components/charts";
import { fetchPatientInsights, type PatientInsights } from "@/features/services/insights";
import { servicesColors, servicesSpacing } from "@/features/services/theme/servicesTheme";

type Props = StackScreenProps<RootStackParamList, "Insights">;

const SLICE_COLORS = ["#C1121F", "#001D3D", "#F59E0B", "#0F766E", "#7C3AED", "#2563EB"];

function changeText(pct: number | null | undefined, invertGood = false) {
  if (pct == null) return { label: "—", color: servicesColors.textMuted };
  const up = pct > 0;
  const good = invertGood ? !up : up;
  const arrow = up ? "↑" : pct < 0 ? "↓" : "→";
  return {
    label: `${arrow} ${Math.abs(pct).toFixed(0)}% vs last month`,
    color: pct === 0 ? servicesColors.textMuted : good ? "#15803D" : "#B91C1C",
  };
}

function toneStyle(tone: string) {
  if (tone === "good") return { bg: "#ECFDF5", fg: "#047857", ring: "#10B981" };
  if (tone === "alert") return { bg: "#FEF2F2", fg: "#B91C1C", ring: "#DC2626" };
  return { bg: "#FFFBEB", fg: "#B45309", ring: "#F59E0B" };
}

export default function InsightsScreen({ navigation }: Props) {
  useClearTopics("Insights");
  const { token, patient } = useAuth();
  const [data, setData] = useState<PatientInsights | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"6m" | "12m">("6m");
  const [chart, setChart] = useState<"activity" | "factor">("activity");
  const [selected, setSelected] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setData(await fetchPatientInsights(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load insights");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const sliced = useMemo(() => {
    if (!data) return null;
    const n = range === "6m" ? 6 : 12;
    const start = data.monthly.labels.length - n;
    return {
      labels: data.monthly.labels.slice(start),
      injections: data.monthly.injections.slice(start),
      bleeds: data.monthly.bleeds.slice(start),
      treatments: data.monthly.treatments.slice(start),
      iu: data.monthly.iu.slice(start),
    };
  }, [data, range]);

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={servicesColors.primary} />
      </View>
    );
  }

  if (!data || !sliced) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "No insight data yet."}</Text>
      </View>
    );
  }

  const tone = toneStyle(data.status.tone);
  const injChange = changeText(data.comparison.injectionChangePct, false);
  const bleedChange = changeText(data.comparison.bleedChangePct, true);
  const selectedLabel = selected != null ? sliced.labels[selected] : "This range";
  const selectedInj = selected != null ? sliced.injections[selected] : sliced.injections.reduce((a, b) => a + b, 0);
  const selectedBleed = selected != null ? sliced.bleeds[selected] : sliced.bleeds.reduce((a, b) => a + b, 0);
  const selectedIu = selected != null ? sliced.iu[selected] : sliced.iu.reduce((a, b) => a + b, 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
    >
      <Text style={styles.kicker}>Your NHMS record</Text>
      <Text style={styles.hello}>{patient?.fullName || "Patient"}</Text>
      <Text style={styles.sub}>
        Type {data.profile.hemophiliaType} · {data.profile.severity} · baseline {data.profile.baselineFactorLevel}%
      </Text>

      <View style={[styles.statusCard, { backgroundColor: tone.bg }]}>
        <View style={[styles.scoreRing, { borderColor: tone.ring }]}>
          <Text style={[styles.score, { color: tone.fg }]}>{data.status.score}</Text>
          <Text style={styles.scoreOut}>/100</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusLabel, { color: tone.fg }]}>{data.status.label}</Text>
          <Text style={styles.statusSummary}>{data.status.summary}</Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <Metric title="Injections (12 mo)" value={String(data.totals.injections12m)} hint={injChange.label} hintColor={injChange.color} />
        <Metric title="Bleeds (12 mo)" value={String(data.totals.bleeds12m)} hint={bleedChange.label} hintColor={bleedChange.color} />
        <Metric title="Factor used" value={`${Math.round(data.totals.iu12m).toLocaleString()}`} hint={`${data.totals.iuUnit} in 12 months`} />
        <Metric
          title="Quiet streak"
          value={data.totals.daysSinceBleed == null ? "—" : `${data.totals.daysSinceBleed}d`}
          hint={data.totals.daysSinceBleed == null ? "No bleed on file" : "since last bleed"}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>{chart === "activity" ? "Bleeds vs injections" : "Factor units"}</Text>
          <View style={styles.pills}>
            {(["6m", "12m"] as const).map((item) => (
              <Pressable key={item} onPress={() => { setRange(item); setSelected(null); }} style={[styles.pill, range === item && styles.pillOn]}>
                <Text style={[styles.pillText, range === item && styles.pillTextOn]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.pills}>
          <Pressable onPress={() => setChart("activity")} style={[styles.pill, chart === "activity" && styles.pillOn]}>
            <Text style={[styles.pillText, chart === "activity" && styles.pillTextOn]}>Activity</Text>
          </Pressable>
          <Pressable onPress={() => setChart("factor")} style={[styles.pill, chart === "factor" && styles.pillOn]}>
            <Text style={[styles.pillText, chart === "factor" && styles.pillTextOn]}>Factor IU</Text>
          </Pressable>
        </View>
        <InteractiveChart
          labels={sliced.labels}
          mode={chart === "factor" ? "line" : "bar"}
          selectedIndex={selected}
          onSelectIndex={setSelected}
          series={
            chart === "factor"
              ? [{ values: sliced.iu, color: servicesColors.navy, label: "IU" }]
              : [
                  { values: sliced.injections, color: servicesColors.navy, label: "Injections" },
                  { values: sliced.bleeds, color: servicesColors.primary, label: "Bleeds" },
                ]
          }
        />
        <View style={styles.legend}>
          {chart === "activity" ? (
            <>
              <Legend color={servicesColors.navy} label="Injections" />
              <Legend color={servicesColors.primary} label="Bleeds" />
            </>
          ) : (
            <Legend color={servicesColors.navy} label="IU used" />
          )}
        </View>
        <Pressable onPress={() => setSelected(null)}>
          <Text style={styles.selected}>
            {selectedLabel}: {chart === "factor" ? `${Math.round(selectedIu).toLocaleString()} IU` : `${selectedInj} injections · ${selectedBleed} bleeds`}
            {selected != null ? "  · tap to show all" : ""}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>This month vs last month</Text>
        <CompareRow label="Injections" current={data.comparison.thisMonth.injections} previous={data.comparison.lastMonth.injections} invert={false} />
        <CompareRow label="Bleeds" current={data.comparison.thisMonth.bleeds} previous={data.comparison.lastMonth.bleeds} invert />
        <CompareRow label="Factor IU" current={Math.round(data.comparison.thisMonth.iu)} previous={Math.round(data.comparison.lastMonth.iu)} invert={false} />
        <Text style={styles.yearHint}>
          Year so far: {data.comparison.thisYear.injections} injections, {data.comparison.thisYear.bleeds} bleeds
          {data.comparison.yearBleedChangePct != null
            ? ` · bleeds ${data.comparison.yearBleedChangePct > 0 ? "up" : "down"} ${Math.abs(data.comparison.yearBleedChangePct)}% vs last year`
            : ""}
        </Text>
      </View>

      <View style={styles.split}>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Bleed sites</Text>
          {data.bleedSites.length ? (
            <>
              <DonutChart
                slices={data.bleedSites.map((row, i) => ({ ...row, color: SLICE_COLORS[i % SLICE_COLORS.length] }))}
                centerLabel="sites"
                centerValue={String(data.totals.bleeds12m)}
              />
              {data.bleedSites.map((row, i) => (
                <Text key={row.label} style={styles.legendLine}>
                  <Text style={{ color: SLICE_COLORS[i % SLICE_COLORS.length] }}>● </Text>
                  {row.label} · {row.count}
                </Text>
              ))}
            </>
          ) : (
            <Text style={styles.muted}>No bleeds recorded in this window.</Text>
          )}
        </View>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Why factor was given</Text>
          {data.indications.length ? (
            data.indications.map((row) => {
              const max = Math.max(...data.indications.map((item) => item.count), 1);
              return (
                <View key={row.label} style={{ marginBottom: 8 }}>
                  <Text style={styles.barLabel}>
                    {row.label} · {row.count}
                  </Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.max(8, (row.count / max) * 100)}%` }]} />
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.muted}>Injections will chart here once your centre logs them.</Text>
          )}
        </View>
      </View>

      <View style={styles.quickRow}>
        <QuickLink label="Injection log" onPress={() => navigation.navigate("Injections")} />
        <QuickLink label="Bleeds" onPress={() => navigation.navigate("Bleeding")} />
        <QuickLink label="Treatments" onPress={() => navigation.navigate("Treatments")} />
      </View>

      {data.guidance.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>From NHS (admin-written)</Text>
          {data.guidance.map((item) => (
            <View key={item.title} style={styles.tip}>
              <Text style={styles.tipTitle}>{item.title}</Text>
              <Text style={styles.tipBody}>{item.body || item.summary}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Metric({ title, value, hint, hintColor }: { title: string; value: string; hint?: string; hintColor?: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {hint ? <Text style={[styles.metricHint, hintColor ? { color: hintColor } : null]}>{hint}</Text> : null}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function CompareRow({
  label,
  current,
  previous,
  invert,
}: {
  label: string;
  current: number;
  previous: number;
  invert: boolean;
}) {
  const delta = current - previous;
  const good = invert ? delta <= 0 : delta >= 0;
  return (
    <View style={styles.compareRow}>
      <Text style={styles.compareLabel}>{label}</Text>
      <View style={styles.compareBars}>
        <View style={[styles.compareBar, { flex: Math.max(previous, 0.3), backgroundColor: "#E5E7EB" }]} />
        <View style={[styles.compareBar, { flex: Math.max(current, 0.3), backgroundColor: servicesColors.primary }]} />
      </View>
      <Text style={[styles.compareDelta, { color: delta === 0 ? servicesColors.textMuted : good ? "#15803D" : "#B91C1C" }]}>
        {current} / {previous}
      </Text>
    </View>
  );
}

function QuickLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quick} onPress={onPress}>
      <Text style={styles.quickText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { padding: servicesSpacing.screen + 6, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: servicesColors.pageBg },
  kicker: { fontSize: 11, fontWeight: "800", color: servicesColors.primary, letterSpacing: 0.6, textTransform: "uppercase" },
  hello: { marginTop: 4, fontSize: 24, fontWeight: "800", color: servicesColors.navy },
  sub: { marginTop: 4, fontSize: 13, color: servicesColors.textMuted },
  error: { color: servicesColors.primary, textAlign: "center", padding: 24 },
  statusCard: { marginTop: 14, borderRadius: 18, padding: 14, flexDirection: "row", gap: 12, alignItems: "center" },
  scoreRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  score: { fontSize: 22, fontWeight: "800" },
  scoreOut: { fontSize: 9, color: servicesColors.textMuted, fontWeight: "700" },
  statusLabel: { fontSize: 16, fontWeight: "800" },
  statusSummary: { marginTop: 4, fontSize: 13, lineHeight: 18, color: servicesColors.text },
  metricGrid: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: { width: "48%", backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: servicesColors.border },
  metricTitle: { fontSize: 11, color: servicesColors.textMuted, fontWeight: "600" },
  metricValue: { marginTop: 4, fontSize: 20, fontWeight: "800", color: servicesColors.navy },
  metricHint: { marginTop: 4, fontSize: 11, color: servicesColors.textMuted },
  card: { marginTop: 12, backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: servicesColors.border },
  cardTitle: { fontSize: 15, fontWeight: "800", color: servicesColors.navy, marginBottom: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  pills: { flexDirection: "row", gap: 6, marginBottom: 8 },
  pill: { borderWidth: 1, borderColor: servicesColors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#fff" },
  pillOn: { backgroundColor: servicesColors.primary, borderColor: servicesColors.primary },
  pillText: { fontSize: 11, fontWeight: "700", color: servicesColors.navy },
  pillTextOn: { color: "#fff" },
  legend: { flexDirection: "row", gap: 12, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11, color: servicesColors.textMuted, fontWeight: "600" },
  selected: { marginTop: 8, fontSize: 12, color: servicesColors.navy, fontWeight: "600" },
  yearHint: { marginTop: 10, fontSize: 12, color: servicesColors.textMuted, lineHeight: 18 },
  split: { flexDirection: "row", gap: 8 },
  muted: { fontSize: 12, color: servicesColors.textMuted, lineHeight: 18 },
  legendLine: { fontSize: 11, color: servicesColors.text, marginTop: 4 },
  barLabel: { fontSize: 11, color: servicesColors.text, fontWeight: "600" },
  barTrack: { height: 8, backgroundColor: "#F3F4F6", borderRadius: 8, overflow: "hidden", marginTop: 4 },
  barFill: { height: 8, backgroundColor: servicesColors.primary, borderRadius: 8 },
  compareRow: { marginBottom: 10 },
  compareLabel: { fontSize: 12, fontWeight: "700", color: servicesColors.navy, marginBottom: 4 },
  compareBars: { flexDirection: "row", height: 8, gap: 4 },
  compareBar: { height: 8, borderRadius: 8 },
  compareDelta: { marginTop: 4, fontSize: 11, fontWeight: "700" },
  quickRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  quick: { flex: 1, backgroundColor: servicesColors.navy, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  quickText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  tip: { marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: servicesColors.border },
  tipTitle: { fontSize: 13, fontWeight: "800", color: servicesColors.navy },
  tipBody: { marginTop: 4, fontSize: 13, lineHeight: 19, color: servicesColors.text },
});
