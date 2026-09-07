import { useCallback, useEffect, useRef, useState } from "react";
import { useCameraPermissions } from "expo-camera";
import { ApiError } from "../../api/client";
import { MEDIA_REJECTED_TYPE } from "../../api/types";
import { putWithProgress } from "../../api/uploadWithProgress";
import { useApiClient } from "../../api/ApiClientProvider";
import type { Entry } from "../../api/types";
import { downscaleForUpload } from "../../utils/downscaleForUpload";
import { generateIdempotencyKey } from "../../utils/generateId";
import type { CapturedPhoto, CaptureState } from "./types";

// Progress milestones for the ONE bar spanning presign -> PUT -> claim (Notes for dev, KAN-5):
// monotonic, never resets between steps.
const PROGRESS_AFTER_PRESIGN = 0.05;
const PROGRESS_AFTER_UPLOAD = 0.9;
const PROGRESS_COMPLETE = 1;

export interface UseCaptureFlowResult {
  state: CaptureState | { phase: "resolving-permission" };
  allowCamera: () => void;
  declinePermission: () => void;
  openSettings: () => void;
  onPhotoTaken: (photo: CapturedPhoto) => void;
  cancelCamera: () => void;
  retake: () => void;
  requestDiscard: () => void;
  keepPhoto: () => void;
  confirmDiscard: () => void;
  usePhoto: () => void;
  cancelSaving: () => void;
  retrySave: () => void;
  takeAnotherPhoto: () => void;
  backToReceipts: () => void;
}

export function useCaptureFlow(options: {
  projectId: string;
  onSaved: (entry: Entry) => void;
  onExit: () => void;
  openSettings: () => void;
}): UseCaptureFlowResult {
  const api = useApiClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<CaptureState | { phase: "resolving-permission" }>({
    phase: "resolving-permission",
  });
  const abortRef = useRef<AbortController | null>(null);
  // AC-3: minted once per captured photo (not per save attempt) so a retry after a lost response
  // replays the same key instead of claiming a second entries row for the same photo.
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (permission == null || state.phase !== "resolving-permission") {
      return;
    }
    if (permission.granted) {
      setState({ phase: "camera" });
    } else if (permission.canAskAgain) {
      setState({ phase: "permission-ask" });
    } else {
      setState({ phase: "permission-denied" });
    }
  }, [permission, state.phase]);

  const allowCamera = useCallback(() => {
    requestPermission().then((result) => {
      setState(result.granted ? { phase: "camera" } : { phase: "permission-denied" });
    });
  }, [requestPermission]);

  const declinePermission = options.onExit;
  const cancelCamera = options.onExit;

  const onPhotoTaken = useCallback((photo: CapturedPhoto) => {
    idempotencyKeyRef.current = generateIdempotencyKey();
    setState({ phase: "preview", photo });
  }, []);

  const retake = useCallback(() => {
    setState({ phase: "camera" });
  }, []);

  const requestDiscard = useCallback(() => {
    setState((current) => (current.phase === "preview" ? { phase: "discard-confirm", photo: current.photo } : current));
  }, []);

  const keepPhoto = useCallback(() => {
    setState((current) =>
      current.phase === "discard-confirm" ? { phase: "preview", photo: current.photo } : current,
    );
  }, []);

  const confirmDiscard = options.onExit;

  const runSave = useCallback(
    async (photo: CapturedPhoto) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ phase: "saving", photo, progress: 0 });

      try {
        const downscaled = await downscaleForUpload(photo.uri, photo.width, photo.height);
        const upload = await api.createMediaUploadUrl(controller.signal);
        setState({ phase: "saving", photo, progress: PROGRESS_AFTER_PRESIGN });

        const blob = await (await fetch(downscaled.uri)).blob();
        await putWithProgress(
          upload.uploadUrl,
          blob,
          "image/jpeg",
          (fraction) => {
            const progress =
              PROGRESS_AFTER_PRESIGN + fraction * (PROGRESS_AFTER_UPLOAD - PROGRESS_AFTER_PRESIGN);
            setState((current) => (current.phase === "saving" ? { ...current, progress } : current));
          },
          controller.signal,
        );
        setState({ phase: "saving", photo, progress: PROGRESS_AFTER_UPLOAD });

        const result = await api.createEntry(
          options.projectId,
          { mediaRef: upload.mediaRef, idempotencyKey: idempotencyKeyRef.current! },
          controller.signal,
        );
        setState({ phase: "saving", photo, progress: PROGRESS_COMPLETE });
        options.onSaved(result.entry);
      } catch (error) {
        if (controller.signal.aborted) {
          // AC-11: cancelled mid-flight - back to preview, photo kept, nothing claimed server-side
          // by this attempt (an in-flight R2 PUT or claim call that the server had already
          // committed before the abort reached it is a residual race no client-side cancel can
          // fully close).
          setState({ phase: "preview", photo });
          return;
        }
        if (error instanceof ApiError && error.problemType === MEDIA_REJECTED_TYPE) {
          setState({ phase: "photo-rejected", photo });
          return;
        }
        // AC-5 / AC-7 / AC-9 shared state (design review ruling 1, KAN-5): upload failure,
        // expired presigned URL, and an unclaimable media_ref all read as "couldn't save".
        setState({ phase: "save-error", photo });
      } finally {
        abortRef.current = null;
      }
    },
    [api, options],
  );

  const usePhoto = useCallback(() => {
    setState((current) => {
      if (current.phase === "preview") {
        runSave(current.photo);
      }
      return current;
    });
  }, [runSave]);

  const retrySave = useCallback(() => {
    setState((current) => {
      if (current.phase === "save-error") {
        runSave(current.photo);
      }
      return current;
    });
  }, [runSave]);

  const cancelSaving = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const takeAnotherPhoto = useCallback(() => {
    setState({ phase: "camera" });
  }, []);

  return {
    state,
    allowCamera,
    declinePermission,
    openSettings: options.openSettings,
    onPhotoTaken,
    cancelCamera,
    retake,
    requestDiscard,
    keepPhoto,
    confirmDiscard,
    usePhoto,
    cancelSaving,
    retrySave,
    takeAnotherPhoto,
    backToReceipts: options.onExit,
  };
}
