import { Suspense, lazy, type ComponentType } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type LazyScreenOptions = {
  fallback?: ComponentType;
};

const DefaultFallback = () => (
  <View style={styles.loader}>
    <ActivityIndicator size="large" color="#DC2626" />
  </View>
);

/**
 * Wraps React.lazy dynamic imports with Suspense for code splitting.
 * Screen bundles load only when the user navigates to that route.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyScreen(
  factory: () => Promise<{ default: ComponentType<any> }>,
  options?: LazyScreenOptions,
) {
  const LazyComponent = lazy(factory);
  const Fallback = options?.fallback ?? DefaultFallback;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function LazyScreenWrapper(props: any) {
    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
});
