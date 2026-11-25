import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInterest } from '../src/utils/calculators/interest.js';

test('simple interest computes P * r * t accurately', () => {
  const res = calculateInterest('10000', '10', '2', 'simple');
  assert.equal(res.ok, true);
  assert.equal(res.interest, 2000);
  assert.equal(res.totalAmount, 12000);
});

test('compound interest supports annual, quarterly, and monthly compounding', () => {
  const annual = calculateInterest('10000', '10', '2', 'compound', 1);
  assert.equal(annual.ok, true);
  assert.ok(Math.abs(annual.totalAmount - 12100) < 0.01);

  const quarterly = calculateInterest('10000', '10', '2', 'compound', 4);
  assert.equal(quarterly.ok, true);
  assert.ok(quarterly.totalAmount > annual.totalAmount);
});

test('interest calculator validates negative or zero inputs', () => {
  assert.equal(calculateInterest('0', '5', '2', 'simple').ok, false);
  assert.equal(calculateInterest('1000', '-1', '2', 'simple').ok, false);
  assert.equal(calculateInterest('1000', '5', '0', 'simple').ok, false);
});
