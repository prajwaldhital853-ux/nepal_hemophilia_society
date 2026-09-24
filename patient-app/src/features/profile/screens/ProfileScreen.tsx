import { Ionicons } from "@expo/vector-icons";
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StackScreenProps } from "@react-navigation/stack";

import type { RootStackParamList } from "@/core/navigation/types";
import { useAuth } from "@/core/auth/AuthContext";
import { usePullRefresh } from "@/core/hooks/usePullRefresh";
import { usePatientClinicalStats } from "@/features/home/hooks/usePatientClinicalStats";
import { usePatientNotifications } from "@/features/notifications/hooks/usePatientNotifications";
import { HomeBottomNav } from "@/features/home/components/HomeBottomNav";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { useAppDrawer } from "@/features/home/context/DrawerContext";
import { ProfileSummaryCard } from "@/features/home/components/ProfileSummaryCard";
import { ProfileMenuList } from "@/features/profile/components/ProfileMenuList";
import type { ProfileMenuItem } from "@/features/profile/data/profileMenu";
import { homeColors, homeSpacing } from "@/features/home/theme/homeTheme";

type Props = StackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { logout, patient, refreshPatient } = useAuth();
  const { refresh: refreshClinical } = usePatientClinicalStats();
  const { refresh: refreshNotifications } = usePatientNotifications();
  const { openDrawer } = useAppDrawer();
  const { refreshing, onRefresh } = usePullRefresh(
    () => refreshPatient(),
    () => refreshClinical(),
    () => refreshNotifications(),
  );

  function handleMenuPress(item: ProfileMenuItem) {
    if (item.action === "notifications") {
      navigation.navigate("Notifications");
      return;
    }
    if (item.action === "profile") {
      navigation.navigate("EmergencyId");
      return;
    }
    if (item.action === "documents") {
      navigation.navigate("Documents");
      return;
    }
    if (item.action === "appointments") {
      navigation.navigate("Appointments");
      return;
    }
    if (item.action === "events") {
      navigation.navigate("ServiceContentList", { kind: "events", title: "Events" });
      return;
    }
    if (item.action === "settings") {
      navigation.navigate("Settings");
      return;
    }
    if (item.action === "help") {
      navigation.navigate("ServiceDetail", { slug: "help", title: "Help & Support" });
      return;
    }
    if (item.action === "community") {
      navigation.navigate("ServiceDetail", { slug: "community", title: "Community Support" });
      return;
    }
    if (item.action === "logout") {
      void logout().then(() => undefined);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={homeColors.white} />
      <View style={[styles.stickyHeader, { paddingTop: insets.top }]}>
        <HomeHeader
          onMenuPress={openDrawer}
          onProfilePress={() => undefined}
          onNotificationPress={() => navigation.navigate("Notifications")}
        />
        <ProfileSummaryCard />
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Person with Hemophilia</Text>
          <View style={styles.chip}>
            <Ionicons name="water" size={13} color="#FFFFFF" />
            <Text style={styles.chipText}>Stay Strong Stay Informed</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={homeColors.primary} />
        }
      >
        {(patient?.documents?.length ?? 0) > 0 ? (
          <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: "#fff", borderRadius: 12, padding: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontWeight: "700", color: "#1E3A5F" }}>My documents</Text>
              <Text onPress={() => navigation.navigate("Documents")} style={{ color: "#C1121F", fontWeight: "700", fontSize: 12 }}>
                See more
              </Text>
            </View>
            {patient?.documents.slice(0, 4).map((doc) => (
              <Text key={doc.url || doc.name} style={{ color: "#C1121F", marginBottom: 6, fontSize: 12 }}>
                {doc.name}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.menuWrap}>
          <ProfileMenuList onPressItem={handleMenuPress} />
        </View>
      </ScrollView>

      <HomeBottomNav
        variant="light"
        activeTab="profile"
        onTabPress={(tab) => {
          if (tab === "home") navigation.navigate("Home");
          if (tab === "services") navigation.navigate("Services");
          if (tab === "factor") navigation.navigate("Factor");
          if (tab === "notifications") navigation.navigate("Notifications");
          if (tab === "profile") return;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },
  stickyHeader: {
    backgroundColor: homeColors.white,
    zIndex: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 72,
  },
  sectionHead: {
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: homeSpacing.screen,
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: homeColors.white,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: homeColors.navy,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#8B0E18",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  menuWrap: {
    paddingHorizontal: homeSpacing.screen,
  },
});
