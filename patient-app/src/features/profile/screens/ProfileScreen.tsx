import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { HomeBottomNav } from "@/features/home/components/HomeBottomNav";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { ProfileSummaryCard } from "@/features/home/components/ProfileSummaryCard";
import { ProfileMenuList } from "@/features/profile/components/ProfileMenuList";
import type { ProfileMenuItem } from "@/features/profile/data/mockProfileMenu";
import { homeColors, homeSpacing } from "@/features/home/theme/homeTheme";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  function handleMenuPress(item: ProfileMenuItem) {
    if (item.action === "notifications") {
      navigation.navigate("Notifications");
      return;
    }
    if (item.action === "logout") {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={homeColors.white} />
      <View style={{ paddingTop: insets.top, backgroundColor: homeColors.white }}>
        <HomeHeader
          onProfilePress={() => undefined}
          onNotificationPress={() => navigation.navigate("Notifications")}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileSummaryCard />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Person with Hemophilia</Text>
          <View style={styles.chip}>
            <Ionicons name="water" size={13} color="#FFFFFF" />
            <Text style={styles.chipText}>Stay Strong Stay Informed</Text>
          </View>
        </View>

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 72,
  },
  sectionHead: {
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: homeSpacing.screen,
    alignItems: "flex-start",
    gap: 8,
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
