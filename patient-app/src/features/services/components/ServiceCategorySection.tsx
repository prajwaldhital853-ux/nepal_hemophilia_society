import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { ServiceCard } from "@/features/services/components/ServiceCard";
import { servicesColors, servicesSpacing } from "@/features/services/theme/servicesTheme";
import { toCardItem, type AppService, type ServiceCategoryGroup } from "@/features/services/types";

type ServiceCategorySectionProps = {
  category: ServiceCategoryGroup;
  onPressService?: (service: AppService) => void;
  onViewAll?: (category: ServiceCategoryGroup) => void;
};

const GRID_GAP = 5;

export function ServiceCategorySection({ category, onPressService, onViewAll }: ServiceCategorySectionProps) {
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - servicesSpacing.screen * 2;
  const cardWidth = (contentWidth - GRID_GAP * 3) / 4;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.redBar} />
          <Text style={styles.title}>{category.title}</Text>
        </View>
        <Pressable hitSlop={8} onPress={() => onViewAll?.(category)}>
          <Text style={styles.viewAll}>View All &gt;</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {category.services.map((item) => (
          <ServiceCard
            key={item.slug}
            item={toCardItem(item)}
            width={cardWidth}
            onPress={() => onPressService?.(item)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: servicesSpacing.section,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  redBar: {
    width: 4,
    height: 20,
    borderRadius: 4,
    backgroundColor: servicesColors.primary,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#0A1628",
    lineHeight: 20,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: "600",
    color: servicesColors.primary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: GRID_GAP,
    rowGap: 8,
  },
});
