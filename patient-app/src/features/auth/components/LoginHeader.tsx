import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";

import { useLoginLayout } from "@/features/auth/hooks/useLoginLayout";
import { LOGO_ASPECT_RATIO, nhmsColors } from "@/features/auth/theme/nhmsTheme";

const HEADER_BG = require("../../../../assets/images/login-header-bg.png");
const LOGO = require("../../../../assets/images/nhs-logo-overlay.png");

export function LoginHeader() {
  const layout = useLoginLayout();

  return (
    <ImageBackground
      source={HEADER_BG}
      style={[styles.wrapper, { height: layout.headerHeight, width: layout.width }]}
      resizeMode="cover"
    >
      <View
        style={[
          styles.topBadgeBlock,
          { top: layout.badgeTop, right: layout.badgeRight },
        ]}
      >
        <Text style={[styles.badgeLine, { fontSize: layout.badgeFontSize, lineHeight: layout.badgeFontSize + 3 }]}>
          CARE
        </Text>
        <Text style={[styles.badgeLine, { fontSize: layout.badgeFontSize, lineHeight: layout.badgeFontSize + 3 }]}>
          SUPPORT
        </Text>
        <Text style={[styles.badgeLine, { fontSize: layout.badgeFontSize, lineHeight: layout.badgeFontSize + 3 }]}>
          EMPOWER
        </Text>
        <View style={styles.badgeUnderline} />
      </View>

      <View style={styles.logoWrap}>
        <Image
          source={LOGO}
          style={{
            width: layout.logoWidth,
            height: layout.logoWidth / LOGO_ASPECT_RATIO,
          }}
          resizeMode="contain"
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: nhmsColors.white,
    flexShrink: 0,
  },
  topBadgeBlock: {
    position: "absolute",
    alignItems: "flex-end",
    zIndex: 2,
  },
  badgeLine: {
    letterSpacing: 1.8,
    color: nhmsColors.badgeText,
    fontWeight: "600",
  },
  badgeUnderline: {
    marginTop: 5,
    width: 42,
    height: 3,
    backgroundColor: nhmsColors.primaryRed,
    borderRadius: 2,
  },
  logoWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
  },
});
