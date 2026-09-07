/**
 * PUTs bytes directly to a presigned R2 URL (ARCHITECTURE.md's ingestion pipeline decision - the
 * backend never sees them) using XMLHttpRequest rather than fetch, since fetch exposes no upload
 * progress in React Native - the saving screen's progress bar (KAN-5 Notes for dev: "ONE bar,
 * monotonic") needs real bytes-sent progress for this, the slowest of the three network steps.
 */
export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export class UploadAbortedError extends Error {
  constructor() {
    super("upload was cancelled");
    this.name = "UploadAbortedError";
  }
}

export function putWithProgress(
  url: string,
  body: Blob,
  contentType: string,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadAbortedError());
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded / event.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        // AC-7: this is the expired-presigned-URL failure shape, alongside any other R2 PUT
        // rejection - the caller maps both to the same "couldn't save, try again" state as AC-9.
        reject(new UploadError(`upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new UploadError("upload failed"));
    xhr.onabort = () => reject(new UploadAbortedError());

    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort, { once: true });

    xhr.send(body);
  });
}
