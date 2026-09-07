import { StyleSheet, Text, View } from "react-native";
import { QuietButton } from "../../components/QuietButton";
import { SecondaryButton } from "../../components/SecondaryButton";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/tokens";

// design/KAN-5/Discard.dc.html (AC-6: nothing uploaded, no entry created either way this resolves).
export function DiscardConfirmSheet({ onKeep, onDiscard }: { onKeep: () => void; onDiscard: () => void }) {
  return (
    <View style={styles.sheet} testID="discard-confirm">
      <Text style={styles.title}>Discard this photo?</Text>
      <Text style={styles.body}>It hasn&apos;t been saved to your receipts yet.</Text>
      <View style={styles.actions}>
        <SecondaryButton label="Keep it" onPress={onKeep} />
        <QuietButton label="Discard" tone="danger" onPress={onDiscard} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 44,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.ink,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
  actions: {
    gap: 4,
  },
});
