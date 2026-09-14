import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { usePatientClinicalStats } from "@/features/home/hooks/usePatientClinicalStats";
import { buildBleedingProfile } from "@/features/home/utils/buildBleedingProfile";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

type Props = NativeStackScreenProps<RootStackParamList, "BleedingHistory">;

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function BleedingHistoryScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const { bleedingEpisodes } = usePatientClinicalStats();
  const profile = buildBleedingProfile(bleedingEpisodes);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}
    >
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Bleeding summary</Text>
        <Text style={styles.summaryMeta}>
          {profile.totalEpisodes} episode(s) this year · Last: {profile.lastBleed} · Severity: {profile.severity}
        </Text>
      </View>

      {profile.episodes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No bleeding episodes yet</Text>
          <Text style={styles.emptyBody}>
            When your care team records a bleeding episode in the admin panel, it will appear here with site, severity,
            and center details.
          </Text>
        </View>
      ) : (
        profile.episodes.map((episode) => (
          <View key={episode.id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardDate}>{formatDate(episode.episodeDate)}</Text>
              {episode.severity ? (
                <View style={styles.severityBadge}>
                  <Text style={styles.severityText}>{episode.severity}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.site}>{episode.site?.trim() || "Site not specified"}</Text>
            {episode.hospitalName ? <Text style={styles.meta}>Center: {episode.hospitalName}</Text> : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: homeColors.screenBg },
  content: { padding: homeSpacing.screen, gap: 10 },
  summary: {
    backgroundColor: homeColors.white,
    borderRadius: homeRadii.card,
    padding: 14,
    borderWidth: 1,
    borderColor: homeColors.border,
  },
  summaryTitle: { fontSize: 16, fontWeight: "800", color: homeColors.navy },
  summaryMeta: { marginTop: 6, fontSize: 12, color: homeColors.textMuted, lineHeight: 18 },
  empty: {
    backgroundColor: homeColors.white,
    borderRadius: homeRadii.card,
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: homeColors.navy },
  emptyBody: { marginTop: 8, fontSize: 12, lineHeight: 18, color: homeColors.textMuted, textAlign: "center" },
  card: {
    backgroundColor: homeColors.white,
    borderRadius: homeRadii.card,
    padding: 14,
    borderWidth: 1,
    borderColor: homeColors.border,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardDate: { fontSize: 14, fontWeight: "800", color: homeColors.navy },
  severityBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  severityText: { fontSize: 11, fontWeight: "700", color: homeColors.primary },
  site: { marginTop: 8, fontSize: 13, fontWeight: "700", color: homeColors.navy },
  meta: { marginTop: 4, fontSize: 11, color: homeColors.textMuted },
});
