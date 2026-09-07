import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const MAX_LONGEST_EDGE = 1600;
const JPEG_QUALITY = 0.8;

export interface DownscaledPhoto {
  uri: string;
  width: number;
  height: number;
}

/**
 * Notes for dev (KAN-5): "Downscale the image on the client before upload: JPEG, longest edge at
 * most 1600px, quality ~0.8" - a cost/latency constraint for KAN-6's vision model, not a UI
 * preference, so it applies even to a photo already under the limit (re-encoding at the fixed
 * quality is still required).
 */
export async function downscaleForUpload(uri: string, width: number, height: number): Promise<DownscaledPhoto> {
  const longestEdge = Math.max(width, height);
  const scale = Math.min(1, MAX_LONGEST_EDGE / longestEdge);
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const context = ImageManipulator.manipulate(uri).resize({ width: targetWidth, height: targetHeight });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });

  return { uri: result.uri, width: targetWidth, height: targetHeight };
}
