import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { QuietButton } from "../../components/QuietButton";
import { colors } from "../../theme/colors";
import { spacing, typography } from "../../theme/tokens";

// design/KAN-5/PermissionDenied.dc.html. Two ways out: Settings, or back to the list.
export function PermissionDeniedView({
  onOpenSettings,
  onBack,
}: {
  onOpenSettings: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.screen} testID="permission-denied">
      <View style={styles.body}>
        <Text style={styles.headline}>Camera access is off</Text>
        <Text style={styles.copy}>
          Turn it on for AI Hub in Settings and come back - then you can photograph a receipt.
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="Open Settings" onPress={onOpenSettings} />
        <QuietButton label="Back to receipts" onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "space-between",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  headline: {
    fontSize: typography.title.fontSize,
    lineHeight: typography.title.lineHeight,
    fontWeight: typography.title.fontWeight,
    color: colors.ink,
  },
  copy: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.inkMuted,
  },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
