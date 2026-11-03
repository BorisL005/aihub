/**
 * Formats a receipt's extracted total for the row's Amount slot (DESIGN-SYSTEM.md §3: "19 / 600
 * / tabular - the number the user came for"). Deliberately not `Intl.NumberFormat` with a
 * currency style: that renders a locale- and platform-dependent symbol (e.g. "$" for both CAD
 * and USD on some devices), which is exactly the ambiguity a three-letter ISO code exists to
 * avoid - same reasoning `formatEntryTime` gives for skipping `toLocaleDateString`.
 */
export function formatAmount(total: number, currency: string): string {
  return `${currency} ${total.toFixed(2)}`;
}
