// Swappable extraction interface. KAN-6 wires a real extractor by pointing
// the EXTRACTOR_MODULE env var (read by run-eval.js) at a module exporting
// the same shape: `wired` (false disables scoring and reports "not
// evaluated"), and `extract(imagePath)` resolving to an array of extracted
// entries (normally one) for that photo.
//
// This stub is the default and does no extraction — KAN-10 proves the
// sync -> validate -> compare pipeline runs end to end without needing a
// real extraction call.
'use strict';

const wired = false;

async function extract(_imagePath) {
  return [];
}

module.exports = { wired, extract };
