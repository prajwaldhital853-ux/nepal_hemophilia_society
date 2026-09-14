import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { usePatientNotifications } from "@/features/notifications/hooks/usePatientNotifications";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function HomeCareActivitySection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { notifications, loading } = usePatientNotifications();

  const recent = notifications.slice(0, 5);

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.title}>Care team activity</Text>
        <Pressable onPress={() => navigation.navigate("Notifications")}>
          <Text style={styles.link}>View all</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        {loading ? (
          <Text style={styles.empty}>Loading activity…</Text>
        ) : recent.length === 0 ? (
          <Text style={styles.empty}>
            Recent actions from your treatment center — profile updates, injections, stock changes, and bleeding
            records — will appear here.
          </Text>
        ) : (
          recent.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.dot} />
              <View style={styles.body}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowMessage} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.rowMeta}>{formatWhen(item.createdAt)} · {item.category}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: homeSpacing.section, paddingHorizontal: homeSpacing.screen },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  title: { fontSize: 15, fontWeight: "700", color: homeColors.navy },
  link: { fontSize: 12, fontWeight: "700", color: homeColors.primary },
  card: {
    backgroundColor: homeColors.white,
    borderRadius: homeRadii.card,
    borderWidth: 1,
    borderColor: homeColors.border,
    padding: 12,
    gap: 10,
  },
  empty: { fontSize: 12, lineHeight: 18, color: homeColors.textMuted },
  row: { flexDirection: "row", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: homeColors.primary, marginTop: 5 },
  body: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 12, fontWeight: "800", color: homeColors.navy },
  rowMessage: { marginTop: 2, fontSize: 11, color: homeColors.textMuted, lineHeight: 16 },
  rowMeta: { marginTop: 4, fontSize: 9, fontWeight: "600", color: "#9CA3AF" },
});
