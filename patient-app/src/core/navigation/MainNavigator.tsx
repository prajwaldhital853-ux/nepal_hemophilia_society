import { createNativeStackNavigator } from "@react-navigation/native-stack";

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
  ProfileScreen,
  ServiceContentDetailScreen,
  ServiceContentListScreen,
  ServiceDetailScreen,
  ServicesScreen,
  SettingsScreen,
  TreatmentsScreen,
} from "./lazyScreens";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const mainTabOptions = {
  headerShown: false,
  animation: "fade" as const,
};

const headerOptions = {
  headerStyle: { backgroundColor: "#DC2626" },
  headerTintColor: "#FFFFFF",
  headerTitleStyle: { fontWeight: "600" as const },
  contentStyle: { backgroundColor: "#F8FAFC" },
  animation: "fade" as const,
};

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={mainTabOptions} />
      <Stack.Screen name="Services" component={ServicesScreen} options={mainTabOptions} />
      <Stack.Screen name="Factor" component={FactorScreen} options={mainTabOptions} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={mainTabOptions} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={mainTabOptions} />
      <Stack.Screen name="Injections" component={InjectionsScreen} options={{ title: "Injection History" }} />
      <Stack.Screen name="Treatments" component={TreatmentsScreen} options={{ title: "Treatment History" }} />
      <Stack.Screen name="Bleeding" component={BleedingScreen} options={{ title: "Bleeding History" }} />
      <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: "Health Insights" }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: "My documents" }} />
      <Stack.Screen name="Centers" component={CentersScreen} options={{ title: "Treatment Centres" }} />
      <Stack.Screen name="EmergencyId" component={EmergencyIdScreen} options={{ title: "Emergency ID" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: "Service" }} />
      <Stack.Screen name="ServiceContentList" component={ServiceContentListScreen} options={{ title: "Updates" }} />
      <Stack.Screen name="ServiceContentDetail" component={ServiceContentDetailScreen} options={{ title: "Details" }} />
    </Stack.Navigator>
  );
}
