import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SecondaryButton } from "../../components/SecondaryButton";
import { spacing } from "../../theme/tokens";
import type { CapturedPhoto } from "./types";

/**
 * design/KAN-5/Preview.dc.html (AC-1: Use photo starts the save; Retake reopens the camera).
 *
 * The canvas has no visible back control on this screen - a swipe-back/hardware-back gesture is
 * the implied trigger for Discard.dc.html's confirm sheet, which a testable RTL suite can't drive
 * the same way a device can. A small top-left chevron gives an equivalent, testable affordance
 * instead; flagged here as a deliberate, minor reading rather than a silent guess.
 *
 * `dimmed` renders the KAN-5 Discard.dc.html composition: this screen underneath, its own actions
 * inert, while DiscardConfirmSheet sits on top.
 */
export function PhotoPreviewView({
  photo,
  dimmed = false,
  onRequestDiscard,
  onRetake,
  onUsePhoto,
}: {
  photo: CapturedPhoto;
  dimmed?: boolean;
  onRequestDiscard: () => void;
  onRetake: () => void;
  onUsePhoto: () => void;
}) {
  return (
    <View style={styles.screen} testID="photo-preview">
      <View style={styles.previewArea}>
        <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />
        {!dimmed && (
          <Pressable
            style={styles.backButton}
            onPress={onRequestDiscard}
            accessibilityRole="button"
            accessibilityLabel="Discard photo"
          >
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>
        )}
        <View style={styles.hintRow} pointerEvents="none">
          <Text style={styles.hint}>Check the total is readable</Text>
        </View>
        {dimmed && <View style={styles.scrim} />}
      </View>
      <View style={[styles.sheet, dimmed && styles.sheetInert]} pointerEvents={dimmed ? "none" : "auto"}>
        <View style={styles.actionsRow}>
          <View style={styles.retakeSlot}>
            <SecondaryButton label="Retake" onPress={onRetake} />
          </View>
          <View style={styles.useSlot}>
            <PrimaryButton label="Use photo" onPress={onUsePhoto} />
          </View>
        </View>
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
  backButton: {
    position: "absolute",
    top: 12,
    left: 8,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backGlyph: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "600",
  },
  hintRow: {
    position: "absolute",
    top: 67,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hint: {
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 34,
  },
  sheetInert: {
    opacity: 0.3,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  retakeSlot: {
    width: 132,
    flexShrink: 0,
  },
  useSlot: {
    flexGrow: 1,
  },
});
