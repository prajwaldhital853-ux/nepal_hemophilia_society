import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import { useLocale } from "@/core/i18n";
import type { RootStackParamList } from "@/core/navigation/types";
import {
  MonthHeader,
  TimelineEntry,
  monthKey,
  monthTitle,
  shortDate,
} from "@/features/services/components/RecordTimeline";
import {
  EmptyNote,
  ErrorNote,
  LoadingScreen,
  ScreenIntro,
  StatStrip,
  TabStrip,
  useBottomPadding,
} from "@/features/services/components/ui";
import { servicesColors, servicesRadii, servicesSpacing, servicesType } from "@/features/services/theme/servicesTheme";
import { useClearTopics } from "@/features/notifications/useClearTopics";

type Doc = {
  id?: number;
  name: string;
  url?: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  hospitalName?: string;
  center?: string;
};

type Row = { kind: "month"; key: string; title: string } | { kind: "entry"; key: string; item: Doc; last: boolean };

type Props = StackScreenProps<RootStackParamList, "Documents">;

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function docIcon(type?: string, name?: string) {
  const hint = `${type || ""} ${name || ""}`.toLowerCase();
  if (hint.includes("pdf")) return "document-text-outline" as const;
  if (hint.includes("png") || hint.includes("jpg") || hint.includes("jpeg") || hint.includes("image")) {
    return "image-outline" as const;
  }
  return "document-outline" as const;
}

export default function DocumentsScreen({}: Props) {
  useClearTopics("Documents");
  const { token } = useAuth();
  const { t } = useLocale();
  const bottomPadding = useBottomPadding();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [center, setCenter] = useState("All");
  const [allCenters, setAllCenters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(
    async (cursor?: string) => {
      if (!token) return;
      const q = new URLSearchParams();
      if (search.trim()) q.set("search", search.trim());
      if (center !== "All") q.set("center", center);
      q.set("limit", "25");
      if (cursor) q.set("cursor", cursor);
      if (cursor) setLoadingMore(true);
      else setLoading(true);
      try {
        const data = await patientApi(`/me/patient/documents/?${q.toString()}`, { token });
        const rows = (data.documents ?? []) as Doc[];
        setDocs((current) => (cursor ? [...current, ...rows] : rows));
        setNextCursor(data.nextCursor ?? null);
        if (!cursor && typeof data.total === "number") setTotal(data.total);
        if (!center || center === "All") {
          const names = rows.map((d) => d.hospitalName || d.center).filter(Boolean) as string[];
          if (names.length) {
            setAllCenters((current) => [...new Set([...current, ...names])].sort());
          }
        }
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("documents.loadError"));
        if (!cursor) {
          setDocs([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, search, center, t],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const centerOptions = useMemo(() => ["All", ...allCenters], [allCenters]);
  const centerCount = allCenters.length;
  const latest = docs[0]?.uploadedAt;

  const rows = useMemo(() => {
    const out: Row[] = [];
    let current = "";
    docs.forEach((item, i) => {
      const key = monthKey(item.uploadedAt);
      if (key !== current) {
        current = key;
        out.push({ kind: "month", key: `m-${key}`, title: monthTitle(item.uploadedAt) });
      }
      const next = docs[i + 1];
      out.push({ kind: "entry", key: String(item.id ?? item.url ?? item.name), item, last: !next || monthKey(next.uploadedAt) !== key });
    });
    return out;
  }, [docs]);

  const openDoc = (doc: Doc) => {
    if (doc.url) void Linking.openURL(doc.url);
  };

  if (loading && docs.length === 0 && !error) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading && docs.length > 0} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
        onEndReached={() => {
          if (nextCursor && !loadingMore) void load(nextCursor);
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View>
            <ScreenIntro eyebrow={t("documents.eyebrow")} title={t("documents.title")} lead={t("documents.lead")} />
            {error ? <ErrorNote message={error} onRetry={() => void load()} /> : null}
            <StatStrip
              items={[
                { label: t("documents.total"), value: String(total || docs.length) },
                { label: t("documents.centers"), value: centerCount ? String(centerCount) : "—" },
                { label: t("documents.latest"), value: latest ? shortDate(latest).replace(/ \d{4}$/, "") : "—" },
              ]}
            />
            <View style={styles.search}>
              <Ionicons name="search" size={16} color={servicesColors.textMuted} />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder={t("documents.searchPlaceholder")}
                placeholderTextColor={servicesColors.textMuted}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {searchInput ? (
                <Pressable onPress={() => setSearchInput("")} hitSlop={8} accessibilityLabel={t("common.close")}>
                  <Ionicons name="close-circle" size={16} color={servicesColors.borderStrong} />
                </Pressable>
              ) : null}
            </View>
            {centerOptions.length > 2 ? (
              <TabStrip
                options={centerOptions}
                value={center}
                onChange={setCenter}
                labelFor={(option) => (option === "All" ? t("common.all") : option)}
                style={styles.tabs}
              />
            ) : null}
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={servicesColors.primary} style={styles.more} /> : null}
        ListEmptyComponent={
          loading ? null : (
            <EmptyNote
              title={t("documents.emptyTitle")}
              body={searchInput || center !== "All" ? t("documents.emptyFiltered") : t("documents.empty")}
            />
          )
        }
        renderItem={({ item: row }) => {
          if (row.kind === "month") return <MonthHeader title={row.title} />;
          const doc = row.item;
          const place = doc.hospitalName || doc.center || t("documents.unknownCenter");
          const size = formatSize(doc.size);
          const icon = docIcon(doc.type, doc.name);
          return (
            <TimelineEntry date={doc.uploadedAt} last={row.last}>
              <Pressable
                onPress={() => openDoc(doc)}
                disabled={!doc.url}
                style={({ pressed }) => [styles.entryPress, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityHint={t("documents.openHint")}
              >
                <View style={styles.entryHead}>
                  <View style={styles.iconWrap}>
                    <Ionicons name={icon} size={18} color={servicesColors.primary} />
                  </View>
                  <Text style={styles.entryTitle} numberOfLines={2}>{doc.name}</Text>
                  {doc.url ? <Ionicons name="open-outline" size={18} color={servicesColors.textMuted} /> : null}
                </View>
                <Text style={styles.entryMeta}>
                  {[place, size].filter(Boolean).join("  ·  ")}
                </Text>
                {doc.uploadedBy ? (
                  <Text style={styles.entryMeta}>
                    {t("documents.uploadedBy")}: {doc.uploadedBy}
                  </Text>
                ) : null}
              </Pressable>
            </TimelineEntry>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { paddingHorizontal: servicesSpacing.screen },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 42,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: servicesRadii.search,
    backgroundColor: servicesColors.searchBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: servicesColors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: servicesColors.text, padding: 0 },
  tabs: { marginTop: 8, marginBottom: 4 },
  more: { marginVertical: 16 },
  entryPress: { paddingBottom: 2 },
  pressed: { opacity: 0.72 },
  entryHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: servicesColors.primaryTint,
  },
  entryTitle: { ...servicesType.label, flex: 1, fontSize: 15, lineHeight: 20 },
  entryMeta: { ...servicesType.meta, marginTop: 4, marginLeft: 44 },
});
