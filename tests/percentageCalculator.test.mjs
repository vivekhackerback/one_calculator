import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePercentage } from '../src/utils/calculators/percentage.js';

test('percentage "of" mode calculates X% of Y', () => {
  const res = calculatePercentage('of', '15', '200');
  assert.equal(res.ok, true);
  assert.equal(res.value, 30);
});

test('percentage "whatPercent" mode calculates X as % of Y and guards zero', () => {
  const res = calculatePercentage('whatPercent', '25', '200');
  assert.equal(res.ok, true);
  assert.equal(res.value, 12.5);

  assert.equal(calculatePercentage('whatPercent', '25', '0').ok, false);
});

test('percentage "change" mode handles increase, decrease, and zero start', () => {
  const inc = calculatePercentage('change', '100', '125');
  assert.equal(inc.ok, true);
  assert.equal(inc.value, 25);
  assert.equal(inc.direction, 'Increase');

  const dec = calculatePercentage('change', '200', '150');
  assert.equal(dec.ok, true);
  assert.equal(dec.value, -25);
  assert.equal(dec.direction, 'Decrease');

  assert.equal(calculatePercentage('change', '0', '50').ok, false);
});
