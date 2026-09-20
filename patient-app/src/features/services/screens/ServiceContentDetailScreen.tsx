import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";

import { useAuth } from "@/core/auth/AuthContext";
import type { RootStackParamList } from "@/core/navigation/types";
import { fetchCmsArticle } from "@/features/services/api";
import type { CmsArticle } from "@/features/services/types";
import { servicesColors } from "@/features/services/theme/servicesTheme";

type Props = StackScreenProps<RootStackParamList, "ServiceContentDetail">;

export default function ServiceContentDetailScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const { kind, slug, title } = route.params;
  const [article, setArticle] = useState<CmsArticle | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: title || "Details" });
  }, [navigation, title]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const row = await fetchCmsArticle(token, kind, slug);
      setArticle(row);
      navigation.setOptions({ title: row.title });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load details");
    } finally {
      setLoading(false);
    }
  }, [kind, navigation, slug, token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={servicesColors.primary} />
      </View>
    );
  }
  if (!article) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Not found."}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {article.imageUrl ? <Image source={{ uri: article.imageUrl }} style={styles.image} /> : null}
      <View style={styles.hero}>
        <Text style={styles.kind}>{article.kind}</Text>
        <Text style={styles.title}>{article.title}</Text>
        {article.summary ? <Text style={styles.summary}>{article.summary}</Text> : null}
        {article.location || article.startsAt ? (
          <Text style={styles.meta}>
            {[article.startsAt ? new Date(article.startsAt).toLocaleString() : "", article.location].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </View>
      {article.body ? (
        <View style={styles.card}>
          <Text style={styles.body}>{article.body}</Text>
        </View>
      ) : null}
      {article.fileUrl ? (
        <Pressable style={styles.download} onPress={() => void Linking.openURL(article.fileUrl!)}>
          <Text style={styles.downloadText}>Open download</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, backgroundColor: servicesColors.pageBg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  image: { width: "100%", height: 180, borderRadius: 16, marginBottom: 14, backgroundColor: "#F3F4F6" },
  hero: { backgroundColor: servicesColors.navy, borderRadius: 18, padding: 16, marginBottom: 12 },
  kind: { color: "#FCA5A5", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  title: { marginTop: 6, fontSize: 22, fontWeight: "800", color: "#fff" },
  summary: { marginTop: 8, fontSize: 14, color: "#E5E7EB", lineHeight: 20 },
  meta: { marginTop: 8, fontSize: 13, fontWeight: "600", color: "#FECACA" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: servicesColors.border },
  body: { fontSize: 15, color: servicesColors.text, lineHeight: 22 },
  download: { marginTop: 14, backgroundColor: servicesColors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  downloadText: { color: "#fff", fontWeight: "800" },
  error: { color: servicesColors.primary, textAlign: "center" },
});
