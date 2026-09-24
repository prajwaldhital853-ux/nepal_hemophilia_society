import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { PanResponder, View } from "react-native";

import { navigateFromDrawer } from "@/core/navigation/navigationRef";
import { HomeDrawer } from "@/features/home/components/HomeDrawer";

type DrawerTab = "home" | "services" | "factor" | "notifications" | "profile" | "injections" | "documents";

type DrawerContextValue = {
  openDrawer: () => void;
  closeDrawer: () => void;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

export function useAppDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error("useAppDrawer must be used within DrawerProvider");
  }
  return ctx;
}

function navigateDrawerTab(tab: DrawerTab) {
  if (tab === "home") navigateFromDrawer("Home");
  if (tab === "services") navigateFromDrawer("Services");
  if (tab === "factor") navigateFromDrawer("Factor");
  if (tab === "notifications") navigateFromDrawer("Notifications");
  if (tab === "profile") navigateFromDrawer("Profile");
  if (tab === "injections") navigateFromDrawer("Injections");
  if (tab === "documents") navigateFromDrawer("Documents");
}

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const edgePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.x0 < 14 && gesture.dx > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 0.45,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 10 || gesture.vx > 0.02) setDrawerOpen(true);
      },
    }),
  ).current;

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer }}>
      <View style={{ flex: 1 }}>
        {children}
        {!drawerOpen ? (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 72,
              width: 14,
              zIndex: 5,
            }}
            {...edgePan.panHandlers}
          />
        ) : null}
        <HomeDrawer
          visible={drawerOpen}
          onClose={closeDrawer}
          onNavigate={(tab) => {
            closeDrawer();
            navigateDrawerTab(tab);
          }}
        />
      </View>
    </DrawerContext.Provider>
  );
}
