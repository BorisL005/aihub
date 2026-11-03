import { render, screen } from "@testing-library/react-native";
import type { Entry } from "../src/api/types";
import { EntryRow } from "../src/components/EntryRow";

function entry(overrides: Partial<Entry>): Entry {
  return {
    id: "e1",
    ts: new Date().toISOString(),
    source: "camera",
    validationStatus: "pending",
    payload: {},
    ...overrides,
  };
}

// AC-8: the row's leading indicator must track the entry it was actually given, not render
// the same glyph regardless of source.
describe("EntryRow", () => {
  it("shows the camera glyph for a camera-sourced entry", async () => {
    await render(<EntryRow entry={entry({ source: "camera" })} />);
    expect(screen.getByTestId("source-glyph-camera")).toBeTruthy();
  });

  it("shows the voice glyph for a voice-sourced entry", async () => {
    await render(<EntryRow entry={entry({ source: "voice" })} />);
    expect(screen.getByTestId("source-glyph-voice")).toBeTruthy();
  });

  it("shows the text glyph for a text-sourced entry", async () => {
    await render(<EntryRow entry={entry({ source: "text" })} />);
    expect(screen.getByTestId("source-glyph-text")).toBeTruthy();
  });
});

// AC-9 (KAN-6): the row's populated state once extraction lands.
describe("EntryRow extraction states", () => {
  it("shows the generic Receipt line and the status badge before extraction (pending)", async () => {
    await render(<EntryRow entry={entry({ validationStatus: "pending", payload: {} })} />);
    expect(screen.getByText("Receipt")).toBeTruthy();
    expect(screen.getByTestId("status-badge")).toBeTruthy();
    expect(screen.queryByTestId("entry-amount")).toBeNull();
  });

  it("shows the needs-a-check badge instead of an amount when extraction needs review", async () => {
    await render(<EntryRow entry={entry({ validationStatus: "needs_review", payload: {} })} />);
    expect(screen.getByText("Receipt")).toBeTruthy();
    expect(screen.getByText("Needs a check")).toBeTruthy();
    expect(screen.queryByTestId("entry-amount")).toBeNull();
  });

  it("swaps in the merchant and amount, dropping the badge, once extracted", async () => {
    await render(
      <EntryRow
        entry={entry({
          validationStatus: "extracted",
          payload: { merchant: "SOHO", purchased_at: "2026-02-01", total: 30.75, currency: "CAD" },
        })}
      />
    );
    expect(screen.getByText("SOHO")).toBeTruthy();
    expect(screen.getByText("CAD 30.75")).toBeTruthy();
    expect(screen.queryByTestId("status-badge")).toBeNull();
  });

  it("falls back to the Receipt/badge row if an `extracted` entry's payload is incomplete", async () => {
    await render(
      <EntryRow entry={entry({ validationStatus: "extracted", payload: { merchant: "SOHO" } })} />
    );
    expect(screen.getByText("Receipt")).toBeTruthy();
    expect(screen.getByTestId("status-badge")).toBeTruthy();
  });

  it("does not reflow line 2 - it always shows the ingest time, never the purchase date", async () => {
    await render(
      <EntryRow
        entry={entry({
          ts: "2026-02-01T14:32:00.000Z",
          validationStatus: "extracted",
          payload: { merchant: "SOHO", purchased_at: "2020-01-01", total: 30.75, currency: "CAD" },
        })}
      />
    );
    expect(screen.queryByText("2020-01-01")).toBeNull();
  });
});
