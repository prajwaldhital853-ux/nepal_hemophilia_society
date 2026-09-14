import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import { SectionTitle } from "@/features/factor/components/SectionTitle";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";

type StockLot = {
  factorMedicineName: string;
  quantity: string;
  unit: string;
  expiryDate?: string | null;
  batchNumber?: string;
};

export function FactorStockStatus() {
  const { token, patient } = useAuth();
  const [lots, setLots] = useState<StockLot[]>([]);
  const [totalQty, setTotalQty] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState("");
  const [province, setProvince] = useState("");
  const [outOfStock, setOutOfStock] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!token) return;
    void patientApi("/me/patient/stock/", { token })
      .then((data) => {
        setLots(Array.isArray(data.stock) ? data.stock : []);
        setTotalQty(String(data.totalQuantity ?? 0));
        setHospitalName(data.hospitalName || patient?.primaryHospital || "");
        setProvince(data.province || patient?.province || "");
        setOutOfStock(Boolean(data.outOfStock));
      })
      .catch(() => {
        setLots([]);
        setTotalQty(null);
      });
  }, [token, patient?.primaryHospital, patient?.province]);

  const visibleLots = expanded ? lots : lots.slice(0, 6);

  return (
    <View style={styles.section}>
      <SectionTitle title="Factor Stock Status" />
      <View style={styles.card}>
        <Text style={styles.centerTitle}>{hospitalName || "Treatment center"}</Text>
        {province ? <Text style={styles.province}>{province} Province</Text> : null}
        <Text style={styles.total}>
          On hand:{" "}
          <Text style={outOfStock ? styles.outOfStock : styles.inStock}>
            {totalQty === null ? "—" : `${totalQty} IU`}
          </Text>
        </Text>
        {outOfStock ? (
          <Text style={styles.warn}>Out of stock at your center. Contact your treatment team before your next dose.</Text>
        ) : null}
        {lots.length === 0 ? (
          <Text style={styles.message}>No factor stock allocated to your treatment center yet.</Text>
        ) : (
          <View style={[styles.tableWrap, lots.length > 6 && !expanded ? styles.tableScroll : null]}>
            {visibleLots.map((lot, index) => (
              <View key={`${lot.factorMedicineName}-${lot.batchNumber}-${index}`} style={styles.row}>
                <Text style={styles.product}>{lot.factorMedicineName}</Text>
                <Text style={styles.qty}>{lot.quantity} {lot.unit}</Text>
                <Text style={styles.expiry}>Exp: {lot.expiryDate || "—"}</Text>
              </View>
            ))}
          </View>
        )}
        {lots.length > 6 ? (
          <Pressable onPress={() => setExpanded((v) => !v)}>
            <Text style={styles.toggle}>{expanded ? "Show less" : `Show all ${lots.length} lots`}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: factorSpacing.section },
  card: {
    backgroundColor: factorColors.white,
    borderRadius: 14,
    padding: 14,
  },
  centerTitle: { fontSize: 13, fontWeight: "800", color: factorColors.navy },
  province: { marginTop: 2, fontSize: 11, fontWeight: "600", color: factorColors.primary },
  total: { marginTop: 8, fontSize: 12, color: factorColors.textMuted },
  inStock: { fontWeight: "800", color: "#15803D" },
  outOfStock: { fontWeight: "800", color: "#B91C1C" },
  warn: { marginTop: 6, fontSize: 11, lineHeight: 16, color: "#B45309" },
  message: { marginTop: 8, fontSize: 12, lineHeight: 18, color: factorColors.textMuted },
  tableWrap: { marginTop: 10, gap: 6 },
  tableScroll: { maxHeight: 180 },
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    paddingTop: 6,
  },
  product: { fontSize: 12, fontWeight: "700", color: factorColors.navy },
  qty: { fontSize: 11, color: factorColors.textMuted, marginTop: 2 },
  expiry: { fontSize: 10, color: factorColors.textMuted, marginTop: 1 },
  toggle: { marginTop: 8, fontSize: 11, fontWeight: "700", color: factorColors.primary },
});
