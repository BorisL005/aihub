import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";
import { radius, typography } from "../theme/tokens";

// DESIGN-SYSTEM.md §5 Buttons - Primary: 48 tall, control radius, ink fill, white label.
export function PrimaryButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress} accessibilityRole="button">
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
  label: {
    color: colors.surface,
    fontSize: typography.row.fontSize,
    fontWeight: typography.row.fontWeight,
    letterSpacing: typography.row.letterSpacing,
  },
});
