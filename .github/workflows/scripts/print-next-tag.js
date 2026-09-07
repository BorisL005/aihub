#!/usr/bin/env node
'use strict';

// Lists tags reachable from the current commit (release.yml runs this after
// checking out master with full tag history - fetch-depth: 0) and prints the
// next release tag to stdout. Isolated from the workflow YAML so the tagging
// algorithm itself is unit-testable without spinning up an Actions runner.
const { execFileSync } = require('node:child_process');
const { computeNextTag } = require('./compute-next-tag');

function main() {
  const output = execFileSync('git', ['tag', '--merged', 'HEAD'], { encoding: 'utf8' });
  const tags = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  process.stdout.write(computeNextTag(tags));
}

main();
