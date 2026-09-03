import { StyleSheet, Text, View } from "react-native";
import type { Entry } from "../api/types";
import { colors } from "../theme/colors";
import { entryRow, radius, spacing, typography } from "../theme/tokens";
import { formatEntryTime } from "../utils/formatEntryTime";
import { StatusBadge } from "./StatusBadge";

/**
 * DESIGN-SYSTEM.md §5 Entry row: this slice's line 1 is always "Receipt" and the right slot
 * always holds the status badge - KAN-6 swaps in merchant + amount without reflowing the row.
 */
export function EntryRow({ entry }: { entry: Entry }) {
  return (
    <View style={styles.row} testID="entry-row">
      <View style={styles.thumbnail} />
      <View style={styles.textStack}>
        <Text style={styles.line1} numberOfLines={1}>
          Receipt
        </Text>
        <Text style={styles.line2} numberOfLines={1}>
          {formatEntryTime(entry.ts)}
        </Text>
      </View>
      <View style={styles.rightSlot}>
        <StatusBadge status={entry.validationStatus} />
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: entryRow.height,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  divider: {
    position: "absolute",
    left: entryRow.dividerInset,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: colors.line,
  },
  thumbnail: {
    width: entryRow.thumbnailSize,
    height: entryRow.thumbnailSize,
    borderRadius: radius.control,
    backgroundColor: colors.sunk,
    borderWidth: 1,
    borderColor: colors.line,
  },
  textStack: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  line1: {
    fontSize: typography.row.fontSize,
    lineHeight: typography.row.lineHeight,
    fontWeight: typography.row.fontWeight,
    letterSpacing: typography.row.letterSpacing,
    color: colors.ink,
  },
  line2: {
    fontSize: typography.label.fontSize,
    lineHeight: typography.label.lineHeight,
    color: colors.inkMuted,
    fontVariant: ["tabular-nums"],
  },
  rightSlot: {
    minWidth: entryRow.rightSlotMinWidth,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
