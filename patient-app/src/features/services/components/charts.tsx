import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { servicesColors, servicesRadii } from "@/features/services/theme/servicesTheme";

export type ChartSeries = {
  values: number[];
  color: string;
  label: string;
};

type Props = {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  mode?: "bar" | "line";
  selectedIndex?: number | null;
  onSelectIndex?: (index: number) => void;
  yLabel?: string;
};

export function InteractiveChart({
  labels,
  series,
  height = 168,
  mode = "bar",
  selectedIndex = null,
  onSelectIndex,
  yLabel,
}: Props) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(260, width - 48);
  const padding = { top: 16, bottom: 24, left: yLabel ? 36 : 28, right: 8 };
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const maxVal = Math.max(1, ...series.flatMap((row) => row.values));
  const yMax = maxVal <= 4 ? 4 : Math.ceil(maxVal / 4) * 4;
  const ticks = [0, yMax / 2, yMax];
  const groupW = plotW / Math.max(labels.length, 1);
  const barW = Math.max(6, (groupW - 8) / Math.max(series.length, 1));

  const linePaths = useMemo(() => {
    return series.map((row) => {
      const pts = row.values.map((v, i) => {
        const x = padding.left + groupW * i + groupW / 2;
        const y = padding.top + plotH - (v / yMax) * plotH;
        return { x, y, v };
      });
      if (!pts.length) return "";
      return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    });
  }, [groupW, padding.left, padding.top, plotH, series, yMax]);

  return (
    <View>
      <Svg width={chartWidth} height={height}>
        {ticks.map((tick) => {
          const y = padding.top + plotH - (tick / yMax) * plotH;
          return (
            <Line
              key={`t-${tick}`}
              x1={padding.left}
              y1={y}
              x2={chartWidth - padding.right}
              y2={y}
              stroke={servicesColors.border}
              strokeWidth={1}
            />
          );
        })}
        {ticks.map((tick) => {
          const y = padding.top + plotH - (tick / yMax) * plotH;
          return (
            <SvgText key={`l-${tick}`} x={padding.left - 6} y={y + 3} fontSize={9} fill={servicesColors.textMuted} textAnchor="end">
              {tick % 1 === 0 ? String(tick) : tick.toFixed(0)}
            </SvgText>
          );
        })}
        {mode === "bar"
          ? series.map((row, s) =>
              row.values.map((v, i) => {
                const h = (v / yMax) * plotH;
                const x = padding.left + groupW * i + 4 + s * (barW + 2);
                const y = padding.top + plotH - h;
                const active = selectedIndex === i;
                return (
                  <Rect
                    key={`${row.label}-${i}`}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(h, v > 0 ? 3 : 0)}
                    rx={3}
                    fill={row.color}
                    opacity={active || selectedIndex == null ? 1 : 0.35}
                  />
                );
              }),
            )
          : series.map((row, s) => (
              <Path key={row.label} d={linePaths[s]} stroke={row.color} strokeWidth={2.4} fill="none" />
            ))}
        {mode === "line"
          ? series.map((row) =>
              row.values.map((v, i) => {
                const x = padding.left + groupW * i + groupW / 2;
                const y = padding.top + plotH - (v / yMax) * plotH;
                return <Circle key={`${row.label}-d-${i}`} cx={x} cy={y} r={selectedIndex === i ? 5 : 3.5} fill={row.color} />;
              }),
            )
          : null}
        {labels.map((label, i) => {
          const x = padding.left + groupW * i + groupW / 2;
          const active = selectedIndex === i;
          return (
            <SvgText
              key={label + i}
              x={x}
              y={height - 6}
              fontSize={9}
              fill={active ? servicesColors.primary : servicesColors.textMuted}
              fontWeight={active ? "700" : "400"}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
      {onSelectIndex ? (
        <View style={[styles.hitRow, { paddingLeft: padding.left, paddingRight: padding.right }]}>
          {labels.map((label, i) => (
            <Pressable key={`hit-${label}-${i}`} style={styles.hit} onPress={() => onSelectIndex(i)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function DonutChart({
  slices,
  size = 132,
  centerLabel,
  centerValue,
}: {
  slices: { label: string; count: number; color: string }[];
  size?: number;
  centerLabel: string;
  centerValue: string;
}) {
  const total = slices.reduce((sum, row) => sum + row.count, 0) || 1;
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <View style={styles.donutWrap}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke="#F3F4F6" strokeWidth={14} fill="none" />
        {slices.map((slice) => {
          const len = (slice.count / total) * c;
          const node = (
            <Circle
              key={slice.label}
              cx={cx}
              cy={cy}
              r={r}
              stroke={slice.color}
              strokeWidth={14}
              fill="none"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += len;
          return node;
        })}
      </Svg>
      <View style={styles.donutCenter} pointerEvents="none">
        <Text style={styles.donutValue}>{centerValue}</Text>
        <Text style={styles.donutLabel}>{centerLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hitRow: { flexDirection: "row", marginTop: -24, height: 28 },
  hit: { flex: 1 },
  donutWrap: { width: 132, height: 132, alignItems: "center", justifyContent: "center" },
  donutCenter: { position: "absolute", alignItems: "center" },
  donutValue: { fontSize: 18, fontWeight: "800", color: servicesColors.navy },
  donutLabel: { fontSize: 10, color: servicesColors.textMuted, fontWeight: "600" },
});
