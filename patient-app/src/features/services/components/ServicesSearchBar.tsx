import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";

import { servicesColors, servicesRadii } from "@/features/services/theme/servicesTheme";

export function ServicesSearchBar() {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search-outline" size={18} color={servicesColors.textMuted} />
      <TextInput
        placeholder="Search services, tools or support..."
        placeholderTextColor={servicesColors.textMuted}
        style={styles.input}
      />
      <Ionicons name="options-outline" size={20} color={servicesColors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: servicesColors.searchBg,
    borderRadius: servicesRadii.search,
    borderWidth: 1,
    borderColor: servicesColors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: servicesColors.text,
    padding: 0,
  },
});
