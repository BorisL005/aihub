import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";
import { radius, typography } from "../theme/tokens";

// DESIGN-SYSTEM.md §5 Buttons - Quiet: 44 tall, transparent, no border. `tone` picks the label
// colour: "muted" for a neutral dismissal (Cancel, Back to receipts), "danger" for a destructive
// one (Discard).
export function QuietButton({
  label,
  onPress,
  tone = "muted",
}: {
  label: string;
  onPress?: () => void;
  tone?: "muted" | "danger";
}) {
  return (
    <Pressable style={styles.button} onPress={onPress} accessibilityRole="button">
      <Text style={[styles.label, tone === "danger" ? styles.danger : styles.muted]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    letterSpacing: -0.006 * typography.body.fontSize,
  },
  muted: {
    color: colors.inkMuted,
  },
  danger: {
    color: colors.danger,
  },
});
