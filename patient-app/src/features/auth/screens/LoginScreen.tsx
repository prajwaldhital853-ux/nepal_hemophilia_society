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

import { ApiError, checkApiReachable } from "@/core/api";
import { AppConfig } from "@/core/config";
import { useAuth } from "@/core/auth/AuthContext";
import { LoginFooter } from "@/features/auth/components/LoginFooter";
import { LoginFormCard } from "@/features/auth/components/LoginFormCard";
import { LoginHeader } from "@/features/auth/components/LoginHeader";
import { SaferTomorrowBanner } from "@/features/auth/components/SaferTomorrowBanner";
import { useLoginLayout } from "@/features/auth/hooks/useLoginLayout";
import { nhmsColors } from "@/features/auth/theme/nhmsTheme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const layout = useLoginLayout();
  const { login } = useAuth();
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    void checkApiReachable(5000)
      .then(() => {
        if (!cancelled) setServerOk(true);
      })
      .catch(() => {
        if (!cancelled) {
          setServerOk(false);
          setError(`Cannot reach ${AppConfig.apiBaseUrl}. ${"Run: python manage.py runserver 0.0.0.0:8000"}`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onLogin() {
    setError("");
    if (!userId.trim() || !password) {
      setError("Enter your email or patient ID and password.");
      return;
    }
    if (serverOk === false) {
      setError(`Cannot reach ${AppConfig.apiBaseUrl}. Run: python manage.py runserver 0.0.0.0:8000`);
      return;
    }
    setLoading(true);
    try {
      await login(userId.trim(), password.trim());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(err.message || "Invalid patient ID/email or password.");
      } else if (err instanceof ApiError && err.code === "device_locked") {
        setError(err.message);
      } else if (err instanceof ApiError && err.status === 0) {
        setError(err.message);
      } else if (err instanceof ApiError && err.attemptsRemaining !== undefined) {
        setError(`${err.message} Attempts left on this device: ${err.attemptsRemaining}.`);
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

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
              rememberMe={rememberMe}
              onToggleRememberMe={() => setRememberMe((value) => !value)}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((value) => !value)}
              userId={userId}
              password={password}
              onChangeUserId={setUserId}
              onChangePassword={setPassword}
              onLogin={() => void onLogin()}
              error={error}
              loading={loading}
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
