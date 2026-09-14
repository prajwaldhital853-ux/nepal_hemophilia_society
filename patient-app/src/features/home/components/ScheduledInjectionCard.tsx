import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { usePatientClinicalStats } from "@/features/home/hooks/usePatientClinicalStats";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduledInjectionCard() {
  const { nextScheduledInjection } = usePatientClinicalStats();

  if (!nextScheduledInjection) return null;

  const dose = `${nextScheduledInjection.dose} ${nextScheduledInjection.unit}`;
  const doctor = nextScheduledInjection.doctorName || "—";

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="calendar" size={22} color={homeColors.green} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>Upcoming Scheduled Injection</Text>
          <Text style={styles.when}>{formatDateTime(nextScheduledInjection.administeredAt)}</Text>
          <Text style={styles.meta}>
            {nextScheduledInjection.factorType} · {dose} · {nextScheduledInjection.indication ?? "Prophylaxis"}
          </Text>
          <Text style={styles.meta}>Doctor: {doctor}</Text>
          <Text style={styles.center}>{nextScheduledInjection.hospitalName ?? ""}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Scheduled</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: homeSpacing.section, paddingHorizontal: homeSpacing.screen },
  card: {
    flexDirection: "row",
    backgroundColor: homeColors.white,
    borderRadius: homeRadii.card,
    borderWidth: 1,
    borderColor: homeColors.green,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: homeColors.greenBg,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 13, fontWeight: "800", color: homeColors.navy },
  when: { marginTop: 4, fontSize: 14, fontWeight: "700", color: homeColors.green },
  meta: { marginTop: 4, fontSize: 11, color: homeColors.textMuted },
  center: { marginTop: 2, fontSize: 10, fontWeight: "600", color: homeColors.navy },
  badge: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: homeColors.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: homeRadii.pill,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: homeColors.green },
});
