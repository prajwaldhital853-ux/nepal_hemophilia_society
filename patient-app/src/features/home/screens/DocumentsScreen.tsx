import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { homeColors } from "@/features/home/theme/homeTheme";

type Doc = {
  id?: number;
  name: string;
  url?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  hospitalName?: string;
  center?: string;
};

type Props = NativeStackScreenProps<RootStackParamList, "Documents">;

export default function DocumentsScreen({}: Props) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [center, setCenter] = useState("");
  const [from, setFrom] = useState("");
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (cursor?: string) => {
    if (!token) return;
    const q = new URLSearchParams();
    if (search.trim()) q.set("search", search.trim());
    if (center.trim()) q.set("center", center.trim());
    if (from.trim()) q.set("from", from.trim());
    q.set("limit", "25");
    if (cursor) q.set("cursor", cursor);
    try {
      if (cursor) setLoadingMore(true);
      const data = await patientApi(`/me/patient/documents/?${q.toString()}`, { token });
      const rows = data.documents ?? [];
      setDocs((current) => (cursor ? [...current, ...rows] : rows));
      setNextCursor(data.nextCursor ?? null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load documents");
    } finally {
      setLoadingMore(false);
    }
  }, [token, search, center, from]);

  useEffect(() => {
    void load();
  }, [load]);

  const centers = Array.from(new Set(docs.map((d) => d.hospitalName || d.center).filter(Boolean))) as string[];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>My documents</Text>
      <TextInput style={styles.input} placeholder="Search by name" value={search} onChangeText={setSearch} />
      <TextInput
        style={styles.input}
        placeholder="Filter by center name"
        value={center}
        onChangeText={setCenter}
      />
      <TextInput style={styles.input} placeholder="From date YYYY-MM-DD" value={from} onChangeText={setFrom} />
      {centers.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable onPress={() => setCenter("")} style={[styles.chip, !center && styles.chipOn]}>
            <Text style={styles.chipText}>All centers</Text>
          </Pressable>
          {centers.map((name) => (
            <Pressable key={name} onPress={() => setCenter(name)} style={[styles.chip, center === name && styles.chipOn]}>
              <Text style={styles.chipText}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView contentContainerStyle={styles.list}>
        {docs.length === 0 ? (
          <Text style={styles.empty}>No documents match these filters.</Text>
        ) : (
          docs.map((doc) => (
            <Pressable
              key={doc.id || doc.url || doc.name}
              style={styles.card}
              onPress={() => {
                if (doc.url) void Linking.openURL(doc.url);
              }}
            >
              <Text style={styles.name}>{doc.name}</Text>
              <Text style={styles.meta}>{doc.hospitalName || doc.center || "Center not recorded"}</Text>
              <Text style={styles.meta}>
                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : ""}
                {doc.uploadedBy ? ` · ${doc.uploadedBy}` : ""}
              </Text>
            </Pressable>
          ))
        )}
        {nextCursor ? (
          <Pressable
            style={styles.card}
            onPress={() => void load(nextCursor)}
            disabled={loadingMore}
          >
            <Text style={styles.name}>{loadingMore ? "Loading…" : "Load more documents"}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: homeColors.screenBg, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: "800", color: "#1E3A5F", marginBottom: 12, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  chips: { gap: 8, paddingBottom: 8 },
  chip: { backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#E5E7EB" },
  chipOn: { borderColor: "#C1121F" },
  chipText: { fontSize: 11, color: "#1E3A5F" },
  list: { paddingBottom: 32 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8 },
  name: { color: "#C1121F", fontWeight: "700", fontSize: 13 },
  meta: { color: "#6B7280", fontSize: 11, marginTop: 4 },
  empty: { color: "#6B7280", fontSize: 13, marginTop: 16 },
  error: { color: "#C1121F", fontSize: 12, marginBottom: 8 },
});
