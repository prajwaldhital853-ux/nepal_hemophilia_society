import { StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/core/auth/AuthContext";
import { usePatientInjections } from "@/features/factor/hooks/usePatientInjections";
import { SectionTitle } from "@/features/factor/components/SectionTitle";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";

export function FactorDistributionChart() {
  const { patient } = useAuth();
  const { injections, loading } = usePatientInjections();
  const factor = patient?.deficientFactor ?? "—";

  return (
    <View style={styles.section}>
      <SectionTitle title="Factor Distribution" />
      <View style={styles.card}>
        {loading ? (
          <Text style={styles.text}>Loading…</Text>
        ) : !injections.length ? (
          <Text style={styles.text}>No injection records to chart yet.</Text>
        ) : (
          <>
            <Text style={styles.value}>{factor}</Text>
            <Text style={styles.text}>All {injections.length} logged injection(s) use your registered deficient factor.</Text>
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
});
