import { NavigationContainer } from "@react-navigation/native";

import { navigationRef } from "@/core/navigation/navigationRef";

import { AuthProvider, useAuth } from "@/core/auth/AuthContext";
import { LocaleProvider } from "@/core/i18n";
import { PatientDataProvider } from "@/core/providers/PatientDataProvider";
import SplashScreen from "@/features/splash/screens/SplashScreen";

import { AuthNavigator } from "./AuthNavigator";
import { MainNavigator } from "./MainNavigator";
import { PasswordNavigator } from "./PasswordNavigator";

export type { RootStackParamList } from "./types";

function AppGate() {
  const { ready, token, mustChangePassword } = useAuth();

  if (!ready) {
    return <SplashScreen />;
  }

  return (
    <PatientDataProvider>
      <NavigationContainer ref={navigationRef}>
        {mustChangePassword ? <PasswordNavigator /> : token ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </PatientDataProvider>
  );
}

export function RootNavigator() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </LocaleProvider>
  );
}
