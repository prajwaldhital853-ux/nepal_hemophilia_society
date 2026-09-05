import { ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { BleedingProfileCard } from "@/features/home/components/BleedingProfileCard";
import { FactorStockCard } from "@/features/home/components/FactorStockCard";
import { HomeBottomNav } from "@/features/home/components/HomeBottomNav";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { InjectionTrendsChart } from "@/features/home/components/InjectionTrendsChart";
import { OverviewSection } from "@/features/home/components/OverviewSection";
import { ProfileSummaryCard } from "@/features/home/components/ProfileSummaryCard";
import { QuickActionsSection } from "@/features/home/components/QuickActionsSection";
import { homeColors } from "@/features/home/theme/homeTheme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={homeColors.white} />
      <View style={{ paddingTop: insets.top }}>
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
        <ProfileSummaryCard />
        <OverviewSection />
        <BleedingProfileCard />
        <FactorStockCard />
        <InjectionTrendsChart />
        <QuickActionsSection />
      </ScrollView>

      <HomeBottomNav
        variant="light"
        activeTab="home"
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
});
