'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { generateReport } = require('../report');

test('a miss line dumps expected and actual for every missed field, not just the field name — ' +
  'this is what lets a diagnosis tell a comparator gap apart from a genuine extraction error ' +
  'without re-running the extractor', () => {
  const results = [
    {
      id: '001',
      status: 'scored',
      fields: [
        { field: 'merchant', status: 'miss', expected: 'Kadoya Sushi', actual: 'Kadoya Sushi Bar & Grill' },
        { field: 'total', status: 'hit', expected: 23.0, actual: 23.0 },
      ],
    },
  ];

  const report = generateReport(results);

  assert.match(report, /001: 1 field miss\(es\)/);
  assert.match(report, /merchant: expected="Kadoya Sushi" actual="Kadoya Sushi Bar & Grill"/);
  assert.ok(!report.includes('total: expected'), 'a hit is not also dumped as if it were a miss');
});

test('a pair with no misses still reports "all fields hit" with no dump lines', () => {
  const results = [
    { id: '003', status: 'scored', fields: [{ field: 'merchant', status: 'hit', expected: 'X', actual: 'X' }] },
  ];

  const report = generateReport(results);

  assert.match(report, /003: all fields hit/);
  assert.ok(!report.includes('expected='));
});
