import test from 'node:test';
import assert from 'node:assert/strict';
import { convertWeight } from '../src/utils/calculators/weight.js';

test('weight converter converts kg to lb and oz to g accurately', () => {
  const kgToLb = convertWeight('1', 'kg', 'lb');
  assert.equal(kgToLb.ok, true);
  assert.ok(Math.abs(kgToLb.value - 2.20462) < 0.0001);

  const ozToG = convertWeight('1', 'oz', 'g');
  assert.equal(ozToG.ok, true);
  assert.ok(Math.abs(ozToG.value - 28.3495) < 0.001);
});

test('weight converter rejects negative values', () => {
  assert.equal(convertWeight('-2', 'kg', 'g').ok, false);
});
