import { useCallback, useState } from "react";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuth } from "@/core/auth/AuthContext";

import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { BleedingProfileCard } from "@/features/home/components/BleedingProfileCard";
import { FactorStockCard } from "@/features/home/components/FactorStockCard";
import { HomeBottomNav } from "@/features/home/components/HomeBottomNav";
import { HomeDrawer } from "@/features/home/components/HomeDrawer";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { ScheduledInjectionCard } from "@/features/home/components/ScheduledInjectionCard";
import { usePatientNotifications } from "@/features/notifications/hooks/usePatientNotifications";
import { HomeCareActivitySection } from "@/features/home/components/HomeCareActivitySection";
import { HomeInventorySection } from "@/features/home/components/HomeInventorySection";
import { InjectionTrendsChart } from "@/features/home/components/InjectionTrendsChart";
import { OverviewSection } from "@/features/home/components/OverviewSection";
import { ProfileSummaryCard } from "@/features/home/components/ProfileSummaryCard";
import { QuickActionsSection } from "@/features/home/components/QuickActionsSection";
import { homeColors } from "@/features/home/theme/homeTheme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { refreshPatient, patient } = useAuth();
  const { unreadCount } = usePatientNotifications();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshPatient().catch(() => undefined);
    }, [refreshPatient]),
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={homeColors.white} />
      <View style={{ paddingTop: insets.top }}>
        <HomeHeader
          notificationCount={unreadCount}
          onMenuPress={() => setDrawerOpen(true)}
          onProfilePress={() => navigation.navigate("Profile")}
          onNotificationPress={() => navigation.navigate("Notifications")}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileSummaryCard />
        <ScheduledInjectionCard />
        <OverviewSection />
        <View style={styles.docsCard}>
          <View style={styles.docsHead}>
            <Text style={styles.docsTitle}>Diagnostic documents</Text>
            {(patient?.documents?.length ?? 0) > 0 ? (
              <Pressable onPress={() => navigation.navigate("Documents")}>
                <Text style={styles.seeMore}>See more</Text>
              </Pressable>
            ) : null}
          </View>
          {(patient?.documents?.length ?? 0) === 0 ? (
            <Text style={styles.docsEmpty}>No documents uploaded by your care team yet.</Text>
          ) : (
            patient?.documents.slice(0, 4).map((doc) => (
              <Text key={doc.url || doc.name} style={styles.docsItem}>
                {doc.name}
              </Text>
            ))
          )}
        </View>
        <BleedingProfileCard />
        <FactorStockCard />
        <HomeInventorySection />
        <InjectionTrendsChart />
        <HomeCareActivitySection />
        <QuickActionsSection />
      </ScrollView>

      <HomeDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(tab) => {
          if (tab === "home") navigation.navigate("Home");
          if (tab === "services") navigation.navigate("Services");
          if (tab === "factor") navigation.navigate("Factor");
          if (tab === "notifications") navigation.navigate("Notifications");
          if (tab === "profile") navigation.navigate("Profile");
          if (tab === "injections") navigation.navigate("Injections");
          if (tab === "documents") navigation.navigate("Documents");
        }}
      />

      <HomeBottomNav
        variant="light"
        activeTab="home"
        notificationCount={unreadCount}
        onTabPress={(tab) => {
          if (tab === "profile") navigation.navigate("Profile");
          if (tab === "home") navigation.navigate("Home");
          if (tab === "services") navigation.navigate("Services");
          if (tab === "factor") navigation.navigate("Factor");
          if (tab === "notifications") navigation.navigate("Notifications");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: homeColors.screenBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 72,
  },
  docsCard: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
  },
  docsHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  docsTitle: {
    fontWeight: "700",
    color: "#1E3A5F",
  },
  seeMore: {
    color: "#C1121F",
    fontWeight: "700",
    fontSize: 12,
  },
  docsEmpty: {
    color: "#6B7280",
    fontSize: 12,
  },
  docsItem: {
    color: "#C1121F",
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "600",
  },
});
