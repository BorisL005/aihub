// DESIGN-SYSTEM.md §4 spacing scale and §5 primitive geometry, spelled once and reused.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  control: 6,
  card: 12,
} as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const, letterSpacing: -0.021 * 28 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const, letterSpacing: -0.018 * 22 },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: "600" as const, letterSpacing: -0.01 * 17 },
  row: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const, letterSpacing: -0.008 * 16 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: "400" as const, letterSpacing: 0 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const, letterSpacing: 0 },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: "600" as const, letterSpacing: 0.04 * 11 },
} as const;

export const entryRow = {
  height: 64,
  thumbnailSize: 40,
  rightSlotMinWidth: 88,
  dividerInset: 68,
} as const;

export const statusBadge = {
  height: 20,
  paddingHorizontal: 7,
} as const;
