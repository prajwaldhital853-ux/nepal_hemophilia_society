import { createStackNavigator } from "@react-navigation/stack";

import { LegalDocumentScreen, LoginScreen, RegisterScreen } from "./lazyScreens";
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
      <Stack.Screen
        name="Legal"
        component={LegalDocumentScreen}
        options={({ route }) => ({
          title: route.params.document === "privacy" ? "Privacy Policy" : "Terms and Conditions",
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerTintColor: "#202124",
          headerTitleStyle: { fontWeight: "500", color: "#202124" },
          cardStyle: { backgroundColor: "#FFFFFF" },
        })}
      />
    </Stack.Navigator>
  );
}
