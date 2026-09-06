import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing, typography } from "../theme/tokens";
import { PrimaryButton } from "./PrimaryButton";

// design/KAN-4/ListEmpty.dc.html (reused byte-for-byte from KAN-5's canvas per this ticket's
// Notes for design). Capture isn't built yet (KAN-5), so the button renders disabled (§5's
// Disabled variant) rather than as a live control that silently does nothing when tapped -
// a dead-looking primary CTA on the app's front door reads as a broken app.
export function EmptyState() {
  return (
    <View style={styles.container} testID="empty-state">
      <Text style={styles.headline}>No receipts yet</Text>
      <Text style={styles.body}>
        Take a photo of a receipt and you can throw the paper away straight after.
      </Text>
      <View style={styles.action}>
        <PrimaryButton label="Capture receipt" disabled />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: 40,
  },
  headline: {
    fontSize: typography.heading.fontSize,
    lineHeight: typography.heading.lineHeight,
    fontWeight: typography.heading.fontWeight,
    color: colors.ink,
    textAlign: "center",
  },
  body: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.inkMuted,
    textAlign: "center",
  },
  action: {
    marginTop: spacing.xl,
    alignSelf: "stretch",
  },
});
