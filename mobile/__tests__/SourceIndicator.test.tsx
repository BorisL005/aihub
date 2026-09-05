import { render, screen } from "@testing-library/react-native";
import { SourceIndicator } from "../src/components/SourceIndicator";

// AC-8: the entry row's leading indicator must reflect the entry's actual `source` field
// (camera/voice/text - ARCHITECTURE.md's core data model), not a single hardcoded literal.
describe("SourceIndicator", () => {
  it("renders the photo glyph for a camera-sourced entry", async () => {
    await render(<SourceIndicator source="camera" />);

    expect(screen.getByTestId("source-glyph-camera")).toBeTruthy();
    expect(screen.queryByTestId("source-glyph-voice")).toBeNull();
    expect(screen.queryByTestId("source-glyph-text")).toBeNull();
  });

  it("renders the waveform glyph for a voice-sourced entry", async () => {
    await render(<SourceIndicator source="voice" />);

    expect(screen.getByTestId("source-glyph-voice")).toBeTruthy();
    expect(screen.queryByTestId("source-glyph-camera")).toBeNull();
    expect(screen.queryByTestId("source-glyph-text")).toBeNull();
  });

  it("renders the note glyph for a text-sourced entry", async () => {
    await render(<SourceIndicator source="text" />);

    expect(screen.getByTestId("source-glyph-text")).toBeTruthy();
    expect(screen.queryByTestId("source-glyph-camera")).toBeNull();
    expect(screen.queryByTestId("source-glyph-voice")).toBeNull();
  });

  it("is not case- or whitespace-sensitive", async () => {
    await render(<SourceIndicator source=" Voice " />);

    expect(screen.getByTestId("source-glyph-voice")).toBeTruthy();
  });

  // `source` is an open string in the API contract ("e.g. camera", not a closed enum) - an
  // unrecognised value must render the frame with no glyph, not crash and not silently claim
  // one of the three known sources.
  it("falls back to no glyph for an unrecognised source rather than guessing", async () => {
    await render(<SourceIndicator source="fax" />);

    expect(screen.getByTestId("source-indicator")).toBeTruthy();
    expect(screen.queryByTestId("source-glyph-camera")).toBeNull();
    expect(screen.queryByTestId("source-glyph-voice")).toBeNull();
    expect(screen.queryByTestId("source-glyph-text")).toBeNull();
  });
});
