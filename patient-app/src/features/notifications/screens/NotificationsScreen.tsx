import { useMemo, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { HomeBottomNav } from "@/features/home/components/HomeBottomNav";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { NotificationFilters } from "@/features/notifications/components/NotificationFilters";
import { NotificationsHeroBanner } from "@/features/notifications/components/NotificationsHeroBanner";
import { NotificationSection } from "@/features/notifications/components/NotificationSection";
import {
  mockNotifications,
  type NotificationFilterId,
} from "@/features/notifications/data/mockNotificationsData";
import { notificationsColors, notificationsSpacing } from "@/features/notifications/theme/notificationsTheme";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

export default function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<NotificationFilterId>("all");
  const [markedRead, setMarkedRead] = useState(false);

  const visible = useMemo(
    () =>
      mockNotifications.filter((item) => (filter === "all" ? true : item.category === filter)),
    [filter],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={notificationsColors.white} />
      <View style={{ paddingTop: insets.top, backgroundColor: notificationsColors.white }}>
        <HomeHeader onProfilePress={() => navigation.navigate("Profile")} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <NotificationsHeroBanner />
        <NotificationFilters active={filter} onChange={setFilter} />
        <NotificationSection
          title="Today"
          items={visible.filter((item) => item.section === "today")}
          showMarkAll
          hideUnread={markedRead}
          onMarkAll={() => setMarkedRead(true)}
        />
        <NotificationSection
          title="Yesterday"
          items={visible.filter((item) => item.section === "yesterday")}
        />
        <NotificationSection
          title="This Week"
          items={visible.filter((item) => item.section === "week")}
        />
      </ScrollView>

      <HomeBottomNav
        variant="light"
        activeTab="notifications"
        onTabPress={(tab) => {
          if (tab === "home") navigation.navigate("Home");
          if (tab === "services") navigation.navigate("Services");
          if (tab === "factor") navigation.navigate("Factor");
          if (tab === "notifications") return;
          if (tab === "profile") navigation.navigate("Profile");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: notificationsColors.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: notificationsSpacing.screen,
    paddingTop: 12,
    paddingBottom: notificationsSpacing.bottomScrollPadding,
  },
});
