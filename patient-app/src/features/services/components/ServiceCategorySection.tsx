import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import type { ServiceCategory } from "@/features/services/data/mockServicesData";
import { ServiceCard } from "@/features/services/components/ServiceCard";
import { servicesColors, servicesSpacing } from "@/features/services/theme/servicesTheme";

type ServiceCategorySectionProps = {
  category: ServiceCategory;
};

const GRID_GAP = 5;

export function ServiceCategorySection({ category }: ServiceCategorySectionProps) {
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
        <Pressable hitSlop={8}>
          <Text style={styles.viewAll}>View All &gt;</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {category.services.map((item) => (
          <ServiceCard key={item.id} item={item} width={cardWidth} />
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
