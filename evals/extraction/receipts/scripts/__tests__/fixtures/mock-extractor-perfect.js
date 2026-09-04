// AC-9 fixture: a "wired" extractor that always returns a perfect match
// for the synthetic fixture set built by test-helpers.makeValidFixtureSet
// (merchant: `Merchant ${nnn}`, total: 10 + index, currency: 'CAD').
'use strict';

const path = require('node:path');

const wired = true;

async function extract(imagePath) {
  const nnn = path.basename(imagePath, '.jpg');
  const index = Number(nnn);
  return [{ merchant: `Merchant ${nnn}`, total: 10 + index, currency: 'CAD' }];
}

module.exports = { wired, extract };
