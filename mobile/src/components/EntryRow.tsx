import { StyleSheet, Text, View } from "react-native";
import type { Entry } from "../api/types";
import { colors } from "../theme/colors";
import { entryRow, spacing, typography } from "../theme/tokens";
import { formatAmount } from "../utils/formatAmount";
import { formatEntryTime } from "../utils/formatEntryTime";
import { SourceIndicator } from "./SourceIndicator";
import { StatusBadge } from "./StatusBadge";

interface ExtractedFields {
  merchant: string;
  amount: string;
}

// Defensive the same way StatusBadge is about an out-of-union status: `payload` has no runtime
// schema check between the backend and here, so a status of "extracted" with an incomplete
// payload falls back to the pre-extraction row rather than rendering `undefined`/`NaN`.
function extractedFields(payload: Record<string, unknown>): ExtractedFields | null {
  const merchant = payload.merchant;
  const total = payload.total;
  const currency = payload.currency;
  if (typeof merchant !== "string" || typeof total !== "number" || typeof currency !== "string") {
    return null;
  }
  return { merchant, amount: formatAmount(total, currency) };
}

/**
 * DESIGN-SYSTEM.md §5 Entry row: before extraction, line 1 is "Receipt" and the right slot holds
 * the status badge. Once `extracted` (KAN-6), line 1 becomes the merchant, line 2 stays the
 * ingest time unchanged, and the right slot becomes the Amount style instead of the badge - the
 * badge exists for surfaces (like `needs_review`) that have no amount to show. AC-8 also
 * requires the row to show the entry's source - slot 1, the thumbnail, is it.
 */
export function EntryRow({ entry }: { entry: Entry }) {
  const extracted = entry.validationStatus === "extracted" ? extractedFields(entry.payload) : null;

  return (
    <View style={styles.row} testID="entry-row">
      <SourceIndicator source={entry.source} />
      <View style={styles.textStack}>
        <Text style={styles.line1} numberOfLines={1}>
          {extracted?.merchant ?? "Receipt"}
        </Text>
        <Text style={styles.line2} numberOfLines={1}>
          {formatEntryTime(entry.ts)}
        </Text>
      </View>
      <View style={styles.rightSlot}>
        {extracted ? (
          <Text style={styles.amount} numberOfLines={1} testID="entry-amount">
            {extracted.amount}
          </Text>
        ) : (
          <StatusBadge status={entry.validationStatus} />
        )}
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
  amount: {
    fontSize: typography.amount.fontSize,
    lineHeight: typography.amount.lineHeight,
    fontWeight: typography.amount.fontWeight,
    letterSpacing: typography.amount.letterSpacing,
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
});
