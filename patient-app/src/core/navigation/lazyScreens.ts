import { lazyScreen } from "./lazyScreen";

/** Every route screen is lazy so cold start only loads splash + auth bootstrap. */
export const LoginScreen = lazyScreen(() => import("@/features/auth/screens/LoginScreen"));
export const ChangePasswordScreen = lazyScreen(() => import("@/features/auth/screens/ChangePasswordScreen"));
export const RegisterScreen = lazyScreen(() => import("@/features/auth/screens/RegisterScreen"));
export const HomeScreen = lazyScreen(() => import("@/features/home/screens/HomeScreen"));
export const ServicesScreen = lazyScreen(() => import("@/features/services/screens/ServicesScreen"));
export const FactorScreen = lazyScreen(() => import("@/features/factor/screens/FactorScreen"));
export const NotificationsScreen = lazyScreen(() => import("@/features/notifications/screens/NotificationsScreen"));
export const ProfileScreen = lazyScreen(() => import("@/features/profile/screens/ProfileScreen"));
export const DocumentsScreen = lazyScreen(() => import("@/features/home/screens/DocumentsScreen"));
export const InjectionsScreen = lazyScreen(() => import("@/features/injections/screens/InjectionsScreen"));
export const TreatmentsScreen = lazyScreen(() => import("@/features/treatments/screens/TreatmentsScreen"));
export const BleedingScreen = lazyScreen(() => import("@/features/services/screens/BleedingScreen"));
export const InsightsScreen = lazyScreen(() => import("@/features/services/screens/InsightsScreen"));
export const CentersScreen = lazyScreen(() => import("@/features/services/screens/CentersScreen"));
export const EmergencyIdScreen = lazyScreen(() => import("@/features/services/screens/EmergencyIdScreen"));
export const SettingsScreen = lazyScreen(() => import("@/features/services/screens/SettingsScreen"));
export const ServiceDetailScreen = lazyScreen(() => import("@/features/services/screens/ServiceDetailScreen"));
export const ServiceContentListScreen = lazyScreen(() => import("@/features/services/screens/ServiceContentListScreen"));
export const ServiceContentDetailScreen = lazyScreen(
  () => import("@/features/services/screens/ServiceContentDetailScreen"),
);
