import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";

import { useAuth } from "@/core/auth/AuthContext";
import { fetchTreatmentCenters } from "@/features/services/api";
import { servicesColors } from "@/features/services/theme/servicesTheme";

type Center = { id: number; name: string; province: string; district: string };

export default function CentersScreen() {
  const { token, patient } = useAuth();
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

  const provinces = useMemo(() => ["All", ...Array.from(new Set(items.map((row) => row.province).filter(Boolean)))], [items]);
  const visible = useMemo(
    () => (province === "All" ? items : items.filter((row) => row.province === province)),
    [items, province],
  );
  const mine = patient?.primaryHospital;

  return (
    <View style={styles.container}>
      <Text style={styles.hero}>Find a treatment centre</Text>
      <Text style={styles.lead}>
        {visible.length} centre{visible.length === 1 ? "" : "s"}
        {province !== "All" ? ` in ${province}` : " across Nepal"}. Your registered centre is highlighted.
      </Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search centre name…"
        placeholderTextColor={servicesColors.textMuted}
        style={styles.search}
      />
      <View style={styles.filters}>
        {provinces.map((name) => (
          <Pressable key={name} onPress={() => setProvince(name)} style={[styles.chip, province === name && styles.chipOn]}>
            <Text style={[styles.chipText, province === name && styles.chipTextOn]}>{name}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && items.length === 0 ? (
        <ActivityIndicator color={servicesColors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>No treatment centres listed yet.</Text>}
          renderItem={({ item }) => {
            const isMine = mine && item.name === mine;
            return (
              <View style={[styles.card, isMine && styles.cardMine]}>
                {isMine ? <Text style={styles.mine}>Your primary centre</Text> : null}
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{[item.district, item.province].filter(Boolean).join(", ")}</Text>
                <Pressable
                  onPress={() =>
                    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} ${item.district} Nepal`)}`)
                  }
                >
                  <Text style={styles.map}>Open in maps</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: servicesColors.pageBg, padding: 14 },
  hero: { fontSize: 20, fontWeight: "800", color: servicesColors.navy },
  lead: { marginTop: 4, marginBottom: 10, fontSize: 13, color: servicesColors.textMuted, lineHeight: 18 },
  search: {
    borderWidth: 1,
    borderColor: servicesColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: servicesColors.text,
    backgroundColor: "#fff",
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: servicesColors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#fff" },
  chipOn: { backgroundColor: servicesColors.primary, borderColor: servicesColors.primary },
  chipText: { fontSize: 11, fontWeight: "700", color: servicesColors.navy },
  chipTextOn: { color: "#fff" },
  error: { color: servicesColors.primary, marginBottom: 8 },
  empty: { textAlign: "center", color: servicesColors.textMuted, marginTop: 32 },
  card: {
    borderWidth: 1,
    borderColor: servicesColors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  cardMine: { borderColor: servicesColors.primary, backgroundColor: "#FFF5F5" },
  mine: { fontSize: 10, fontWeight: "800", color: servicesColors.primary, textTransform: "uppercase", marginBottom: 4 },
  name: { fontSize: 15, fontWeight: "800", color: servicesColors.navy },
  meta: { marginTop: 4, fontSize: 12, color: servicesColors.textMuted },
  map: { marginTop: 8, fontSize: 12, fontWeight: "800", color: servicesColors.primary },
});
