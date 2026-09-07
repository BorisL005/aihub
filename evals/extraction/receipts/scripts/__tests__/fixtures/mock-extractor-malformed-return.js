// Edge-case fixture (QA): a "wired" extractor that violates its own contract
// by resolving to `null` instead of an array for one pair, simulating a
// buggy real extractor (KAN-6) that forgets to wrap a single result. Every
// other pair returns a well-formed single-entry array.
'use strict';

const path = require('node:path');

const wired = true;

async function extract(imagePath) {
  const nnn = path.basename(imagePath, '.jpg');
  if (nnn === '005') {
    return null;
  }
  const index = Number(nnn);
  return [{ merchant: `Merchant ${nnn}`, total: 10 + index, currency: 'CAD' }];
}

module.exports = { wired, extract };
