import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/core/ErrorBoundary";
import { RootNavigator } from "@/core/navigation/RootNavigator";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash may already be hidden in dev reloads.
});

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <RootNavigator />
        <StatusBar style="light" />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
