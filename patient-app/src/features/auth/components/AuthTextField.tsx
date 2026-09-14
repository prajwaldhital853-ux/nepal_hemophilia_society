import { Ionicons } from "@expo/vector-icons";
import { forwardRef, type Ref } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { useLoginLayout } from "@/features/auth/hooks/useLoginLayout";
import { nhmsColors, nhmsRadii } from "@/features/auth/theme/nhmsTheme";

type AuthTextFieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  onToggleSecure?: () => void;
  value?: string;
  onChangeText?: (text: string) => void;
} & Pick<TextInputProps, "onFocus" | "onSubmitEditing" | "returnKeyType" | "blurOnSubmit" | "textContentType" | "autoComplete">;

function AuthTextFieldInner(
  {
    icon,
    placeholder,
    secureTextEntry,
    showToggle,
    onToggleSecure,
    value,
    onChangeText,
    onFocus,
    onSubmitEditing,
    returnKeyType,
    blurOnSubmit,
    textContentType,
    autoComplete,
  }: AuthTextFieldProps,
  ref: Ref<TextInput>,
) {
  const layout = useLoginLayout();

  return (
    <View style={[styles.field, { height: layout.inputHeight }]}>
      <Ionicons name={icon} size={18} color={nhmsColors.primaryRed} style={styles.leadingIcon} />
      <TextInput
        ref={ref}
        style={[styles.input, { fontSize: Math.round(13 * layout.scale) }]}
        placeholder={placeholder}
        placeholderTextColor={nhmsColors.inputPlaceholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        blurOnSubmit={blurOnSubmit}
        textContentType={textContentType}
        autoComplete={autoComplete}
      />
      {showToggle ? (
        <Pressable onPress={onToggleSecure} hitSlop={8}>
          <Ionicons
            name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
            size={18}
            color={nhmsColors.inputPlaceholder}
            style={styles.trailingIcon}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export const AuthTextField = forwardRef(AuthTextFieldInner);
AuthTextField.displayName = "AuthTextField";

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: nhmsColors.inputBorder,
    borderRadius: nhmsRadii.input,
    backgroundColor: nhmsColors.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  leadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: nhmsColors.textDark,
    paddingVertical: 0,
  },
  trailingIcon: {
    marginLeft: 8,
  },
});
