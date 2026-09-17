import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuth } from "@/core/auth/AuthContext";
import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { colors, spacing } from "@/core/theme";
import { fetchCmsArticle } from "@/features/services/api";
import type { CmsArticle } from "@/features/services/types";

type Props = NativeStackScreenProps<RootStackParamList, "ServiceContentDetail">;

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
        <ActivityIndicator color={colors.primary} />
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
      <Text style={styles.title}>{article.title}</Text>
      {article.summary ? <Text style={styles.summary}>{article.summary}</Text> : null}
      {article.location || article.startsAt ? (
        <Text style={styles.meta}>
          {[article.startsAt ? new Date(article.startsAt).toLocaleString() : "", article.location].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
      {article.body ? <Text style={styles.body}>{article.body}</Text> : null}
      {article.fileUrl ? (
        <Pressable onPress={() => void Linking.openURL(article.fileUrl!)}>
          <Text style={styles.link}>Open download</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  image: { width: "100%", height: 180, borderRadius: 12, marginBottom: 16, backgroundColor: "#F3F4F6" },
  title: { fontSize: 22, fontWeight: "800", color: colors.navy },
  summary: { marginTop: 8, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  meta: { marginTop: 8, fontSize: 13, fontWeight: "600", color: colors.primary },
  body: { marginTop: 16, fontSize: 15, color: colors.text, lineHeight: 22 },
  link: { marginTop: 16, fontSize: 14, fontWeight: "700", color: colors.primary },
  error: { color: colors.primary, textAlign: "center" },
});
