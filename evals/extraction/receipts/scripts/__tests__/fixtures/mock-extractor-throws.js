// AC-8 fixture: a "wired" extractor that throws on one pair (simulating a
// live extraction call failing) and succeeds normally on every other pair —
// exercises the per-pair failure path that must still produce a report.
'use strict';

const path = require('node:path');

const wired = true;

async function extract(imagePath) {
  const nnn = path.basename(imagePath, '.jpg');
  if (nnn === '013') {
    throw new Error('extraction service timed out');
  }
  const index = Number(nnn);
  return [{ merchant: `Merchant ${nnn}`, total: 10 + index, currency: 'CAD' }];
}

module.exports = { wired, extract };
