import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/core/auth/AuthContext";
import { homeColors } from "@/features/home/theme/homeTheme";

type DrawerTab = "home" | "services" | "factor" | "notifications" | "profile" | "injections" | "documents";

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigate: (tab: DrawerTab) => void;
};

const MENU_ITEMS: { id: DrawerTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "home", label: "Home", icon: "home-outline" },
  { id: "services", label: "Services", icon: "medkit-outline" },
  { id: "factor", label: "Factor & Stock", icon: "water-outline" },
  { id: "injections", label: "Injection History", icon: "medical-outline" },
  { id: "documents", label: "Documents", icon: "document-text-outline" },
  { id: "notifications", label: "Notifications", icon: "notifications-outline" },
  { id: "profile", label: "My Profile", icon: "person-outline" },
];

export function HomeDrawer({ visible, onClose, onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const { patient, logout } = useAuth();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu" />
        <View style={[styles.drawer, { paddingTop: insets.top + 12 }]}>
          <View style={styles.header}>
            <Text style={styles.name}>{patient?.fullName ?? "Patient"}</Text>
            <Text style={styles.meta}>
              {patient?.id ?? ""}
              {patient?.primaryHospital ? ` · ${patient.primaryHospital}` : ""}
            </Text>
            {patient?.province ? <Text style={styles.province}>{patient.province} Province</Text> : null}
          </View>

          <View style={styles.menu}>
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.id}
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onNavigate(item.id);
                }}
              >
                <Ionicons name={item.icon} size={20} color={homeColors.primary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.logout}
            onPress={() => {
              onClose();
              void logout();
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={homeColors.primary} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  drawer: {
    width: "78%",
    maxWidth: 300,
    backgroundColor: homeColors.white,
    paddingHorizontal: 16,
    paddingBottom: 24,
    zIndex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: homeColors.border,
    paddingBottom: 14,
    marginBottom: 8,
  },
  name: { fontSize: 17, fontWeight: "800", color: homeColors.navy },
  meta: { marginTop: 4, fontSize: 11, color: homeColors.textMuted, fontWeight: "600" },
  province: { marginTop: 2, fontSize: 10, color: homeColors.primary, fontWeight: "600" },
  menu: { flex: 1 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: homeColors.border,
  },
  menuLabel: { fontSize: 14, fontWeight: "600", color: homeColors.navy },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingVertical: 12,
  },
  logoutText: { fontSize: 14, fontWeight: "700", color: homeColors.primary },
});
