import { useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  type FactorDateRange,
  type FactorTab,
  useFactorFilter,
} from "@/features/factor/context/FactorFilterContext";
import { factorColors } from "@/features/factor/theme/factorTheme";

const factorTabs: FactorTab[] = ["Overview", "Usage History", "Reports", "Stock Details"];

const tabIcons = {
  Overview: "stats-chart",
  "Usage History": "time-outline",
  Reports: "document-text-outline",
  "Stock Details": "cube-outline",
} as const;

const dateOptions: { id: FactorDateRange; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "1y", label: "Last 12 months" },
  { id: "ytd", label: "This year" },
];

export function FactorTabs() {
  const { activeTab, setActiveTab, dateRange, setDateRange, dateLabel } = useFactorFilter();
  const [rangeOpen, setRangeOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {factorTabs.map((tab) => {
          const isActive = tab === activeTab;
          const inner = (
            <>
              <Ionicons name={tabIcons[tab]} size={14} color={isActive ? "#FFFFFF" : "#0F172A"} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
            </>
          );
          if (isActive) {
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)}>
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
            <Pressable key={tab} style={styles.tab} onPress={() => setActiveTab(tab)}>
              {inner}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.dateRow}>
        <Pressable style={styles.dateChip} onPress={() => setRangeOpen(true)}>
          <MaterialCommunityIcons name="calendar-month-outline" size={14} color={factorColors.primary} />
          <Text style={styles.dateText}>{dateLabel}</Text>
          <Ionicons name="chevron-down" size={14} color="#0F172A" />
        </Pressable>
      </View>

      <Modal visible={rangeOpen} transparent animationType="fade" onRequestClose={() => setRangeOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRangeOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Date range</Text>
            {dateOptions.map((option) => {
              const selected = option.id === dateRange;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.rangeRow, selected && styles.rangeRowActive]}
                  onPress={() => {
                    setDateRange(option.id);
                    setRangeOpen(false);
                  }}
                >
                  <Text style={[styles.rangeText, selected && styles.rangeTextActive]}>{option.label}</Text>
                  {selected ? <Ionicons name="checkmark" size={16} color={factorColors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  rangeRowActive: {
    backgroundColor: "#FEF2F2",
  },
  rangeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  rangeTextActive: {
    color: factorColors.primary,
    fontWeight: "800",
  },
});
