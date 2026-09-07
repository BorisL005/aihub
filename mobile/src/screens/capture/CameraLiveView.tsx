import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, type CameraView as CameraViewInstance } from "expo-camera";
import { spacing } from "../../theme/tokens";
import type { CapturedPhoto } from "./types";

// design/KAN-5/CameraLive.dc.html (AC-6: Cancel returns to the list, nothing uploaded).
export function CameraLiveView({
  onCapture,
  onCancel,
}: {
  onCapture: (photo: CapturedPhoto) => void;
  onCancel: () => void;
}) {
  const cameraRef = useRef<CameraViewInstance>(null);

  async function handleShutterPress() {
    const photo = await cameraRef.current?.takePictureAsync();
    if (photo) {
      onCapture({ uri: photo.uri, width: photo.width, height: photo.height });
    }
  }

  return (
    <View style={styles.screen} testID="camera-live">
      <CameraView ref={cameraRef} style={styles.preview} facing="back" />
      <View style={styles.hintRow} pointerEvents="none">
        <Text style={styles.hint}>Fit the whole receipt in the frame</Text>
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.sideButton} onPress={onCancel} accessibilityRole="button">
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
        <Pressable
          style={styles.shutter}
          onPress={handleShutterPress}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          testID="shutter-button"
        >
          <View style={styles.shutterInner} />
        </Pressable>
        <View style={styles.sideButton} />
      </View>
    </View>
  );
}

const SHUTTER_SIZE = 68;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  preview: {
    flex: 1,
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
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 84,
    paddingHorizontal: spacing.lg,
  },
  sideButton: {
    minWidth: 68,
    height: 44,
    justifyContent: "center",
  },
  cancelLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  shutter: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: SHUTTER_SIZE / 2,
    borderWidth: 3,
    borderColor: "#ffffff",
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: "100%",
    height: "100%",
    borderRadius: SHUTTER_SIZE / 2,
    backgroundColor: "#ffffff",
  },
});
