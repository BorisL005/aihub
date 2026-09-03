import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useApiClient } from "../src/api/ApiClientProvider";
import { ReceiptsListScreen } from "../src/screens/ReceiptsListScreen";

jest.mock("../src/api/ApiClientProvider", () => ({
  useApiClient: jest.fn(),
}));

const mockedUseApiClient = useApiClient as jest.Mock;

const RECEIPTS_PROJECT = { id: "p1", name: "Receipts", projectType: "receipts" };

function renderScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReceiptsListScreen />
    </QueryClientProvider>,
  );
}

describe("ReceiptsListScreen", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // AC-8: loading state
  it("shows the loading skeleton while the initial request is in flight", () => {
    mockedUseApiClient.mockReturnValue({
      listProjects: () => new Promise(() => {}),
      listProjectEntries: () => new Promise(() => {}),
    });

    renderScreen();

    expect(screen.getByTestId("loading-state")).toBeTruthy();
  });

  // AC-8: error state with retry
  it("shows the error state with a working retry action when the request fails", async () => {
    const listProjects = jest.fn().mockRejectedValue(new Error("network down"));
    mockedUseApiClient.mockReturnValue({ listProjects, listProjectEntries: jest.fn() });

    renderScreen();

    await waitFor(() => expect(screen.getByTestId("error-state")).toBeTruthy());
    expect(screen.getByText("Couldn't load your receipts")).toBeTruthy();

    fireEvent.press(screen.getByText("Try again"));
    await waitFor(() => expect(listProjects).toHaveBeenCalledTimes(2));
  });

  // AC-8: empty state
  it("shows the empty state when the receipts project has no entries", async () => {
    mockedUseApiClient.mockReturnValue({
      listProjects: jest.fn().mockResolvedValue([RECEIPTS_PROJECT]),
      listProjectEntries: jest.fn().mockResolvedValue({ items: [] }),
    });

    renderScreen();

    await waitFor(() => expect(screen.getByTestId("empty-state")).toBeTruthy());
    expect(screen.getByText("No receipts yet")).toBeTruthy();
    // Capture isn't built yet (KAN-5) - the CTA must be genuinely disabled, not a live-looking
    // control that does nothing when tapped.
    expect(screen.getByRole("button")).toBeDisabled();
  });

  // AC-8: populated list, each row shows date and status
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

    renderScreen();

    await waitFor(() => expect(screen.getAllByTestId("entry-row")).toHaveLength(2));
    expect(screen.getByText("Not read yet")).toBeTruthy();
    expect(screen.getByText("Needs a check")).toBeTruthy();
  });
});
