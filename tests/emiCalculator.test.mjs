import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEMI } from '../src/utils/calculators/emi.js';

test('EMI calculator matches verified loan example', () => {
  // 100,000 at 12% p.a. for 1 year (12 months) => EMI ~ 8884.88
  const res = calculateEMI('100000', '12', '1', 'years');
  assert.equal(res.ok, true);
  assert.equal(res.months, 12);
  assert.ok(Math.abs(res.emi - 8884.88) < 0.01);
  assert.ok(Math.abs(res.totalInterest - 6618.55) < 0.05);
});

test('EMI calculator handles 0% interest rate', () => {
  const res = calculateEMI('12000', '0', '12', 'months');
  assert.equal(res.ok, true);
  assert.equal(res.emi, 1000);
  assert.equal(res.totalInterest, 0);
  assert.equal(res.totalPayment, 12000);
});

test('EMI calculator validates invalid inputs', () => {
  assert.equal(calculateEMI('0', '10', '5', 'years').ok, false);
  assert.equal(calculateEMI('10000', '-5', '5', 'years').ok, false);
  assert.equal(calculateEMI('10000', '10', '0', 'years').ok, false);
});
