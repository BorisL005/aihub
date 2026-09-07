import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useApiClient } from "../src/api/ApiClientProvider";
import { ReceiptsListScreen } from "../src/screens/ReceiptsListScreen";

jest.mock("../src/api/ApiClientProvider", () => ({
  useApiClient: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockedUseApiClient = useApiClient as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;
const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;

const RECEIPTS_PROJECT = { id: "p1", name: "Receipts", projectType: "receipts" };

function renderScreen(queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ReceiptsListScreen />
    </QueryClientProvider>,
  );
}

describe("ReceiptsListScreen", () => {
  const push = jest.fn();

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ push });
    mockedUseLocalSearchParams.mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // AC-8 (KAN-4): loading state
  it("shows the loading skeleton while the initial request is in flight", async () => {
    mockedUseApiClient.mockReturnValue({
      listProjects: () => new Promise(() => {}),
      listProjectEntries: () => new Promise(() => {}),
    });

    await renderScreen();

    expect(screen.getByTestId("loading-state")).toBeTruthy();
  });

  // AC-8 (KAN-4): error state with retry
  it("shows the error state with a working retry action when the request fails", async () => {
    const listProjects = jest.fn().mockRejectedValue(new Error("network down"));
    mockedUseApiClient.mockReturnValue({ listProjects, listProjectEntries: jest.fn() });

    await renderScreen();

    await waitFor(() => expect(screen.getByTestId("error-state")).toBeTruthy());
    expect(screen.getByText("Couldn't load your receipts")).toBeTruthy();

    await fireEvent.press(screen.getByText("Try again"));
    await waitFor(() => expect(listProjects).toHaveBeenCalledTimes(2));
  });

  // AC-8 (KAN-4): empty state
  it("shows the empty state when the receipts project has no entries", async () => {
    mockedUseApiClient.mockReturnValue({
      listProjects: jest.fn().mockResolvedValue([RECEIPTS_PROJECT]),
      listProjectEntries: jest.fn().mockResolvedValue({ items: [] }),
    });

    await renderScreen();

    await waitFor(() => expect(screen.getByTestId("empty-state")).toBeTruthy());
    expect(screen.getByText("No receipts yet")).toBeTruthy();
  });

  // AC-8 (KAN-4): populated list, each row shows date and status
  it("shows one row per entry with its status badge", async () => {
    mockedUseApiClient.mockReturnValue({
      listProjects: jest.fn().mockResolvedValue([RECEIPTS_PROJECT]),
      listProjectEntries: jest.fn().mockResolvedValue({
        items: [
          {
            id: "e1",
            ts: new Date().toISOString(),
            source: "camera",
            validationStatus: "pending",
            payload: {},
          },
          {
            id: "e2",
            ts: new Date().toISOString(),
            source: "camera",
            validationStatus: "needs_review",
            payload: {},
          },
        ],
      }),
    });

    await renderScreen();

    await waitFor(() => expect(screen.getAllByTestId("entry-row")).toHaveLength(2));
    expect(screen.getByText("Not read yet")).toBeTruthy();
    expect(screen.getByText("Needs a check")).toBeTruthy();
  });

  // KAN-5 AC-1: capture is now live from the empty state - a real, enabled control, not KAN-4's
  // disabled placeholder - and navigates to the capture flow for the caller's receipts project.
  it("navigates to capture with the receipts project id from the empty state", async () => {
    mockedUseApiClient.mockReturnValue({
      listProjects: jest.fn().mockResolvedValue([RECEIPTS_PROJECT]),
      listProjectEntries: jest.fn().mockResolvedValue({ items: [] }),
    });

    await renderScreen();
    await waitFor(() => expect(screen.getByTestId("empty-state")).toBeTruthy());

    const captureButton = screen.getByRole("button", { name: "Capture receipt" });
    expect(captureButton).toBeEnabled();
    await fireEvent.press(captureButton);

    expect(push).toHaveBeenCalledWith({ pathname: "/capture", params: { projectId: "p1" } });
  });

  // KAN-5 AC-1: same capture entry point from the populated list (design note: "same capture
  // button position as the populated list") - KAN-4 never had a footer control here at all.
  it("navigates to capture from the populated list too", async () => {
    mockedUseApiClient.mockReturnValue({
      listProjects: jest.fn().mockResolvedValue([RECEIPTS_PROJECT]),
      listProjectEntries: jest.fn().mockResolvedValue({
        items: [{ id: "e1", ts: new Date().toISOString(), source: "camera", validationStatus: "pending", payload: {} }],
      }),
    });

    await renderScreen();
    await waitFor(() => expect(screen.getAllByTestId("entry-row")).toHaveLength(1));

    await fireEvent.press(screen.getByText("Capture receipt"));

    expect(push).toHaveBeenCalledWith({ pathname: "/capture", params: { projectId: "p1" } });
  });

  // KAN-5 AC-1 + AC-2: returning from a successful capture (app/capture.tsx sets savedEntryId)
  // refreshes the list and shows the confirmation toast.
  it("shows the saved toast and invalidates the entries query when returning from a successful capture", async () => {
    const listProjectEntries = jest.fn().mockResolvedValue({
      items: [{ id: "e1", ts: new Date().toISOString(), source: "camera", validationStatus: "pending", payload: {} }],
    });
    mockedUseApiClient.mockReturnValue({
      listProjects: jest.fn().mockResolvedValue([RECEIPTS_PROJECT]),
      listProjectEntries,
    });
    mockedUseLocalSearchParams.mockReturnValue({ savedEntryId: "e1" });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    await renderScreen(queryClient);

    await waitFor(() => expect(screen.getByTestId("toast")).toBeTruthy());
    expect(screen.getByText("Receipt saved")).toBeTruthy();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["projectEntries", "p1"] });
  });
});
