import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import { usePatientClinicalStats } from "@/features/home/hooks/usePatientClinicalStats";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

const FACTOR_VIAL_ICON = require("../../../../assets/images/factor-vial-icon.png");

export function FactorStockCard() {
  const { patient, token } = useAuth();
  const { totalIuLabel, totalInjections } = usePatientClinicalStats();
  const [centerQty, setCenterQty] = useState<string | null>(null);
  const [centerName, setCenterName] = useState("");
  const [outOfStock, setOutOfStock] = useState(false);
  const factorName = patient?.deficientFactor ? `Factor ${patient.deficientFactor.replace("FVIII", "VIII").replace("FIX", "IX")}` : "Your factor";

  useEffect(() => {
    if (!token) return;
    void patientApi("/me/patient/stock/", { token })
      .then((data) => {
        setCenterQty(String(data.totalQuantity ?? 0));
        setCenterName(data.hospitalName || patient?.primaryHospital || "");
        setOutOfStock(Boolean(data.outOfStock));
      })
      .catch(() => setCenterQty(null));
  }, [token, patient?.primaryHospital]);

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
          <Text style={styles.factorName}>{factorName}</Text>
          <Text style={styles.stockLabel}>
            Center stock{centerName ? ` (${centerName})` : ""}:{" "}
            <Text style={[styles.stockMuted, outOfStock ? styles.outOfStock : null]}>
              {centerQty === null
                ? "Not available"
                : outOfStock
                  ? "Out of stock at your center"
                  : `${centerQty} IU on hand`}
            </Text>
          </Text>
          <Text style={styles.progressText}>Center inventory updates when staff log a completed dose.</Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.usedLabel}>Patient Used</Text>
          <Text style={styles.usedValue}>{totalIuLabel}</Text>
          <Text style={styles.usedSub}>{totalInjections} injection(s)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: homeSpacing.section, paddingHorizontal: homeSpacing.screen },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: homeColors.cardBg,
    borderRadius: homeRadii.card,
    borderWidth: 1,
    borderColor: homeColors.border,
    padding: 14,
  },
  iconCol: { marginRight: 12 },
  bottleWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  factorIcon: { width: 38, height: 38 },
  midCol: { flex: 1, minWidth: 0, paddingRight: 10 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: homeColors.navy, marginBottom: 5 },
  factorName: { fontSize: 13, fontWeight: "700", color: homeColors.navy, marginBottom: 6 },
  stockLabel: { fontSize: 11, color: homeColors.textMuted, marginBottom: 6 },
  stockMuted: { color: homeColors.textMuted },
  progressText: { fontSize: 9, color: homeColors.textMuted },
  rightCol: {
    width: 104,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  usedLabel: { fontSize: 9, color: homeColors.textMuted },
  usedValue: { fontSize: 14, fontWeight: "800", color: homeColors.primary, marginTop: 3, textAlign: "center" },
  usedSub: { fontSize: 9, color: homeColors.textMuted, marginTop: 2 },
  outOfStock: { color: "#B91C1C", fontWeight: "700" },
});
