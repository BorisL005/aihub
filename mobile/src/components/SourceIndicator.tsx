import { StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";
import { entryRow, radius } from "../theme/tokens";

/**
 * DESIGN-SYSTEM.md §5 Entry row, slot 1: the 40×40 thumbnail. The canvas only ever draws this as
 * a stand-in receipt photo because every sample row it covers is camera-sourced (KAN-5 is the
 * only capture path shipped so far) - but `entries.source` is camera/voice/text from day one
 * (ARCHITECTURE.md's core data model), and AC-8 requires the row to show it. Drawn with plain
 * Views, not an icon library, the same way the canvas itself draws every glyph here as a shape
 * rather than an SVG asset.
 */
export function SourceIndicator({ source }: { source: string }) {
  const variant = normalize(source);
  return (
    <View style={styles.frame} testID="source-indicator" accessibilityLabel={`Captured by ${variant}`}>
      {variant === "camera" && <PhotoGlyph />}
      {variant === "voice" && <WaveformGlyph />}
      {variant === "text" && <NoteGlyph />}
    </View>
  );
}

function normalize(source: string): "camera" | "voice" | "text" | "unknown" {
  const value = source.trim().toLowerCase();
  return value === "camera" || value === "voice" || value === "text" ? value : "unknown";
}

// A rotated stand-in receipt photo - the same drawing the design canvas uses for every row today.
function PhotoGlyph() {
  return (
    <View style={styles.photoPaper} testID="source-glyph-camera">
      {PHOTO_LINE_WIDTHS.map((width, index) => (
        <View key={index} style={[styles.photoRule, { width: `${width}%` }]} />
      ))}
    </View>
  );
}

// A small waveform - camera's photo has a shape, so voice earns one distinct from it too.
function WaveformGlyph() {
  return (
    <View style={styles.waveform} testID="source-glyph-voice">
      {WAVEFORM_BAR_HEIGHTS.map((height, index) => (
        <View key={index} style={[styles.waveformBar, { height }]} />
      ))}
    </View>
  );
}

// Flush, unrotated ruled lines - a typed note, not a photograph.
function NoteGlyph() {
  return (
    <View style={styles.note} testID="source-glyph-text">
      {NOTE_LINE_WIDTHS.map((width, index) => (
        <View key={index} style={[styles.noteRule, { width: `${width}%` }]} />
      ))}
    </View>
  );
}

const PHOTO_LINE_WIDTHS = [70, 100, 100, 88, 100, 52];
const WAVEFORM_BAR_HEIGHTS = [8, 16, 22, 14, 9];
const NOTE_LINE_WIDTHS = [90, 65, 80];

const styles = StyleSheet.create({
  frame: {
    width: entryRow.thumbnailSize,
    height: entryRow.thumbnailSize,
    borderRadius: radius.control,
    backgroundColor: colors.sunk,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoPaper: {
    width: 18,
    height: 26,
    backgroundColor: colors.surface,
    transform: [{ rotate: "-3deg" }],
    gap: 3,
    padding: 4,
  },
  photoRule: {
    height: 2,
    backgroundColor: colors.line,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: colors.inkMuted,
  },
  note: {
    width: 22,
    gap: 4,
  },
  noteRule: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.inkFaint,
  },
});
