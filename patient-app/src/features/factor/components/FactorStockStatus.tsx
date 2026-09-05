import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { factorStockCards } from "@/features/factor/data/mockFactorData";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";
import { SectionTitle } from "@/features/factor/components/SectionTitle";

const VIAL_RED = require("../../../../assets/images/factor-vial-red.png");
const VIAL_BLUE = require("../../../../assets/images/factor-vial-blue.png");

export function FactorStockStatus() {
  return (
    <View style={styles.section}>
      <SectionTitle title="Factor Stock Status" action="View Stock Details >" />
      <View style={styles.row}>
        {factorStockCards.map((card) => {
          const isIx = card.id === "ix";
          return (
            <View key={card.id} style={styles.card}>
              <View style={styles.topRow}>
                <View style={[styles.iconWrap, isIx ? styles.iconWrapBlue : styles.iconWrapRed]}>
                  <Image source={isIx ? VIAL_BLUE : VIAL_RED} style={styles.vial} resizeMode="contain" />
                </View>
                <View style={styles.nameCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{card.name}</Text>
                    <View style={styles.badge}>
                      <View style={styles.badgeDot} />
                      <Text style={styles.badgeText}>{card.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.subtitle}>{card.subtitle}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Current Stock</Text>
                  <Text style={styles.statRed}>{card.currentStock}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Total Received</Text>
                  <Text style={styles.statNavy}>{card.totalReceived}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Total Used</Text>
                  <Text style={styles.statNavy}>{card.totalUsed}</Text>
                </View>
              </View>

              <View style={styles.progressBg}>
                <LinearGradient
                  colors={["#8B0E18", "#C1121F"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.progressFill, { width: `${card.percent}%` }]}
                />
              </View>
              <View style={styles.footer}>
                <Text style={styles.footerLeft}>{card.footerLeft}</Text>
                <View style={styles.footerRight}>
                  <Ionicons
                    name={card.footerTone === "ok" ? "checkmark-circle" : "warning"}
                    size={13}
                    color={card.footerTone === "ok" ? factorColors.green : factorColors.primary}
                  />
                  <Text
                    style={[
                      styles.footerRightText,
                      { color: card.footerTone === "ok" ? factorColors.greenText : factorColors.primary },
                    ]}
                  >
                    {card.footerRight}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: factorSpacing.section,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: factorColors.white,
    borderRadius: 14,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapRed: {
    backgroundColor: "#FFE8E8",
  },
  iconWrapBlue: {
    backgroundColor: "#DBEAFE",
  },
  vial: {
    width: 24,
    height: 36,
  },
  nameCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 12,
    fontWeight: "800",
    color: factorColors.navy,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 8.5,
    color: factorColors.textMuted,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: factorColors.greenBg,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: factorColors.green,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: factorColors.greenText,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#E5E7EB",
  },
  statLabel: {
    fontSize: 7.5,
    color: factorColors.textMuted,
    marginBottom: 3,
    textAlign: "center",
  },
  statRed: {
    fontSize: 12,
    fontWeight: "800",
    color: factorColors.primary,
  },
  statNavy: {
    fontSize: 12,
    fontWeight: "800",
    color: factorColors.navy,
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F8E4E4",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  footer: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontSize: 8,
    fontWeight: "600",
    color: factorColors.textMuted,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerRightText: {
    fontSize: 8,
    fontWeight: "700",
  },
});
