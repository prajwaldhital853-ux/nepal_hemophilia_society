import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

import { APP_LOGO } from "@/core/assets";
import { LOGO_ASPECT_RATIO } from "@/features/auth/theme/nhmsTheme";
import { colors } from "@/core/theme";

const LOGO_WIDTH = 180;

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={APP_LOGO}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="NHMS logo"
      />
      <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_WIDTH / LOGO_ASPECT_RATIO,
  },
  loader: {
    marginTop: 32,
  },
});
