import { StyleSheet, Text, View } from "react-native";
import type { ValidationStatus } from "../api/types";
import { colors } from "../theme/colors";
import { radius, statusBadge, typography } from "../theme/tokens";

// DESIGN-SYSTEM.md §5 Status badge: the wording is fixed and the internal status name is
// never shown to the user.
const STATUS_LABEL: Record<ValidationStatus, string> = {
  pending: "Not read yet",
  needs_review: "Needs a check",
  extracted: "Read",
};

const STATUS_COLOR: Record<ValidationStatus, { fg: string; bg: string }> = {
  pending: { fg: colors.warn, bg: colors.warnTint },
  needs_review: { fg: colors.danger, bg: colors.dangerTint },
  extracted: { fg: colors.positive, bg: colors.positiveTint },
};

// `validation_status` has no DB-level CHECK constraint yet (follow-up ticket), so a value outside
// the closed union is reachable at runtime despite the TS type - fall back rather than crash the
// row, the same defensive posture SourceIndicator takes for `source`.
const UNKNOWN_COLOR = { fg: colors.inkMuted, bg: colors.sunk };
const UNKNOWN_LABEL = "Unknown status";

export function StatusBadge({ status }: { status: ValidationStatus }) {
  const { fg, bg } = STATUS_COLOR[status] ?? UNKNOWN_COLOR;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]} testID="status-badge">
      <Text style={[styles.label, { color: fg }]}>{STATUS_LABEL[status] ?? UNKNOWN_LABEL}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: statusBadge.height,
    paddingHorizontal: statusBadge.paddingHorizontal,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  label: {
    fontSize: typography.micro.fontSize,
    fontWeight: typography.micro.fontWeight,
    letterSpacing: typography.micro.letterSpacing,
    textTransform: "uppercase",
  },
});
