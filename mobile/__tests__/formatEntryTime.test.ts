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
});
