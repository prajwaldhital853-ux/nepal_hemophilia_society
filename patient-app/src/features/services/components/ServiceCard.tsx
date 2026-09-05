import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import type { ServiceItem } from "@/features/services/data/mockServicesData";

type ServiceCardProps = {
  item: ServiceItem;
  width?: number;
  onPress?: () => void;
};

/** Vibrant SS red used for every service icon */
const ICON_RED = "#E53935";

function ServiceIcon({
  icon,
  size,
  color = ICON_RED,
}: {
  icon: ServiceItem["icon"];
  size: number;
  color?: string;
}) {
  if (icon.set === "mci") {
    return <MaterialCommunityIcons name={icon.name} size={size} color={color} />;
  }
  return <Ionicons name={icon.name} size={size} color={color} />;
}

export function ServiceCard({ item, width, onPress }: ServiceCardProps) {
  const cardStyle: ViewStyle[] = [styles.card];
  if (width != null) {
    cardStyle.push({ width });
  }

  return (
    <Pressable style={cardStyle} onPress={onPress}>
      <View style={styles.iconCircle}>
        <ServiceIcon icon={item.icon} size={30} color={ICON_RED} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <View style={styles.arrowWrap}>
        <Ionicons name="chevron-forward" size={12} color={ICON_RED} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 22,
    minHeight: 132,
    alignItems: "stretch",
    shadowColor: "#8B5A5A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  textBlock: {
    alignItems: "flex-start",
    marginTop: 7,
    paddingRight: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "left",
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 9.5,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "left",
    lineHeight: 12.5,
    marginTop: 3,
  },
  arrowWrap: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
  },
});
