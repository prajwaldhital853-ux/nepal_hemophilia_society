import type { ReactNode } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { mockOverview } from "@/features/home/data/mockPatientData";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

export function OverviewSection() {
  const d = mockOverview;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>My Overview</Text>
        <View style={styles.recordsBadge}>
          <Text style={styles.recordsText}>
            Total Records <Text style={styles.recordsCount}>{d.totalRecords}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <OverviewCard
          icon={<MaterialCommunityIcons name="needle" size={20} color={homeColors.primary} />}
          iconBg="#FEE2E2"
          label="Last Injection"
          value={d.lastInjection.date}
          valueColor={homeColors.primary}
          badge={d.lastInjection.dose}
          badgeBg="#FEE2E2"
          badgeColor={homeColors.primary}
        />
        <OverviewCard
          icon={<Ionicons name="calendar" size={20} color={homeColors.green} />}
          iconBg={homeColors.greenBg}
          label="Next Injection"
          value={d.nextInjection.date}
          valueColor={homeColors.green}
          subValue={d.nextInjection.inDays}
          subColor={homeColors.green}
        />
        <OverviewCard
          icon={<MaterialCommunityIcons name="shield-half-full" size={20} color={homeColors.purple} />}
          iconBg={homeColors.purpleBg}
          label="Bleeding Episodes"
          value={String(d.bleedingEpisodes.count)}
          valueColor={homeColors.purple}
          subValue={d.bleedingEpisodes.label}
          subColor={homeColors.purple}
        />
        <OverviewCard
          icon={<Ionicons name="notifications" size={20} color={homeColors.orange} />}
          iconBg={homeColors.orangeBg}
          label="Alerts"
          value={String(d.alerts.count)}
          valueColor={homeColors.orange}
          link="View All"
          linkBg={homeColors.orangeBg}
          linkColor={homeColors.orange}
        />
      </View>
    </View>
  );
}

function OverviewCard({
  icon,
  iconBg,
  label,
  value,
  valueColor,
  subValue,
  subColor,
  badge,
  badgeBg,
  badgeColor,
  link,
  linkBg,
  linkColor,
}: {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueColor?: string;
  subValue?: string;
  subColor?: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  link?: string;
  linkBg?: string;
  linkColor?: string;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.cardLabel} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.cardValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
        {value}
      </Text>
      {badge ? (
        <View style={[styles.pill, { backgroundColor: badgeBg ?? badgeColor }]}>
          <Text style={[styles.pillText, { color: badgeColor }]}>{badge}</Text>
        </View>
      ) : null}
      {subValue ? (
        <Text style={[styles.subValue, subColor ? { color: subColor } : null]} numberOfLines={1}>
          {subValue}
        </Text>
      ) : null}
      {link ? (
        <Pressable style={[styles.pill, { backgroundColor: linkBg ?? homeColors.orangeBg }]}>
          <Text style={[styles.pillText, { color: linkColor ?? homeColors.orange }]}>{link}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: homeSpacing.section,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: homeSpacing.screen,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: homeColors.navy,
  },
  recordsBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: homeRadii.pill,
  },
  recordsText: {
    fontSize: 9,
    fontWeight: "600",
    color: homeColors.textMuted,
  },
  recordsCount: {
    color: homeColors.primary,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: homeSpacing.screen,
    gap: 6,
  },
  card: {
    flex: 1,
    alignItems: "center",
    backgroundColor: homeColors.cardBg,
    borderRadius: homeRadii.card,
    paddingVertical: 10,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: homeColors.navy,
    marginTop: 6,
    textAlign: "center",
  },
  cardValue: {
    fontSize: 11,
    fontWeight: "800",
    color: homeColors.navy,
    marginTop: 3,
    textAlign: "center",
  },
  subValue: {
    fontSize: 8.5,
    fontWeight: "600",
    color: homeColors.textMuted,
    marginTop: 3,
    textAlign: "center",
  },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  pillText: {
    fontSize: 8.5,
    fontWeight: "700",
    textAlign: "center",
  },
});
