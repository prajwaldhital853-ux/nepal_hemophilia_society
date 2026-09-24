import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { useLocale } from "@/core/i18n";
import { servicesColors, servicesRadii } from "@/features/services/theme/servicesHubTheme";

type Props = {
  value?: string;
  onChangeText?: (value: string) => void;
  filterActive?: boolean;
  onFilterPress?: () => void;
};

export function ServicesSearchBar({ value, onChangeText, filterActive = false, onFilterPress }: Props) {
  const { t } = useLocale();
  return (
    <View style={styles.wrap}>
      <Ionicons name="search-outline" size={18} color={servicesColors.textMuted} />
      <TextInput
        placeholder={t("services.searchPlaceholder")}
        placeholderTextColor={servicesColors.textMuted}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
      <Pressable
        onPress={() => onFilterPress?.()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Filter services by category"
        style={[styles.filterBtn, filterActive && styles.filterBtnActive]}
      >
        <Ionicons name="options-outline" size={20} color={servicesColors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: servicesColors.searchBg,
    borderRadius: servicesRadii.search,
    borderWidth: 1,
    borderColor: servicesColors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: servicesColors.text,
    padding: 0,
  },
  filterBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  filterBtnActive: {
    backgroundColor: "#FEE2E2",
  },
});
