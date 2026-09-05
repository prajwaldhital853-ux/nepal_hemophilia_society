import type { ReactNode } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { homeColors, homeRadii } from "@/features/home/theme/homeTheme";

type TabId = "home" | "services" | "factor" | "notifications" | "profile";

type HomeBottomNavProps = {
  activeTab?: TabId;
  variant?: "home" | "light";
  onTabPress?: (tab: TabId) => void;
};

function ProfileNavIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={28} viewBox="0 0 24 26">
      <Path
        d="M12 1.5 C12 1.5 8.8 6.2 8.8 8.2 C8.8 9.6 10.2 10.8 12 10.8 C13.8 10.8 15.2 9.6 15.2 8.2 C15.2 6.2 12 1.5 12 1.5 Z"
        fill={color}
      />
      <Circle cx={12} cy={14.5} r={3.8} stroke={color} strokeWidth={1.6} fill="none" />
      <Path
        d="M6.5 24.5 C6.5 19.8 8.8 17.5 12 17.5 C15.2 17.5 17.5 19.8 17.5 24.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export function HomeBottomNav({
  activeTab = "home",
  variant = "home",
  onTabPress,
}: HomeBottomNavProps) {
  const insets = useSafeAreaInsets();
  const isLight = variant === "light";

  const inactiveColor = isLight ? homeColors.textMuted : "rgba(255,255,255,0.82)";
  const activeColor = isLight ? homeColors.primary : homeColors.white;

  const bar = (
    <View style={[styles.bar, isLight && styles.barLight]}>
      <NavItem
        label="Home"
        active={activeTab === "home"}
        light={isLight}
        inactiveColor={inactiveColor}
        activeColor={activeColor}
        onPress={() => onTabPress?.("home")}
        icon={
          <Ionicons
            name={activeTab === "home" && isLight ? "home" : "home-outline"}
            size={22}
            color={activeTab === "home" && isLight ? activeColor : inactiveColor}
          />
        }
      />
      <NavItem
        label="Services"
        active={activeTab === "services"}
        light={isLight}
        inactiveColor={inactiveColor}
        activeColor={activeColor}
        onPress={() => onTabPress?.("services")}
        icon={
          <Ionicons
            name={
              activeTab === "services" && isLight ? "business" : "business-outline"
            }
            size={22}
            color={activeTab === "services" && isLight ? activeColor : inactiveColor}
          />
        }
      />

      <View style={[styles.fabSlot, isLight && styles.fabSlotLight]}>
        <Pressable
          style={[
            styles.fab,
            isLight && styles.fabLight,
            isLight && activeTab === "factor" && styles.fabFactorActive,
          ]}
          onPress={() => onTabPress?.("factor")}
        >
          <MaterialCommunityIcons
            name="needle"
            size={isLight ? 22 : 30}
            color={isLight && activeTab === "factor" ? homeColors.white : homeColors.primary}
            style={styles.fabNeedle}
          />
          {isLight ? (
            <Text
              style={[
                styles.fabLabelLight,
                activeTab === "factor" && styles.fabLabelFactorActive,
              ]}
            >
              Factor
            </Text>
          ) : (
            <Text style={styles.fabLabel}>Factor</Text>
          )}
        </Pressable>
      </View>

      <NavItem
        label="Notifications"
        active={activeTab === "notifications"}
        light={isLight}
        inactiveColor={inactiveColor}
        activeColor={activeColor}
        onPress={() => onTabPress?.("notifications")}
        icon={
          <Ionicons
            name={
              activeTab === "notifications" && isLight
                ? "notifications"
                : "notifications-outline"
            }
            size={22}
            color={activeTab === "notifications" && isLight ? activeColor : inactiveColor}
          />
        }
        badge={3}
        lightBadge={isLight}
      />
      <NavItem
        label="Profile"
        active={activeTab === "profile"}
        highlighted={activeTab === "profile" && !isLight}
        light={isLight}
        inactiveColor={inactiveColor}
        activeColor={activeColor}
        onPress={() => onTabPress?.("profile")}
        icon={
          isLight ? (
            <Ionicons
              name={activeTab === "profile" ? "person" : "person-outline"}
              size={22}
              color={activeTab === "profile" ? activeColor : inactiveColor}
            />
          ) : (
            <ProfileNavIcon color={activeTab === "profile" ? activeColor : inactiveColor} />
          )
        }
      />
    </View>
  );

  if (isLight) {
    return (
      <View style={[styles.shellLight, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {bar}
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={["#B81422", "#961018", "#7A0E16", "#5C0A12"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 14) }]}
      >
        {bar}
      </LinearGradient>
    </View>
  );
}

function NavItem({
  label,
  icon,
  active,
  highlighted,
  light,
  inactiveColor,
  activeColor,
  badge,
  lightBadge,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  highlighted?: boolean;
  light?: boolean;
  inactiveColor: string;
  activeColor: string;
  badge?: number;
  lightBadge?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable style={[styles.navItem, light && styles.navItemLight]} onPress={onPress}>
      <View style={[styles.navInner, highlighted && styles.navInnerHighlighted]}>
        <View style={styles.iconSlot}>
          {icon}
          {badge ? (
            <View style={[styles.navBadge, lightBadge && styles.navBadgeLight]}>
              <Text style={[styles.navBadgeText, lightBadge && styles.navBadgeTextLight]}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.navLabel,
            { color: inactiveColor },
            active && { color: activeColor, fontWeight: "700" },
          ]}
        >
          {label}
        </Text>
      </View>
      {light && active ? <View style={styles.activeIndicatorBottom} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: homeColors.navBg,
  },
  shellLight: {
    backgroundColor: homeColors.white,
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  wrapper: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 14,
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingHorizontal: 8,
    minHeight: 74,
  },
  barLight: {
    paddingTop: 10,
    paddingBottom: 2,
    minHeight: 58,
    alignItems: "flex-end",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 4,
  },
  navItemLight: {
    paddingBottom: 0,
    justifyContent: "flex-end",
  },
  activeIndicatorBottom: {
    marginTop: 6,
    width: 34,
    height: 3,
    borderRadius: 2,
    backgroundColor: homeColors.primary,
  },
  navInner: {
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 14,
  },
  navInnerHighlighted: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.75)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  iconSlot: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
  },
  navBadge: {
    position: "absolute",
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: homeColors.primary,
    borderWidth: 1.5,
    borderColor: homeColors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  navBadgeLight: {
    backgroundColor: homeColors.primary,
    borderColor: homeColors.white,
  },
  navBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: homeColors.white,
  },
  navBadgeTextLight: {
    color: homeColors.white,
  },
  fabSlot: {
    flex: 1,
    alignItems: "center",
    marginTop: -44,
  },
  fabSlotLight: {
    marginTop: -28,
  },
  fab: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: homeColors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: homeColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  fabLight: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: homeColors.white,
    borderWidth: 3,
    borderColor: homeColors.primary,
    marginTop: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  fabNeedle: {
    transform: [{ rotate: "45deg" }],
    marginTop: -1,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: homeColors.primary,
    marginTop: 1,
  },
  fabLabelLight: {
    fontSize: 9,
    fontWeight: "700",
    color: homeColors.primary,
    marginTop: 1,
  },
  fabFactorActive: {
    backgroundColor: homeColors.primary,
    borderColor: homeColors.primary,
  },
  fabLabelFactorActive: {
    color: homeColors.white,
  },
});
