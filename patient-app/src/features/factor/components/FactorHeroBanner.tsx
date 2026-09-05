import { ImageBackground, StyleSheet, Text, View } from "react-native";

const BANNER = require("../../../../assets/images/factor-banner.png");

export function FactorHeroBanner() {
  return (
    <View style={styles.wrap}>
      <ImageBackground source={BANNER} style={styles.banner} imageStyle={styles.image} resizeMode="cover">
        <View style={styles.textCol}>
          <View>
            <Text style={styles.title}>Factor Report</Text>
            <Text style={styles.sub}>Track  •  Manage  •  Plan  •  Save Lives</Text>
            <View style={styles.separator} />
          </View>
          <View style={styles.tagBlock}>
            <Text style={styles.tagline}>Real Data. Better Care.</Text>
            <Text style={styles.taglineNext}>Stronger Community.</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    overflow: "hidden",
    height: 198,
    shadowColor: "#7A1018",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  banner: {
    flex: 1,
  },
  image: {
    borderRadius: 18,
  },
  textCol: {
    flex: 1,
    maxWidth: "58%",
    paddingLeft: 16,
    paddingRight: 8,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 32,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sub: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.94)",
    letterSpacing: 0.2,
  },
  separator: {
    width: 42,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.85)",
    marginTop: 8,
    borderRadius: 1,
  },
  tagBlock: {
    marginTop: 24,
  },
  tagline: {
    fontSize: 11,
    fontStyle: "italic",
    fontWeight: "500",
    color: "rgba(255,255,255,0.92)",
  },
  taglineNext: {
    marginTop: 2,
    fontSize: 11,
    fontStyle: "italic",
    fontWeight: "500",
    color: "rgba(255,255,255,0.92)",
  },
});
