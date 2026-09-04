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
