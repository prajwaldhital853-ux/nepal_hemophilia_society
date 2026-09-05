import { Fragment, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

import { monthlyUsage } from "@/features/factor/data/mockFactorData";
import { SectionTitle } from "@/features/factor/components/SectionTitle";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";

const Y_MAX = 5000;
const Y_TICKS = [0, 1000, 2000, 3000, 4000, 5000];

export function MonthlyFactorUsageChart() {
  const { width } = useWindowDimensions();
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const cardW = width - factorSpacing.screen * 2;
  const yLabelW = 18;
  const chartW = cardW - 24 - yLabelW;
  const chartH = 210;
  const pad = { top: 12, bottom: 24, left: 28, right: 6 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;
  const groupW = plotW / monthlyUsage.length;
  const barW = Math.max(8, groupW * 0.52);
  const active = activeBar != null ? monthlyUsage[activeBar] : null;

  return (
    <View style={styles.section}>
      <SectionTitle title="Monthly Factor Usage" />
      <View style={styles.card}>
        <View style={styles.headerRight}>
          <View style={styles.legItem}>
            <View style={[styles.dot, { backgroundColor: factorColors.primaryDark }]} />
            <Text style={styles.legText}>Factor VIII</Text>
          </View>
          <View style={styles.legItem}>
            <View style={[styles.dot, { backgroundColor: factorColors.pinkBar }]} />
            <Text style={styles.legText}>Factor IX</Text>
          </View>
          <View style={styles.yearChip}>
            <Text style={styles.yearText}>2025</Text>
            <Ionicons name="chevron-down" size={13} color={factorColors.navy} />
          </View>
        </View>

        <View style={styles.chartRow}>
          <View style={styles.yAxisLabelWrap}>
            <Text style={styles.yAxisLabel}>Factor Used (IU)</Text>
          </View>
          <View style={styles.chartArea}>
            <Svg width={chartW} height={chartH}>
              {Y_TICKS.map((tick) => {
                const y = pad.top + plotH - (tick / Y_MAX) * plotH;
                return (
                  <Fragment key={tick}>
                    <Line
                      x1={pad.left}
                      y1={y}
                      x2={chartW - pad.right}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeWidth={1}
                    />
                    <SvgText
                      x={pad.left - 6}
                      y={y + 4}
                      fill={factorColors.textMuted}
                      fontSize={10}
                      fontWeight="600"
                      textAnchor="end"
                    >
                      {tick === 0 ? "0" : `${tick / 1000}K`}
                    </SvgText>
                  </Fragment>
                );
              })}
              {monthlyUsage.map((m, i) => {
                const viiiH = (m.viii / Y_MAX) * plotH;
                const ixH = (m.ix / Y_MAX) * plotH;
                const x = pad.left + i * groupW + (groupW - barW) / 2;
                const viiiY = pad.top + plotH - viiiH;
                const ixY = viiiY - ixH;
                const totalH = viiiH + ixH;
                return (
                  <Fragment key={m.month}>
                    <Rect x={x} y={viiiY} width={barW} height={viiiH} rx={2} fill={factorColors.primaryDark} />
                    <Rect x={x} y={ixY} width={barW} height={ixH} rx={2} fill={factorColors.pinkBar} />
                    <Rect
                      x={x - 4}
                      y={ixY}
                      width={barW + 8}
                      height={totalH}
                      fill="transparent"
                      onPress={() => setActiveBar((prev) => (prev === i ? null : i))}
                    />
                    <SvgText
                      x={x + barW / 2}
                      y={chartH - 6}
                      fill={factorColors.textMuted}
                      fontSize={10}
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {m.month}
                    </SvgText>
                  </Fragment>
                );
              })}
            </Svg>

            {active && activeBar != null ? (
              <View
                style={[
                  styles.tooltip,
                  { left: Math.min(chartW - 118, Math.max(8, pad.left + activeBar * groupW - 24)) },
                ]}
                pointerEvents="none"
              >
                <Text style={styles.tipTitle}>{active.month} 2025</Text>
                <Text style={styles.tipLine}>FVIII: {active.viii.toLocaleString()} IU</Text>
                <Text style={styles.tipLine}>FIX: {active.ix.toLocaleString()} IU</Text>
                <Text style={styles.tipTotal}>Total: {(active.viii + active.ix).toLocaleString()} IU</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: factorSpacing.section,
  },
  card: {
    backgroundColor: factorColors.white,
    borderRadius: 14,
    padding: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    marginBottom: 8,
  },
  legItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legText: {
    fontSize: 11,
    fontWeight: "600",
    color: factorColors.navy,
  },
  yearChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  yearText: {
    fontSize: 11,
    fontWeight: "700",
    color: factorColors.navy,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  yAxisLabelWrap: {
    width: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 2,
  },
  yAxisLabel: {
    width: 110,
    fontSize: 10,
    fontWeight: "600",
    color: factorColors.textMuted,
    textAlign: "center",
    transform: [{ rotate: "-90deg" }],
  },
  chartArea: {
    flex: 1,
    position: "relative",
  },
  tooltip: {
    position: "absolute",
    top: 24,
    backgroundColor: "#8B0E18",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 104,
  },
  tipTitle: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 3,
  },
  tipLine: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
    lineHeight: 13,
  },
  tipTotal: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 2,
  },
});
