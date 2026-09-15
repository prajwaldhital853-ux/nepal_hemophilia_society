import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/core/auth/AuthContext";
import { homeColors, homeRadii } from "@/features/home/theme/homeTheme";

const LOGO = require("../../../../assets/images/nhs-logo-icon.png");
const SCREEN_WIDTH = Dimensions.get("window").width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.84, 320);

type DrawerTab = "home" | "services" | "factor" | "notifications" | "profile" | "injections" | "documents";

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (tab: DrawerTab) => void;
};

const MENU_ITEMS: { id: DrawerTab; label: string; ion?: keyof typeof Ionicons.glyphMap; mci?: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: "home", label: "Home", ion: "home" },
  { id: "services", label: "Services", ion: "medkit" },
  { id: "factor", label: "Factor & Stock", ion: "water" },
  { id: "injections", label: "Injection History", mci: "needle" },
  { id: "documents", label: "Documents", ion: "document-text" },
  { id: "notifications", label: "Notifications", ion: "notifications" },
  { id: "profile", label: "My Profile", ion: "person" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

export function HomeDrawer({ visible, onClose, onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const { patient, logout } = useAuth();
  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideX, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 22,
      }).start();
    } else {
      slideX.setValue(-DRAWER_WIDTH);
    }
  }, [visible, slideX]);

  const closeDrawer = () => {
    Animated.timing(slideX, {
      toValue: -DRAWER_WIDTH,
      duration: 160,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onCloseRef.current();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy),
      onMoveShouldSetPanResponderCapture: (_, g) => g.dx < -12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.15,
      onPanResponderMove: (_, g) => {
        slideX.setValue(Math.max(-DRAWER_WIDTH, Math.min(0, g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        const shouldClose = g.dx < -24 || g.vx < -0.08;
        if (shouldClose) {
          Animated.timing(slideX, {
            toValue: -DRAWER_WIDTH,
            duration: 140,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (finished) onCloseRef.current();
          });
        } else {
          Animated.spring(slideX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 26,
          }).start();
        }
      },
    }),
  ).current;

  const overlayOpacity = slideX.interpolate({
    inputRange: [-DRAWER_WIDTH, 0],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const name = patient?.fullName ?? "Patient";
  const factorLine = patient
    ? [patient.deficientFactor, patient.severity].filter(Boolean).join(" · ")
    : "—";

  const topInset = Math.max(insets.top, Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={closeDrawer}>
      <View style={styles.overlay}>
        <Pressable style={styles.outsideHit} onPress={closeDrawer} accessibilityRole="button" accessibilityLabel="Close menu">
          <Animated.View pointerEvents="none" style={[styles.scrim, { opacity: overlayOpacity }]} />
        </Pressable>
        <Animated.View
          style={[
            styles.drawer,
            {
              width: DRAWER_WIDTH,
              paddingTop: topInset + 6,
              transform: [{ translateX: slideX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.topBar}>
            <View style={styles.logoBlock}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <View style={styles.logoTextWrap}>
                <Text style={styles.logoNepal}>NEPAL</Text>
                <Text style={styles.logoSociety}>HEMOPHILIA</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={closeDrawer} hitSlop={8} accessibilityLabel="Close menu">
              <Ionicons name="close" size={20} color={homeColors.navy} />
            </Pressable>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              <View style={styles.avatarWrap}>
                {patient?.photoUrl ? (
                  <Image source={{ uri: patient.photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitials}>{initials(name)}</Text>
                  </View>
                )}
              </View>

              <View style={styles.profileRight}>
                <Text style={styles.name} numberOfLines={2}>{name}</Text>
                <View style={styles.badgeRow}>
                  {patient?.status ? (
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>{patient.status}</Text>
                    </View>
                  ) : null}
                  {patient?.id ? (
                    <View style={styles.idBadge}>
                      <Text style={styles.idText}>{patient.id}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.detailsBlock}>
              <DetailRow label="Factor" value={factorLine} />
              <DetailRow label="Phone" value={patient?.mobile ?? "—"} />
              <DetailRow label="Treatment Center" value={patient?.primaryHospital ?? "—"} />
            </View>
          </View>

          <ScrollView
            style={styles.menuScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.menu}>
              {MENU_ITEMS.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => {
                    slideX.setValue(-DRAWER_WIDTH);
                    onClose();
                    onNavigate(item.id);
                  }}
                >
                  <View style={styles.menuIconWrap}>
                    {item.mci ? (
                      <MaterialCommunityIcons name={item.mci} size={22} color={homeColors.navy} />
                    ) : (
                      <Ionicons name={item.ion ?? "ellipse"} size={22} color={homeColors.navy} />
                    )}
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={homeColors.textLight} />
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.logout}
              onPress={() => {
                slideX.setValue(-DRAWER_WIDTH);
                onClose();
                void logout();
              }}
            >
              <View style={styles.logoutIconWrap}>
                <Ionicons name="log-out" size={22} color={homeColors.primary} />
              </View>
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 29, 61, 0.22)",
  },
  outsideHit: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: homeColors.screenBg,
    paddingHorizontal: 12,
    paddingBottom: 12,
    zIndex: 2,
    height: "100%",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  logoBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  logo: {
    width: 32,
    height: 40,
  },
  logoTextWrap: {
    justifyContent: "center",
  },
  logoNepal: {
    fontSize: 11,
    fontWeight: "800",
    color: homeColors.primary,
    letterSpacing: 0.4,
    lineHeight: 13,
  },
  logoSociety: {
    fontSize: 12,
    fontWeight: "800",
    color: homeColors.navy,
    lineHeight: 14,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: homeColors.white,
  },
  profileCard: {
    backgroundColor: homeColors.white,
    borderRadius: homeRadii.card,
    borderWidth: 1,
    borderColor: homeColors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: homeColors.white,
    backgroundColor: "#FEE2E2",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: "800",
    color: homeColors.primary,
  },
  profileRight: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: homeColors.navy,
    lineHeight: 19,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: homeColors.greenBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: homeRadii.pill,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: homeColors.green,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: homeColors.green,
  },
  idBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: homeRadii.pill,
  },
  idText: {
    fontSize: 10,
    fontWeight: "700",
    color: homeColors.primary,
  },
  detailsBlock: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: homeColors.border,
    gap: 5,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  detailLabel: {
    flex: 0.85,
    fontSize: 11,
    color: homeColors.textMuted,
    fontWeight: "600",
  },
  detailValue: {
    flex: 1.15,
    fontSize: 11,
    fontWeight: "700",
    color: homeColors.navy,
    textAlign: "right",
  },
  menuScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  menu: {
    gap: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: homeColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: homeColors.border,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#DDE4EE",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: homeColors.navy,
    letterSpacing: 0.2,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: homeColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: homeColors.primary,
  },
});
