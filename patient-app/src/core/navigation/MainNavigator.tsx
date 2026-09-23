import { createStackNavigator } from "@react-navigation/stack";

import { useLocale } from "@/core/i18n";

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

export function MainNavigator() {
  const { t } = useLocale();

  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={mainTabOptions} />
      <Stack.Screen name="Services" component={ServicesScreen} options={mainTabOptions} />
      <Stack.Screen name="Factor" component={FactorScreen} options={mainTabOptions} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={mainTabOptions} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={mainTabOptions} />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} options={{ title: t("home.appointments") }} />
      <Stack.Screen name="Injections" component={InjectionsScreen} options={{ title: t("home.injectionHistory") }} />
      <Stack.Screen name="Treatments" component={TreatmentsScreen} options={{ title: t("home.treatmentHistory") }} />
      <Stack.Screen name="Bleeding" component={BleedingScreen} options={{ title: t("home.bleedingHistory") }} />
      <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: t("home.healthInsights") }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: t("home.myDocuments") }} />
      <Stack.Screen name="Centers" component={CentersScreen} options={{ title: t("home.treatmentCentres") }} />
      <Stack.Screen name="EmergencyId" component={EmergencyIdScreen} options={{ title: t("home.emergencyId") }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t("home.settings") }} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: "Service" }} />
      <Stack.Screen name="ServiceContentList" component={ServiceContentListScreen} options={{ title: "Updates" }} />
      <Stack.Screen name="ServiceContentDetail" component={ServiceContentDetailScreen} options={{ title: "Details" }} />
    </Stack.Navigator>
  );
}
