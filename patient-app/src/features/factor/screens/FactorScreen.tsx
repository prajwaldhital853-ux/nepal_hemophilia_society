import { RefreshControl, ScrollView, StatusBar, StyleSheet, View } from "react-native";
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
import { FactorDistributionChart } from "@/features/factor/components/FactorDistributionChart";
import { FactorHeroBanner } from "@/features/factor/components/FactorHeroBanner";
import { FactorQuickActions } from "@/features/factor/components/FactorQuickActions";
import { FactorStockStatus } from "@/features/factor/components/FactorStockStatus";
import { FactorTabs } from "@/features/factor/components/FactorTabs";
import { FactorFilterProvider, useFactorFilter } from "@/features/factor/context/FactorFilterContext";
import { useClearTopics } from "@/features/notifications/useClearTopics";
import { FactorUsageSummary } from "@/features/factor/components/FactorUsageSummary";
import { MonthlyFactorUsageChart } from "@/features/factor/components/MonthlyFactorUsageChart";
import { RecentFactorTransactions } from "@/features/factor/components/RecentFactorTransactions";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";

type Props = StackScreenProps<RootStackParamList, "Factor">;

function FactorScreenBody({ navigation }: Props) {
  useClearTopics("Factor");
  const insets = useSafeAreaInsets();
  const { openDrawer } = useAppDrawer();
  const { refreshPatient } = useAuth();
  const { refresh: refreshClinical } = usePatientClinicalStats();
  const { refresh: refreshNotifications } = usePatientNotifications();
  const { refreshing, onRefresh } = usePullRefresh(
    () => refreshPatient(),
    () => refreshClinical(),
    () => refreshNotifications(),
  );
  const { activeTab } = useFactorFilter();
  const showOverview = activeTab === "Overview";
  const showUsage = activeTab === "Overview" || activeTab === "Usage History";
  const showReports = activeTab === "Overview" || activeTab === "Reports";
  const showStock = activeTab === "Overview" || activeTab === "Stock Details";

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={factorColors.white} />
      <View style={[styles.stickyHeader, { paddingTop: insets.top }]}>
        <HomeHeader
          onMenuPress={openDrawer}
          onProfilePress={() => navigation.navigate("Profile")}
          onNotificationPress={() => navigation.navigate("Notifications")}
        />
        <View style={styles.bannerWrap}>
          <FactorHeroBanner />
        </View>
        <View style={styles.tabsWrap}>
          <FactorTabs />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={factorColors.primary} />
        }
      >
        {showStock ? <FactorStockStatus /> : null}
        {showReports ? <FactorUsageSummary /> : null}
        {showUsage ? <MonthlyFactorUsageChart /> : null}
        {showReports ? <FactorDistributionChart /> : null}
        {showUsage ? <RecentFactorTransactions /> : null}
        {showOverview ? <FactorQuickActions /> : null}
      </ScrollView>

      <HomeBottomNav
        variant="light"
        activeTab="factor"
        onTabPress={(tab) => {
          if (tab === "home") navigation.navigate("Home");
          if (tab === "services") navigation.navigate("Services");
          if (tab === "factor") return;
          if (tab === "notifications") navigation.navigate("Notifications");
          if (tab === "profile") navigation.navigate("Profile");
        }}
      />
    </View>
  );
}

export default function FactorScreen(props: Props) {
  return (
    <FactorFilterProvider>
      <FactorScreenBody {...props} />
    </FactorFilterProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: factorColors.pageBg,
  },
  stickyHeader: {
    backgroundColor: factorColors.white,
    zIndex: 2,
  },
  bannerWrap: {
    paddingHorizontal: factorSpacing.screen,
    paddingTop: 8,
  },
  tabsWrap: {
    paddingHorizontal: factorSpacing.screen,
    paddingBottom: 8,
    backgroundColor: factorColors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: factorSpacing.screen,
    paddingTop: 12,
    paddingBottom: factorSpacing.bottomScrollPadding,
  },
});
