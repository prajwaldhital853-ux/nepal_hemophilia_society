import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Reference device: iPhone 14 */
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/** Provided header PNG aspect (941 x 648) — keep full curve visible */
export const HEADER_BG_ASPECT = 648 / 941;

export function useLoginLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const availableHeight = height - insets.top - Math.max(insets.bottom, 6);
  const widthScale = width / BASE_WIDTH;
  const heightScale = availableHeight / BASE_HEIGHT;

  const compact = availableHeight < 760;
  const veryCompact = availableHeight < 680;

  /** Scale typography/spacing only — never shrink the header background */
  const scale = Math.min(Math.max(Math.min(widthScale, heightScale), 0.85), 1.12);
  const bodyDensity = veryCompact ? 0.88 : compact ? 0.94 : 1;

  /** Full width-proportional header so the red/gray curve always shows */
  const headerHeight = Math.round(width * HEADER_BG_ASPECT);
  const logoWidth = Math.round(Math.min(width * 0.56, 236 * scale));

  return {
    width,
    availableHeight,
    scale,
    bodyDensity,
    compact,
    veryCompact,
    headerHeight,
    logoWidth,
    badgeTop: Math.round(34 * scale),
    badgeRight: Math.round(36 * scale),
    badgeFontSize: Math.round(11 * scale),
    saferMarginTop: Math.round((compact ? 22 : 32) * bodyDensity),
    saferFontSize: Math.round(15 * scale),
    saferIconWidth: Math.round(62 * scale),
    cardSidePadding: Math.round(20 * widthScale),
    cardMaxWidth: Math.min(width - 32, Math.round(392 * widthScale)),
    cardPaddingV: Math.round((compact ? 18 : 22) * bodyDensity),
    cardPaddingH: Math.round(22 * scale),
    cardGap: Math.round((compact ? 10 : 12) * bodyDensity),
    cardSectionGap: Math.round((compact ? 12 : 14) * bodyDensity),
    inputHeight: Math.round((compact ? 44 : 48) * scale),
    buttonHeight: Math.round((compact ? 46 : 50) * scale),
    footerPaddingTop: Math.round((compact ? 8 : 14) * bodyDensity),
    footerTaglineSize: Math.round((compact ? 10 : 11.5) * scale),
    footerLabelSize: Math.round((compact ? 7 : 8) * scale),
    footerIconSize: Math.round(16 * scale),
    shieldSize: Math.round(30 * scale),
  };
}
