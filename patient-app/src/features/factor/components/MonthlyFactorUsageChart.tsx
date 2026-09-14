import { StyleSheet, Text, View } from "react-native";

import { usePatientClinicalStats } from "@/features/home/hooks/usePatientClinicalStats";
import { SectionTitle } from "@/features/factor/components/SectionTitle";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";

export function MonthlyFactorUsageChart() {
  const { monthlyTrends, totalInjections } = usePatientClinicalStats();

  return (
    <View style={styles.section}>
      <SectionTitle title="Monthly Injections" />
      <View style={styles.card}>
        {totalInjections === 0 ? (
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
