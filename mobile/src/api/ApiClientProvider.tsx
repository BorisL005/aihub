import { createContext, useContext, useMemo, type ReactNode } from "react";
import { type ApiClient, createApiClient } from "./client";

const ApiClientContext = createContext<ApiClient | null>(null);

/**
 * No mobile sign-in flow exists yet - no ticket has added the Auth0 mobile SDK. Until it does,
 * every call fails and the screen falls back to its error state, which is the correct behaviour
 * for "we have no token" rather than a crash. Swap this for the real Auth0 token accessor when
 * that ticket lands.
 */
async function getAccessToken(): Promise<string> {
  throw new Error("Sign-in is not implemented yet - no access token is available.");
}

export function ApiClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
        getAccessToken,
      }),
    [],
  );
  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>;
}

export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error("useApiClient must be used within an ApiClientProvider");
  }
  return client;
}
