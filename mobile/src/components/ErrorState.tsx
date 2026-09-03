import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing, typography } from "../theme/tokens";
import { PrimaryButton } from "./PrimaryButton";

// design/KAN-4/ListError.dc.html. Deliberately offers only "Try again" - this screen is the
// app's front door (no picker, no screen behind it), so there is no "back" to give.
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.container} testID="error-state">
      <Text style={styles.headline}>Couldn&apos;t load your receipts</Text>
      <Text style={styles.body}>Check your connection and try again.</Text>
      <View style={styles.action}>
        <PrimaryButton label="Try again" onPress={onRetry} />
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
