const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MONTH_ABBREVIATIONS[date.getMonth()]}`;
}

/**
 * Matches the design canvas's row line-2 copy exactly: "Today, 14:32" / "Yesterday, 18:44" /
 * "31 Aug, 19:22". Deliberately not locale-adaptive: `toLocaleDateString`/`toLocaleTimeString`
 * order day/month and render the midnight hour differently per locale (e.g. en-US gives
 * "Aug 31" where the canvas fixes "31 Aug"), and this app has no i18n strategy - a fixed
 * English format keeps the copy matching the canvas on every device rather than only some.
 */
export function formatEntryTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const time = formatTime(date);

  const diffDays = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (diffDays === 0) {
    return `Today, ${time}`;
  }
  if (diffDays === 1) {
    return `Yesterday, ${time}`;
  }
  return `${formatShortDate(date)}, ${time}`;
}
