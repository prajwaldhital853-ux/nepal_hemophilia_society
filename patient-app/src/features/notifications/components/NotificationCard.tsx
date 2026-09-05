import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { NotificationItem } from "@/features/notifications/data/mockNotificationsData";
import { notificationsColors } from "@/features/notifications/theme/notificationsTheme";

type Props = {
  item: NotificationItem;
  unread: boolean;
};

function CardIcon({ item }: { item: NotificationItem }) {
  const isToday = item.variant !== "plain";
  const iconColor =
    item.variant === "injection" ? "#1E3A5F" : notificationsColors.iconRed;

  const icon = (() => {
    switch (item.icon) {
      case "calendar":
        return <Ionicons name="calendar" size={20} color={isToday && item.variant === "appointment" ? notificationsColors.iconRed : iconColor} />;
      case "needle":
        return <MaterialCommunityIcons name="needle" size={20} color={iconColor} />;
      case "water":
        return <Ionicons name="water" size={20} color={notificationsColors.iconRed} />;
      case "document":
        return <Ionicons name="document-text" size={20} color={notificationsColors.iconRed} />;
      case "megaphone":
        return <Ionicons name="megaphone" size={20} color={notificationsColors.iconRed} />;
      case "people":
        return <Ionicons name="people" size={20} color={notificationsColors.iconRed} />;
      case "shield":
        return <MaterialCommunityIcons name="shield-plus" size={21} color={notificationsColors.iconRed} />;
      case "call":
        return <Ionicons name="call" size={19} color={notificationsColors.iconRed} />;
      default:
        return null;
    }
  })();

  const wrapStyle = [
    styles.iconWrap,
    item.variant === "appointment" && styles.iconWrapPink,
    item.variant === "injection" && styles.iconWrapBlue,
    item.variant === "stock" && styles.iconWrapGreen,
  ];

  if (item.variant === "stock") {
    return (
      <View style={wrapStyle}>
        <View style={styles.stockInner}>{icon}</View>
      </View>
    );
  }

  return <View style={wrapStyle}>{icon}</View>;
}

export function NotificationCard({ item, unread }: Props) {
  const cardTone =
    item.variant === "appointment"
      ? styles.cardPink
      : item.variant === "injection"
        ? styles.cardBlue
        : item.variant === "stock"
          ? styles.cardGreen
          : styles.cardPlain;

  return (
    <Pressable style={[styles.card, cardTone]}>
      {unread ? <View style={styles.unreadDot} /> : <View style={styles.unreadSpacer} />}
      <CardIcon item={item} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {item.badge ? (
              <View
                style={[
                  styles.badge,
                  item.badge.tone === "green" ? styles.badgeGreen : styles.badgeRed,
                ]}
              >
                <Text style={styles.badgeText}>{item.badge.label}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={notificationsColors.chevron} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 12,
    paddingRight: 8,
    paddingLeft: 8,
  },
  cardPlain: {
    backgroundColor: notificationsColors.white,
    borderWidth: 1,
    borderColor: notificationsColors.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardPink: {
    backgroundColor: notificationsColors.todayPink,
  },
  cardBlue: {
    backgroundColor: notificationsColors.todayBlue,
  },
  cardGreen: {
    backgroundColor: notificationsColors.todayGreen,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: notificationsColors.unreadDot,
    marginRight: 6,
  },
  unreadSpacer: {
    width: 0,
    marginRight: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: notificationsColors.iconPink,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconWrapPink: {
    backgroundColor: "#FFFFFF",
  },
  iconWrapBlue: {
    backgroundColor: "#D6E7F5",
  },
  iconWrapGreen: {
    backgroundColor: "#CDEDD6",
  },
  stockInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
  },
  titleWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: notificationsColors.navy,
    lineHeight: 18,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeRed: {
    backgroundColor: notificationsColors.primary,
  },
  badgeGreen: {
    backgroundColor: notificationsColors.badgeGreen,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  time: {
    fontSize: 10,
    fontWeight: "500",
    color: notificationsColors.time,
    marginTop: 1,
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: notificationsColors.textMuted,
    paddingRight: 8,
  },
  chevron: {
    marginLeft: 2,
  },
});
