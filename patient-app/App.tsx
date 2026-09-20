import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { APP_LOGO } from "@/core/assets";
import { ErrorBoundary } from "@/core/ErrorBoundary";
import { RootNavigator } from "@/core/navigation/RootNavigator";

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch {
        // Splash may already be managed by the OS on some devices.
      }
      if (!cancelled) setAppReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!appReady) {
    return (
      <View style={styles.boot}>
        <Image source={APP_LOGO} style={styles.bootLogo} resizeMode="contain" accessibilityLabel="NHMS logo" />
        <ActivityIndicator size="large" color="#DC2626" style={styles.bootSpinner} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <RootNavigator />
          <StatusBar style="light" />
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  bootLogo: {
    width: 140,
    height: 140,
  },
  bootSpinner: {
    marginTop: 24,
  },
});
