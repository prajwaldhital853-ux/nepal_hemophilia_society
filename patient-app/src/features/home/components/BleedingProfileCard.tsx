import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Text as SvgText } from "react-native-svg";

import { mockBleeding } from "@/features/home/data/mockPatientData";
import { homeColors, homeRadii, homeSpacing } from "@/features/home/theme/homeTheme";

const BLEEDING_BODY_MAP = require("../../../../assets/images/bleeding-body-map.png");

const MAP_W = 178;
const MAP_H = 168;

type Callout = {
  label: string;
  jx: number;
  jy: number;
  ex: number;
  ey: number;
  fontSize?: number;
};

/**
 * White glow dots measured from the PNG pixels (682x1024, contain-fit in 178x168):
 *   right elbow dot  (394,361) -> (98, 59)   — at blood-drop height, line angles UP over the drop
 *   right knee dot   (307,676) -> (83, 111)
 *   left foot dot    (146,913) -> (57, 150)
 * Blood drop ring occupies roughly x 105-145, y 54-100 — lines/labels avoid it.
 */
function BodyMapWithCallouts({ joints }: { joints: string[] }) {
  const callouts: Callout[] = [
    { label: joints[2] ?? "Elbow", jx: 98, jy: 59, ex: 146, ey: 40 },
    { label: joints[0] ?? "Right Knee", jx: 83, jy: 111, ex: 100, ey: 111 },
    { label: joints[1] ?? "Left Ankle", jx: 57, jy: 150, ex: 100, ey: 150 },
  ];

  return (
    <View style={styles.mapWrap}>
      <Image source={BLEEDING_BODY_MAP} style={styles.bodyMapImage} resizeMode="contain" />
      <Svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={styles.mapOverlay}>
        {callouts.map((c) => (
          <Line
            key={`line-${c.label}`}
            x1={c.jx}
            y1={c.jy}
            x2={c.ex}
            y2={c.ey}
            stroke="rgba(255,255,255,0.75)"
            strokeWidth={1.2}
          />
        ))}
        {callouts.map((c) => (
          <SvgText
            key={`text-${c.label}`}
            x={c.ex + 3}
            y={c.ey + 3}
            fill="#FFFFFF"
            fontSize={c.fontSize ?? 8.5}
            fontWeight="600"
          >
            {c.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

export function BleedingProfileCard() {
  const d = mockBleeding;

  return (
    <View style={styles.section}>
      <LinearGradient
        colors={["#4A0810", "#7A1018", "#961018", "#7A1018", "#3A060C"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="water" size={15} color={homeColors.white} />
            <Text style={styles.title}>Bleeding Profile</Text>
          </View>
          <Pressable style={styles.historyBtn}>
            <Text style={styles.historyText}>View Bleeding History &gt;</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.leftPanel}>
            <BodyMapWithCallouts joints={d.joints} />
          </View>

          <View style={styles.statsPanel}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Most Affected Joint</Text>
              <View style={styles.jointRow}>
                <Text style={styles.jointName}>{d.mostAffected}</Text>
                <View style={styles.modBadge}>
                  <Text style={styles.modBadgeText}>{d.severity}</Text>
                </View>
              </View>
            </View>
            <View style={styles.statDivider} />
            <StatLine label="Total Bleeding Episodes (This Year)" value={String(d.totalEpisodes)} />
            <View style={styles.statDivider} />
            <StatLine label="Last Bleed" value={d.lastBleed} bold />
            <View style={styles.statDivider} />
            <View style={styles.severityRow}>
              <Text style={styles.statLineLabel}>Severity</Text>
              <View style={styles.severityPill}>
                <Text style={styles.severityPillText}>{d.severity}</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function StatLine({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.statLineRow}>
      <Text style={styles.statLineLabel} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.statLineValue, bold && styles.statLineValueBold]}>{value}</Text>
    </View>
  );
}

const SEV_RED = "#7A0E18";

const styles = StyleSheet.create({
  section: {
    marginTop: homeSpacing.section,
    paddingHorizontal: homeSpacing.screen,
  },
  card: {
    borderRadius: homeRadii.card,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    zIndex: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: homeColors.white,
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  leftPanel: {
    width: "51%",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  mapWrap: {
    width: MAP_W,
    height: MAP_H,
    position: "relative",
  },
  bodyMapImage: {
    width: MAP_W,
    height: MAP_H,
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  statsPanel: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.22)",
    paddingLeft: 10,
    justifyContent: "center",
  },
  historyBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  historyText: {
    fontSize: 10,
    color: homeColors.white,
    fontWeight: "700",
  },
  statBlock: {
    paddingVertical: 3,
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
  },
  jointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  jointName: {
    fontSize: 16,
    fontWeight: "800",
    color: homeColors.white,
  },
  modBadge: {
    backgroundColor: "#C1121F",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 11,
  },
  modBadgeText: {
    fontSize: 9.5,
    color: homeColors.white,
    fontWeight: "700",
  },
  statDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 6,
  },
  statLineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    paddingVertical: 2,
  },
  severityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
  statLineLabel: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.85)",
  },
  statLineValue: {
    fontSize: 12,
    color: homeColors.white,
    fontWeight: "700",
  },
  statLineValueBold: {
    fontSize: 14,
    fontWeight: "800",
  },
  severityPill: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 13,
  },
  severityPillText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: SEV_RED,
  },
});
