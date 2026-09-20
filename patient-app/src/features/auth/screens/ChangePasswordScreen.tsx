import { useEffect, useRef, useState, type RefObject } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { StackScreenProps } from "@react-navigation/stack";

import type { RootStackParamList } from "@/core/navigation/types";
import { useAuth } from "@/core/auth/AuthContext";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { KeyboardFormScroll, type KeyboardFormScrollRef } from "@/features/auth/components/KeyboardFormScroll";
import { nhmsColors } from "@/features/auth/theme/nhmsTheme";

type Props = StackScreenProps<RootStackParamList, "ChangePassword">;

export default function ChangePasswordScreen({}: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<KeyboardFormScrollRef>(null);
  const currentWrapRef = useRef<View>(null);
  const newWrapRef = useRef<View>(null);
  const confirmWrapRef = useRef<View>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  function scrollField(fieldRef: RefObject<View | null>, height = keyboardHeight) {
    scrollRef.current?.scrollFieldAboveKeyboard(fieldRef, height || 280, Math.max(insets.bottom, 12));
  }

  function focusField(fieldRef: RefObject<View | null>) {
    const delays = keyboardVisible ? [0, 50] : [80, 180, 320];
    delays.forEach((delay) => {
      setTimeout(() => scrollField(fieldRef), delay);
    });
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
  }, [insets.bottom]);

  async function onSubmit() {
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the temporary password.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }]}>
      <KeyboardFormScroll
        ref={scrollRef}
        keyboardVisible={keyboardVisible}
        extraBottomPadding={keyboardHeight}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Create a new password</Text>
        <Text style={styles.copy}>
          Your first login used a temporary password from NHMS. Set a new password now. The temporary password will stop
          working.
        </Text>

        <View style={styles.form}>
          <View ref={currentWrapRef} collapsable={false}>
            <AuthTextField
              icon="lock-closed-outline"
              placeholder="Temporary password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              onFocus={() => focusField(currentWrapRef)}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => newPasswordRef.current?.focus()}
              textContentType="password"
              autoComplete="password"
            />
          </View>
          <View ref={newWrapRef} collapsable={false}>
            <AuthTextField
              ref={newPasswordRef}
              icon="lock-closed-outline"
              placeholder="New password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              onFocus={() => focusField(newWrapRef)}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              textContentType="newPassword"
              autoComplete="password-new"
            />
          </View>
          <View ref={confirmWrapRef} collapsable={false}>
            <AuthTextField
              ref={confirmPasswordRef}
              icon="lock-closed-outline"
              placeholder="Confirm new password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => focusField(confirmWrapRef)}
              returnKeyType="done"
              onSubmitEditing={() => void onSubmit()}
              textContentType="newPassword"
              autoComplete="password-new"
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={() => void onSubmit()} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? "Saving…" : "Save password and continue"}</Text>
        </Pressable>
      </KeyboardFormScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: nhmsColors.navy,
  },
  copy: {
    marginTop: 8,
    marginBottom: 16,
    color: nhmsColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    gap: 10,
  },
  error: {
    color: nhmsColors.primaryRed,
    marginTop: 10,
    marginBottom: 10,
    fontSize: 12,
  },
  button: {
    marginTop: 8,
    backgroundColor: nhmsColors.primaryRed,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
