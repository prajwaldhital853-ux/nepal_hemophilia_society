import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { servicesColors, servicesType } from "@/features/services/theme/servicesTheme";

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
  const [chartWidth, setChartWidth] = useState(0);
  const padding = { top: 12, bottom: 22, left: yLabel ? 34 : 24, right: 4 };
  const plotW = Math.max(chartWidth - padding.left - padding.right, 1);
  const plotH = height - padding.top - padding.bottom;
  const maxVal = Math.max(1, ...series.flatMap((row) => row.values));
  const yMax = maxVal <= 4 ? 4 : Math.ceil(maxVal / 4) * 4;
  const ticks = [0, yMax / 2, yMax];
  const groupW = plotW / Math.max(labels.length, 1);
  const barW = Math.min(14, Math.max(4, (groupW - 6) / Math.max(series.length, 1) - 2));
  const groupBarsW = barW * series.length + 2 * (series.length - 1);

  const linePaths = useMemo(() => {
    return series.map((row) => {
      const pts = row.values.map((v, i) => ({
        x: padding.left + groupW * i + groupW / 2,
        y: padding.top + plotH - (v / yMax) * plotH,
      }));
      if (!pts.length) return "";
      return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    });
  }, [groupW, padding.left, padding.top, plotH, series, yMax]);

  return (
    <View onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)} style={{ height: height + (onSelectIndex ? 4 : 0) }}>
      {chartWidth > 0 ? (
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
                stroke={tick === 0 ? servicesColors.borderStrong : servicesColors.border}
                strokeWidth={1}
                strokeDasharray={tick === 0 ? undefined : "2 4"}
              />
            );
          })}
          {ticks.map((tick) => {
            const y = padding.top + plotH - (tick / yMax) * plotH;
            return (
              <SvgText key={`l-${tick}`} x={padding.left - 6} y={y + 3} fontSize={9.5} fill={servicesColors.textMuted} textAnchor="end">
                {String(Math.round(tick))}
              </SvgText>
            );
          })}
          {mode === "bar"
            ? series.map((row, s) =>
                row.values.map((v, i) => {
                  const h = (v / yMax) * plotH;
                  const x = padding.left + groupW * i + (groupW - groupBarsW) / 2 + s * (barW + 2);
                  const y = padding.top + plotH - h;
                  const active = selectedIndex === i;
                  return (
                    <Rect
                      key={`${row.label}-${i}`}
                      x={x}
                      y={y}
                      width={barW}
                      height={Math.max(h, v > 0 ? 2 : 0)}
                      rx={2}
                      fill={row.color}
                      opacity={active || selectedIndex == null ? 1 : 0.28}
                    />
                  );
                }),
              )
            : series.map((row, s) => <Path key={row.label} d={linePaths[s]} stroke={row.color} strokeWidth={2} fill="none" />)}
          {mode === "line"
            ? series.map((row) =>
                row.values.map((v, i) => {
                  const x = padding.left + groupW * i + groupW / 2;
                  const y = padding.top + plotH - (v / yMax) * plotH;
                  const active = selectedIndex === i;
                  return (
                    <Circle
                      key={`${row.label}-d-${i}`}
                      cx={x}
                      cy={y}
                      r={active ? 4.5 : 3}
                      fill={active ? row.color : servicesColors.white}
                      stroke={row.color}
                      strokeWidth={1.5}
                    />
                  );
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
                y={height - 5}
                fontSize={9.5}
                fill={active ? servicesColors.ink : servicesColors.textMuted}
                fontWeight={active ? "700" : "400"}
                textAnchor="middle"
              >
                {label}
              </SvgText>
            );
          })}
        </Svg>
      ) : null}
      {onSelectIndex && chartWidth > 0 ? (
        <View style={[StyleSheet.absoluteFill, styles.hitRow, { paddingLeft: padding.left, paddingRight: padding.right }]}>
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
  size = 124,
  centerLabel,
  centerValue,
}: {
  slices: { label: string; count: number; color: string }[];
  size?: number;
  centerLabel: string;
  centerValue: string;
}) {
  const total = slices.reduce((sum, row) => sum + row.count, 0) || 1;
  const stroke = 11;
  const r = size / 2 - stroke;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  const gap = slices.length > 1 ? 2 : 0;
  let offset = 0;
  return (
    <View style={[styles.donutWrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke={servicesColors.paperDeep} strokeWidth={stroke} fill="none" />
        {slices.map((slice) => {
          const len = (slice.count / total) * c;
          const node = (
            <Circle
              key={slice.label}
              cx={cx}
              cy={cy}
              r={r}
              stroke={slice.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${Math.max(len - gap, 0)} ${c - Math.max(len - gap, 0)}`}
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
  hitRow: { flexDirection: "row" },
  hit: { flex: 1 },
  donutWrap: { alignItems: "center", justifyContent: "center" },
  donutCenter: { position: "absolute", alignItems: "center" },
  donutValue: { ...servicesType.figure, fontSize: 22, lineHeight: 26 },
  donutLabel: { fontSize: 11, color: servicesColors.textMuted },
});
