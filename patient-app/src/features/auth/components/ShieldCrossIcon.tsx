import Svg, { Path } from "react-native-svg";

import { nhmsColors } from "@/features/auth/theme/nhmsTheme";

type ShieldCrossIconProps = {
  size?: number;
};

/** SS1 footer shield — white shield, gray outline, red medical cross */
export function ShieldCrossIcon({ size = 36 }: ShieldCrossIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Path
        d="M18 3.5 L30.5 9.2 V19.8 C30.5 26.8 18 32.5 18 32.5 C18 32.5 5.5 26.8 5.5 19.8 V9.2 Z"
        fill={nhmsColors.white}
        stroke="#B8C0CC"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path
        d="M18 12.5 V23.5 M12.5 18 H23.5"
        stroke={nhmsColors.primaryRed}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
