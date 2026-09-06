import { formatEntryTime } from "../src/utils/formatEntryTime";

describe("formatEntryTime", () => {
  const now = new Date("2026-09-03T20:00:00");

  // AC-8 (row line 2 copy matches the design canvas)
  it("labels a same-day entry as Today", () => {
    expect(formatEntryTime("2026-09-03T14:32:00", now)).toBe("Today, 14:32");
  });

  it("labels a one-day-old entry as Yesterday", () => {
    expect(formatEntryTime("2026-09-02T18:44:00", now)).toBe("Yesterday, 18:44");
  });

  it("labels an older entry with its day and month", () => {
    expect(formatEntryTime("2026-08-31T19:22:00", now)).toBe("31 Aug, 19:22");
  });

  it("renders the midnight hour as 00, not 24", () => {
    expect(formatEntryTime("2026-09-03T00:05:00", now)).toBe("Today, 00:05");
  });

  it("uses the fixed day-then-month order regardless of runtime locale", () => {
    // en-US's toLocaleDateString would render this "Jan 5" - the canvas fixes "5 Jan".
    expect(formatEntryTime("2026-01-05T09:00:00", now)).toBe("5 Jan, 09:00");
  });

  // The backend serialises OffsetDateTime as a Z-suffixed (UTC) string - every other case here
  // passes an offset-less string, which `new Date(...)` parses as local time and would hide a
  // regression that mishandled the wire format's timezone conversion. jest.setup.tz.js pins the
  // runner to UTC so this assertion is deterministic across machines.
  it("handles the Z-suffixed UTC format the API actually sends", () => {
    const utcNow = new Date("2026-09-03T20:00:00Z");
    expect(formatEntryTime("2026-09-03T14:32:00Z", utcNow)).toBe("Today, 14:32");
  });
});
