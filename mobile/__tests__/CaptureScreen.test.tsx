import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import { useCameraPermissions } from "expo-camera";
import { useApiClient } from "../src/api/ApiClientProvider";
import { downscaleForUpload } from "../src/utils/downscaleForUpload";
import { putWithProgress } from "../src/api/uploadWithProgress";
import { ApiError } from "../src/api/client";
import { MEDIA_REJECTED_TYPE, MEDIA_UNAVAILABLE_TYPE } from "../src/api/types";
import { CaptureScreen } from "../src/screens/CaptureScreen";

jest.mock("../src/api/ApiClientProvider", () => ({
  useApiClient: jest.fn(),
}));

jest.mock("../src/utils/downscaleForUpload", () => ({
  downscaleForUpload: jest.fn(),
}));

jest.mock("../src/api/uploadWithProgress", () => ({
  ...jest.requireActual("../src/api/uploadWithProgress"),
  putWithProgress: jest.fn(),
}));

const mockTakePictureAsync = jest.fn();

jest.mock("expo-camera", () => {
  const React = require("react");
  return {
    useCameraPermissions: jest.fn(),
    CameraView: React.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({ takePictureAsync: mockTakePictureAsync }));
      return null;
    }),
  };
});

const mockedUseApiClient = useApiClient as jest.Mock;
const mockedUseCameraPermissions = useCameraPermissions as jest.Mock;
const mockedDownscale = downscaleForUpload as jest.Mock;
const mockedPutWithProgress = putWithProgress as jest.Mock;

const CAPTURED_PHOTO = { uri: "file://photo.jpg", width: 1200, height: 1600 };
const DOWNSCALED_PHOTO = { uri: "file://downscaled.jpg", width: 1200, height: 1600 };
const CREATED_ENTRY = { id: "e1", ts: "2026-01-01T00:00:00Z", source: "camera", validationStatus: "pending", payload: {} };

function grantedPermission() {
  return { status: "granted", granted: true, canAskAgain: true, expires: "never" };
}
function undeterminedPermission() {
  return { status: "undetermined", granted: false, canAskAgain: true, expires: "never" };
}
function deniedPermission() {
  return { status: "denied", granted: false, canAskAgain: false, expires: "never" };
}

async function renderCaptureScreen(onSaved = jest.fn(), onExit = jest.fn()) {
  await render(<CaptureScreen projectId="p1" onSaved={onSaved} onExit={onExit} />);
  return { onSaved, onExit };
}

describe("CaptureScreen", () => {
  const api = {
    createMediaUploadUrl: jest.fn(),
    createEntry: jest.fn(),
  };

  beforeEach(() => {
    mockedUseApiClient.mockReturnValue(api);
    mockedDownscale.mockResolvedValue(DOWNSCALED_PHOTO);
    mockedPutWithProgress.mockImplementation(async (_url, _blob, _type, onProgress) => {
      onProgress(1);
    });
    globalThis.fetch = jest.fn().mockResolvedValue({ blob: jest.fn().mockResolvedValue({}) }) as unknown as typeof fetch;
    api.createMediaUploadUrl.mockResolvedValue({
      mediaRef: "uploads/abc",
      uploadUrl: "https://fake-r2.test/uploads/abc",
      expiresAt: "2026-01-01T00:15:00Z",
    });
    api.createEntry.mockResolvedValue({ entry: CREATED_ENTRY, created: true });
    mockTakePictureAsync.mockResolvedValue(CAPTURED_PHOTO);
    jest.spyOn(Linking, "openSettings").mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // AC-6: permission not yet asked shows the ask screen; declining exits without touching the camera.
  it("shows the permission-ask screen and exits on Not now without requesting the camera", async () => {
    mockedUseCameraPermissions.mockReturnValue([undeterminedPermission(), jest.fn()]);
    const { onExit } = await renderCaptureScreen();

    await waitFor(() => expect(screen.getByTestId("permission-ask")).toBeTruthy());
    await fireEvent.press(screen.getByText("Not now"));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(api.createMediaUploadUrl).not.toHaveBeenCalled();
  });

  it("shows the permission-denied screen with a working Open Settings and Back to receipts", async () => {
    mockedUseCameraPermissions.mockReturnValue([deniedPermission(), jest.fn()]);
    const { onExit } = await renderCaptureScreen();

    await waitFor(() => expect(screen.getByTestId("permission-denied")).toBeTruthy());
    await fireEvent.press(screen.getByText("Open Settings"));
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByText("Back to receipts"));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  // AC-1: already-granted permission skips straight to the live camera.
  it("goes straight to the camera when permission is already granted", async () => {
    mockedUseCameraPermissions.mockReturnValue([grantedPermission(), jest.fn()]);
    await renderCaptureScreen();

    await waitFor(() => expect(screen.getByTestId("camera-live")).toBeTruthy());
  });

  // AC-6: Cancel on the live camera exits with nothing uploaded.
  it("exits without uploading when the camera is cancelled", async () => {
    mockedUseCameraPermissions.mockReturnValue([grantedPermission(), jest.fn()]);
    const { onExit } = await renderCaptureScreen();
    await waitFor(() => expect(screen.getByTestId("camera-live")).toBeTruthy());

    await fireEvent.press(screen.getByText("Cancel"));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(api.createMediaUploadUrl).not.toHaveBeenCalled();
  });

  // AC-1: taking a photo moves to the preview screen.
  it("shows the preview after taking a photo", async () => {
    mockedUseCameraPermissions.mockReturnValue([grantedPermission(), jest.fn()]);
    await renderCaptureScreen();
    await waitFor(() => expect(screen.getByTestId("camera-live")).toBeTruthy());

    await fireEvent.press(screen.getByTestId("shutter-button"));

    await waitFor(() => expect(screen.getByTestId("photo-preview")).toBeTruthy());
  });

  // AC-6: discarding from preview exits with nothing uploaded and no entry created.
  it("discards the photo and exits without ever calling the API", async () => {
    mockedUseCameraPermissions.mockReturnValue([grantedPermission(), jest.fn()]);
    const { onExit } = await renderCaptureScreen();
    await waitFor(() => expect(screen.getByTestId("camera-live")).toBeTruthy());
    await fireEvent.press(screen.getByTestId("shutter-button"));
    await waitFor(() => expect(screen.getByTestId("photo-preview")).toBeTruthy());

    await fireEvent.press(screen.getByLabelText("Discard photo"));
    await waitFor(() => expect(screen.getByTestId("discard-confirm")).toBeTruthy());
    await fireEvent.press(screen.getByText("Discard"));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(api.createMediaUploadUrl).not.toHaveBeenCalled();
  });

  // Keeping the photo from the discard sheet returns to an interactive preview.
  it("returns to preview when the user keeps the photo", async () => {
    mockedUseCameraPermissions.mockReturnValue([grantedPermission(), jest.fn()]);
    await renderCaptureScreen();
    await waitFor(() => expect(screen.getByTestId("camera-live")).toBeTruthy());
    await fireEvent.press(screen.getByTestId("shutter-button"));
    await waitFor(() => expect(screen.getByTestId("photo-preview")).toBeTruthy());
    await fireEvent.press(screen.getByLabelText("Discard photo"));
    await waitFor(() => expect(screen.getByTestId("discard-confirm")).toBeTruthy());

    await fireEvent.press(screen.getByText("Keep it"));

    await waitFor(() => expect(screen.queryByTestId("discard-confirm")).toBeNull());
    expect(screen.getByText("Use photo")).toBeEnabled();
  });

  // AC-1: the full happy path - downscale, presign, upload, claim, onSaved with the created entry.
  it("saves the photo end to end and reports the created entry", async () => {
    mockedUseCameraPermissions.mockReturnValue([grantedPermission(), jest.fn()]);
    const { onSaved } = await renderCaptureScreen();
    await waitFor(() => expect(screen.getByTestId("camera-live")).toBeTruthy());
    await fireEvent.press(screen.getByTestId("shutter-button"));
    await waitFor(() => expect(screen.getByTestId("photo-preview")).toBeTruthy());

    await fireEvent.press(screen.getByText("Use photo"));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(CREATED_ENTRY));
    expect(mockedDownscale).toHaveBeenCalledWith(CAPTURED_PHOTO.uri, CAPTURED_PHOTO.width, CAPTURED_PHOTO.height);
    expect(api.createMediaUploadUrl).toHaveBeenCalledTimes(1);
    expect(api.createEntry).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({ mediaRef: "uploads/abc" }),
      expect.anything(),
    );
  });

  // AC-4: content-type/size rejection shows the not-retryable photo-rejected screen.
  it("shows photo-rejected when the server rejects the uploaded object", async () => {
    api.createEntry.mockRejectedValue(new ApiError(400, "rejected", MEDIA_REJECTED_TYPE));
    mockedUseCameraPermissions.mockReturnValue([grantedPermission(), jest.fn()]);
    await renderCaptureScreen();
    await waitFor(() => expect(screen.getByTestId("camera-live")).toBeTruthy());
    await fireEvent.press(screen.getByTestId("shutter-button"));
    await waitFor(() => expect(screen.getByTestId("photo-preview")).toBeTruthy());

    await fireEvent.press(screen.getByText("Use photo"));

    await waitFor(() => expect(screen.getByTestId("photo-rejected")).toBeTruthy());
    expect(screen.getByText("This photo won't work")).toBeTruthy();
  });

  // AC-5 / AC-7 / AC-9 shared state: any other failure (media unavailable, upload failure) shows
  // the retryable save-error screen, and retry re-runs the whole pipeline.
  it("shows the retryable save-error screen on an unavailable media_ref and retry saves successfully", async () => {
    api.createEntry
      .mockRejectedValueOnce(new ApiError(400, "unavailable", MEDIA_UNAVAILABLE_TYPE))
      .mockResolvedValueOnce({ entry: CREATED_ENTRY, created: true });
    mockedUseCameraPermissions.mockReturnValue([grantedPermission(), jest.fn()]);
    const { onSaved } = await renderCaptureScreen();
    await waitFor(() => expect(screen.getByTestId("camera-live")).toBeTruthy());
    await fireEvent.press(screen.getByTestId("shutter-button"));
    await waitFor(() => expect(screen.getByTestId("photo-preview")).toBeTruthy());
    await fireEvent.press(screen.getByText("Use photo"));
    await waitFor(() => expect(screen.getByTestId("save-error")).toBeTruthy());

    await fireEvent.press(screen.getByText("Try again"));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(CREATED_ENTRY));
    expect(api.createEntry).toHaveBeenCalledTimes(2);
  });

  // AC-3 (QA regression for review blocker B1): the real client retry path is "response lost,
  // user taps Try again" - the server may already have committed the row from the first attempt,
  // so the retry MUST carry the same idempotency key or it claims a second entries row. The
  // existing retry test above only asserts createEntry was called twice; it would have passed
  // even with the pre-fix code, which minted a fresh key per attempt (useCaptureFlow.ts used to
  // call generateIdempotencyKey() inline in runSave instead of once in onPhotoTaken). This
  // asserts the key itself is identical across both calls, which is the actual bug B1 described.
  it("reuses the same idempotency key across a retry after a lost response", async () => {
    api.createEntry
      .mockRejectedValueOnce(new ApiError(400, "unavailable", MEDIA_UNAVAILABLE_TYPE))
      .mockResolvedValueOnce({ entry: CREATED_ENTRY, created: true });
    mockedUseCameraPermissions.mockReturnValue([grantedPermission(), jest.fn()]);
    const { onSaved } = await renderCaptureScreen();
    await waitFor(() => expect(screen.getByTestId("camera-live")).toBeTruthy());
    await fireEvent.press(screen.getByTestId("shutter-button"));
    await waitFor(() => expect(screen.getByTestId("photo-preview")).toBeTruthy());
    await fireEvent.press(screen.getByText("Use photo"));
    await waitFor(() => expect(screen.getByTestId("save-error")).toBeTruthy());

    await fireEvent.press(screen.getByText("Try again"));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(CREATED_ENTRY));
    expect(api.createEntry).toHaveBeenCalledTimes(2);
    const firstKey = api.createEntry.mock.calls[0][1].idempotencyKey;
    const secondKey = api.createEntry.mock.calls[1][1].idempotencyKey;
    expect(firstKey).toBeTruthy();
    expect(secondKey).toBe(firstKey);
  });

  // AC-11: cancelling mid-save returns to preview with the photo retained, no entry created.
  it("returns to preview when the save is cancelled and creates no entry", async () => {
    mockedPutWithProgress.mockImplementation(
      (_url, _blob, _type, _onProgress, signal: AbortSignal) =>
        new Promise<void>((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    mockedUseCameraPermissions.mockReturnValue([grantedPermission(), jest.fn()]);
    await renderCaptureScreen();
    await waitFor(() => expect(screen.getByTestId("camera-live")).toBeTruthy());
    await fireEvent.press(screen.getByTestId("shutter-button"));
    await waitFor(() => expect(screen.getByTestId("photo-preview")).toBeTruthy());
    await fireEvent.press(screen.getByText("Use photo"));
    await waitFor(() => expect(screen.getByTestId("saving")).toBeTruthy());

    await fireEvent.press(screen.getByText("Cancel"));

    await waitFor(() => expect(screen.getByTestId("photo-preview")).toBeTruthy());
    expect(api.createEntry).not.toHaveBeenCalled();
  });
});
