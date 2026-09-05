import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";
import { SectionTitle } from "@/features/factor/components/SectionTitle";

const actions = [
  {
    id: "log",
    label: "Log New Injection",
    hint: "Add injection record",
    icon: "needle" as const,
  },
  {
    id: "report",
    label: "Generate Report",
    hint: "Download reports",
    icon: "document-text-outline" as const,
  },
  {
    id: "guide",
    label: "Factor Guidelines",
    hint: "View treatment guide",
    icon: "book-outline" as const,
  },
  {
    id: "center",
    label: "Find Treatment Center",
    hint: "Locate near you",
    icon: "location-outline" as const,
  },
];

export function FactorQuickActions() {
  return (
    <View style={styles.section}>
      <SectionTitle title="Quick Actions" />
      <View style={styles.row}>
        {actions.map((item) => (
          <Pressable key={item.id} style={styles.card}>
            {item.icon === "needle" ? (
              <MaterialCommunityIcons name="needle" size={16} color="#FFFFFF" />
            ) : (
              <Ionicons name={item.icon} size={16} color="#FFFFFF" />
            )}
            <View style={styles.textCol}>
              <Text style={styles.label} numberOfLines={2}>
                {item.label}
              </Text>
              <Text style={styles.hint} numberOfLines={1}>
                {item.hint}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: factorSpacing.section,
  },
  row: {
    flexDirection: "row",
    gap: 7,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: factorColors.primary,
  },
  textCol: {
    marginTop: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 14,
  },
  hint: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "500",
    color: "rgba(255,255,255,0.88)",
  },
});
