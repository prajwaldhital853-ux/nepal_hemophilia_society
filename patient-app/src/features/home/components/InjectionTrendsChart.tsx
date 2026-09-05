import { Fragment } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { mockMonthlyTrends } from "@/features/home/data/mockPatientData";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

type ChartPoint = { x: number; y: number; v: number };

function buildSmoothPath(points: ChartPoint[], startIdx: number, endIdx: number): string {
  const slice = points.slice(startIdx, endIdx + 1);
  if (slice.length === 0) return "";
  if (slice.length === 1) return `M ${slice[0].x} ${slice[0].y}`;

  let d = `M ${slice[0].x} ${slice[0].y}`;
  for (let i = 0; i < slice.length - 1; i += 1) {
    const p0 = slice[i - 1] ?? slice[i];
    const p1 = slice[i];
    const p2 = slice[i + 1];
    const p3 = slice[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function InjectionTrendsChart() {
  const { width } = useWindowDimensions();
  const chartWidth = width - homeSpacing.screen * 2 - homeSpacing.card * 2;
  const chartHeight = 168;
  const d = mockMonthlyTrends;
  const currentIdx = d.currentMonthIndex;
  const yMax = d.yMax;

  const padding = { top: 20, bottom: 22, left: 38, right: 8 };
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;
  const baselineY = padding.top + plotH;
  const yTicks = [0, 5, 10, 15, 20];
  const yAxisLabelX = 7;
  const yTickLabelX = padding.left - 10;

  const points: ChartPoint[] = d.values.map((v, i) => {
    const x = padding.left + (i / (d.values.length - 1)) * plotW;
    const y = padding.top + plotH - (v / yMax) * plotH;
    return { x, y, v };
  });

  const actualLinePath = buildSmoothPath(points, 0, currentIdx);
  const futureLinePath = buildSmoothPath(points, currentIdx, points.length - 1);
  const areaPath = `${actualLinePath} L ${points[currentIdx].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
  const currentPoint = points[currentIdx];

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Monthly Injection Trends</Text>
            <Text style={styles.subtitle}>
              Year {d.year} • {d.subtitle}
            </Text>
          </View>
          <Pressable style={styles.historyBtn}>
            <Text style={styles.historyText}>History &gt;</Text>
          </Pressable>
        </View>

        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="injectionAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={homeColors.primary} stopOpacity={0.22} />
              <Stop offset="1" stopColor={homeColors.primary} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          <SvgText
            x={yAxisLabelX}
            y={padding.top + plotH / 2}
            fontSize={9}
            fill={homeColors.textLight}
            textAnchor="middle"
            transform={`rotate(-90, ${yAxisLabelX}, ${padding.top + plotH / 2})`}
          >
            Injections
          </SvgText>

          {yTicks.map((tick) => {
            const y = padding.top + plotH - (tick / yMax) * plotH;
            return (
              <Fragment key={`grid-${tick}`}>
                <Line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke={homeColors.border}
                  strokeWidth={1}
                  opacity={tick === 0 ? 0.55 : 0.35}
                />
                <SvgText
                  x={yTickLabelX}
                  y={y + 3}
                  fontSize={9.5}
                  fill={homeColors.textLight}
                  textAnchor="end"
                >
                  {tick}
                </SvgText>
              </Fragment>
            );
          })}

          <Path d={areaPath} fill="url(#injectionAreaGrad)" />

          <Path d={actualLinePath} stroke={homeColors.primary} strokeWidth={2.8} fill="none" />

          <Path
            d={futureLinePath}
            stroke={homeColors.primary}
            strokeWidth={2.5}
            fill="none"
            strokeDasharray="6 5"
            opacity={0.85}
          />

          <Line
            x1={currentPoint.x}
            y1={currentPoint.y + 5}
            x2={currentPoint.x}
            y2={baselineY}
            stroke={homeColors.primary}
            strokeWidth={1.2}
            opacity={0.35}
          />

          {points.slice(0, currentIdx + 1).map((p, i) => (
            <Circle
              key={`dot-${d.months[i]}`}
              cx={p.x}
              cy={p.y}
              r={i === currentIdx ? 6.5 : 5}
              fill={homeColors.primary}
              stroke={homeColors.white}
              strokeWidth={i === currentIdx ? 2.2 : 1.8}
            />
          ))}

          {points.slice(0, currentIdx + 1).map((p, i) => (
            <SvgText
              key={`val-${d.months[i]}`}
              x={p.x}
              y={p.y - 12}
              fontSize={12}
              fill={homeColors.text}
              textAnchor="middle"
              fontWeight="700"
            >
              {p.v}
            </SvgText>
          ))}

          {d.months.map((m, i) => {
            const x = points[i].x;
            const y = chartHeight - 8;
            const isCurrent = i === currentIdx;

            if (isCurrent) {
              return (
                <Fragment key={m}>
                  <Rect x={x - 15} y={y - 11} width={30} height={16} rx={8} fill={homeColors.primary} />
                  <SvgText x={x} y={y + 1} fontSize={9.5} fill={homeColors.white} textAnchor="middle" fontWeight="700">
                    {m}
                  </SvgText>
                </Fragment>
              );
            }

            return (
              <SvgText key={m} x={x} y={y} fontSize={9.5} fill={homeColors.textLight} textAnchor="middle">
                {m}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: homeSpacing.section,
    paddingHorizontal: homeSpacing.screen,
  },
  card: {
    backgroundColor: homeColors.cardBg,
    borderRadius: homeRadii.card,
    borderWidth: 1,
    borderColor: homeColors.border,
    padding: homeSpacing.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerText: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: homeColors.text,
  },
  subtitle: {
    fontSize: 10,
    color: homeColors.textMuted,
    marginTop: 3,
  },
  historyBtn: {
    borderWidth: 1,
    borderColor: homeColors.border,
    borderRadius: homeRadii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: homeColors.white,
  },
  historyText: {
    fontSize: 10,
    fontWeight: "600",
    color: homeColors.primary,
  },
});
