import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ApiClientProvider } from "../src/api/ApiClientProvider";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiClientProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </ApiClientProvider>
    </QueryClientProvider>
  );
}
