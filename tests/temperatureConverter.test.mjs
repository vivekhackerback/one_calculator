import test from 'node:test';
import assert from 'node:assert/strict';
import { convertTemperature } from '../src/utils/calculators/temperature.js';

test('temperature converter converts freezing, boiling, and -40 crossover', () => {
  assert.equal(convertTemperature('0', '°C', '°F').value, 32);
  assert.equal(convertTemperature('100', '°C', '°F').value, 212);
  assert.equal(convertTemperature('-40', '°C', '°F').value, -40);
  assert.equal(convertTemperature('0', 'K', '°C').value, -273.15);
});

test('temperature converter rejects below absolute zero', () => {
  assert.equal(convertTemperature('-274', '°C', 'K').ok, false);
  assert.equal(convertTemperature('-1', 'K', '°C').ok, false);
});
