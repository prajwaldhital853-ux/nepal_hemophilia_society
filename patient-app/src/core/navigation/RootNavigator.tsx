import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import {
  FactorScreen,
  HomeScreen,
  InjectionsScreen,
  LoginScreen,
  NotificationsScreen,
  ProfileScreen,
  RegisterScreen,
  ServicesScreen,
  SplashScreen,
} from "./screens";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Services: undefined;
  Factor: undefined;
  Notifications: undefined;
  Profile: undefined;
  Injections: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const mainTabOptions = {
  headerShown: false,
  animation: "slide_from_right" as const,
  animationDuration: 280,
};

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: { backgroundColor: "#DC2626" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#F8FAFC" },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "Registration" }}
        />
        <Stack.Screen name="Home" component={HomeScreen} options={mainTabOptions} />
        <Stack.Screen name="Services" component={ServicesScreen} options={mainTabOptions} />
        <Stack.Screen name="Factor" component={FactorScreen} options={mainTabOptions} />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={mainTabOptions}
        />
        <Stack.Screen name="Profile" component={ProfileScreen} options={mainTabOptions} />
        <Stack.Screen
          name="Injections"
          component={InjectionsScreen}
          options={{ title: "Injection History" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
