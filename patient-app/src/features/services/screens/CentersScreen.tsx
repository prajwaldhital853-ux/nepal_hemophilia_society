import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "@/core/auth/AuthContext";
import { fetchTreatmentCenters } from "@/features/services/api";
import { EmptyNote, ErrorNote, ScreenIntro, TabStrip, useBottomPadding } from "@/features/services/components/ui";
import { servicesColors, servicesRadii, servicesSpacing, servicesType } from "@/features/services/theme/servicesTheme";

type Center = { id: number; name: string; province: string; district: string };

function openDirections(center: Center) {
  const query = encodeURIComponent(`${center.name} ${center.district} Nepal`);
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
}

export default function CentersScreen() {
  const { token, patient } = useAuth();
  const bottomPadding = useBottomPadding();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [province, setProvince] = useState("All");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setItems(await fetchTreatmentCenters(token, search));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load centres");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, token]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const mine = patient?.primaryHospital;
  const provinces = useMemo(() => ["All", ...Array.from(new Set(items.map((row) => row.province).filter(Boolean)))], [items]);
  const visible = useMemo(() => {
    const rows = province === "All" ? items : items.filter((row) => row.province === province);
    return [...rows].sort((a, b) => Number(b.name === mine) - Number(a.name === mine));
  }, [items, province, mine]);

  return (
    <View style={styles.container}>
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading && items.length > 0} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View>
            <ScreenIntro
              eyebrow="Treatment centres"
              title="Find care near you"
              lead={`${visible.length} centre${visible.length === 1 ? "" : "s"}${province !== "All" ? ` in ${province}` : " across Nepal"} with hemophilia services.`}
            />
            <View style={styles.search}>
              <Ionicons name="search" size={16} color={servicesColors.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by centre name"
                placeholderTextColor={servicesColors.textMuted}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {search ? (
                <Pressable onPress={() => setSearch("")} hitSlop={8} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={16} color={servicesColors.borderStrong} />
                </Pressable>
              ) : null}
            </View>
            {provinces.length > 2 ? <TabStrip options={provinces} value={province} onChange={setProvince} style={styles.tabs} /> : null}
            {error ? <ErrorNote message={error} onRetry={() => void load()} /> : null}
            {loading && items.length === 0 ? <ActivityIndicator color={servicesColors.primary} style={styles.spinner} /> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : <EmptyNote title="No centres found" body={search ? "Try a different name or clear the search." : undefined} />
        }
        renderItem={({ item }) => {
          const isMine = Boolean(mine) && item.name === mine;
          return (
            <Pressable
              onPress={() => openDirections(item)}
              style={({ pressed }) => [styles.row, isMine && styles.rowMine, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityHint="Opens directions in maps"
            >
              <View style={styles.rowText}>
                {isMine ? <Text style={styles.mineLabel}>Your registered centre</Text> : null}
                <Text style={styles.name}>{item.name}</Text>
                <Text style={servicesType.meta}>{[item.district, item.province].filter(Boolean).join(", ") || "Location not listed"}</Text>
              </View>
              <View style={styles.directions}>
                <Ionicons name="navigate-outline" size={16} color={servicesColors.primary} />
                <Text style={styles.directionsText}>Directions</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { paddingHorizontal: servicesSpacing.screen, paddingBottom: 48 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: servicesRadii.search,
    backgroundColor: servicesColors.searchBg,
  },
  searchInput: { flex: 1, fontSize: 14, color: servicesColors.text, padding: 0 },
  tabs: { marginTop: 8, marginBottom: 4 },
  spinner: { marginTop: 32 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: servicesColors.border },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16 },
  rowMine: {
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: servicesRadii.card,
    backgroundColor: servicesColors.white,
    borderLeftWidth: 3,
    borderLeftColor: servicesColors.primary,
  },
  pressed: { opacity: 0.7 },
  rowText: { flex: 1, gap: 3 },
  mineLabel: { ...servicesType.eyebrow, fontSize: 10.5, color: servicesColors.primary, marginBottom: 2 },
  name: { ...servicesType.label, fontSize: 15.5 },
  directions: { alignItems: "center", gap: 3 },
  directionsText: { fontSize: 11, fontWeight: "600", color: servicesColors.primary },
});
