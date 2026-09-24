import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { servicesColors, servicesRadii, servicesType } from "@/features/services/theme/servicesTheme";

/** Scroll padding that clears the Android navigation / iOS home-indicator area (app draws edge-to-edge). */
export function useBottomPadding(extra = 32) {
  return useSafeAreaInsets().bottom + extra;
}

export function ServicesStatusBar() {
  return <StatusBar barStyle="dark-content" backgroundColor={servicesColors.pageBg} />;
}

export function ScreenIntro({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.intro}>
      <ServicesStatusBar />
      {eyebrow ? <Text style={servicesType.eyebrow}>{eyebrow}</Text> : null}
      <Text style={[servicesType.display, eyebrow ? styles.introTitleSpaced : null]}>{title}</Text>
      {lead ? <Text style={[servicesType.lead, styles.introLead]}>{lead}</Text> : null}
      {children}
    </View>
  );
}

export function SectionHeading({
  index,
  title,
  meta,
  style,
}: {
  index?: number;
  title: string;
  meta?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionHead, style]}>
      <View style={styles.sectionTitleRow}>
        {index != null ? <Text style={styles.sectionIndex}>{String(index).padStart(2, "0")}</Text> : null}
        <Text style={styles.sectionTitle} numberOfLines={2}>
          {title}
        </Text>
        {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
      </View>
    </View>
  );
}

export function Panel({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.panel, padded && styles.panelPadded, style]}>{children}</View>;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.divider, { marginLeft: inset }]} />;
}

/** Underlined text tabs — used instead of pill chips for filters. */
export function TabStrip<T extends string>({
  options,
  value,
  onChange,
  labelFor,
  style,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  labelFor?: (option: T) => string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.tabsWrap, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                {labelFor ? labelFor(option) : option}
              </Text>
              <View style={[styles.tabBar, active && styles.tabBarActive]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Compact two-option switch for chart ranges etc. */
export function Toggle<T extends string>({
  options,
  value,
  onChange,
  labelFor,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  labelFor?: (option: T) => string;
}) {
  return (
    <View style={styles.toggle}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable key={option} onPress={() => onChange(option)} style={[styles.toggleItem, active && styles.toggleItemActive]}>
            <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{labelFor ? labelFor(option) : option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export type StatItem = { label: string; value: string; note?: string; noteColor?: string };

/** Figures laid out in a single row, separated by hairlines. */
export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <Panel padded={false} style={styles.statStrip}>
      {items.map((item, i) => (
        <View key={item.label} style={[styles.stat, i > 0 && styles.statDivided]}>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {item.value}
          </Text>
          <Text style={styles.statLabel} numberOfLines={2}>
            {item.label}
          </Text>
          {item.note ? (
            <Text style={[styles.statNote, item.noteColor ? { color: item.noteColor } : null]} numberOfLines={2}>
              {item.note}
            </Text>
          ) : null}
        </View>
      ))}
    </Panel>
  );
}

export function StatusTag({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "alert" | "neutral" }) {
  const palette = {
    good: { fg: servicesColors.good, bg: servicesColors.goodTint },
    warn: { fg: servicesColors.warn, bg: servicesColors.warnTint },
    alert: { fg: servicesColors.primary, bg: servicesColors.primaryTint },
    neutral: { fg: servicesColors.inkSoft, bg: servicesColors.paperDeep },
  }[tone];
  return (
    <View style={[styles.tag, { backgroundColor: palette.bg }]}>
      <View style={[styles.tagDot, { backgroundColor: palette.fg }]} />
      <Text style={[styles.tagText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export function LinkRow({
  icon,
  label,
  detail,
  onPress,
  tint = servicesColors.ink,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  onPress: () => void;
  tint?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
      <Ionicons name={icon} size={19} color={tint} />
      <View style={styles.linkText}>
        <Text style={servicesType.label} numberOfLines={1}>
          {label}
        </Text>
        {detail ? (
          <Text style={servicesType.meta} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={servicesColors.borderStrong} />
    </Pressable>
  );
}

export function EmptyNote({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyRule} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.error}>
      <Ionicons name="alert-circle-outline" size={18} color={servicesColors.primary} />
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Text style={styles.errorRetry}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ServicesStatusBar />
      <ActivityIndicator color={servicesColors.primary} />
    </View>
  );
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingTop: 20,
    paddingBottom: 18,
  },
  introTitleSpaced: {
    marginTop: 6,
  },
  introLead: {
    marginTop: 8,
    maxWidth: 520,
  },
  sectionHead: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: servicesColors.borderStrong,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  sectionIndex: {
    fontSize: 12,
    fontWeight: "700",
    color: servicesColors.primary,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  sectionTitle: {
    ...servicesType.title,
    fontSize: 18,
    lineHeight: 23,
    flex: 1,
  },
  sectionMeta: {
    fontSize: 12,
    color: servicesColors.textMuted,
    fontVariant: ["tabular-nums"],
  },
  panel: {
    backgroundColor: servicesColors.cardBg,
    borderRadius: servicesRadii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: servicesColors.borderStrong,
    overflow: "hidden",
  },
  panelPadded: {
    padding: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: servicesColors.border,
  },
  tabsWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: servicesColors.borderStrong,
  },
  tabsRow: {
    gap: 20,
  },
  tab: {
    paddingTop: 10,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: "500",
    color: servicesColors.textMuted,
    paddingBottom: 9,
  },
  tabTextActive: {
    color: servicesColors.ink,
    fontWeight: "700",
  },
  tabBar: {
    height: 2,
    borderRadius: 1,
    backgroundColor: "transparent",
  },
  tabBarActive: {
    backgroundColor: servicesColors.primary,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: servicesColors.paperDeep,
    borderRadius: 8,
    padding: 2,
  },
  toggleItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  toggleItemActive: {
    backgroundColor: servicesColors.white,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: servicesColors.textMuted,
  },
  toggleTextActive: {
    color: servicesColors.ink,
  },
  statStrip: {
    flexDirection: "row",
  },
  stat: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statDivided: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: servicesColors.border,
  },
  statValue: {
    ...servicesType.figure,
    fontSize: 24,
    lineHeight: 28,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: servicesColors.inkSoft,
  },
  statNote: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: servicesColors.textMuted,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkText: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    backgroundColor: servicesColors.pageBg,
  },
  empty: {
    paddingVertical: 36,
    alignItems: "center",
  },
  emptyRule: {
    width: 28,
    height: 2,
    backgroundColor: servicesColors.borderStrong,
    marginBottom: 14,
  },
  emptyTitle: {
    ...servicesType.title,
    fontSize: 17,
    textAlign: "center",
  },
  emptyBody: {
    ...servicesType.meta,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
    maxWidth: 300,
  },
  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: servicesRadii.card,
    backgroundColor: servicesColors.primaryTint,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: servicesColors.primaryDark,
  },
  errorRetry: {
    fontSize: 13,
    fontWeight: "700",
    color: servicesColors.primary,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: servicesColors.pageBg,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 10,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: servicesColors.inkSoft,
  },
});
