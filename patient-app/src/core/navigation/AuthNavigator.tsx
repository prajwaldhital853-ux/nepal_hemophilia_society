import { createStackNavigator } from "@react-navigation/stack";

import { LoginScreen, RegisterScreen } from "./lazyScreens";
import type { RootStackParamList } from "./types";

const Stack = createStackNavigator<RootStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: "#DC2626" },
  headerTintColor: "#FFFFFF",
  headerTitleStyle: { fontWeight: "600" as const },
  cardStyle: { backgroundColor: "#F8FAFC" },
  animationEnabled: false,
};

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Registration" }} />
    </Stack.Navigator>
  );
}
