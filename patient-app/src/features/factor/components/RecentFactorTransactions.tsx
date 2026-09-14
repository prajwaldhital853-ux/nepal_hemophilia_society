import { ScrollView, StyleSheet, Text, View } from "react-native";

import { FactorEmptyState, FactorLoading } from "@/features/factor/components/FactorStates";
import { usePatientInjections } from "@/features/factor/hooks/usePatientInjections";
import { factorColors, factorSpacing } from "@/features/factor/theme/factorTheme";
import { SectionTitle } from "@/features/factor/components/SectionTitle";

export function RecentFactorTransactions() {
  const { injections, loading } = usePatientInjections();

  if (loading) return <FactorLoading />;

  return (
    <View style={styles.section}>
      <SectionTitle title="Recent Injections" />
      {!injections.length ? (
        <FactorEmptyState title="No transactions yet" message="Logged injections will appear here as they are added by your hospital." />
      ) : (
        <View style={styles.card}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.headRow}>
                {["Date", "Factor", "Dose", "Status", "Doctor", "Facility"].map((h) => (
                  <Text key={h} style={styles.head}>
                    {h}
                  </Text>
                ))}
              </View>
              {injections.slice(0, 10).map((row, idx) => (
                <View key={row.id} style={[styles.bodyRow, idx % 2 === 0 && styles.bodyAlt]}>
                  <Text style={styles.cell}>{row.date ?? "—"}</Text>
                  <Text style={styles.cell}>{row.factorType ?? "—"}</Text>
                  <Text style={styles.cell}>
                    {row.dose} {row.unit}
                  </Text>
                  <Text style={styles.cell}>{row.status ?? "Completed"}</Text>
                  <Text style={styles.cell}>{row.doctorName || row.administeredBy || "—"}</Text>
                  <Text style={styles.cellWide}>{row.hospitalName ?? row.label ?? "—"}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: factorSpacing.section },
  card: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 4, gap: 12 },
  head: { width: 88, fontSize: 10, fontWeight: "700", color: "#64748B" },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.25)",
    backgroundColor: "#F8FAFC",
  },
  bodyAlt: { backgroundColor: "#EEF1F4" },
  cell: { width: 88, fontSize: 11, fontWeight: "600", color: factorColors.navy },
  cellWide: { width: 120, fontSize: 11, fontWeight: "600", color: factorColors.navy },
});
