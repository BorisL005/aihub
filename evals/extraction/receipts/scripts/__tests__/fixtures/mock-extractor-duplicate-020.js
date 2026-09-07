// AC-7 fixture: a "wired" extractor that simulates the 020 SOHO trap —
// the same transaction printed twice on one strip yielding two entries —
// and a single correct entry for every other pair.
'use strict';

const path = require('node:path');

const wired = true;

async function extract(imagePath) {
  const nnn = path.basename(imagePath, '.jpg');
  const index = Number(nnn);
  const entry = { merchant: `Merchant ${nnn}`, total: 10 + index, currency: 'CAD' };
  return nnn === '020' ? [entry, entry] : [entry];
}

module.exports = { wired, extract };
