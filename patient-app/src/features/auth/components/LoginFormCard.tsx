import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { useLoginLayout } from "@/features/auth/hooks/useLoginLayout";
import { nhmsColors, nhmsRadii, nhmsTypography } from "@/features/auth/theme/nhmsTheme";

type Props = {
  rememberMe: boolean;
  onToggleRememberMe: () => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  userId: string;
  password: string;
  onChangeUserId: (value: string) => void;
  onChangePassword: (value: string) => void;
  onLogin: () => void;
  error?: string;
  loading?: boolean;
};

export function LoginFormCard({
  rememberMe,
  onToggleRememberMe,
  showPassword,
  onTogglePassword,
  userId,
  password,
  onChangeUserId,
  onChangePassword,
  onLogin,
  error,
  loading,
}: Props) {
  const layout = useLoginLayout();
  const titleSize = Math.round(nhmsTypography.cardTitle * layout.scale);
  const subtitleSize = Math.round(nhmsTypography.cardSubtitle * layout.scale);
  const linkSize = Math.round(nhmsTypography.link * layout.scale);
  const buttonSize = Math.round(nhmsTypography.button * layout.scale);
  const formGap = layout.cardGap;
  const sectionGap = layout.cardSectionGap;

  return (
    <View
      style={[
        styles.card,
        {
          maxWidth: layout.cardMaxWidth,
          paddingHorizontal: layout.cardPaddingH,
          paddingTop: layout.cardPaddingV,
          paddingBottom: layout.cardPaddingV,
        },
      ]}
    >
      <View style={styles.headerBlock}>
        <Text style={[styles.title, { fontSize: titleSize }]}>
          Welcome <Text style={styles.titleAccent}>Back!</Text>
        </Text>
        <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>
          Login to continue to your account
        </Text>
        <View style={styles.subtitleLine} />
      </View>

      <View style={[styles.formGap, { gap: formGap, marginTop: sectionGap }]}>
        <AuthTextField
          icon="person-outline"
          placeholder="Email or Unique Patient ID"
          value={userId}
          onChangeText={onChangeUserId}
        />
        <AuthTextField
          icon="lock-closed-outline"
          placeholder="Password"
          secureTextEntry={!showPassword}
          showToggle
          onToggleSecure={onTogglePassword}
          value={password}
          onChangeText={onChangePassword}
        />
      </View>

      <View style={[styles.optionsRow, { marginTop: sectionGap }]}>
        <Pressable style={styles.rememberRow} onPress={onToggleRememberMe}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
          </View>
          <Text style={[styles.rememberText, { fontSize: linkSize }]}>Remember Me</Text>
        </Pressable>
        <Pressable>
          <Text style={[styles.forgotText, { fontSize: linkSize }]}>Forgot Password?</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[
          styles.loginButton,
          {
            marginTop: sectionGap,
            height: layout.buttonHeight,
            opacity: loading ? 0.7 : 1,
          },
        ]}
        onPress={onLogin}
        disabled={loading}
      >
        <MaterialCommunityIcons name="login" size={21} color="#FFFFFF" />
        <Text style={[styles.loginButtonText, { fontSize: buttonSize }]}>{loading ? "Signing in…" : "Login"}</Text>
      </Pressable>

      <View style={[styles.dividerRow, { marginTop: sectionGap }]}>
        <View style={styles.dividerLine} />
        <View style={styles.orBadge}>
          <Text style={styles.dividerText}>or</Text>
        </View>
        <View style={styles.dividerLine} />
      </View>

        <Text style={[styles.registerText, { fontSize: linkSize, marginTop: sectionGap }]}>
          Patient accounts are created by NHMS admins. Self-registration is not allowed.
        </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: nhmsColors.white,
    borderRadius: nhmsRadii.card,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
  },
  headerBlock: {
    alignItems: "center",
  },
  title: {
    fontWeight: "700",
    color: nhmsColors.navy,
    textAlign: "center",
  },
  titleAccent: {
    color: nhmsColors.primaryRed,
  },
  subtitle: {
    marginTop: 5,
    color: nhmsColors.textMuted,
    textAlign: "center",
  },
  subtitleLine: {
    marginTop: 8,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: nhmsColors.primaryRed,
  },
  formGap: {},
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: nhmsRadii.checkbox,
    borderWidth: 1.5,
    borderColor: nhmsColors.checkboxBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: nhmsColors.white,
  },
  checkboxChecked: {
    backgroundColor: nhmsColors.primaryRed,
    borderColor: nhmsColors.primaryRed,
  },
  rememberText: {
    color: nhmsColors.textDark,
  },
  forgotText: {
    color: nhmsColors.primaryRed,
    fontWeight: "600",
  },
  errorText: {
    marginTop: 10,
    color: nhmsColors.primaryRed,
    fontSize: 12,
    textAlign: "center",
  },
  loginButton: {
    borderRadius: nhmsRadii.button,
    backgroundColor: nhmsColors.primaryRed,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loginButtonText: {
    color: nhmsColors.white,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: nhmsColors.divider,
  },
  orBadge: {
    marginHorizontal: 10,
    minWidth: nhmsRadii.orBadge,
    height: nhmsRadii.orBadge,
    borderRadius: nhmsRadii.orBadge / 2,
    borderWidth: 1,
    borderColor: nhmsColors.divider,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: nhmsColors.white,
  },
  dividerText: {
    fontSize: 11,
    color: nhmsColors.textMuted,
  },
  registerText: {
    textAlign: "center",
    color: nhmsColors.navy,
  },
  registerLink: {
    color: nhmsColors.primaryRed,
    fontWeight: "700",
  },
});
