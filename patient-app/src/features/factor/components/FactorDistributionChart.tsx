import { StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/core/auth/AuthContext";
import { usePatientInjections } from "@/features/factor/hooks/usePatientInjections";
import { SectionTitle } from "@/features/factor/components/SectionTitle";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";

export function FactorDistributionChart() {
  const { patient } = useAuth();
  const { injections, loading } = usePatientInjections();
  const factor = patient?.deficientFactor ?? "—";
  const byIndication: Record<string, number> = {};
  injections.forEach((row) => {
    const key = row.indication || "Other";
    byIndication[key] = (byIndication[key] || 0) + 1;
  });
  const rows = Object.entries(byIndication).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map((row) => row[1]), 1);

  return (
    <View style={styles.section}>
      <SectionTitle title="Factor distribution" />
      <View style={styles.card}>
        {loading ? (
          <Text style={styles.text}>Loading…</Text>
        ) : !injections.length ? (
          <Text style={styles.text}>No injection records to chart yet.</Text>
        ) : (
          <>
            <Text style={styles.value}>{factor}</Text>
            <Text style={styles.text}>How your {injections.length} logged injection(s) were used.</Text>
            {rows.map(([label, count]) => (
              <View key={label} style={{ marginTop: 8, width: "100%" }}>
                <Text style={styles.barLabel}>
                  {label} · {count}
                </Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.max(10, (count / max) * 100)}%` }]} />
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: factorSpacing.section },
  card: { backgroundColor: factorColors.white, borderRadius: 14, padding: 14, alignItems: "center" },
  value: { fontSize: 22, fontWeight: "800", color: factorColors.navy },
  text: { marginTop: 6, fontSize: 12, lineHeight: 18, color: factorColors.textMuted, textAlign: "center" },
  barLabel: { fontSize: 11, fontWeight: "700", color: factorColors.navy, marginBottom: 4 },
  track: { height: 8, backgroundColor: "#F3F4F6", borderRadius: 8, overflow: "hidden" },
  fill: { height: 8, backgroundColor: factorColors.primary || "#C1121F", borderRadius: 8 },
});
