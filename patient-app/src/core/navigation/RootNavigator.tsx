import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthProvider, useAuth } from "@/core/auth/AuthContext";
import { PatientDataProvider } from "@/core/providers/PatientDataProvider";
import {
  ChangePasswordScreen,
  FactorScreen,
  HomeScreen,
  InjectionsScreen,
  DocumentsScreen,
  LoginScreen,
  NotificationsScreen,
  ProfileScreen,
  RegisterScreen,
  ServicesScreen,
  SplashScreen,
  TreatmentsScreen,
  BleedingScreen,
  CentersScreen,
  EmergencyIdScreen,
  SettingsScreen,
  ServiceDetailScreen,
  ServiceContentListScreen,
  ServiceContentDetailScreen,
} from "./screens";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ChangePassword: undefined;
  Home: undefined;
  Services: undefined;
  Factor: undefined;
  Notifications: undefined;
  Profile: undefined;
  Documents: undefined;
  Injections: undefined;
  Treatments: undefined;
  Bleeding: undefined;
  Centers: undefined;
  EmergencyId: undefined;
  Settings: undefined;
  ServiceDetail: { slug: string; title?: string };
  ServiceContentList: { kind: string; title: string };
  ServiceContentDetail: { kind: string; slug: string; title?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const mainTabOptions = {
  headerShown: false,
  animation: "slide_from_right" as const,
  animationDuration: 280,
};

function AppStack() {
  const { ready, token, mustChangePassword } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#DC2626" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: "#F8FAFC" },
      }}
    >
      {!ready ? (
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      ) : !token ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Registration" }} />
        </>
      ) : mustChangePassword ? (
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={mainTabOptions} />
          <Stack.Screen name="Services" component={ServicesScreen} options={mainTabOptions} />
          <Stack.Screen name="Factor" component={FactorScreen} options={mainTabOptions} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={mainTabOptions} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={mainTabOptions} />
          <Stack.Screen name="Injections" component={InjectionsScreen} options={{ title: "Injection History" }} />
          <Stack.Screen name="Treatments" component={TreatmentsScreen} options={{ title: "Treatment History" }} />
          <Stack.Screen name="Bleeding" component={BleedingScreen} options={{ title: "Bleeding History" }} />
          <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: "My documents" }} />
          <Stack.Screen name="Centers" component={CentersScreen} options={{ title: "Treatment Centres" }} />
          <Stack.Screen name="EmergencyId" component={EmergencyIdScreen} options={{ title: "Emergency ID" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
          <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: "Service" }} />
          <Stack.Screen name="ServiceContentList" component={ServiceContentListScreen} options={{ title: "Updates" }} />
          <Stack.Screen name="ServiceContentDetail" component={ServiceContentDetailScreen} options={{ title: "Details" }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <AuthProvider>
      <PatientDataProvider>
        <NavigationContainer>
          <AppStack />
        </NavigationContainer>
      </PatientDataProvider>
    </AuthProvider>
  );
}
