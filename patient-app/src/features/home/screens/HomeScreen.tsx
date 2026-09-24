import { useCallback } from "react";
import { Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StackScreenProps } from "@react-navigation/stack";

import { useAuth } from "@/core/auth/AuthContext";
import { usePullRefresh } from "@/core/hooks/usePullRefresh";
import { useLocale } from "@/core/i18n";
import { usePatientClinicalStats } from "@/features/home/hooks/usePatientClinicalStats";
import { usePatientNotifications } from "@/features/notifications/hooks/usePatientNotifications";

import type { RootStackParamList } from "@/core/navigation/types";
import { BleedingProfileCard } from "@/features/home/components/BleedingProfileCard";
import { FactorStockCard } from "@/features/home/components/FactorStockCard";
import { HomeBottomNav } from "@/features/home/components/HomeBottomNav";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { ScheduledInjectionCard } from "@/features/home/components/ScheduledInjectionCard";
import { useAppDrawer } from "@/features/home/context/DrawerContext";
import { InjectionTrendsChart } from "@/features/home/components/InjectionTrendsChart";
import { OverviewSection } from "@/features/home/components/OverviewSection";
import { ProfileSummaryCard } from "@/features/home/components/ProfileSummaryCard";
import { QuickActionsSection } from "@/features/home/components/QuickActionsSection";
import { homeColors } from "@/features/home/theme/homeTheme";

type Props = StackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { refreshPatient, patient } = useAuth();
  const { t } = useLocale();
  const { unreadCount, refresh: refreshNotifications } = usePatientNotifications();
  const { refresh: refreshClinical } = usePatientClinicalStats();
  const { openDrawer } = useAppDrawer();
  const { refreshing, onRefresh } = usePullRefresh(
    () => refreshPatient(),
    () => refreshClinical(),
    () => refreshNotifications(),
  );

  useFocusEffect(
    useCallback(() => {
      void refreshPatient().catch(() => undefined);
      void refreshClinical().catch(() => undefined);
    }, [refreshPatient, refreshClinical]),
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={homeColors.white} />
      <View style={{ paddingTop: insets.top }}>
        <HomeHeader
          notificationCount={unreadCount}
          onMenuPress={openDrawer}
          onProfilePress={() => navigation.navigate("Profile")}
          onNotificationPress={() => navigation.navigate("Notifications")}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={homeColors.primary} />
        }
      >
        <ProfileSummaryCard />
        <ScheduledInjectionCard />
        <OverviewSection />
        <View style={styles.docsCard}>
          <View style={styles.docsHead}>
            <Text style={styles.docsTitle}>{t("home.diagnosticDocs")}</Text>
            {(patient?.documents?.length ?? 0) > 0 ? (
              <Pressable onPress={() => navigation.navigate("Documents")}>
                <Text style={styles.seeMore}>{t("common.seeMore")}</Text>
              </Pressable>
            ) : null}
          </View>
          {(patient?.documents?.length ?? 0) === 0 ? (
            <Text style={styles.docsEmpty}>{t("home.noDocuments")}</Text>
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
        <InjectionTrendsChart />
        <QuickActionsSection
          onActionPress={(key) => {
            if (key === "history") navigation.navigate("Injections");
            if (key === "report") navigation.navigate("Treatments");
            if (key === "emergency") navigation.navigate("EmergencyId");
            if (key === "hospital") navigation.navigate("Centers");
            if (key === "helpline") navigation.navigate("ServiceDetail", { slug: "contact", title: "Contact Us" });
          }}
        />
      </ScrollView>

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
