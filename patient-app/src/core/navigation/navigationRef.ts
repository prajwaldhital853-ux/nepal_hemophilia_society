import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateFromDrawer(screen: keyof RootStackParamList) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(screen as never);
  }
}
