import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { mockQuickActions } from "@/features/home/data/mockPatientData";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

const iconMap = {
  medical: (color: string) => <MaterialCommunityIcons name="needle" size={20} color={color} />,
  "document-text": (color: string) => <Ionicons name="clipboard-outline" size={20} color={color} />,
  "id-card": (color: string) => <Ionicons name="shield-checkmark" size={20} color={color} />,
  business: (color: string) => <Ionicons name="location" size={20} color={color} />,
  call: (color: string) => <Ionicons name="call" size={20} color={color} />,
};

export function QuickActionsSection() {
  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <Text style={styles.title}>Quick Actions</Text>
        <View style={styles.row}>
          {mockQuickActions.map((action) => (
            <Pressable key={action.key} style={styles.actionItem}>
              <View style={[styles.iconWrap, { backgroundColor: action.bg }]}>
                {iconMap[action.icon](action.color)}
              </View>
              <Text style={styles.label} numberOfLines={2}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: homeSpacing.section,
    marginBottom: 0,
    paddingHorizontal: homeSpacing.screen,
  },
  card: {
    backgroundColor: homeColors.cardBg,
    borderRadius: homeRadii.card,
    borderWidth: 1,
    borderColor: homeColors.border,
    paddingTop: 13,
    paddingBottom: 14,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: homeColors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  actionItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    paddingHorizontal: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    width: "100%",
    fontSize: 9.5,
    fontWeight: "600",
    color: homeColors.text,
    lineHeight: 12,
    textAlign: "center",
  },
});
