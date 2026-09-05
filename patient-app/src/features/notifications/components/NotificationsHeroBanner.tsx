import { ImageBackground, StyleSheet, Text, View } from "react-native";

const BANNER = require("../../../../assets/images/notifications-banner.png");

export function NotificationsHeroBanner() {
  return (
    <View style={styles.wrap}>
      <ImageBackground source={BANNER} style={styles.banner} imageStyle={styles.image} resizeMode="contain">
        <View style={styles.left}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.sub}>Stay informed. Stay stronger.</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.quote}>Together</Text>
          <Text style={styles.quote}>for a Safer</Text>
          <Text style={styles.quote}>Tomorrow</Text>
          <View style={styles.divider} />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 154,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#C1121F",
    shadowColor: "#7A1018",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  banner: {
    flex: 1,
  },
  image: {
    borderRadius: 20,
  },
  left: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 16,
    paddingRight: 8,
    maxWidth: "58%",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 30,
  },
  sub: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "400",
    color: "#FFFFFF",
  },
  right: {
    position: "absolute",
    top: 12,
    right: 12,
    alignItems: "flex-end",
  },
  quote: {
    fontSize: 10,
    fontStyle: "italic",
    fontWeight: "500",
    color: "#FFFFFF",
    lineHeight: 14,
    textAlign: "right",
  },
  divider: {
    width: 42,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.9)",
    marginTop: 5,
    borderRadius: 1,
  },
});
