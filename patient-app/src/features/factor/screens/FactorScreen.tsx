import { ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { HomeBottomNav } from "@/features/home/components/HomeBottomNav";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { FactorDistributionChart } from "@/features/factor/components/FactorDistributionChart";
import { FactorHeroBanner } from "@/features/factor/components/FactorHeroBanner";
import { FactorQuickActions } from "@/features/factor/components/FactorQuickActions";
import { FactorStockStatus } from "@/features/factor/components/FactorStockStatus";
import { FactorTabs } from "@/features/factor/components/FactorTabs";
import { FactorUsageSummary } from "@/features/factor/components/FactorUsageSummary";
import { MonthlyFactorUsageChart } from "@/features/factor/components/MonthlyFactorUsageChart";
import { RecentFactorTransactions } from "@/features/factor/components/RecentFactorTransactions";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";

type Props = NativeStackScreenProps<RootStackParamList, "Factor">;

export default function FactorScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={factorColors.white} />
      <View style={{ paddingTop: insets.top, backgroundColor: factorColors.white }}>
        <HomeHeader
          onProfilePress={() => navigation.navigate("Profile")}
          onNotificationPress={() => navigation.navigate("Notifications")}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FactorHeroBanner />
        <FactorTabs />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: factorSpacing.screen,
    paddingTop: 12,
    paddingBottom: factorSpacing.bottomScrollPadding,
  },
});
