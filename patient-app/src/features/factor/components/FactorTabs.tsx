import { useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { factorDateRange, factorTabs } from "@/features/factor/data/mockFactorData";
import { factorColors } from "@/features/factor/theme/factorTheme";

const tabIcons = {
  Overview: "stats-chart",
  "Usage History": "time-outline",
  Reports: "document-text-outline",
  "Stock Details": "cube-outline",
} as const;

export function FactorTabs() {
  const [active, setActive] = useState<(typeof factorTabs)[number]>("Overview");

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {factorTabs.map((tab) => {
          const isActive = tab === active;
          const inner = (
            <>
              <Ionicons name={tabIcons[tab]} size={14} color={isActive ? "#FFFFFF" : "#0F172A"} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
            </>
          );
          if (isActive) {
            return (
              <Pressable key={tab} onPress={() => setActive(tab)}>
                <LinearGradient
                  colors={["#9B0E18", "#C1121F", "#E11D2E"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.tab, styles.tabActive]}
                >
                  {inner}
                </LinearGradient>
              </Pressable>
            );
          }
          return (
            <Pressable key={tab} style={styles.tab} onPress={() => setActive(tab)}>
              {inner}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.dateRow}>
        <View style={styles.dateChip}>
          <MaterialCommunityIcons name="calendar-month-outline" size={14} color={factorColors.primary} />
          <Text style={styles.dateText}>{factorDateRange}</Text>
          <Ionicons name="chevron-down" size={14} color="#0F172A" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
  },
  tabs: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabActive: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  dateRow: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
});
