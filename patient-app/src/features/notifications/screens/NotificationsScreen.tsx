import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StackScreenProps } from "@react-navigation/stack";

import { useAuth } from "@/core/auth/AuthContext";
import { usePullRefresh } from "@/core/hooks/usePullRefresh";
import { useLocale } from "@/core/i18n";
import { usePatientClinicalStats } from "@/features/home/hooks/usePatientClinicalStats";
import type { RootStackParamList } from "@/core/navigation/types";
import { HomeBottomNav } from "@/features/home/components/HomeBottomNav";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { useAppDrawer } from "@/features/home/context/DrawerContext";
import { NotificationFilters } from "@/features/notifications/components/NotificationFilters";
import { NotificationsHeroBanner } from "@/features/notifications/components/NotificationsHeroBanner";
import type { NotificationFilterId } from "@/features/notifications/data/notificationsTypes";
import { destinationForNotification } from "@/features/notifications/notificationRoutes";
import { usePatientNotifications } from "@/features/notifications/hooks/usePatientNotifications";
import { notificationsColors, notificationsSpacing } from "@/features/notifications/theme/notificationsTheme";

type Props = StackScreenProps<RootStackParamList, "Notifications">;

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
  const { t } = useLocale();
  const { openDrawer } = useAppDrawer();
  const [filter, setFilter] = useState<NotificationFilterId>("all");
  const { notifications, unreadCount, loading, markRead } = usePatientNotifications(FILTER_TO_CATEGORY[filter]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={notificationsColors.white} />
      <View style={[styles.stickyHeader, { paddingTop: insets.top }]}>
        <HomeHeader
          notificationCount={unreadCount}
          onMenuPress={openDrawer}
          onProfilePress={() => navigation.navigate("Profile")}
          onNotificationPress={() => navigation.navigate("Notifications")}
        />
        <View style={styles.filtersWrap}>
          <NotificationFilters active={filter} onChange={setFilter} />
        </View>
        <NotificationsHeroBanner />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={notificationsColors.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator style={styles.loader} color={notificationsColors.primary} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{t("notifications.emptyTitle")}</Text>
            <Text style={styles.emptyBody}>{t("notifications.emptyBody")}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((item) => (
              <View key={item.id} style={[styles.card, !item.isRead ? styles.cardUnread : null]}>
                <Pressable
                  style={styles.cardBody}
                  onPress={() => {
                    const destination = destinationForNotification(item);
                    if (destination) navigation.navigate(destination.screen as never, destination.params as never);
                  }}
                >
                  <View style={styles.cardHead}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {!item.isRead ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={styles.cardMessage}>{item.message}</Text>
                  <Text style={styles.cardMeta}>{formatWhen(item.createdAt)} · {item.category}</Text>
                </Pressable>
                {!item.isRead ? (
                  <Pressable
                    style={styles.readBtn}
                    accessibilityLabel="Mark as read"
                    onPress={() => void markRead(item.id)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={22} color={notificationsColors.primary} />
                  </Pressable>
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color="#9CA3AF" style={styles.readBtn} />
                )}
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
  stickyHeader: {
    backgroundColor: notificationsColors.white,
    zIndex: 2,
  },
  filtersWrap: {
    paddingHorizontal: notificationsSpacing.screen,
    paddingBottom: 4,
    backgroundColor: notificationsColors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },
  cardBody: { flex: 1, padding: 14 },
  readBtn: { paddingRight: 12, paddingLeft: 4 },
  cardUnread: { borderColor: notificationsColors.primary, backgroundColor: "#FFFBFB" },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: notificationsColors.navy },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: notificationsColors.primary },
  cardMessage: { marginTop: 6, fontSize: 12, lineHeight: 18, color: notificationsColors.textMuted },
  cardMeta: { marginTop: 8, fontSize: 10, fontWeight: "600", color: "#9CA3AF" },
});
