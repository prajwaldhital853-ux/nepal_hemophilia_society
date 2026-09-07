import { lazyScreen } from "./lazyScreen";

/** Auth screens — eager so they share the same AuthContext module instance as App. */
export { default as LoginScreen } from "@/features/auth/screens/LoginScreen";
export { default as ChangePasswordScreen } from "@/features/auth/screens/ChangePasswordScreen";

export const SplashScreen = lazyScreen(() => import("@/features/splash/screens/SplashScreen"));
export const RegisterScreen = lazyScreen(() => import("@/features/auth/screens/RegisterScreen"));
export const InjectionsScreen = lazyScreen(() => import("@/features/injections/screens/InjectionsScreen"));

/** Main tabs — eager for instant tab switching. */
export { default as HomeScreen } from "@/features/home/screens/HomeScreen";
export { default as ServicesScreen } from "@/features/services/screens/ServicesScreen";
export { default as FactorScreen } from "@/features/factor/screens/FactorScreen";
export { default as NotificationsScreen } from "@/features/notifications/screens/NotificationsScreen";
export { default as ProfileScreen } from "@/features/profile/screens/ProfileScreen";
