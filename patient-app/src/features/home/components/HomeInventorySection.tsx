import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import { usePatientClinicalStats } from "@/features/home/hooks/usePatientClinicalStats";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

type StockSummary = {
  totalQuantity: number;
  hospitalName: string;
  outOfStock: boolean;
  factorName?: string;
};

export function HomeInventorySection() {
  const { token, patient } = useAuth();
  const { monthlyTrends, totalIu, totalInjections } = usePatientClinicalStats();
  const [stock, setStock] = useState<StockSummary | null>(null);

  useEffect(() => {
    if (!token) return;
    void patientApi("/me/patient/stock/", { token })
      .then((data) =>
        setStock({
          totalQuantity: Number(data.totalQuantity ?? 0),
          hospitalName: data.hospitalName || patient?.primaryHospital || "",
          outOfStock: Boolean(data.outOfStock),
          factorName: data.prescribedFactorMedicineName || patient?.prescribedFactorMedicineName,
        }),
      )
      .catch(() => setStock(null));
  }, [token, patient?.primaryHospital, patient?.prescribedFactorMedicineName]);

  const chart = useMemo(() => {
    const values = monthlyTrends.values;
    const max = monthlyTrends.yMax || 1;
    const barW = 16;
    const gap = 6;
    const height = 90;
    const width = values.length * (barW + gap);
    return { values, max, barW, gap, height, width };
  }, [monthlyTrends]);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Inventory & Usage</Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Center stock</Text>
          <Text style={styles.big}>{stock?.outOfStock ? "0" : String(stock?.totalQuantity ?? "—")}</Text>
          <Text style={styles.meta}>
            {stock?.factorName || "Factor"} at {stock?.hospitalName || "your center"}
          </Text>
          <Text style={styles.hint}>Updates when staff log doses or add stock.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your usage</Text>
          <Text style={styles.big}>{totalInjections}</Text>
          <Text style={styles.meta}>Completed injections</Text>
          <Text style={styles.hint}>{totalIu.toLocaleString()} IU total</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Monthly injections ({monthlyTrends.year})</Text>
        <Svg width={chart.width + 8} height={chart.height + 24}>
          {chart.values.map((value, index) => {
            const h = (value / chart.max) * chart.height;
            const x = index * (chart.barW + chart.gap);
            const y = chart.height - h;
            return (
              <Rect
                key={monthlyTrends.months[index]}
                x={x}
                y={y}
                width={chart.barW}
                height={h}
                rx={4}
                fill={index === monthlyTrends.currentMonthIndex ? homeColors.primary : "#FCA5A5"}
              />
            );
          })}
          {monthlyTrends.months.map((month, index) => {
            const x = index * (chart.barW + chart.gap) + chart.barW / 2;
            return (
              <SvgText key={`lbl-${month}`} x={x} y={chart.height + 16} fontSize={8} fill={homeColors.textMuted} textAnchor="middle">
                {month.slice(0, 1)}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: homeSpacing.section, paddingHorizontal: homeSpacing.screen },
  title: { fontSize: 15, fontWeight: "700", color: homeColors.navy, marginBottom: 10 },
  grid: { flexDirection: "row", gap: 8 },
  card: {
    flex: 1,
    backgroundColor: homeColors.white,
    borderRadius: homeRadii.card,
    borderWidth: 1,
    borderColor: homeColors.border,
    padding: 12,
  },
  chartCard: {
    marginTop: 8,
    backgroundColor: homeColors.white,
    borderRadius: homeRadii.card,
    borderWidth: 1,
    borderColor: homeColors.border,
    padding: 12,
  },
  cardTitle: { fontSize: 12, fontWeight: "700", color: homeColors.navy },
  big: { marginTop: 6, fontSize: 24, fontWeight: "800", color: homeColors.primary },
  meta: { marginTop: 4, fontSize: 10, color: homeColors.textMuted },
  hint: { marginTop: 4, fontSize: 9, color: homeColors.textMuted },
});
