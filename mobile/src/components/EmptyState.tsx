import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing, typography } from "../theme/tokens";

// design/KAN-5/ListEmpty.dc.html. The Capture button itself lives in ReceiptsListScreen's footer,
// not here - "same capture button position as the populated list" (canvas note) means one shared
// footer element, not two screens each drawing their own copy of it.
export function EmptyState() {
  return (
    <View style={styles.container} testID="empty-state">
      <Text style={styles.headline}>No receipts yet</Text>
      <Text style={styles.body}>
        Take a photo of a receipt and you can throw the paper away straight after.
      </Text>
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
});
