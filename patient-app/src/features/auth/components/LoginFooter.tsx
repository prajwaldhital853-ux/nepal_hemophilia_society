import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { ShieldCrossIcon } from "@/features/auth/components/ShieldCrossIcon";
import { useLoginLayout } from "@/features/auth/hooks/useLoginLayout";
import { nhmsColors } from "@/features/auth/theme/nhmsTheme";

const features = [
  { key: "care", label: "Care", icon: "heart-plus-outline", library: "mci" as const },
  { key: "support", label: "Support", icon: "users", library: "fa5" as const },
  { key: "empower", label: "Empower", icon: "heart-outline", library: "ion" as const },
  { key: "awareness", label: "Awareness", icon: "water-outline", library: "ion" as const },
  { key: "stronger", label: "Stronger\nLives", icon: "shield-cross-outline", library: "mci" as const },
];

function FeatureIcon({
  icon,
  library,
  size,
}: {
  icon: string;
  library: "fa5" | "ion" | "mci";
  size: number;
}) {
  const color = nhmsColors.footerIcon;

  if (library === "fa5") {
    return <FontAwesome5 name={icon as "users"} size={size} color={color} />;
  }
  if (library === "mci") {
    return (
      <MaterialCommunityIcons
        name={icon as "shield-cross-outline" | "heart-plus-outline"}
        size={size + 1}
        color={color}
      />
    );
  }
  return <Ionicons name={icon as "heart-outline" | "water-outline"} size={size + 1} color={color} />;
}

export function LoginFooter() {
  const layout = useLoginLayout();

  return (
    <View style={[styles.wrapper, { paddingTop: layout.footerPaddingTop }]}>
      <ShieldCrossIcon size={layout.shieldSize} />
      <Text
        style={[styles.tagline, { fontSize: layout.footerTaglineSize }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        — Together for a better tomorrow —
      </Text>

      <View style={[styles.featureBar, { paddingHorizontal: Math.max(2, layout.width * 0.01) }]}>
        {features.map((item, index) => (
          <View key={item.key} style={styles.featureColumn}>
            {index > 0 ? <View style={styles.featureDivider} /> : null}
            <View style={styles.featureItem}>
              <FeatureIcon icon={item.icon} library={item.library} size={layout.footerIconSize} />
              <Text
                style={[
                  styles.featureLabel,
                  {
                    fontSize: layout.footerLabelSize,
                    lineHeight: layout.footerLabelSize + 2,
                  },
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {item.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 4,
    alignItems: "center",
    flexShrink: 0,
  },
  tagline: {
    marginTop: 8,
    color: nhmsColors.textMuted,
  },
  featureBar: {
    marginTop: 8,
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  featureColumn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  featureDivider: {
    position: "absolute",
    left: 0,
    top: 2,
    width: 1,
    height: 34,
    backgroundColor: nhmsColors.divider,
  },
  featureItem: {
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 1,
    maxWidth: "100%",
  },
  featureLabel: {
    color: nhmsColors.footerMuted,
    textAlign: "center",
    fontWeight: "500",
    width: "100%",
  },
});
