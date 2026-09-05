import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useLoginLayout } from "@/features/auth/hooks/useLoginLayout";
import { nhmsColors } from "@/features/auth/theme/nhmsTheme";

function HeartbeatIcon({ width }: { width: number }) {
  const height = Math.round(width * (24 / 62));

  return (
    <Svg width={width} height={height} viewBox="0 0 54 22">
      <Path
        d="M1 13 H10 L13 6 L17 19 L21 9 L24 13 H32 L35 8 L38 13 H42"
        fill="none"
        stroke={nhmsColors.primaryRed}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path
        d="M41 10 C42.2 8.2 44.6 8.2 45.8 10 C47 8.2 49.4 8.2 50.6 10 C51.6 11.6 49.2 14.2 45.8 16.6 C42.4 14.2 40 11.6 41 10 Z"
        fill={nhmsColors.primaryRed}
      />
    </Svg>
  );
}

export function SaferTomorrowBanner() {
  const layout = useLoginLayout();

  return (
    <View
      style={[
        styles.wrapper,
        {
          marginTop: layout.saferMarginTop,
          paddingBottom: Math.round(12 * layout.bodyDensity),
        },
      ]}
    >
      <HeartbeatIcon width={layout.saferIconWidth} />
      <View style={[styles.verticalDivider, { height: Math.round(36 * layout.scale) }]} />
      <View style={styles.textBlock}>
        <Text style={[styles.text, { fontSize: layout.saferFontSize, lineHeight: layout.saferFontSize + 6 }]}>
          Together for a
        </Text>
        <Text style={[styles.text, { fontSize: layout.saferFontSize, lineHeight: layout.saferFontSize + 6 }]}>
          <Text style={styles.highlight}>Safer</Text> Tomorrow
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 2,
    backgroundColor: nhmsColors.white,
    flexShrink: 0,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: nhmsColors.divider,
    marginHorizontal: 12,
  },
  textBlock: {
    alignItems: "flex-start",
  },
  text: {
    color: nhmsColors.textMuted,
    fontWeight: "500",
  },
  highlight: {
    color: nhmsColors.primaryRed,
    fontWeight: "700",
  },
});
