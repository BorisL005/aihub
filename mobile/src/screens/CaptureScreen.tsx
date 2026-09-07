import { Linking, View } from "react-native";
import type { Entry } from "../api/types";
import { CameraLiveView } from "./capture/CameraLiveView";
import { DiscardConfirmSheet } from "./capture/DiscardConfirmSheet";
import { PermissionAskView } from "./capture/PermissionAskView";
import { PermissionDeniedView } from "./capture/PermissionDeniedView";
import { PhotoPreviewView } from "./capture/PhotoPreviewView";
import { PhotoRejectedView } from "./capture/PhotoRejectedView";
import { SaveErrorView } from "./capture/SaveErrorView";
import { SavingView } from "./capture/SavingView";
import { useCaptureFlow } from "./capture/useCaptureFlow";

/** Orchestrates design/KAN-5/'s 11 artboards over dev.aihub.ingestion's capture endpoints (KAN-5). */
export function CaptureScreen({
  projectId,
  onSaved,
  onExit,
}: {
  projectId: string;
  onSaved: (entry: Entry) => void;
  onExit: () => void;
}) {
  const flow = useCaptureFlow({ projectId, onSaved, onExit, openSettings: () => Linking.openSettings() });
  const { state } = flow;

  switch (state.phase) {
    case "resolving-permission":
      // Genuinely brief (a single async permission read) - nothing meaningful to paint yet.
      return <View style={{ flex: 1, backgroundColor: "#000000" }} testID="capture-resolving" />;
    case "permission-ask":
      return <PermissionAskView onAllow={flow.allowCamera} onDecline={flow.declinePermission} />;
    case "permission-denied":
      return <PermissionDeniedView onOpenSettings={flow.openSettings} onBack={flow.backToReceipts} />;
    case "camera":
      return <CameraLiveView onCapture={flow.onPhotoTaken} onCancel={flow.cancelCamera} />;
    case "preview":
      return (
        <PhotoPreviewView
          photo={state.photo}
          onRequestDiscard={flow.requestDiscard}
          onRetake={flow.retake}
          onUsePhoto={flow.usePhoto}
        />
      );
    case "discard-confirm":
      return (
        <View style={{ flex: 1 }}>
          <PhotoPreviewView
            photo={state.photo}
            dimmed
            onRequestDiscard={flow.requestDiscard}
            onRetake={flow.retake}
            onUsePhoto={flow.usePhoto}
          />
          <DiscardConfirmSheet onKeep={flow.keepPhoto} onDiscard={flow.confirmDiscard} />
        </View>
      );
    case "saving":
      return <SavingView photo={state.photo} progress={state.progress} onCancel={flow.cancelSaving} />;
    case "save-error":
      return <SaveErrorView photo={state.photo} onRetry={flow.retrySave} onBackToReceipts={flow.backToReceipts} />;
    case "photo-rejected":
      return (
        <PhotoRejectedView
          photo={state.photo}
          onTakeAnotherPhoto={flow.takeAnotherPhoto}
          onBackToReceipts={flow.backToReceipts}
        />
      );
  }
}
