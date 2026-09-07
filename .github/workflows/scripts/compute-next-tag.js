'use strict';

// Computes the next vX.Y release tag given the tags already reachable from
// master. Only tags of the exact "vMAJOR.MINOR" form participate - anything
// else (a stray "v1", a hypothetical "v1.2.3", non-release tags) is ignored.
// With no matching tag yet, the first release is v0.1. Major (X) is never
// bumped by this logic - see KAN-14's "Out of scope".
function computeNextTag(existingTags) {
  let best = null;
  for (const tag of existingTags) {
    const match = /^v(\d+)\.(\d+)$/.exec(tag);
    if (!match) continue;
    const major = Number(match[1]);
    const minor = Number(match[2]);
    if (!best || major > best.major || (major === best.major && minor > best.minor)) {
      best = { major, minor };
    }
  }
  if (!best) return 'v0.1';
  return `v${best.major}.${best.minor + 1}`;
}

module.exports = { computeNextTag };
