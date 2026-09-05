import { render, waitFor } from "@testing-library/react-native";
import { useEffect } from "react";
import { ApiClientProvider, useApiClient } from "../src/api/ApiClientProvider";

// React Native declares `__DEV__` as `declare const __DEV__: boolean`, so it can't be assigned
// directly under strict TS - cast through a differently-typed view of the same global instead.
function setDevFlag(value: boolean): void {
  (globalThis as unknown as { __DEV__: boolean }).__DEV__ = value;
}

function getDevFlag(): boolean {
  return (globalThis as unknown as { __DEV__: boolean }).__DEV__;
}

function Probe({ onError }: { onError: (message: string) => void }) {
  const api = useApiClient();
  useEffect(() => {
    api.listProjects().catch((error: Error) => onError(error.message));
  }, [api, onError]);
  return null;
}

async function renderProbeAndCaptureError(): Promise<string> {
  let capturedMessage: string | undefined;
  await render(
    <ApiClientProvider>
      <Probe onError={(message) => (capturedMessage = message)} />
    </ApiClientProvider>,
  );
  await waitFor(() => expect(capturedMessage).toBeDefined());
  return capturedMessage as string;
}

// getAccessToken (mobile/src/api/ApiClientProvider.tsx) is module-private, so it's only
// reachable through the public API client - exercising it this way is what proves the __DEV__
// guard actually fires, not just that the stub throws (which it always would anyway).
describe("ApiClientProvider auth stub", () => {
  const originalDev = getDevFlag();

  afterEach(() => {
    setDevFlag(originalDev);
  });

  it("rejects with the sign-in-not-implemented message in dev", async () => {
    setDevFlag(true);

    const message = await renderProbeAndCaptureError();

    expect(message).toContain("Sign-in is not implemented");
  });

  it("rejects with the release-build guard message when __DEV__ is false", async () => {
    setDevFlag(false);

    const message = await renderProbeAndCaptureError();

    expect(message).toContain("must never happen");
  });
});
