import test from 'node:test';
import assert from 'node:assert/strict';
import { convertLength } from '../src/utils/calculators/length.js';

test('length converter converts metric and imperial units accurately', () => {
  const mToFt = convertLength('1', 'm', 'ft');
  assert.equal(mToFt.ok, true);
  assert.ok(Math.abs(mToFt.value - 3.28084) < 0.0001);

  const kmToMi = convertLength('1.609344', 'km', 'mi');
  assert.equal(kmToMi.ok, true);
  assert.ok(Math.abs(kmToMi.value - 1) < 0.0001);
});

test('length converter rejects negative values', () => {
  assert.equal(convertLength('-5', 'm', 'cm').ok, false);
});
