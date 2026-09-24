import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { ServiceCategoryGroup } from "@/features/services/types";
import { servicesColors, servicesRadii } from "@/features/services/theme/servicesHubTheme";

type Props = {
  categories: ServiceCategoryGroup[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
};

export function ServicesCategoryFilter({ categories, activeId, onSelect }: Props) {
  if (!categories.length) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Pressable
          style={[styles.chip, activeId === null && styles.chipActive]}
          onPress={() => onSelect(null)}
        >
          <Text style={[styles.chipText, activeId === null && styles.chipTextActive]}>All</Text>
        </Pressable>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={[styles.chip, activeId === category.id && styles.chipActive]}
            onPress={() => onSelect(category.id)}
          >
            <Text style={[styles.chipText, activeId === category.id && styles.chipTextActive]} numberOfLines={1}>
              {category.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 8,
    backgroundColor: servicesColors.white,
  },
  row: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    borderRadius: servicesRadii.search,
    borderWidth: 1,
    borderColor: servicesColors.border,
    backgroundColor: servicesColors.searchBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: 180,
  },
  chipActive: {
    borderColor: servicesColors.primary,
    backgroundColor: "#FEE2E2",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: servicesColors.textMuted,
  },
  chipTextActive: {
    color: servicesColors.primary,
  },
});
