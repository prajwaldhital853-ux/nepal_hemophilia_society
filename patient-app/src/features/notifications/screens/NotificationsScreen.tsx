import { useState } from "react";
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/core/navigation/types";
import { HomeBottomNav } from "@/features/home/components/HomeBottomNav";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { NotificationFilters } from "@/features/notifications/components/NotificationFilters";
import { NotificationsHeroBanner } from "@/features/notifications/components/NotificationsHeroBanner";
import type { NotificationFilterId } from "@/features/notifications/data/notificationsTypes";
import { usePatientNotifications } from "@/features/notifications/hooks/usePatientNotifications";
import { notificationsColors, notificationsSpacing } from "@/features/notifications/theme/notificationsTheme";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

const FILTER_TO_CATEGORY: Record<NotificationFilterId, string> = {
  all: "all",
  appointments: "treatment",
  treatments: "injection",
  events: "event",
  updates: "stock",
  system: "system",
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<NotificationFilterId>("all");
  const { notifications, unreadCount, loading } = usePatientNotifications(FILTER_TO_CATEGORY[filter]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={notificationsColors.white} />
      <View style={{ paddingTop: insets.top, backgroundColor: notificationsColors.white }}>
        <HomeHeader
          notificationCount={unreadCount}
          onProfilePress={() => navigation.navigate("Profile")}
          onNotificationPress={() => navigation.navigate("Notifications")}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <NotificationsHeroBanner />
        <NotificationFilters active={filter} onChange={setFilter} />
        {loading ? (
          <ActivityIndicator style={styles.loader} color={notificationsColors.primary} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyBody}>
              Alerts from your treatment center — injection schedules, stock updates, bleeding episodes, and other
              actions taken by your care team — will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((item) => (
              <View key={item.id} style={[styles.card, !item.isRead ? styles.cardUnread : null]}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {!item.isRead ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <Text style={styles.cardMeta}>{formatWhen(item.createdAt)} · {item.category}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <HomeBottomNav
        variant="light"
        activeTab="notifications"
        notificationCount={unreadCount}
        onTabPress={(tab) => {
          if (tab === "home") navigation.navigate("Home");
          if (tab === "services") navigation.navigate("Services");
          if (tab === "factor") navigation.navigate("Factor");
          if (tab === "profile") navigation.navigate("Profile");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: notificationsColors.pageBg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: notificationsSpacing.bottomScrollPadding },
  loader: { marginTop: 24 },
  emptyWrap: {
    marginHorizontal: notificationsSpacing.screen,
    marginTop: 24,
    backgroundColor: notificationsColors.white,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: notificationsColors.navy },
  emptyBody: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: notificationsColors.textMuted,
    textAlign: "center",
  },
  list: { marginHorizontal: notificationsSpacing.screen, marginTop: 12, gap: 10 },
  card: {
    backgroundColor: notificationsColors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardUnread: { borderColor: notificationsColors.primary, backgroundColor: "#FFFBFB" },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: notificationsColors.navy },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: notificationsColors.primary },
  cardMessage: { marginTop: 6, fontSize: 12, lineHeight: 18, color: notificationsColors.textMuted },
  cardMeta: { marginTop: 8, fontSize: 10, fontWeight: "600", color: "#9CA3AF" },
});
