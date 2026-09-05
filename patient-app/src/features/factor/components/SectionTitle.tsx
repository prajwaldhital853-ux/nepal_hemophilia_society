import { Pressable, StyleSheet, Text, View } from "react-native";

import { factorColors } from "@/features/factor/theme/factorTheme";

type Props = {
  title: string;
  action?: string;
};

export function SectionTitle({ title, action }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.bar} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {action ? (
        <Pressable hitSlop={8}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bar: {
    width: 4,
    height: 18,
    borderRadius: 3,
    backgroundColor: factorColors.primary,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: factorColors.navy,
  },
  action: {
    fontSize: 13,
    fontWeight: "700",
    color: factorColors.primary,
  },
});
