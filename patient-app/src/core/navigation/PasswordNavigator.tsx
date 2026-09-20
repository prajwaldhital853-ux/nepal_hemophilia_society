import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ChangePasswordScreen } from "./lazyScreens";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: "#DC2626" },
  headerTintColor: "#FFFFFF",
  headerTitleStyle: { fontWeight: "600" as const },
  contentStyle: { backgroundColor: "#F8FAFC" },
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
