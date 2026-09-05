import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { NotificationItem } from "@/features/notifications/data/mockNotificationsData";
import { notificationsColors, notificationsSpacing } from "@/features/notifications/theme/notificationsTheme";
import { NotificationCard } from "@/features/notifications/components/NotificationCard";

type Props = {
  title: string;
  items: NotificationItem[];
  showMarkAll?: boolean;
  onMarkAll?: () => void;
  hideUnread?: boolean;
};

export function NotificationSection({ title, items, showMarkAll, onMarkAll, hideUnread }: Props) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showMarkAll ? (
          <Pressable style={styles.markAll} onPress={onMarkAll} hitSlop={8}>
            <Text style={styles.markAllText}>Mark all as read</Text>
            <View style={styles.markAllIcon}>
              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
            </View>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.list}>
        {items.map((item) => (
          <NotificationCard key={item.id} item={item} unread={item.unread && !hideUnread} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: notificationsSpacing.section,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: notificationsColors.navy,
  },
  markAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: notificationsColors.primary,
  },
  markAllIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: notificationsColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    gap: notificationsSpacing.cardGap,
  },
});
