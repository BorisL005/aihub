import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";
import { radius, typography } from "../theme/tokens";

// DESIGN-SYSTEM.md §5 Buttons - Primary: 48 tall, control radius, ink fill, white label.
// Disabled: 35% opacity, no colour change.
export function PrimaryButton({
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
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.35,
  },
  label: {
    color: colors.surface,
    fontSize: typography.row.fontSize,
    fontWeight: typography.row.fontWeight,
    letterSpacing: typography.row.letterSpacing,
  },
});
