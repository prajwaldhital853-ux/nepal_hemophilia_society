import { createStackNavigator } from "@react-navigation/stack";

import { ChangePasswordScreen } from "./lazyScreens";
import type { RootStackParamList } from "./types";

const Stack = createStackNavigator<RootStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: "#DC2626" },
  headerTintColor: "#FFFFFF",
  headerTitleStyle: { fontWeight: "600" as const },
  cardStyle: { backgroundColor: "#F8FAFC" },
  animationEnabled: false,
};

export function PasswordNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
