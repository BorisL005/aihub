// Builds the human-readable eval report. Pure function, exercised by tests.
'use strict';

const TARGET_MIN = 30;
const TARGET_MAX = 50;
const PARTIAL_SET_NOTE =
  'PARTIAL SET: this run covers batches 001-002 (24 receipts) only, against the ' +
  `ARCHITECTURE.md-documented ${TARGET_MIN}-${TARGET_MAX} target. Batch 003 ` +
  '(Polish fiscal, handwritten, non-CAD, long grocery lists) is outstanding as an owner TODO.';

// pairResults: { id: string, status: 'not_evaluated' | 'mismatch' | 'scored', detail?: string, fields?: [...] }[]
function generateReport(pairResults) {
  const lines = [];
  lines.push(`Receipt eval report: ${pairResults.length} pair(s) evaluated`);
  lines.push(PARTIAL_SET_NOTE);
  lines.push('');

  for (const result of pairResults) {
    if (result.status === 'not_evaluated') {
      lines.push(`${result.id}: not evaluated: no extractor wired`);
    } else if (result.status === 'mismatch') {
      lines.push(`${result.id}: MISMATCH — ${result.detail}`);
    } else {
      const misses = result.fields.filter((f) => f.status === 'miss');
      if (misses.length === 0) {
        lines.push(`${result.id}: all fields hit`);
      } else {
        lines.push(
          `${result.id}: ${misses.length} field miss(es) — ${misses.map((f) => f.field).join(', ')}`
        );
      }
    }
  }

  return lines.join('\n');
}

module.exports = { generateReport, PARTIAL_SET_NOTE, TARGET_MIN, TARGET_MAX };
