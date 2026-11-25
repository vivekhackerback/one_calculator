import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDateDifference } from '../src/utils/calculators/dateDiff.js';

test('date difference calculates same day and leap year span', () => {
  const same = calculateDateDifference('2026-05-01', '2026-05-01');
  assert.equal(same.ok, true);
  assert.equal(same.totalDays, 0);

  const leap = calculateDateDifference('2024-02-01', '2024-03-01');
  assert.equal(leap.ok, true);
  assert.equal(leap.totalDays, 29);
  assert.equal(leap.months, 1);
});

test('date difference handles reversed dates and invalid inputs', () => {
  const rev = calculateDateDifference('2026-01-10', '2026-01-01');
  assert.equal(rev.ok, true);
  assert.equal(rev.isReversed, true);
  assert.equal(rev.totalDays, 9);

  assert.equal(calculateDateDifference('2026-13-01', '2026-01-01').ok, false);
});
