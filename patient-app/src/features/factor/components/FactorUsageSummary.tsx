import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { FactorEmptyState, FactorLoading } from "@/features/factor/components/FactorStates";
import { usePatientInjections } from "@/features/factor/hooks/usePatientInjections";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";
import { SectionTitle } from "@/features/factor/components/SectionTitle";

export function FactorUsageSummary() {
  const { injections, loading, totalIu } = usePatientInjections();

  if (loading) return <FactorLoading />;
  if (!injections.length) {
    return (
      <View style={styles.section}>
        <SectionTitle title="Usage Summary" />
        <FactorEmptyState
          title="No usage data yet"
          message="Injection records from your treatment center will populate this summary."
        />
      </View>
    );
  }

  const items = [
    { id: "injections", icon: "needle" as const, value: String(injections.length), label: "Total Injections", trend: "From your records" },
    { id: "iu", icon: "water" as const, value: `${totalIu.toLocaleString()} IU`, label: "Total IU Used", trend: "All time" },
    { id: "last", icon: "target" as const, value: injections[0]?.date ?? "—", label: "Last Injection", trend: injections[0]?.factorType ?? "—" },
  ];

  return (
    <View style={styles.section}>
      <SectionTitle title="Usage Summary" />
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.iconCircle}>
              {item.icon === "water" ? (
                <Ionicons name="water" size={28} color={factorColors.primary} />
              ) : item.icon === "target" ? (
                <MaterialCommunityIcons name="target" size={28} color={factorColors.primary} />
              ) : (
                <MaterialCommunityIcons name={item.icon} size={28} color={factorColors.primary} />
              )}
            </View>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.trend}>{item.trend}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: factorSpacing.section },
  grid: { flexDirection: "row", gap: 8 },
  card: {
    flex: 1,
    backgroundColor: factorColors.white,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: "center",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: factorColors.iconBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  value: { fontSize: 14, fontWeight: "800", color: factorColors.navy, textAlign: "center" },
  label: {
    fontSize: 10.5,
    fontWeight: "600",
    color: factorColors.textMuted,
    textAlign: "center",
    marginTop: 3,
    lineHeight: 13,
    minHeight: 26,
  },
  trend: { fontSize: 9.5, fontWeight: "700", color: factorColors.greenText, textAlign: "center", marginTop: 5 },
});
