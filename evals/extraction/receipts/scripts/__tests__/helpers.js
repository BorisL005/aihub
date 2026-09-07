'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function pad3(n) {
  return String(n).padStart(3, '0');
}

// Creates a temp dir with `count` valid NNN.jpg/NNN.expected.json pairs
// (001..count) plus the three allowed non-pair files. Returns the dir path.
function makeValidFixtureSet(count = 24) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'receipt-eval-'));
  for (let i = 1; i <= count; i++) {
    const nnn = pad3(i);
    fs.writeFileSync(path.join(dir, `${nnn}.jpg`), Buffer.from([0xff, 0xd8, 0xff]));
    fs.writeFileSync(
      path.join(dir, `${nnn}.expected.json`),
      JSON.stringify({ merchant: `Merchant ${nnn}`, total: 10 + i, currency: 'CAD' })
    );
  }
  fs.writeFileSync(path.join(dir, 'README.md'), '# eval set\n');
  fs.writeFileSync(path.join(dir, 'MANIFEST.md'), '# batch 1\n');
  fs.writeFileSync(path.join(dir, 'MANIFEST-002.md'), '# batch 2\n');
  return dir;
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = { makeValidFixtureSet, cleanup, pad3 };
