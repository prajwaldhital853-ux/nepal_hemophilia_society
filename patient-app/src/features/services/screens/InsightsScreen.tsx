import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";

import { useAuth } from "@/core/auth/AuthContext";
import { useClearTopics } from "@/features/notifications/useClearTopics";
import type { RootStackParamList } from "@/core/navigation/types";
import { DonutChart, InteractiveChart } from "@/features/services/components/charts";
import {
  Divider,
  EmptyNote,
  ErrorNote,
  LegendDot,
  LinkRow,
  LoadingScreen,
  Panel,
  ScreenIntro,
  SectionHeading,
  StatStrip,
  Toggle,
  useBottomPadding,
} from "@/features/services/components/ui";
import { fetchPatientInsights, type PatientInsights } from "@/features/services/insights";
import {
  servicesChartPalette,
  servicesColors,
  servicesSpacing,
  servicesType,
} from "@/features/services/theme/servicesTheme";

type Props = StackScreenProps<RootStackParamList, "Insights">;

function changeNote(pct: number | null | undefined, invertGood = false) {
  if (pct == null) return { label: "No prior month", color: servicesColors.textMuted };
  if (pct === 0) return { label: "Same as last month", color: servicesColors.textMuted };
  const up = pct > 0;
  const good = invertGood ? !up : up;
  return {
    label: `${up ? "Up" : "Down"} ${Math.abs(pct).toFixed(0)}% on last month`,
    color: good ? servicesColors.good : servicesColors.primary,
  };
}

function toneColors(tone: string) {
  if (tone === "good") return { fg: servicesColors.good, bg: servicesColors.goodTint };
  if (tone === "alert") return { fg: servicesColors.primary, bg: servicesColors.primaryTint };
  return { fg: servicesColors.warn, bg: servicesColors.warnTint };
}

export default function InsightsScreen({ navigation }: Props) {
  useClearTopics("Insights");
  const { token, patient } = useAuth();
  const bottomPadding = useBottomPadding();
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
    const start = Math.max(0, data.monthly.labels.length - n);
    return {
      labels: data.monthly.labels.slice(start),
      injections: data.monthly.injections.slice(start),
      bleeds: data.monthly.bleeds.slice(start),
      iu: data.monthly.iu.slice(start),
    };
  }, [data, range]);

  if (loading && !data) return <LoadingScreen />;

  if (!data || !sliced) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
      >
        <ScreenIntro eyebrow="Health insights" title={patient?.fullName || "Your record"} />
        {error ? <ErrorNote message={error} onRetry={() => void load()} /> : null}
        <EmptyNote title="No insight data yet" body="Once your centre records injections or bleeds, trends will appear here." />
      </ScrollView>
    );
  }

  const tone = toneColors(data.status.tone);
  const score = Math.max(0, Math.min(100, data.status.score));
  const injChange = changeNote(data.comparison.injectionChangePct);
  const bleedChange = changeNote(data.comparison.bleedChangePct, true);
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  const focusLabel = selected != null ? sliced.labels[selected] : range === "6m" ? "Last 6 months" : "Last 12 months";
  const focusInj = selected != null ? sliced.injections[selected] : sum(sliced.injections);
  const focusBleed = selected != null ? sliced.bleeds[selected] : sum(sliced.bleeds);
  const focusIu = selected != null ? sliced.iu[selected] : sum(sliced.iu);
  const facts = [
    { label: "Type", value: data.profile.hemophiliaType || "—" },
    { label: "Severity", value: data.profile.severity || "—" },
    { label: "Baseline", value: data.profile.baselineFactorLevel ? `${data.profile.baselineFactorLevel}%` : "—" },
  ];
  const maxIndication = Math.max(1, ...data.indications.map((row) => row.count));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
    >
      <ScreenIntro eyebrow="Health insights" title={patient?.fullName || "Your record"}>
        <View style={styles.facts}>
          {facts.map((fact, i) => (
            <View key={fact.label} style={[styles.fact, i > 0 && styles.factDivided]}>
              <Text style={styles.factLabel}>{fact.label}</Text>
              <Text style={styles.factValue} numberOfLines={1}>
                {fact.value}
              </Text>
            </View>
          ))}
        </View>
      </ScreenIntro>

      <Panel style={styles.status}>
        <View style={styles.statusTop}>
          <View style={styles.scoreBlock}>
            <Text style={[styles.score, { color: tone.fg }]}>{score}</Text>
            <Text style={styles.scoreOut}>/ 100</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.statusPillText, { color: tone.fg }]}>{data.status.label}</Text>
          </View>
        </View>
        <View style={styles.meter}>
          <View style={[styles.meterFill, { width: `${score}%`, backgroundColor: tone.fg }]} />
        </View>
        <Text style={styles.statusSummary}>{data.status.summary}</Text>
      </Panel>

      <View style={styles.block}>
        <StatStrip
          items={[
            { label: "Injections, 12 mo", value: String(data.totals.injections12m), note: injChange.label, noteColor: injChange.color },
            { label: "Bleeds, 12 mo", value: String(data.totals.bleeds12m), note: bleedChange.label, noteColor: bleedChange.color },
          ]}
        />
        <View style={styles.stripGap} />
        <StatStrip
          items={[
            {
              label: `Factor used (${data.totals.iuUnit})`,
              value: Math.round(data.totals.iu12m).toLocaleString(),
              note: "Past 12 months",
            },
            {
              label: "Days since last bleed",
              value: data.totals.daysSinceBleed == null ? "—" : String(data.totals.daysSinceBleed),
              note: data.totals.lastBleedOn ? `Last on ${data.totals.lastBleedOn}` : "No bleed on file",
            },
          ]}
        />
      </View>

      <SectionHeading index={1} title="Month by month" style={styles.sectionTop} />
      <Panel>
        <View style={styles.chartControls}>
          <Toggle
            options={["activity", "factor"] as const}
            value={chart}
            onChange={setChart}
            labelFor={(o) => (o === "activity" ? "Activity" : "Factor IU")}
          />
          <Toggle
            options={["6m", "12m"] as const}
            value={range}
            onChange={(next) => {
              setRange(next);
              setSelected(null);
            }}
            labelFor={(o) => o.toUpperCase()}
          />
        </View>
        <InteractiveChart
          labels={sliced.labels}
          mode={chart === "factor" ? "line" : "bar"}
          selectedIndex={selected}
          onSelectIndex={(i) => setSelected((current) => (current === i ? null : i))}
          series={
            chart === "factor"
              ? [{ values: sliced.iu, color: servicesColors.ink, label: "IU" }]
              : [
                  { values: sliced.injections, color: servicesColors.ink, label: "Injections" },
                  { values: sliced.bleeds, color: servicesColors.primary, label: "Bleeds" },
                ]
          }
        />
        <View style={styles.chartFoot}>
          <View style={styles.legendRow}>
            {chart === "activity" ? (
              <>
                <LegendDot color={servicesColors.ink} label="Injections" />
                <LegendDot color={servicesColors.primary} label="Bleeds" />
              </>
            ) : (
              <LegendDot color={servicesColors.ink} label="IU used" />
            )}
          </View>
          <Text style={servicesType.meta}>Tap a month to focus</Text>
        </View>
        <Divider />
        <View style={styles.focus}>
          <Text style={styles.focusLabel}>{focusLabel}</Text>
          <Text style={styles.focusValue}>
            {chart === "factor"
              ? `${Math.round(focusIu).toLocaleString()} IU`
              : `${focusInj} injection${focusInj === 1 ? "" : "s"}  ·  ${focusBleed} bleed${focusBleed === 1 ? "" : "s"}`}
          </Text>
        </View>
      </Panel>

      <SectionHeading index={2} title="This month against last" style={styles.sectionTop} />
      <Panel padded={false}>
        <View style={[styles.compareRow, styles.compareHead]}>
          <Text style={[styles.compareCell, styles.compareLabelCell, styles.compareHeadText]} />
          <Text style={[styles.compareCell, styles.compareHeadText]}>Last</Text>
          <Text style={[styles.compareCell, styles.compareHeadText]}>This</Text>
          <Text style={[styles.compareCell, styles.compareHeadText]}>Change</Text>
        </View>
        {[
          { label: "Injections", now: data.comparison.thisMonth.injections, before: data.comparison.lastMonth.injections, invert: false },
          { label: "Bleeds", now: data.comparison.thisMonth.bleeds, before: data.comparison.lastMonth.bleeds, invert: true },
          {
            label: "Factor IU",
            now: Math.round(data.comparison.thisMonth.iu),
            before: Math.round(data.comparison.lastMonth.iu),
            invert: false,
          },
        ].map((row) => {
          const delta = row.now - row.before;
          const good = row.invert ? delta < 0 : delta > 0;
          const color = delta === 0 ? servicesColors.textMuted : good ? servicesColors.good : servicesColors.primary;
          return (
            <Fragment key={row.label}>
              <Divider />
              <View style={styles.compareRow}>
                <Text style={[styles.compareCell, styles.compareLabelCell]}>{row.label}</Text>
                <Text style={[styles.compareCell, styles.compareNum]}>{row.before.toLocaleString()}</Text>
                <Text style={[styles.compareCell, styles.compareNum, styles.compareNow]}>{row.now.toLocaleString()}</Text>
                <Text style={[styles.compareCell, styles.compareNum, { color }]}>
                  {delta === 0 ? "—" : `${delta > 0 ? "+" : "−"}${Math.abs(delta).toLocaleString()}`}
                </Text>
              </View>
            </Fragment>
          );
        })}
        <Divider />
        <Text style={styles.yearNote}>
          Year to date: {data.comparison.thisYear.injections} injections and {data.comparison.thisYear.bleeds} bleeds
          {data.comparison.yearBleedChangePct != null
            ? `. Bleeds are ${data.comparison.yearBleedChangePct > 0 ? "up" : "down"} ${Math.abs(data.comparison.yearBleedChangePct)}% on last year.`
            : "."}
        </Text>
      </Panel>

      <SectionHeading index={3} title="Where bleeds happened" style={styles.sectionTop} />
      <Panel>
        {data.bleedSites.length ? (
          <View style={styles.donutRow}>
            <DonutChart
              slices={data.bleedSites.map((row, i) => ({ ...row, color: servicesChartPalette[i % servicesChartPalette.length] }))}
              centerLabel="bleeds"
              centerValue={String(data.totals.bleeds12m)}
            />
            <View style={styles.siteList}>
              {data.bleedSites.map((row, i) => (
                <View key={row.label} style={styles.siteRow}>
                  <View style={[styles.siteSwatch, { backgroundColor: servicesChartPalette[i % servicesChartPalette.length] }]} />
                  <Text style={styles.siteName} numberOfLines={1}>
                    {row.label}
                  </Text>
                  <Text style={styles.siteCount}>{row.count}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={servicesType.meta}>No bleeds recorded in the last 12 months.</Text>
        )}
      </Panel>

      <SectionHeading index={4} title="Why factor was given" style={styles.sectionTop} />
      <Panel>
        {data.indications.length ? (
          data.indications.map((row, i) => (
            <View key={row.label} style={[styles.indication, i > 0 && styles.indicationSpaced]}>
              <View style={styles.indicationHead}>
                <Text style={styles.indicationLabel}>{row.label}</Text>
                <Text style={styles.indicationCount}>{row.count}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${Math.max(4, (row.count / maxIndication) * 100)}%` }]} />
              </View>
            </View>
          ))
        ) : (
          <Text style={servicesType.meta}>Reasons will appear once your centre logs injections.</Text>
        )}
      </Panel>

      {data.guidance.length ? (
        <>
          <SectionHeading index={5} title="Notes from your care team" style={styles.sectionTop} />
          {data.guidance.map((item) => (
            <View key={item.title} style={styles.note}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              <Text style={styles.noteBody}>{item.body || item.summary}</Text>
            </View>
          ))}
        </>
      ) : null}

      <SectionHeading title="Go to records" style={styles.sectionTop} />
      <Panel padded={false}>
        <LinkRow icon="medical-outline" label="Injection log" detail="Every dose, date and batch" onPress={() => navigation.navigate("Injections")} />
        <Divider inset={49} />
        <LinkRow icon="water-outline" label="Bleeding history" detail="Episodes by site and severity" onPress={() => navigation.navigate("Bleeding")} />
        <Divider inset={49} />
        <LinkRow icon="clipboard-outline" label="Treatment history" detail="Centre visits and therapy" onPress={() => navigation.navigate("Treatments")} />
      </Panel>

      {data.generatedAt ? <Text style={styles.generated}>Figures updated {new Date(data.generatedAt).toLocaleString()}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { paddingHorizontal: servicesSpacing.screen, paddingBottom: 48 },
  facts: {
    marginTop: 16,
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: servicesColors.borderStrong,
  },
  fact: { flex: 1, paddingVertical: 10 },
  factDivided: { paddingLeft: 12, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: servicesColors.border },
  factLabel: { fontSize: 11.5, color: servicesColors.textMuted },
  factValue: { marginTop: 2, fontSize: 14.5, fontWeight: "600", color: servicesColors.ink, textTransform: "capitalize" },
  status: { gap: 12 },
  statusTop: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  scoreBlock: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  score: { ...servicesType.figure, fontSize: 44, lineHeight: 48 },
  scoreOut: { fontSize: 14, color: servicesColors.textMuted, fontVariant: ["tabular-nums"] },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginBottom: 6 },
  statusPillText: { fontSize: 12.5, fontWeight: "700" },
  meter: { height: 4, borderRadius: 2, backgroundColor: servicesColors.paperDeep, overflow: "hidden" },
  meterFill: { height: 4, borderRadius: 2 },
  statusSummary: { ...servicesType.lead, color: servicesColors.text },
  block: { marginTop: 12 },
  stripGap: { height: 8 },
  sectionTop: { marginTop: servicesSpacing.section },
  chartControls: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  chartFoot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, marginBottom: 12 },
  legendRow: { flexDirection: "row", gap: 14 },
  focus: { paddingTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 },
  focusLabel: { fontSize: 13, color: servicesColors.textMuted },
  focusValue: { fontSize: 14, fontWeight: "700", color: servicesColors.ink, fontVariant: ["tabular-nums"] },
  compareHead: { paddingVertical: 10 },
  compareHeadText: { fontSize: 11.5, color: servicesColors.textMuted, fontWeight: "600" },
  compareRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  compareCell: { flex: 1, textAlign: "right" },
  compareLabelCell: { flex: 1.6, textAlign: "left", fontSize: 14, color: servicesColors.ink },
  compareNum: { fontSize: 14, color: servicesColors.inkSoft, fontVariant: ["tabular-nums"] },
  compareNow: { color: servicesColors.ink, fontWeight: "700" },
  yearNote: { ...servicesType.meta, paddingHorizontal: 16, paddingVertical: 12 },
  donutRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  siteList: { flex: 1, gap: 8 },
  siteRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  siteSwatch: { width: 8, height: 8, borderRadius: 2 },
  siteName: { flex: 1, fontSize: 13.5, color: servicesColors.text },
  siteCount: { fontSize: 13.5, fontWeight: "700", color: servicesColors.ink, fontVariant: ["tabular-nums"] },
  indication: {},
  indicationSpaced: { marginTop: 14 },
  indicationHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  indicationLabel: { fontSize: 13.5, color: servicesColors.text },
  indicationCount: { fontSize: 13.5, fontWeight: "700", color: servicesColors.ink, fontVariant: ["tabular-nums"] },
  track: { height: 6, borderRadius: 3, backgroundColor: servicesColors.paperDeep, overflow: "hidden" },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: servicesColors.ink },
  note: {
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: servicesColors.primary,
    marginBottom: 16,
  },
  noteTitle: { ...servicesType.title, fontSize: 16, lineHeight: 21 },
  noteBody: { ...servicesType.body, fontSize: 14.5, lineHeight: 22, marginTop: 4, color: servicesColors.inkSoft },
  generated: { ...servicesType.meta, marginTop: 20, textAlign: "center" },
});
