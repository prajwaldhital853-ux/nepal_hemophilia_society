import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { servicesColors, servicesType } from "@/features/services/theme/servicesTheme";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function parseRecordDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function monthKey(value?: string | null) {
  const d = parseRecordDate(value);
  return d ? `${d.getFullYear()}-${d.getMonth()}` : "undated";
}

export function monthTitle(value?: string | null) {
  const d = parseRecordDate(value);
  return d ? `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}` : "Undated";
}

export function shortDate(value?: string | null) {
  const d = parseRecordDate(value);
  return d ? `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}` : "—";
}

export function MonthHeader({ title }: { title: string }) {
  return <Text style={styles.month}>{title}</Text>;
}

/** One dated entry: day/month stamp on the left, a vertical rule, content on the right. */
export function TimelineEntry({ date, children, last }: { date?: string | null; children: ReactNode; last?: boolean }) {
  const d = parseRecordDate(date);
  return (
    <View style={styles.entry}>
      <View style={styles.stamp}>
        <Text style={styles.day}>{d ? d.getDate() : "—"}</Text>
        <Text style={styles.mon}>{d ? MONTHS_SHORT[d.getMonth()] : ""}</Text>
      </View>
      <View style={styles.rail}>
        <View style={styles.node} />
        {!last ? <View style={styles.line} /> : null}
      </View>
      <View style={[styles.body, !last && styles.bodySpaced]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  month: {
    ...servicesType.eyebrow,
    marginTop: 22,
    marginBottom: 12,
  },
  entry: {
    flexDirection: "row",
  },
  stamp: {
    width: 40,
    alignItems: "flex-end",
    paddingTop: 1,
  },
  day: {
    ...servicesType.figure,
    fontSize: 20,
    lineHeight: 22,
  },
  mon: {
    fontSize: 11,
    color: servicesColors.textMuted,
    marginTop: 1,
  },
  rail: {
    width: 28,
    alignItems: "center",
  },
  node: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: servicesColors.ink,
    backgroundColor: servicesColors.pageBg,
  },
  line: {
    flex: 1,
    width: StyleSheet.hairlineWidth,
    backgroundColor: servicesColors.borderStrong,
    marginTop: 4,
  },
  body: {
    flex: 1,
  },
  bodySpaced: {
    paddingBottom: 20,
  },
});
