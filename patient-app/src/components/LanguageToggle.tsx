import { Pressable, StyleSheet, Text, View } from "react-native";

import { useLocale } from "@/core/i18n";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <View style={styles.wrap}>
      <Pressable
        style={[styles.chip, locale === "en" && styles.chipActive]}
        onPress={() => void setLocale("en")}
      >
        <Text style={[styles.text, locale === "en" && styles.textActive]}>EN</Text>
      </Pressable>
      <Pressable
        style={[styles.chip, locale === "ne" && styles.chipActive]}
        onPress={() => void setLocale("ne")}
      >
        <Text style={[styles.text, locale === "ne" && styles.textActive]}>ने</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 4,
    marginRight: 4,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#FFFFFF",
  },
  chipActive: {
    backgroundColor: "#DC2626",
    borderColor: "#DC2626",
  },
  text: {
    fontSize: 10,
    fontWeight: "800",
    color: "#374151",
  },
  textActive: {
    color: "#FFFFFF",
  },
});
