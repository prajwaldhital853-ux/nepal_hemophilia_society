import { ScrollView, StyleSheet, Text, View } from "react-native";

import { recentTransactions } from "@/features/factor/data/mockFactorData";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";
import { SectionTitle } from "@/features/factor/components/SectionTitle";

export function RecentFactorTransactions() {
  return (
    <View style={styles.section}>
      <SectionTitle title="Recent Factor Transactions" action="View All >" />
      <View style={styles.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.headRow}>
              {["Date", "Type", "Factor Type", "Dose (IU)", "Purpose", "Facility"].map((h) => (
                <Text key={h} style={[styles.head, colWidth(h)]}>
                  {h}
                </Text>
              ))}
            </View>
            {recentTransactions.map((row, idx) => (
              <View key={row.id} style={[styles.bodyRow, idx % 2 === 0 && styles.bodyAlt]}>
                <Text style={[styles.cell, styles.wDate]}>{row.date}</Text>
                <View style={styles.wType}>
                  <View style={[styles.typePill, row.type === "Used" ? styles.used : styles.received]}>
                    <Text style={[styles.typeText, row.type === "Used" ? styles.usedText : styles.receivedText]}>
                      {row.type}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.cell, styles.wFactor]}>{row.factor}</Text>
                <Text style={[styles.cell, styles.wDose]}>{row.dose}</Text>
                <Text style={[styles.cell, styles.wPurpose]}>{row.purpose}</Text>
                <Text style={[styles.cell, styles.wFacility]}>{row.facility}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function colWidth(header: string) {
  switch (header) {
    case "Date":
      return styles.wDate;
    case "Type":
      return styles.wType;
    case "Factor Type":
      return styles.wFactor;
    case "Dose (IU)":
      return styles.wDose;
    case "Purpose":
      return styles.wPurpose;
    default:
      return styles.wFacility;
  }
}

const styles = StyleSheet.create({
  section: {
    marginTop: factorSpacing.section,
  },
  card: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  headRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  head: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.25)",
    backgroundColor: "#F8FAFC",
  },
  bodyAlt: {
    backgroundColor: "#EEF1F4",
  },
  cell: {
    fontSize: 11,
    fontWeight: "600",
    color: factorColors.navy,
  },
  wDate: { width: 92 },
  wType: { width: 82 },
  wFactor: { width: 88 },
  wDose: { width: 78 },
  wPurpose: { width: 120 },
  wFacility: { width: 140 },
  typePill: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  used: {
    backgroundColor: "#FEE2E2",
  },
  received: {
    backgroundColor: factorColors.greenBg,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  usedText: {
    color: factorColors.primary,
  },
  receivedText: {
    color: factorColors.greenText,
  },
});
