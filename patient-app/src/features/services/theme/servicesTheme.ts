import { Platform, type TextStyle } from "react-native";

/** Services area tokens — warm paper, ink type, one crimson accent, hairline structure. */
export const servicesColors = {
  pageBg: "#F5F2ED",
  paperDeep: "#EDE8E0",
  primary: "#A4161A",
  primaryDark: "#7D1013",
  primaryTint: "#F4E4E1",
  navy: "#16202E",
  ink: "#16202E",
  inkSoft: "#465061",
  white: "#FFFFFF",
  text: "#1E2733",
  textMuted: "#737B87",
  border: "#E3DDD3",
  borderStrong: "#CFC6B8",
  cardBg: "#FFFFFF",
  iconBg: "#F4E4E1",
  arrowBg: "#F4E4E1",
  quoteBg: "#EDE8E0",
  searchBg: "#EDE8E0",
  good: "#2F6B4F",
  goodTint: "#E2EEE6",
  warn: "#9A6412",
  warnTint: "#F5EAD6",
};

export const servicesRadii = {
  card: 12,
  banner: 14,
  search: 10,
  icon: 9,
  arrow: 8,
};

export const servicesSpacing = {
  screen: 16,
  section: 28,
  bottomScrollPadding: 88,
};

/** Accent per backend service category (treatment / education / support / more). */
export const categoryAccents: Record<string, { fg: string; bg: string }> = {
  treatment: { fg: "#A4161A", bg: "#F4E4E1" },
  education: { fg: "#8A5A12", bg: "#F3E8D5" },
  support: { fg: "#2F6B4F", bg: "#E2EEE6" },
  more: { fg: "#3D4F66", bg: "#E5E9EF" },
};

export function accentFor(categoryId?: string) {
  return categoryAccents[categoryId ?? ""] ?? categoryAccents.more;
}

/** Chart / slice palette drawn from the same family as the tokens above. */
export const servicesChartPalette = ["#A4161A", "#16202E", "#B7822B", "#2F6B4F", "#5B6B82", "#C79A90"];

const serifFamily = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia, 'Times New Roman', serif",
});

export const servicesType = {
  display: {
    fontFamily: serifFamily,
    fontSize: 28,
    lineHeight: 34,
    color: servicesColors.ink,
    letterSpacing: -0.3,
  } as TextStyle,
  title: {
    fontFamily: serifFamily,
    fontSize: 20,
    lineHeight: 26,
    color: servicesColors.ink,
  } as TextStyle,
  figure: {
    fontFamily: serifFamily,
    color: servicesColors.ink,
    fontVariant: ["tabular-nums"],
  } as TextStyle,
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: servicesColors.textMuted,
  } as TextStyle,
  lead: {
    fontSize: 14,
    lineHeight: 21,
    color: servicesColors.inkSoft,
  } as TextStyle,
  body: {
    fontSize: 15.5,
    lineHeight: 25,
    color: servicesColors.text,
  } as TextStyle,
  label: {
    fontSize: 14.5,
    fontWeight: "600",
    color: servicesColors.ink,
  } as TextStyle,
  meta: {
    fontSize: 12.5,
    lineHeight: 17,
    color: servicesColors.textMuted,
  } as TextStyle,
};
