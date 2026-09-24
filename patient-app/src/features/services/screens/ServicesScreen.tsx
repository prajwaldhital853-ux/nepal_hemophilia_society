import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StackScreenProps } from "@react-navigation/stack";

import { useAuth } from "@/core/auth/AuthContext";
import { useLocale } from "@/core/i18n";
import type { RootStackParamList } from "@/core/navigation/types";
import { HomeBottomNav } from "@/features/home/components/HomeBottomNav";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { useAppDrawer } from "@/features/home/context/DrawerContext";
import { fetchPatientServices } from "@/features/services/api";
import { ServiceCategorySection } from "@/features/services/components/ServiceCategorySection";
import { ServicesCategoryFilter } from "@/features/services/components/ServicesCategoryFilter";
import { ServicesHeroBanner } from "@/features/services/components/ServicesHeroBanner";
import { ServicesQuoteBanner } from "@/features/services/components/ServicesQuoteBanner";
import { ServicesSearchBar } from "@/features/services/components/ServicesSearchBar";
import { openPatientService } from "@/features/services/navigateService";
import type { ServiceCategoryGroup } from "@/features/services/types";
import { servicesColors, servicesSpacing } from "@/features/services/theme/servicesTheme";

type Props = StackScreenProps<RootStackParamList, "Services">;

export default function ServicesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { t } = useLocale();
  const { openDrawer } = useAppDrawer();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<ServiceCategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!token) return;
    const id = ++requestId.current;
    setError("");
    setLoading(true);
    try {
      const rows = await fetchPatientServices(token, search);
      if (id !== requestId.current) return;
      setCategories(rows);
    } catch (err) {
      if (id !== requestId.current) return;
      const message = err instanceof Error ? err.message : "Could not load services";
      if (/canceled|cancelled/i.test(message)) return;
      setError(message);
      setCategories([]);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const visible = useMemo(() => {
    if (!filterCategory) return categories;
    return categories.filter((row) => row.id === filterCategory);
  }, [categories, filterCategory]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={servicesColors.white} />
      <View style={[styles.stickyHeader, { paddingTop: insets.top }]}>
        <HomeHeader
          onMenuPress={openDrawer}
          onProfilePress={() => navigation.navigate("Profile")}
          onNotificationPress={() => navigation.navigate("Notifications")}
        />
        <View style={styles.searchWrap}>
          <ServicesSearchBar
            value={search}
            onChangeText={setSearch}
            filterActive={Boolean(filterCategory) || showFilters}
            onFilterPress={() => setShowFilters((current) => !current)}
          />
        </View>
        {showFilters ? (
          <ServicesCategoryFilter
            categories={categories}
            activeId={filterCategory}
            onSelect={(id) => {
              setFilterCategory(id);
              if (id) setShowFilters(true);
            }}
          />
        ) : null}
        {filterCategory && !showFilters ? (
          <Text style={styles.filterHint} onPress={() => setFilterCategory(null)}>
            {t("services.categoryHint")}
          </Text>
        ) : null}
        <ServicesHeroBanner />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={servicesColors.primary} />}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && categories.length === 0 ? (
          <ActivityIndicator color={servicesColors.primary} style={{ marginTop: 24 }} />
        ) : visible.length === 0 ? (
          <Text style={styles.empty}>{t("services.empty")}</Text>
        ) : (
          visible.map((category) => (
            <ServiceCategorySection
              key={category.id}
              category={category}
              onPressService={(service) => openPatientService(navigation, service)}
              onViewAll={(row) => {
                setFilterCategory(row.id);
                setShowFilters(true);
              }}
            />
          ))
        )}
        <ServicesQuoteBanner />
      </ScrollView>

      <HomeBottomNav
        variant="light"
        activeTab="services"
        onTabPress={(tab) => {
          if (tab === "home") navigation.navigate("Home");
          if (tab === "services") return;
          if (tab === "factor") navigation.navigate("Factor");
          if (tab === "notifications") navigation.navigate("Notifications");
          if (tab === "profile") navigation.navigate("Profile");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: servicesColors.pageBg,
  },
  stickyHeader: {
    backgroundColor: servicesColors.white,
    zIndex: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: servicesSpacing.screen,
    paddingTop: 12,
    paddingBottom: servicesSpacing.bottomScrollPadding,
  },
  searchWrap: {
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: servicesSpacing.screen,
    backgroundColor: servicesColors.white,
  },
  error: {
    marginTop: 12,
    color: servicesColors.primary,
    fontSize: 13,
  },
  empty: {
    marginTop: 24,
    textAlign: "center",
    color: servicesColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  filterHint: {
    marginTop: 0,
    marginBottom: 8,
    paddingHorizontal: servicesSpacing.screen,
    fontSize: 12,
    fontWeight: "600",
    color: servicesColors.primary,
    backgroundColor: servicesColors.white,
  },
});
