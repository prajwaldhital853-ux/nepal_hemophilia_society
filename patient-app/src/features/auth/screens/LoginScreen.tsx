import { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError, checkApiReachable } from "@/core/api";
import { AppConfig } from "@/core/config";
import { useAuth } from "@/core/auth/AuthContext";
import { KeyboardFormScroll, type KeyboardFormScrollRef } from "@/features/auth/components/KeyboardFormScroll";
import { LoginFooter } from "@/features/auth/components/LoginFooter";
import { LoginFormCard } from "@/features/auth/components/LoginFormCard";
import { LoginHeader } from "@/features/auth/components/LoginHeader";
import { SaferTomorrowBanner } from "@/features/auth/components/SaferTomorrowBanner";
import { useLoginLayout } from "@/features/auth/hooks/useLoginLayout";
import { nhmsColors } from "@/features/auth/theme/nhmsTheme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const layout = useLoginLayout();
  const scrollRef = useRef<KeyboardFormScrollRef>(null);
  const passwordWrapRef = useRef<View>(null);
  const { login } = useAuth();
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [connectionHint, setConnectionHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState("");
  const [lockLabel, setLockLabel] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  function scrollPasswordAboveKeyboard(height = keyboardHeight) {
    scrollRef.current?.scrollFieldAboveKeyboard(
      passwordWrapRef,
      height || 280,
      Math.max(insets.bottom, 6),
    );
  }

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const until = new Date(lockedUntil).getTime();
      const seconds = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      const minutes = Math.floor(seconds / 60);
      const rest = seconds % 60;
      setLockLabel(`${minutes}:${String(rest).padStart(2, "0")}`);
      if (seconds <= 0) {
        setLockedUntil("");
        setError("");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  useEffect(() => {
    let cancelled = false;
    void checkApiReachable(5000)
      .then(() => {
        if (!cancelled) setConnectionHint("");
      })
      .catch(() => {
        if (!cancelled) {
          setConnectionHint(
            `Cannot reach ${AppConfig.apiBaseUrl}. Check Wi‑Fi, firewall, and run: python manage.py runserver 0.0.0.0:8000`,
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function focusPasswordField() {
    const delays = keyboardVisible ? [0, 50] : [80, 180, 320];
    delays.forEach((delay) => {
      setTimeout(scrollPasswordAboveKeyboard, delay);
    });
  }

  async function onLogin() {
    setError("");
    if (lockedUntil) return;
    if (!userId.trim() || !password) {
      setError("Enter your email or patient ID and password.");
      return;
    }
    setLoading(true);
    try {
      await login(userId.trim(), password.trim());
    } catch (err) {
      if (err instanceof ApiError && (err.code === "device_locked" || err.status === 423)) {
        setLockedUntil(err.lockedUntil || new Date(Date.now() + (err.retryAfterSeconds || 300) * 1000).toISOString());
        setError(err.message);
      } else if (err instanceof ApiError && err.status === 401) {
        setError(
          err.attemptsRemaining !== undefined
            ? `${err.message} Attempts left on this device: ${err.attemptsRemaining}.`
            : err.message || "Invalid patient ID/email or password.",
        );
      } else if (err instanceof ApiError && err.status === 0) {
        setError(err.message);
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

      <Pressable onPress={Keyboard.dismiss} style={styles.dismissTap}>
        <LoginHeader />
      </Pressable>

      <KeyboardFormScroll
        ref={scrollRef}
        keyboardVisible={keyboardVisible}
        extraBottomPadding={keyboardHeight}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        {!keyboardVisible ? <SaferTomorrowBanner /> : null}
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
            passwordWrapRef={passwordWrapRef}
            rememberMe={rememberMe}
            onToggleRememberMe={() => setRememberMe((value) => !value)}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword((value) => !value)}
            userId={userId}
            password={password}
            onChangeUserId={setUserId}
            onChangePassword={setPassword}
            onLogin={() => void onLogin()}
            onPasswordFocus={focusPasswordField}
            error={error}
            connectionHint={connectionHint}
            loading={loading}
            locked={Boolean(lockedUntil)}
            lockLabel={lockLabel}
          />
        </View>
        {!keyboardVisible ? (
          <View style={styles.footerWrap}>
            <LoginFooter />
          </View>
        ) : null}
      </KeyboardFormScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: nhmsColors.white,
  },
  dismissTap: {
    flexShrink: 0,
  },
  cardWrap: {
    alignItems: "center",
  },
  footerWrap: {
    marginTop: "auto",
    paddingTop: 8,
  },
});
