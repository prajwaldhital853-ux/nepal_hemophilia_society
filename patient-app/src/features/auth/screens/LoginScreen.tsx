import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/core/navigation/RootNavigator";
import { LoginFooter } from "@/features/auth/components/LoginFooter";
import { LoginFormCard } from "@/features/auth/components/LoginFormCard";
import { LoginHeader } from "@/features/auth/components/LoginHeader";
import { SaferTomorrowBanner } from "@/features/auth/components/SaferTomorrowBanner";
import { useLoginLayout } from "@/features/auth/hooks/useLoginLayout";
import { nhmsColors } from "@/features/auth/theme/nhmsTheme";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const layout = useLoginLayout();
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={[styles.screen, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <LoginHeader />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <View style={styles.bodyContent}>
          <SaferTomorrowBanner />
          <View
            style={[
              styles.cardWrap,
              {
                paddingHorizontal: layout.cardSidePadding,
                marginTop: Math.round(4 * layout.bodyDensity),
              },
            ]}
          >
            <LoginFormCard
              navigation={navigation}
              rememberMe={rememberMe}
              onToggleRememberMe={() => setRememberMe((value) => !value)}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((value) => !value)}
              userId={userId}
              password={password}
              onChangeUserId={setUserId}
              onChangePassword={setPassword}
              onLogin={() => navigation.replace("Home")}
            />
          </View>
          {!keyboardVisible ? (
            <>
              <View style={styles.flexSpacer} />
              <LoginFooter />
            </>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: nhmsColors.white,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flex: 1,
  },
  cardWrap: {
    alignItems: "center",
    flexShrink: 0,
  },
  flexSpacer: {
    flex: 1,
    minHeight: 0,
  },
});
