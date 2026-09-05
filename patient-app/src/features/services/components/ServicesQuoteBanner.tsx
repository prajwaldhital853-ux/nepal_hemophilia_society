import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const LOGO = require("../../../../assets/images/nhs-logo-icon-clear.png");

const QUOTE_RED = "#C1121F";

function PinkMountains() {
  return (
    <Svg width={92} height={52} viewBox="0 0 92 52">
      <Path d="M0 52 L18 22 L28 34 L42 8 L58 32 L68 20 L92 52 Z" fill="#F3B8BE" />
      <Path d="M18 22 L24 30 L28 26 L42 8 L48 20 L58 32 L52 36 L42 18 L28 34 Z" fill="#E48A92" />
      <Path d="M42 8 L46 16 L50 12 L54 20 L48 20 Z" fill="#FFFFFF" opacity={0.55} />
      <Path d="M68 20 L74 30 L80 24 L92 52 L58 52 L58 32 Z" fill="#E0707A" />
    </Svg>
  );
}

export function ServicesQuoteBanner() {
  return (
    <View style={styles.outer}>
      <View style={styles.quoteCol}>
        <Text style={styles.quote}>“Knowledge. Support. Stronger Lives.”</Text>
        <View style={styles.underline} />
      </View>

      <View style={styles.mountainsWrap} pointerEvents="none">
        <PinkMountains />
      </View>

      <View style={styles.brandCol}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <View style={styles.brandText}>
          <Text style={styles.nepal}>NEPAL</Text>
          <Text style={styles.society}>HEMOPHILIA{"\n"}SOCIETY</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginTop: 16,
    marginBottom: 0,
    backgroundColor: "#FDECEC",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F5C8C8",
    paddingVertical: 18,
    paddingLeft: 16,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 88,
    position: "relative",
  },
  quoteCol: {
    flex: 1,
    zIndex: 2,
    paddingRight: 8,
  },
  quote: {
    fontSize: 14,
    fontStyle: "italic",
    fontWeight: "700",
    color: QUOTE_RED,
    lineHeight: 19,
  },
  underline: {
    width: 52,
    height: 3,
    backgroundColor: QUOTE_RED,
    borderRadius: 2,
    marginTop: 8,
  },
  mountainsWrap: {
    position: "absolute",
    right: 118,
    bottom: 6,
    zIndex: 1,
    opacity: 0.95,
  },
  brandCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 2,
    flexShrink: 0,
  },
  logo: {
    width: 38,
    height: 48,
  },
  brandText: {
    justifyContent: "center",
  },
  nepal: {
    fontSize: 11,
    fontWeight: "800",
    color: QUOTE_RED,
    lineHeight: 13,
    letterSpacing: 0.4,
  },
  society: {
    fontSize: 10,
    fontWeight: "800",
    color: QUOTE_RED,
    lineHeight: 12,
    letterSpacing: 0.2,
    marginTop: 1,
  },
});
