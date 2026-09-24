import { createStackNavigator } from "@react-navigation/stack";
import { StyleSheet } from "react-native";

import { useLocale } from "@/core/i18n";
import { DrawerProvider } from "@/features/home/context/DrawerContext";
import { servicesColors } from "@/features/services/theme/servicesTheme";

import {
  BleedingScreen,
  CentersScreen,
  DocumentsScreen,
  EmergencyIdScreen,
  FactorScreen,
  HomeScreen,
  InjectionsScreen,
  InsightsScreen,
  NotificationsScreen,
  AppointmentsScreen,
  ProfileScreen,
  ServiceContentDetailScreen,
  ServiceContentListScreen,
  ServiceDetailScreen,
  ServicesScreen,
  SettingsScreen,
  TreatmentsScreen,
} from "./lazyScreens";
import type { RootStackParamList } from "./types";

const Stack = createStackNavigator<RootStackParamList>();

const mainTabOptions = {
  headerShown: false,
  animationEnabled: false,
};

const headerOptions = {
  headerStyle: { backgroundColor: "#DC2626" },
  headerTintColor: "#FFFFFF",
  headerTitleStyle: { fontWeight: "600" as const },
  cardStyle: { backgroundColor: "#F8FAFC" },
  animationEnabled: false,
};

const paperHeader = {
  headerStyle: {
    backgroundColor: servicesColors.pageBg,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: servicesColors.borderStrong,
  },
  headerTintColor: servicesColors.ink,
  headerTitleStyle: { fontWeight: "600" as const, fontSize: 16, color: servicesColors.ink },
  cardStyle: { backgroundColor: servicesColors.pageBg },
};

export function MainNavigator() {
  const { t } = useLocale();

  return (
    <DrawerProvider>
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={mainTabOptions} />
      <Stack.Screen name="Services" component={ServicesScreen} options={mainTabOptions} />
      <Stack.Screen name="Factor" component={FactorScreen} options={mainTabOptions} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={mainTabOptions} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={mainTabOptions} />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} options={{ title: t("home.appointments") }} />
      <Stack.Screen name="Injections" component={InjectionsScreen} options={{ ...paperHeader, title: t("home.injectionHistory") }} />
      <Stack.Screen name="Treatments" component={TreatmentsScreen} options={{ ...paperHeader, title: t("home.treatmentHistory") }} />
      <Stack.Screen name="Bleeding" component={BleedingScreen} options={{ ...paperHeader, title: t("home.bleedingHistory") }} />
      <Stack.Screen name="Insights" component={InsightsScreen} options={{ ...paperHeader, title: t("home.healthInsights") }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ ...paperHeader, title: t("home.myDocuments") }} />
      <Stack.Screen name="Centers" component={CentersScreen} options={{ ...paperHeader, title: t("home.treatmentCentres") }} />
      <Stack.Screen name="EmergencyId" component={EmergencyIdScreen} options={{ ...paperHeader, title: t("home.emergencyId") }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ ...paperHeader, title: t("home.settings") }} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ ...paperHeader, title: "Service" }} />
      <Stack.Screen name="ServiceContentList" component={ServiceContentListScreen} options={{ ...paperHeader, title: "Updates" }} />
      <Stack.Screen name="ServiceContentDetail" component={ServiceContentDetailScreen} options={{ ...paperHeader, title: "Details" }} />
    </Stack.Navigator>
    </DrawerProvider>
  );
}
