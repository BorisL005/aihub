export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
}

/**
 * One state machine drives every screen in design/KAN-5/ (11 artboards). `permission-ask` and
 * `permission-denied` are skipped entirely when the OS permission is already granted - they only
 * appear on `undetermined`/`denied` (see useCaptureFlow).
 */
export type CaptureState =
  | { phase: "permission-ask" }
  | { phase: "permission-denied" }
  | { phase: "camera" }
  | { phase: "preview"; photo: CapturedPhoto }
  | { phase: "discard-confirm"; photo: CapturedPhoto }
  | { phase: "saving"; photo: CapturedPhoto; progress: number }
  | { phase: "save-error"; photo: CapturedPhoto }
  | { phase: "photo-rejected"; photo: CapturedPhoto };
