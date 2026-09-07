// Fixture: a "wired" extractor that finds nothing for every pair —
// exercises the "0 entries returned" mismatch path (distinct from the
// unwired stub's "not evaluated" path).
'use strict';

const wired = true;

async function extract(_imagePath) {
  return [];
}

module.exports = { wired, extract };
