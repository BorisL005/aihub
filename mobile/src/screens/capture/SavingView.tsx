import { Image, StyleSheet, Text, View } from "react-native";
import { QuietButton } from "../../components/QuietButton";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/tokens";
import type { CapturedPhoto } from "./types";

// design/KAN-5/Uploading.dc.html (AC-1: ONE bar, monotonic, never resets between the two network
// steps; AC-11: Cancel is accepted mid-save).
export function SavingView({
  photo,
  progress,
  onCancel,
}: {
  photo: CapturedPhoto;
  progress: number;
  onCancel: () => void;
}) {
  const percent = Math.round(progress * 100);
  return (
    <View style={styles.screen} testID="saving">
      <View style={styles.previewArea}>
        <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.sheet}>
        <View style={styles.progressHeader}>
          <Text style={styles.label}>Saving your receipt</Text>
          <Text style={styles.percent} testID="saving-percent">
            {percent}%
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.hint}>Keep the app open until it finishes.</Text>
        <QuietButton label="Cancel" onPress={onCancel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  previewArea: {
    flex: 1,
  },
  image: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 34,
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  percent: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
  track: {
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.sunk,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  hint: {
    fontSize: 14,
    color: colors.inkMuted,
  },
});
