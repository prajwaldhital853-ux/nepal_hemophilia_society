import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { mockFactorStock } from "@/features/home/data/mockPatientData";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

const FACTOR_VIAL_ICON = require("../../../../assets/images/factor-vial-icon.png");

export function FactorStockCard() {
  const d = mockFactorStock;

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.iconCol}>
          <View style={styles.bottleWrap}>
            <Image source={FACTOR_VIAL_ICON} style={styles.factorIcon} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.midCol}>
          <Text style={styles.sectionTitle}>Factor Stock & Patient Usage</Text>
          <View style={styles.factorRow}>
            <Text style={styles.factorName}>{d.factorName}</Text>
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>{d.status}</Text>
            </View>
          </View>
          <Text style={styles.stockLabel}>
            Stock: <Text style={styles.stockValue}>{d.stockIu}</Text>
          </Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${d.stockPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{d.stockPercent}% Available Stock</Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.usedLabel}>Patient Used</Text>
          <Text style={styles.usedValue}>{d.patientUsed}</Text>
          <Text style={styles.usedSub}>Total IU</Text>
          <Pressable style={styles.detailsBtn}>
            <Text style={styles.detailsText}>Details &gt;</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: homeSpacing.section,
    paddingHorizontal: homeSpacing.screen,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: homeColors.cardBg,
    borderRadius: homeRadii.card,
    borderWidth: 1,
    borderColor: homeColors.border,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCol: {
    marginRight: 12,
  },
  bottleWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  factorIcon: {
    width: 38,
    height: 38,
  },
  midCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: homeColors.navy,
    marginBottom: 5,
  },
  factorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 5,
  },
  factorName: {
    fontSize: 13,
    fontWeight: "700",
    color: homeColors.navy,
  },
  availableBadge: {
    backgroundColor: homeColors.greenBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  availableText: {
    fontSize: 9,
    fontWeight: "600",
    color: homeColors.green,
  },
  stockLabel: {
    fontSize: 11,
    color: homeColors.textMuted,
    marginBottom: 7,
  },
  stockValue: {
    fontSize: 13,
    fontWeight: "800",
    color: homeColors.primary,
  },
  progressBg: {
    height: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: homeColors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 9,
    color: homeColors.textMuted,
    marginTop: 5,
  },
  rightCol: {
    width: 104,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  usedLabel: {
    fontSize: 9,
    color: homeColors.textMuted,
  },
  usedValue: {
    fontSize: 16,
    fontWeight: "800",
    color: homeColors.primary,
    marginTop: 3,
  },
  usedSub: {
    fontSize: 9,
    color: homeColors.textMuted,
    marginTop: 2,
  },
  detailsBtn: {
    marginTop: 10,
    backgroundColor: homeColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  detailsText: {
    fontSize: 10,
    fontWeight: "700",
    color: homeColors.white,
  },
});
