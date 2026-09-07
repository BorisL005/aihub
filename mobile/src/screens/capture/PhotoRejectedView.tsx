import { Image, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { QuietButton } from "../../components/QuietButton";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/tokens";
import type { CapturedPhoto } from "./types";

// design/KAN-5/PhotoRejected.dc.html (AC-4: not retryable - the object was already deleted from
// R2, so the action is a fresh photo, never "try again" with this one).
export function PhotoRejectedView({
  photo,
  onTakeAnotherPhoto,
  onBackToReceipts,
}: {
  photo: CapturedPhoto;
  onTakeAnotherPhoto: () => void;
  onBackToReceipts: () => void;
}) {
  return (
    <View style={styles.screen} testID="photo-rejected">
      <View style={styles.previewArea}>
        <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.sheet}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>This photo won&apos;t work</Text>
          <Text style={styles.bannerBody}>
            It&apos;s too big or in a format we can&apos;t read. Take another one and it&apos;ll be smaller.
          </Text>
        </View>
        <PrimaryButton label="Take another photo" onPress={onTakeAnotherPhoto} />
        <QuietButton label="Back to receipts" onPress={onBackToReceipts} />
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
    gap: spacing.xs,
  },
  banner: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.warnTint,
    gap: 3,
    marginBottom: spacing.sm,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.warn,
  },
  bannerBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
});
