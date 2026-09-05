import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { homeColors } from "@/features/home/theme/homeTheme";

const LOGO = require("../../../../assets/images/nhs-logo-icon.png");
const PATIENT_PHOTO = require("../../../../assets/images/mock-patient-photo.jpg");

type HomeHeaderProps = {
  notificationCount?: number;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
};

export function HomeHeader({
  notificationCount = 3,
  onMenuPress,
  onNotificationPress,
  onProfilePress,
}: HomeHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.swooshLeft} pointerEvents="none" />
      <View style={styles.swooshRight} pointerEvents="none" />

      <Pressable style={styles.menuBtn} onPress={onMenuPress} hitSlop={8}>
        <Ionicons name="menu" size={28} color={homeColors.primary} />
      </Pressable>

      <View style={styles.logoBlock}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <View style={styles.logoTextWrap}>
          <Text style={styles.logoNepal}>NEPAL</Text>
          <Text style={styles.logoSociety}>HEMOPHILIA SOCIETY</Text>
          <Text style={styles.logoTagline}>For A Bleeding Free Tomorrow</Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        <Pressable style={styles.iconBtn} onPress={onNotificationPress} hitSlop={8}>
          <Ionicons name="notifications-outline" size={24} color="#111827" />
          {notificationCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable style={styles.avatarWrap} onPress={onProfilePress} hitSlop={8}>
          <Image source={PATIENT_PHOTO} style={styles.avatar} />
          <View style={styles.avatarDot}>
            <Ionicons name="water" size={8} color={homeColors.white} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFCFC",
    overflow: "hidden",
  },
  swooshLeft: {
    position: "absolute",
    top: -28,
    left: -36,
    width: 110,
    height: 90,
    borderRadius: 55,
    backgroundColor: "rgba(193, 18, 31, 0.06)",
  },
  swooshRight: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 130,
    height: 100,
    borderRadius: 65,
    backgroundColor: "rgba(193, 18, 31, 0.05)",
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingRight: 4,
  },
  logo: {
    width: 42,
    height: 54,
  },
  logoTextWrap: {
    justifyContent: "center",
    flexShrink: 1,
  },
  logoNepal: {
    fontSize: 13,
    fontWeight: "800",
    color: homeColors.primary,
    lineHeight: 15,
    letterSpacing: 0.4,
  },
  logoSociety: {
    fontSize: 14,
    fontWeight: "800",
    color: homeColors.navy,
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  logoTagline: {
    fontSize: 8.5,
    fontWeight: "500",
    color: "#334155",
    lineHeight: 11,
    marginTop: 1,
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: homeColors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: homeColors.white,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: homeColors.white,
    backgroundColor: "#FEE2E2",
  },
  avatarDot: {
    position: "absolute",
    bottom: 1,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: homeColors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: homeColors.white,
  },
});
