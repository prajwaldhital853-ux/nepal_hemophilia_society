import { ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { HomeBottomNav } from "@/features/home/components/HomeBottomNav";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { ServiceCategorySection } from "@/features/services/components/ServiceCategorySection";
import { ServicesHeroBanner } from "@/features/services/components/ServicesHeroBanner";
import { ServicesQuoteBanner } from "@/features/services/components/ServicesQuoteBanner";
import { ServicesSearchBar } from "@/features/services/components/ServicesSearchBar";
import { mockServiceCategories } from "@/features/services/data/mockServicesData";
import { servicesColors, servicesSpacing } from "@/features/services/theme/servicesTheme";

type Props = NativeStackScreenProps<RootStackParamList, "Services">;

export default function ServicesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={servicesColors.white} />
      <View style={{ paddingTop: insets.top, backgroundColor: servicesColors.white }}>
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
        <ServicesHeroBanner />
        <View style={styles.searchWrap}>
          <ServicesSearchBar />
        </View>

        {mockServiceCategories.map((category) => (
          <ServiceCategorySection key={category.id} category={category} />
        ))}

        <ServicesQuoteBanner />
      </ScrollView>

      <HomeBottomNav
        variant="light"
        activeTab="services"
        onTabPress={(tab) => {
          if (tab === "home") navigation.navigate("Home");
          if (tab === "services") return;
          if (tab === "factor") navigation.navigate("Factor");
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
    backgroundColor: servicesColors.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: servicesSpacing.screen,
    paddingTop: 12,
    paddingBottom: servicesSpacing.bottomScrollPadding,
  },
  searchWrap: {
    marginTop: 12,
  },
});
