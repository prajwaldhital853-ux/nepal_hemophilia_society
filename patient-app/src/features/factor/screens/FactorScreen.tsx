import { ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StackScreenProps } from "@react-navigation/stack";

import type { RootStackParamList } from "@/core/navigation/types";
import { HomeBottomNav } from "@/features/home/components/HomeBottomNav";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { useAppDrawer } from "@/features/home/context/DrawerContext";
import { FactorDistributionChart } from "@/features/factor/components/FactorDistributionChart";
import { FactorHeroBanner } from "@/features/factor/components/FactorHeroBanner";
import { FactorQuickActions } from "@/features/factor/components/FactorQuickActions";
import { FactorStockStatus } from "@/features/factor/components/FactorStockStatus";
import { FactorTabs } from "@/features/factor/components/FactorTabs";
import { useClearTopics } from "@/features/notifications/useClearTopics";
import { FactorUsageSummary } from "@/features/factor/components/FactorUsageSummary";
import { MonthlyFactorUsageChart } from "@/features/factor/components/MonthlyFactorUsageChart";
import { RecentFactorTransactions } from "@/features/factor/components/RecentFactorTransactions";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";

type Props = StackScreenProps<RootStackParamList, "Factor">;

export default function FactorScreen({ navigation }: Props) {
  useClearTopics("Factor");
  const insets = useSafeAreaInsets();
  const { openDrawer } = useAppDrawer();

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
      >
        <FactorStockStatus />
        <FactorUsageSummary />
        <MonthlyFactorUsageChart />
        <FactorDistributionChart />
        <RecentFactorTransactions />
        <FactorQuickActions />
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
