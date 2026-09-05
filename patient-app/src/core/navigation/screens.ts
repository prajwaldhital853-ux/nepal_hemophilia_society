import { lazyScreen } from "./lazyScreen";

/** Auth feature — loaded only when user opens login/register flows. */
export const SplashScreen = lazyScreen(
  () => import("@/features/splash/screens/SplashScreen"),
);
export const LoginScreen = lazyScreen(
  () => import("@/features/auth/screens/LoginScreen"),
);
export const RegisterScreen = lazyScreen(
  () => import("@/features/auth/screens/RegisterScreen"),
);
export const InjectionsScreen = lazyScreen(
  () => import("@/features/injections/screens/InjectionsScreen"),
);

/** Main tabs — eager so switching Home/Services/Factor/Notifications/Profile is instant. */
export { default as HomeScreen } from "@/features/home/screens/HomeScreen";
export { default as ServicesScreen } from "@/features/services/screens/ServicesScreen";
export { default as FactorScreen } from "@/features/factor/screens/FactorScreen";
export { default as NotificationsScreen } from "@/features/notifications/screens/NotificationsScreen";
export { default as ProfileScreen } from "@/features/profile/screens/ProfileScreen";
