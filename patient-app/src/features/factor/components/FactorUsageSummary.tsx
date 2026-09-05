import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { usageSummary } from "@/features/factor/data/mockFactorData";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";
import { SectionTitle } from "@/features/factor/components/SectionTitle";

export function FactorUsageSummary() {
  return (
    <View style={styles.section}>
      <SectionTitle title="Usage Summary" />
      <View style={styles.grid}>
        {usageSummary.map((item) => (
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
  section: {
    marginTop: factorSpacing.section,
  },
  grid: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: factorColors.white,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
  value: {
    fontSize: 16,
    fontWeight: "800",
    color: factorColors.navy,
    textAlign: "center",
  },
  label: {
    fontSize: 10.5,
    fontWeight: "600",
    color: factorColors.textMuted,
    textAlign: "center",
    marginTop: 3,
    lineHeight: 13,
    minHeight: 26,
  },
  trend: {
    fontSize: 9.5,
    fontWeight: "700",
    color: factorColors.greenText,
    textAlign: "center",
    marginTop: 5,
  },
});
