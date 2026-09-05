import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";

import { servicesColors } from "@/features/services/theme/servicesTheme";

const HANDS_IMAGE = require("../../../../assets/images/services-banner-hands.png");

export function ServicesHeroBanner() {
  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={["#7A1018", "#8B121E", "#961018", "#A8121F", "#F0D4D4", "#FFF5F5"]}
        locations={[0, 0.25, 0.45, 0.58, 0.82, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      >
        <View style={styles.textCol}>
          <Text style={styles.title}>
            <Text style={styles.titleOur}>Our </Text>
            <Text style={styles.titleServices}>Services</Text>
          </Text>
          <View style={styles.bulletsRow}>
            <Text style={styles.bulletItem}>Support</Text>
            <Text style={styles.bulletSep}>•</Text>
            <Text style={styles.bulletItem}>Treat</Text>
            <Text style={styles.bulletSep}>•</Text>
            <Text style={styles.bulletItem}>Educate</Text>
            <Text style={styles.bulletSep}>•</Text>
            <Text style={styles.bulletItem}>Empower</Text>
          </View>
          <View style={styles.quoteBlock}>
            <Text style={styles.quoteLine}>"Together for</Text>
            <Text style={styles.quoteLine}>a Safer Tomorrow"</Text>
          </View>
          <View style={styles.divider} />
        </View>

        <Image source={HANDS_IMAGE} style={styles.handsImage} resizeMode="contain" />
        <Text style={styles.script}>Stronger Together</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    height: 184,
    position: "relative",
    justifyContent: "center",
  },
  textCol: {
    width: "64%",
    paddingLeft: 20,
    paddingRight: 4,
    paddingTop: 24,
    paddingBottom: 20,
    zIndex: 2,
  },
  title: {
    lineHeight: 36,
  },
  titleOur: {
    fontSize: 30,
    fontWeight: "600",
    color: servicesColors.white,
  },
  titleServices: {
    fontSize: 30,
    fontWeight: "800",
    color: servicesColors.white,
  },
  bulletsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    marginTop: 10,
  },
  bulletItem: {
    fontSize: 12.5,
    fontWeight: "400",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 0.4,
  },
  bulletSep: {
    fontSize: 12.5,
    fontWeight: "400",
    color: "rgba(255,255,255,0.82)",
    marginHorizontal: 7,
  },
  quoteBlock: {
    marginTop: 14,
  },
  quoteLine: {
    fontSize: 13.5,
    fontStyle: "italic",
    fontWeight: "400",
    color: "rgba(255,255,255,0.82)",
    lineHeight: 17,
  },
  divider: {
    width: 72,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.72)",
    marginTop: 8,
    borderRadius: 1,
  },
  handsImage: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 152,
    height: 158,
    zIndex: 1,
  },
  script: {
    position: "absolute",
    right: 16,
    bottom: 16,
    fontSize: 14.5,
    fontStyle: "italic",
    fontWeight: "700",
    color: "#961018",
    zIndex: 3,
  },
});
