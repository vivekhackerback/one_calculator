import test from 'node:test';
import assert from 'node:assert/strict';
import { formatWithPrecision } from '../src/utils/formatters.js';

test('formatWithPrecision formats numbers with clamped decimal precision', () => {
  assert.equal(formatWithPrecision(12.3456, 2), '12.35');
  assert.equal(formatWithPrecision(12.3456, 0), '12');
  assert.equal(formatWithPrecision(10, 4), '10');
});

test('formatWithPrecision handles NaN and Infinity safely', () => {
  assert.equal(formatWithPrecision(NaN, 2), '0');
  assert.equal(formatWithPrecision(Infinity, 2), '0');
});
