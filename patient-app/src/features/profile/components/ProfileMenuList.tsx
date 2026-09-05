import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ProfileMenuItem } from "@/features/profile/data/mockProfileMenu";
import { profileMenuItems } from "@/features/profile/data/mockProfileMenu";
import { homeColors } from "@/features/home/theme/homeTheme";

const ICON_RED = "#B9020A";

const ICONS: Record<ProfileMenuItem["icon"], keyof typeof Ionicons.glyphMap> = {
  person: "person",
  people: "people",
  medical: "document-text",
  calendar: "calendar",
  notifications: "notifications",
  settings: "settings",
  help: "help-circle",
  logout: "log-out",
};

type Props = {
  onPressItem?: (item: ProfileMenuItem) => void;
};

export function ProfileMenuList({ onPressItem }: Props) {
  return (
    <View style={styles.list}>
      {profileMenuItems.map((item) => (
        <Pressable key={item.id} style={styles.card} onPress={() => onPressItem?.(item)}>
          <View style={styles.iconWrap}>
            <Ionicons name={ICONS[item.icon]} size={22} color={ICON_RED} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#C4C4C8" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: homeColors.white,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E8C4C6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: homeColors.navy,
    lineHeight: 19,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "400",
    color: homeColors.textMuted,
    lineHeight: 16,
  },
});
