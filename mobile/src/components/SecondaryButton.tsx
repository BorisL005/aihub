import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";
import { radius, typography } from "../theme/tokens";

// DESIGN-SYSTEM.md §5 Buttons - Secondary: 48 tall, control radius, white fill, hairline border, ink label.
export function SecondaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    color: colors.ink,
    fontSize: typography.row.fontSize,
    fontWeight: typography.row.fontWeight,
    letterSpacing: typography.row.letterSpacing,
  },
});
