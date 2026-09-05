import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  notificationFilters,
  type NotificationFilterId,
} from "@/features/notifications/data/mockNotificationsData";
import { notificationsColors } from "@/features/notifications/theme/notificationsTheme";

type Props = {
  active: NotificationFilterId;
  onChange: (id: NotificationFilterId) => void;
};

function FilterIcon({
  name,
  color,
}: {
  name: (typeof notificationFilters)[number]["icon"];
  color: string;
}) {
  if (name === "needle") {
    return <MaterialCommunityIcons name="needle" size={15} color={color} />;
  }
  const map = {
    bell: "notifications",
    calendar: "calendar-outline",
    megaphone: "megaphone-outline",
    document: "document-text-outline",
    settings: "settings-outline",
  } as const;
  return <Ionicons name={map[name]} size={15} color={color} />;
}

export function NotificationFilters({ active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.wrap}
    >
      {notificationFilters.map((filter) => {
        const isActive = filter.id === active;
        const color = isActive ? "#FFFFFF" : "#374151";
        const inner = (
          <>
            <FilterIcon name={filter.icon} color={color} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{filter.label}</Text>
          </>
        );

        return (
          <Pressable key={filter.id} onPress={() => onChange(filter.id)} style={styles.chipHit}>
            {isActive ? (
              <LinearGradient
                colors={["#9B0E18", "#C1121F", "#E11D2E"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.chip, styles.chipActive]}
              >
                {inner}
              </LinearGradient>
            ) : (
              <View style={styles.chip}>{inner}</View>
            )}
            {filter.badge && isActive ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{filter.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    marginHorizontal: -2,
  },
  row: {
    gap: 8,
    paddingVertical: 6,
    paddingRight: 4,
    paddingLeft: 2,
  },
  chipHit: {
    position: "relative",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: notificationsColors.filterIdle,
    borderWidth: 1,
    borderColor: notificationsColors.filterBorder,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  labelActive: {
    color: "#FFFFFF",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: notificationsColors.primary,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
