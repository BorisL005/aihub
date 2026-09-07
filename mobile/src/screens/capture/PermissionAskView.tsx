import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { QuietButton } from "../../components/QuietButton";
import { colors } from "../../theme/colors";
import { spacing, typography } from "../../theme/tokens";

// design/KAN-5/PermissionAsk.dc.html. "Allow camera" opens the OS permission prompt - never a
// look-alike of it (canvas note) - so onAllow must be wired straight to the OS request, not to a
// custom UI that decides the outcome itself.
export function PermissionAskView({ onAllow, onDecline }: { onAllow: () => void; onDecline: () => void }) {
  return (
    <View style={styles.screen} testID="permission-ask">
      <View style={styles.body}>
        <Text style={styles.headline}>AI Hub needs your camera</Text>
        <Text style={styles.copy}>
          You point it at a receipt, we keep the photo in your receipts. Nothing else uses the camera.
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="Allow camera" onPress={onAllow} />
        <QuietButton label="Not now" onPress={onDecline} />
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
