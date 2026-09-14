import type { ReactNode } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { usePatientClinicalStats } from "@/features/home/hooks/usePatientClinicalStats";
import { usePatientNotifications } from "@/features/notifications/hooks/usePatientNotifications";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function OverviewSection() {
  const { totalInjections, lastInjection, nextScheduledInjection, bleedingCount } = usePatientClinicalStats();
  const { unreadCount } = usePatientNotifications();
  const lastDate = formatDate(lastInjection?.administeredAt);
  const lastDose = lastInjection ? `${lastInjection.dose} ${lastInjection.unit}` : "—";
  const nextDate = nextScheduledInjection ? formatDate(nextScheduledInjection.administeredAt) : "—";
  const nextSub = nextScheduledInjection ? "Scheduled" : "Not scheduled";

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>My Overview</Text>
        <View style={styles.recordsBadge}>
          <Text style={styles.recordsText}>
            Total Records <Text style={styles.recordsCount}>{totalInjections}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <OverviewCard
          icon={<MaterialCommunityIcons name="needle" size={20} color={homeColors.primary} />}
          iconBg="#FEE2E2"
          label="Last Injection"
          value={lastDate}
          valueColor={homeColors.primary}
          badge={lastInjection ? lastDose : undefined}
          badgeBg="#FEE2E2"
          badgeColor={homeColors.primary}
        />
        <OverviewCard
          icon={<Ionicons name="calendar" size={20} color={homeColors.green} />}
          iconBg={homeColors.greenBg}
          label="Next Injection"
          value={nextDate}
          valueColor={nextScheduledInjection ? homeColors.green : homeColors.textMuted}
          subValue={nextSub}
          subColor={nextScheduledInjection ? homeColors.green : homeColors.textMuted}
        />
        <OverviewCard
          icon={<MaterialCommunityIcons name="shield-half-full" size={20} color={homeColors.purple} />}
          iconBg={homeColors.purpleBg}
          label="Bleeding Episodes"
          value={bleedingCount > 0 ? String(bleedingCount) : "—"}
          valueColor={homeColors.purple}
          subValue={bleedingCount > 0 ? "Recorded" : "No data yet"}
          subColor={homeColors.purple}
        />
        <OverviewCard
          icon={<Ionicons name="notifications" size={20} color={homeColors.orange} />}
          iconBg={homeColors.orangeBg}
          label="Alerts"
          value={String(unreadCount)}
          valueColor={homeColors.orange}
          subValue={unreadCount > 0 ? "Unread" : "None"}
          subColor={homeColors.orange}
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
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: homeSpacing.section },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: homeSpacing.screen,
  },
  title: { fontSize: 15, fontWeight: "700", color: homeColors.navy },
  recordsBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: homeRadii.pill,
  },
  recordsText: { fontSize: 9, fontWeight: "600", color: homeColors.textMuted },
  recordsCount: { color: homeColors.primary, fontWeight: "700" },
  row: { flexDirection: "row", paddingHorizontal: homeSpacing.screen, gap: 6 },
  card: {
    flex: 1,
    alignItems: "center",
    backgroundColor: homeColors.cardBg,
    borderRadius: homeRadii.card,
    paddingVertical: 10,
    paddingHorizontal: 4,
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
  pill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  pillText: { fontSize: 8.5, fontWeight: "700", textAlign: "center" },
});
