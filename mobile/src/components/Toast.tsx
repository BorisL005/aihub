import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/tokens";

const AUTO_DISMISS_MS = 3000;

// design/KAN-5/SuccessList.dc.html: "toast auto-dismisses after 3s" (AC-1 + AC-2).
export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <View style={styles.toast} testID="toast">
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.label}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: 74,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.chrome,
  },
  checkmark: {
    color: colors.onDark,
    fontSize: 15,
    fontWeight: "700",
  },
  label: {
    color: colors.onDark,
    fontSize: 15,
    fontWeight: "600",
  },
});
