import { forwardRef, useImperativeHandle, useRef, type ReactNode, type RefObject } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type KeyboardFormScrollRef = {
  scrollTo: (y: number) => void;
  scrollToEnd: () => void;
  scrollFieldAboveKeyboard: (
    fieldRef: RefObject<View | null>,
    keyboardHeight: number,
    bottomInset?: number,
  ) => void;
};

type Props = {
  children: ReactNode;
  keyboardVerticalOffset?: number;
  keyboardVisible?: boolean;
  extraBottomPadding?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
} & Pick<ScrollViewProps, "keyboardShouldPersistTaps" | "showsVerticalScrollIndicator">;

export const KeyboardFormScroll = forwardRef<KeyboardFormScrollRef, Props>(function KeyboardFormScroll(
  {
    children,
    keyboardVerticalOffset = 0,
    keyboardVisible = false,
    extraBottomPadding = 0,
    contentContainerStyle,
    ...scrollProps
  },
  ref,
) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);

  useImperativeHandle(ref, () => ({
    scrollTo: (y: number) => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    },
    scrollToEnd: () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    },
    scrollFieldAboveKeyboard: (fieldRef, keyboardHeight, bottomInset = 0) => {
      fieldRef.current?.measureInWindow((_x, y, _w, h) => {
        const fieldBottom = y + h;
        const visibleBottom = Dimensions.get("window").height - keyboardHeight - bottomInset - 20;
        const overlap = fieldBottom - visibleBottom;
        if (overlap > 0) {
          scrollRef.current?.scrollTo({ y: scrollY.current + overlap, animated: true });
        }
      });
    },
  }));

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={keyboardVisible ? (Platform.OS === "ios" ? "padding" : "height") : undefined}
      enabled={keyboardVisible}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        ref={scrollRef}
        scrollEnabled={keyboardVisible}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        automaticallyAdjustKeyboardInsets={keyboardVisible}
        onScroll={(event) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, 24) + (keyboardVisible ? extraBottomPadding : 0),
          },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={keyboardVisible}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
});
