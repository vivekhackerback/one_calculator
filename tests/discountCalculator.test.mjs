import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDiscount } from '../src/utils/calculators/discount.js';

test('discount calculator handles single discount', () => {
  const res = calculateDiscount('1000', '20');
  assert.equal(res.ok, true);
  assert.equal(res.totalSavings, 200);
  assert.equal(res.finalPrice, 800);
});

test('discount calculator handles stacked discounts and tax', () => {
  const res = calculateDiscount('1000', '20', '10', '10');
  assert.equal(res.ok, true);
  // 1000 -> 800 -> 720 -> +10% tax = 792
  assert.equal(res.discountedPrice, 720);
  assert.equal(res.totalSavings, 280);
  assert.equal(res.finalPrice, 792);
});

test('discount calculator validates invalid inputs', () => {
  assert.equal(calculateDiscount('-50', '10').ok, false);
  assert.equal(calculateDiscount('100', '150').ok, false);
});
