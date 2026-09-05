import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { factorDistribution } from "@/features/factor/data/mockFactorData";
import { SectionTitle } from "@/features/factor/components/SectionTitle";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";

const SIZE = 156;
const STROKE = 24;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function FactorDistributionChart() {
  const viiiLen = (factorDistribution.viiiPercent / 100) * C;

  return (
    <View style={styles.section}>
      <SectionTitle title="Factor Distribution" />
      <View style={styles.card}>
        <View style={styles.donutWrap}>
          <Svg width={SIZE} height={SIZE}>
            <G rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}>
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                stroke={factorColors.pinkBar}
                strokeWidth={STROKE}
                fill="none"
              />
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                stroke={factorColors.primaryDark}
                strokeWidth={STROKE}
                fill="none"
                strokeDasharray={`${viiiLen} ${C - viiiLen}`}
                strokeLinecap="butt"
              />
            </G>
          </Svg>
          <View style={styles.center}>
            <Text style={styles.centerValue}>{factorDistribution.totalUsed}</Text>
            <Text style={styles.centerLabel}>Total Used</Text>
          </View>
        </View>
        <View style={styles.legend}>
          <View style={styles.legRow}>
            <View style={styles.legLeft}>
              <View style={[styles.dot, { backgroundColor: factorColors.primaryDark }]} />
              <Text style={styles.legName}>Factor VIII</Text>
            </View>
            <Text style={styles.legValue}>
              {factorDistribution.viiiPercent}% ({factorDistribution.viiiIu})
            </Text>
          </View>
          <View style={styles.legRow}>
            <View style={styles.legLeft}>
              <View style={[styles.dot, { backgroundColor: factorColors.pinkBar }]} />
              <Text style={styles.legName}>Factor IX</Text>
            </View>
            <Text style={styles.legValue}>
              {factorDistribution.ixPercent}% ({factorDistribution.ixIu})
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: factorSpacing.section,
  },
  card: {
    backgroundColor: factorColors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  donutWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 8,
  },
  center: {
    position: "absolute",
    alignItems: "center",
  },
  centerValue: {
    fontSize: 18,
    fontWeight: "800",
    color: factorColors.navy,
  },
  centerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: factorColors.navy,
    marginTop: 2,
  },
  legend: {
    marginTop: 8,
    gap: 8,
  },
  legRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legName: {
    fontSize: 13,
    fontWeight: "700",
    color: factorColors.navy,
  },
  legValue: {
    fontSize: 13,
    fontWeight: "700",
    color: factorColors.navy,
  },
});
