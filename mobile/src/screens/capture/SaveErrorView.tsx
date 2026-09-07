import { Image, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { QuietButton } from "../../components/QuietButton";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/tokens";
import type { CapturedPhoto } from "./types";

// design/KAN-5/UploadError.dc.html - the shared state for AC-5 (upload failed), AC-7 (expired
// presigned URL) and AC-9 (unclaimable media_ref): design review ruling 1, they're all
// "couldn't save, try again" from here. The photo stays on device until the entry exists.
export function SaveErrorView({
  photo,
  onRetry,
  onBackToReceipts,
}: {
  photo: CapturedPhoto;
  onRetry: () => void;
  onBackToReceipts: () => void;
}) {
  return (
    <View style={styles.screen} testID="save-error">
      <View style={styles.previewArea}>
        <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.sheet}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Couldn&apos;t save that receipt</Text>
          <Text style={styles.bannerBody}>Your photo is still here. Check your connection and try again.</Text>
        </View>
        <PrimaryButton label="Try again" onPress={onRetry} />
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
    backgroundColor: colors.dangerTint,
    gap: 3,
    marginBottom: spacing.sm,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.danger,
  },
  bannerBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
});
