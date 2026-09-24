import { StyleSheet, Text, View } from "react-native";

import { useMemo } from "react";

import { usePatientInjections } from "@/features/factor/hooks/usePatientInjections";
import { SectionTitle } from "@/features/factor/components/SectionTitle";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthlyFactorUsageChart() {
  const { injections, loading } = usePatientInjections();
  const monthlyTrends = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const values = MONTHS.map(() => 0);
    injections.forEach((row) => {
      const stamp = new Date(row.administeredAt || row.date || "");
      if (Number.isNaN(stamp.getTime()) || stamp.getFullYear() !== year) return;
      values[stamp.getMonth()] += 1;
    });
    return { year, months: MONTHS, values };
  }, [injections]);
  const totalInjections = injections.length;

  return (
    <View style={styles.section}>
      <SectionTitle title="Monthly Injections" />
      <View style={styles.card}>
        {loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : totalInjections === 0 ? (
          <Text style={styles.empty}>No monthly data yet.</Text>
        ) : (
          <View style={styles.row}>
            {monthlyTrends.months.map((month, index) => (
              <View key={month} style={styles.col}>
                <Text style={styles.count}>{monthlyTrends.values[index]}</Text>
                <Text style={styles.month}>{month}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: factorSpacing.section },
  card: { backgroundColor: factorColors.white, borderRadius: 14, padding: 12 },
  empty: { fontSize: 12, color: factorColors.textMuted },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  col: {
    width: "22%",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingVertical: 8,
  },
  count: { fontSize: 14, fontWeight: "800", color: factorColors.navy },
  month: { marginTop: 2, fontSize: 9, color: factorColors.textMuted },
});
